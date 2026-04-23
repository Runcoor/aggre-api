package controller

import (
	"bytes"
	"crypto/md5"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/service"
	"github.com/runcoor/aggre-api/setting"
	"github.com/runcoor/aggre-api/setting/operation_setting"
	"github.com/runcoor/aggre-api/setting/system_setting"

	"github.com/gin-gonic/gin"
	"github.com/thanhpk/randstr"
)

const (
	PaymentMethodCryptomus = "cryptomus"
	cryptomusCreateURL     = "https://api.cryptomus.com/v1/payment"
)

// CryptomusPayRequest 用户发起 Cryptomus 支付请求体
type CryptomusPayRequest struct {
	Amount   int64  `json:"amount"`
	Network  string `json:"network,omitempty"`   // 可选覆盖默认网络
	Currency string `json:"currency,omitempty"`  // 可选覆盖默认收款币种
}

// cryptomusCreatePayload 调 Cryptomus /v1/payment 的请求体
// 文档: https://doc.cryptomus.com/business/payments/creating-invoice
type cryptomusCreatePayload struct {
	Amount      string `json:"amount"`
	Currency    string `json:"currency"`     // 报价币种 (USD)
	OrderID     string `json:"order_id"`
	Network     string `json:"network,omitempty"`
	ToCurrency  string `json:"to_currency,omitempty"`
	URLReturn   string `json:"url_return,omitempty"`
	URLSuccess  string `json:"url_success,omitempty"`
	URLCallback string `json:"url_callback,omitempty"`
	Lifetime    int    `json:"lifetime,omitempty"` // 秒, 默认 3600
}

// cryptomusCreateResponse Cryptomus 下单响应
type cryptomusCreateResponse struct {
	State   int    `json:"state"`
	Message string `json:"message,omitempty"`
	Result  struct {
		UUID            string `json:"uuid"`
		OrderID         string `json:"order_id"`
		Amount          string `json:"amount"`
		PaymentAmount   string `json:"payment_amount"`
		PayerAmount     string `json:"payer_amount"`
		PayerCurrency   string `json:"payer_currency"`
		Network         string `json:"network"`
		Address         string `json:"address"`
		URL             string `json:"url"`
		ExpiredAt       int64  `json:"expired_at"`
		Status          string `json:"status"`
		MerchantAmount  string `json:"merchant_amount"`
	} `json:"result"`
}

// cryptomusWebhookPayload Cryptomus 回调通知
type cryptomusWebhookPayload struct {
	Type              string `json:"type"`
	UUID              string `json:"uuid"`
	OrderID           string `json:"order_id"`
	Amount            string `json:"amount"`
	PaymentAmount     string `json:"payment_amount"`
	PayerAmount       string `json:"payer_amount"`
	PayerCurrency     string `json:"payer_currency"`
	MerchantAmount    string `json:"merchant_amount"`
	Network           string `json:"network"`
	Address           string `json:"address"`
	Status            string `json:"status"`
	IsFinal           bool   `json:"is_final"`
	AdditionalData    string `json:"additional_data"`
	Sign              string `json:"sign"`
	Currency          string `json:"currency"`
}

// cryptomusEnabled 返回 Cryptomus 是否可用
func cryptomusEnabled() bool {
	return setting.CryptomusEnabled &&
		setting.CryptomusMerchantId != "" &&
		setting.CryptomusPaymentApiKey != ""
}

// getCryptomusPayMoney 按现有结算体系折算出 USD 金额（参考 getStripePayMoney）
func getCryptomusPayMoney(amount float64, group string) float64 {
	originalAmount := amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = amount / common.QuotaPerUnit
	}
	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}
	discount := 1.0
	if ds, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(originalAmount)]; ok {
		if ds > 0 {
			discount = ds
		}
	}
	return amount * setting.CryptomusUnitPrice * topupGroupRatio * discount
}

// cryptomusSign 计算 Cryptomus 签名 = md5(base64(body) + api_key)
// 注意：body 必须是 **未经重新序列化** 的原始 JSON 字节
func cryptomusSign(body []byte, apiKey string) string {
	encoded := base64.StdEncoding.EncodeToString(body)
	sum := md5.Sum([]byte(encoded + apiKey))
	return hex.EncodeToString(sum[:])
}

