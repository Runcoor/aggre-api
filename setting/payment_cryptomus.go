package setting

// Cryptomus 加密货币支付配置
// 文档: https://doc.cryptomus.com/
var (
	// CryptomusEnabled 是否启用 Cryptomus 支付
	CryptomusEnabled bool

	// CryptomusMerchantId 商户 ID（在 Cryptomus 后台 Merchant 页获取）
	CryptomusMerchantId string

	// CryptomusPaymentApiKey Payment API Key（用于调用下单接口）
	CryptomusPaymentApiKey string

	// CryptomusWebhookApiKey Webhook 回调签名校验使用的 Key
	// 通常和 Payment API Key 相同，但 Cryptomus 允许分开配置
	CryptomusWebhookApiKey string

	// CryptomusNetwork 收款链路，空 = 用户在支付页面自选
	// 常用值：tron / eth / bsc / polygon / solana
	CryptomusNetwork string

	// CryptomusCurrency 收款币种，空 = 用户在支付页面自选
	// 常用值：USDT / USDC / BTC / ETH
	CryptomusCurrency string

	// CryptomusOrderCurrency 报价币种，默认 USD
	CryptomusOrderCurrency string = "USD"

	// CryptomusNotifyUrl 自定义 Webhook 回调地址
	// 为空时自动拼接 {server_address}/api/cryptomus/webhook
	CryptomusNotifyUrl string

	// CryptomusReturnUrl 支付完成后的跳转地址
	// 为空时自动拼接 {server_address}/console/topup?show_history=true
	CryptomusReturnUrl string

	// CryptomusUnitPrice 1 单位（美元）报价，默认 1.0
	CryptomusUnitPrice float64 = 1.0

	// CryptomusMinTopUp 最小充值单位数量
	CryptomusMinTopUp int = 1
)
