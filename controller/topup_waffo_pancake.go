package controller

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/service/waffo_pancake"
	"github.com/runcoor/aggre-api/setting"
	"github.com/runcoor/aggre-api/setting/operation_setting"
	"github.com/runcoor/aggre-api/setting/system_setting"
	"github.com/thanhpk/randstr"
)

// waffoPancakeTradePrefix tags the merchant order id, so a single log/grep
// disambiguates Pancake top-ups from the legacy Waffo SDK flow ("WAFFO-").
const waffoPancakeTradePrefix = "WPNC-"

// getWaffoPancakeCurrency returns the configured currency, defaulting to USD
// for completeness (the admin may have left the field blank).
func getWaffoPancakeCurrency() string {
	if setting.WaffoPancakeCurrency != "" {
		return setting.WaffoPancakeCurrency
	}
	return "USD"
}

// getWaffoPancakePayMoney mirrors getWaffoPayMoney: take the user-facing
// Amount (in display units / tokens depending on QuotaDisplayType), apply
// the group ratio, then multiply by the unit price. Returns the actual
// charge that goes into priceSnapshot.
func getWaffoPancakePayMoney(amount float64, group string) float64 {
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
	return amount * setting.WaffoPancakeUnitPrice * topupGroupRatio * discount
}

// waffoPancakeAmountString formats the charge amount for Pancake's
// priceSnapshot. Pancake expects display-format strings (e.g. "10.00") and
// rejects zero-decimal currencies with decimals — same rule as legacy Waffo.
func waffoPancakeAmountString(amount float64, currency string) string {
	if zeroDecimalCurrencies[currency] {
		return fmt.Sprintf("%.0f", amount)
	}
	return fmt.Sprintf("%.2f", amount)
}

type WaffoPancakePayRequest struct {
	Amount int64 `json:"amount"`
}