// RequestCryptomusPay POST /api/user/cryptomus/pay
func RequestCryptomusPay(c *gin.Context) {
	if !cryptomusEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Cryptomus 支付未启用"})
		return
	}

	var req CryptomusPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	userId := c.GetInt("id")
	minTopup := getMinTopupForUser(userId)
	cryptomusMin := int64(setting.CryptomusMinTopUp)
	if cryptomusMin < minTopup {
		cryptomusMin = minTopup
	}
	if req.Amount < cryptomusMin {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", cryptomusMin)})
		return
	}
	if req.Amount > 10000 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值数量过大"})
		return
	}

	user, err := model.GetUserById(userId, false)
	if err != nil || user == nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "用户不存在"})
		return
	}

	group, _ := model.GetUserGroup(userId, true)
	payMoney := getCryptomusPayMoney(float64(req.Amount), group)
	if payMoney < 0.5 {
		// Cryptomus 最低订单额度约 0.5 USD
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	// Token 模式下归一化 Amount（存美元等价数量），避免 RechargeCryptomus 双重放大
	amount := req.Amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = int64(float64(req.Amount) / common.QuotaPerUnit)
		if amount < 1 {
			amount = 1
		}
	}

	tradeNo := fmt.Sprintf("CM-%d-%d-%s", userId, time.Now().UnixMilli(), randstr.String(6))

	topUp := &model.TopUp{
		UserId:        userId,
		Amount:        amount,
		Money:         payMoney,
		TradeNo:       tradeNo,
		PaymentMethod: PaymentMethodCryptomus,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		log.Printf("Cryptomus 创建本地订单失败: %v", err)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	callbackAddr := service.GetCallbackAddress()
	notifyURL := callbackAddr + "/api/cryptomus/webhook"
	if setting.CryptomusNotifyUrl != "" {
		notifyURL = setting.CryptomusNotifyUrl
	}
	returnURL := system_setting.ServerAddress + "/console/topup?show_history=true"
	if setting.CryptomusReturnUrl != "" {
		returnURL = setting.CryptomusReturnUrl
	}

	orderCurrency := setting.CryptomusOrderCurrency
	if orderCurrency == "" {
		orderCurrency = "USD"
	}

	network := setting.CryptomusNetwork
	if req.Network != "" {
		network = req.Network
	}
	currency := setting.CryptomusCurrency
	if req.Currency != "" {
		currency = req.Currency
	}

	payload := cryptomusCreatePayload{
		Amount:      fmt.Sprintf("%.2f", payMoney),
		Currency:    orderCurrency,
		OrderID:     tradeNo,
		Network:     network,
		ToCurrency:  currency,
		URLReturn:   returnURL,
		URLSuccess:  returnURL,
		URLCallback: notifyURL,
		Lifetime:    3600,
	}
	body, err := common.Marshal(payload)
	if err != nil {
		log.Printf("Cryptomus 序列化请求体失败: %v", err)
		_ = markCryptomusTopUpFailed(topUp)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	sign := cryptomusSign(body, setting.CryptomusPaymentApiKey)

	httpReq, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, cryptomusCreateURL, bytes.NewReader(body))
	if err != nil {
		log.Printf("Cryptomus 构造请求失败: %v", err)
		_ = markCryptomusTopUpFailed(topUp)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("merchant", setting.CryptomusMerchantId)
	httpReq.Header.Set("sign", sign)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("Cryptomus 请求失败: %v", err)
		_ = markCryptomusTopUpFailed(topUp)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Cryptomus 读取响应失败: %v", err)
		_ = markCryptomusTopUpFailed(topUp)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	var createResp cryptomusCreateResponse
	if err := common.Unmarshal(respBody, &createResp); err != nil {
		log.Printf("Cryptomus 解析响应失败: %v, body=%s", err, string(respBody))
		_ = markCryptomusTopUpFailed(topUp)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	if createResp.State != 0 || createResp.Result.URL == "" {
		log.Printf("Cryptomus 下单业务失败: state=%d, msg=%s, body=%s", createResp.State, createResp.Message, string(respBody))
		_ = markCryptomusTopUpFailed(topUp)
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	log.Printf("Cryptomus 订单创建成功 - 用户: %d, 订单: %s, 金额: %.2f USD", userId, tradeNo, payMoney)

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"pay_link":   createResp.Result.URL,
			"trade_no":   tradeNo,
			"uuid":       createResp.Result.UUID,
			"expired_at": createResp.Result.ExpiredAt,
		},
	})
}

func markCryptomusTopUpFailed(topUp *model.TopUp) error {
	topUp.Status = common.TopUpStatusFailed
	return topUp.Update()
}

// CryptomusWebhook 处理 Cryptomus 回调通知
// POST /api/cryptomus/webhook
func CryptomusWebhook(c *gin.Context) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Cryptomus Webhook 读取 body 失败: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	if !cryptomusEnabled() {
		log.Printf("Cryptomus Webhook: 未启用")
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	// 解析 payload 只为了拿到 sign / order_id / status，验签使用原始 body
	var payload cryptomusWebhookPayload
	if err := common.Unmarshal(bodyBytes, &payload); err != nil {
		log.Printf("Cryptomus Webhook 解析失败: %v, body=%s", err, string(bodyBytes))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	// 取签名用的 key：优先 WebhookApiKey，否则回退到 PaymentApiKey
	apiKey := setting.CryptomusWebhookApiKey
	if apiKey == "" {
		apiKey = setting.CryptomusPaymentApiKey
	}

	// 验签：去掉 sign 字段后重算 md5(base64(body_without_sign) + api_key)
	bodyForSign, err := stripSignFieldAndReencode(bodyBytes)
	if err != nil {
		log.Printf("Cryptomus Webhook 签名准备失败: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	expectedSign := cryptomusSign(bodyForSign, apiKey)
	if expectedSign != payload.Sign {
		log.Printf("Cryptomus Webhook 签名验证失败: expected=%s got=%s", expectedSign, payload.Sign)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	if payload.OrderID == "" {
		log.Printf("Cryptomus Webhook 缺少 order_id")
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	LockOrder(payload.OrderID)
	defer UnlockOrder(payload.OrderID)

	topUp := model.GetTopUpByTradeNo(payload.OrderID)
	if topUp == nil {
		log.Printf("Cryptomus Webhook 未找到订单: %s", payload.OrderID)
		c.Status(http.StatusOK)
		return
	}

	// 已成功幂等返回
	if topUp.Status == common.TopUpStatusSuccess {
		c.Status(http.StatusOK)
		return
	}

	// 只认最终成功状态：paid / paid_over
	if payload.Status != "paid" && payload.Status != "paid_over" {
		log.Printf("Cryptomus Webhook - 订单: %s, 状态: %s, 非终态", payload.OrderID, payload.Status)
		// 终态失败标记为 failed，避免永远 pending
		if payload.IsFinal && (payload.Status == "fail" || payload.Status == "cancel" || payload.Status == "system_fail" || payload.Status == "refund_paid" || payload.Status == "wrong_amount" || payload.Status == "refund_process") {
			if topUp.Status == common.TopUpStatusPending {
				topUp.Status = common.TopUpStatusFailed
				_ = topUp.Update()
			}
		}
		c.Status(http.StatusOK)
		return
	}

	// 金额校验：商户到账金额不能少于下单金额
	merchantAmount, _ := strconv.ParseFloat(payload.MerchantAmount, 64)
	if merchantAmount > 0 && merchantAmount+0.01 < topUp.Money {
		log.Printf("Cryptomus Webhook 金额不足: 订单=%s, 期望=%.2f, 实收=%.2f", payload.OrderID, topUp.Money, merchantAmount)
		c.Status(http.StatusOK)
		return
	}

	if err := model.RechargeCryptomus(payload.OrderID); err != nil {
		log.Printf("Cryptomus 入账失败: %v, 订单: %s", err, payload.OrderID)
		c.Status(http.StatusInternalServerError)
		return
	}

	log.Printf("Cryptomus 充值成功 - 订单: %s, 到账: %.2f %s", payload.OrderID, merchantAmount, payload.PayerCurrency)
	c.Status(http.StatusOK)
}

// stripSignFieldAndReencode 从 webhook JSON 中去掉 sign 字段再以 Cryptomus 期望的方式重新序列化。
// 关键：Cryptomus Go 官方示例对 webhook 验签使用的是原始 body 去掉 sign 后的 JSON，
// 但因为重新序列化 map 的 key 顺序不确定，会导致签名不一致。
// 实践中 Cryptomus 的 PHP/Python SDK 是**按收到的原始字节**计算，只是把 "sign" 这个 key 替换/剔除再保留其余格式。
// 为了最大兼容性，我们遍历 JSON 做字段级剔除（保留原 key 顺序和空白）。
func stripSignFieldAndReencode(body []byte) ([]byte, error) {
	// 将 body 解析为保留顺序的结构更稳，但 encoding/json 不保留 map 顺序。
	// Cryptomus 实际做法：对 body 反序列化成 map[string]interface{}，重新 json.Marshal 再参与签名。
	// 由于 Go 的 json.Marshal 会按 key 字典序输出，所以 Cryptomus 服务端也必须按同样方式。
	// 大多数集成（含官方 Go 示例）都这样签。
	var m map[string]any
	if err := common.Unmarshal(body, &m); err != nil {
		return nil, err
	}
	delete(m, "sign")
	return common.Marshal(m)
}