// RequestWaffoPancakePay creates a hosted Pancake checkout session and
// returns its URL. Independent from the legacy Waffo flow.
func RequestWaffoPancakePay(c *gin.Context) {
	if !setting.WaffoPancakeEnabled {
		c.JSON(200, gin.H{"message": "error", "data": "Waffo Pancake 支付未启用"})
		return
	}
	if setting.WaffoPancakeMerchantId == "" || setting.GetWaffoPancakePrivateKey() == "" || setting.GetWaffoPancakeProductId() == "" {
		c.JSON(200, gin.H{"message": "error", "data": "Waffo Pancake 支付配置不完整"})
		return
	}

	var req WaffoPancakePayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	id := c.GetInt("id")
	minTopup := getMinTopupForUser(id)
	pancakeMin := int64(setting.WaffoPancakeMinTopUp)
	if pancakeMin < minTopup {
		pancakeMin = minTopup
	}
	if req.Amount < pancakeMin {
		c.JSON(200, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", pancakeMin)})
		return
	}

	user, err := model.GetUserById(id, false)
	if err != nil || user == nil {
		c.JSON(200, gin.H{"message": "error", "data": "用户不存在"})
		return
	}

	group, _ := model.GetUserGroup(id, true)
	payMoney := getWaffoPancakePayMoney(float64(req.Amount), group)
	if payMoney < 0.01 {
		c.JSON(200, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	currency := getWaffoPancakeCurrency()
	tradeNo := fmt.Sprintf("%s%d-%d-%s", waffoPancakeTradePrefix, id, time.Now().UnixMilli(), randstr.String(6))

	// Token-mode normalization: TopUp.Amount stores the equivalent currency
	// quantity so RechargeWaffoPancake doesn't double-multiply by QuotaPerUnit.
	amount := req.Amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = int64(float64(req.Amount) / common.QuotaPerUnit)
		if amount < 1 {
			amount = 1
		}
	}

	topUp := &model.TopUp{
		UserId:        id,
		Amount:        amount,
		Money:         payMoney,
		TradeNo:       tradeNo,
		PaymentMethod: "waffo-pancake",
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		log.Printf("Waffo Pancake 创建本地订单失败: %v", err)
		c.JSON(200, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	successUrl := system_setting.ServerAddress + "/console/topup?pay=success"
	if setting.WaffoPancakeReturnUrl != "" {
		successUrl = setting.WaffoPancakeReturnUrl
	}

	client := waffo_pancake.New()
	sessionReq := &waffo_pancake.CreateSessionRequest{
		StoreId:   setting.GetWaffoPancakeStoreId(),
		ProductId: setting.GetWaffoPancakeProductId(),
		Currency:  currency,
		PriceSnapshot: &waffo_pancake.PriceSnapshot{
			Amount:      waffoPancakeAmountString(payMoney, currency),
			TaxIncluded: false,
			TaxCategory: "saas",
		},
		BuyerEmail: user.Email,
		SuccessUrl: successUrl,
		// Round-trip our trade number through metadata. Pancake echoes it
		// in webhook payloads under `data.metadata.tradeNo`, giving us a
		// reliable join key without relying on Pancake's orderId-to-session
		// mapping endpoint.
		Metadata: map[string]string{
			"tradeNo": tradeNo,
			"userId":  strconv.Itoa(id),
		},
	}

	resp, err := client.CreateCheckoutSession(sessionReq)
	if err != nil {
		log.Printf("Waffo Pancake 创建 session 失败: %v", err)
		topUp.Status = common.TopUpStatusFailed
		_ = topUp.Update()
		c.JSON(200, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	log.Printf("Waffo Pancake 订单创建成功 - 用户: %d, 订单: %s, 金额: %.2f %s, sessionId: %s",
		id, tradeNo, payMoney, currency, resp.SessionId)

	c.JSON(200, gin.H{
		"message": "success",
		"data": gin.H{
			"payment_url": resp.CheckoutUrl,
			"order_id":    tradeNo,
			"session_id":  resp.SessionId,
			"expires_at":  resp.ExpiresAt,
		},
	})
}

// WaffoPancakeWebhook handles signed event notifications from Pancake.
// Only order.completed feeds the credit-issuance path; refund events are
// logged but not auto-actioned (admin handles refunds manually for now).
func WaffoPancakeWebhook(c *gin.Context) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Waffo Pancake Webhook 读取 body 失败: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	// Parse envelope first so we can pick the right verification key based
	// on the (still-unverified) mode field. This is safe: the worst a forged
	// payload can do is pick the wrong key, and verification will then fail.
	var envelope waffo_pancake.WebhookEnvelope
	if err := common.Unmarshal(bodyBytes, &envelope); err != nil {
		log.Printf("Waffo Pancake Webhook 解析失败: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	if err := waffo_pancake.VerifyWebhookSignature(bodyBytes, c.GetHeader("X-Waffo-Signature"), envelope.Mode); err != nil {
		log.Printf("Waffo Pancake Webhook 签名验证失败: %v (mode=%s)", err, envelope.Mode)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	log.Printf("Waffo Pancake Webhook - EventType: %s, EventId: %s, Mode: %s",
		envelope.EventType, envelope.EventId, envelope.Mode)

	switch envelope.EventType {
	case waffo_pancake.EventOrderCompleted:
		handleWaffoPancakeOrderCompleted(c, envelope.Data)
	case waffo_pancake.EventRefundSucceeded, waffo_pancake.EventRefundFailed:
		// Log only; refunds are reconciled manually for now.
		log.Printf("Waffo Pancake 退款事件 (待人工处理): %s", string(envelope.Data))
		c.Status(http.StatusOK)
	default:
		log.Printf("Waffo Pancake Webhook 未知事件类型: %s", envelope.EventType)
		c.Status(http.StatusOK)
	}
}

func handleWaffoPancakeOrderCompleted(c *gin.Context, data []byte) {
	var order waffo_pancake.OrderCompletedData
	if err := common.Unmarshal(data, &order); err != nil {
		log.Printf("Waffo Pancake order.completed 解析失败: %v", err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	tradeNo := order.Metadata["tradeNo"]
	if tradeNo == "" {
		log.Printf("Waffo Pancake order.completed 缺少 metadata.tradeNo, orderId=%s", order.OrderId)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	if err := model.RechargeWaffoPancake(tradeNo); err != nil {
		log.Printf("Waffo Pancake 充值处理失败: %v, 订单: %s", err, tradeNo)
		// Return 500 so Pancake retries (3 attempts w/ exponential backoff).
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	log.Printf("Waffo Pancake 充值成功 - 订单: %s, Pancake orderId: %s", tradeNo, order.OrderId)
	c.Status(http.StatusOK)
}
