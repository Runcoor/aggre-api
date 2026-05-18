package operation_setting

import "github.com/runcoor/aggre-api/setting/config"

type PaymentSetting struct {
	AmountOptions  []int           `json:"amount_options"`
	AmountDiscount map[int]float64 `json:"amount_discount"` // 充值金额对应的折扣，例如 100 元 0.9 表示 100 元充值享受 9 折优惠
	// WalletPayEnabled 控制是否允许使用钱包余额支付订阅套餐（默认 false）。
	// 仅作用于订阅购买路径（/api/subscription/wallet/pay），不影响普通充值。
	WalletPayEnabled bool `json:"wallet_pay_enabled"`
}

// 默认配置
var paymentSetting = PaymentSetting{
	AmountOptions:    []int{10, 20, 50, 100, 200, 500},
	AmountDiscount:   map[int]float64{},
	WalletPayEnabled: false,
}

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("payment_setting", &paymentSetting)
}

func GetPaymentSetting() *PaymentSetting {
	return &paymentSetting
}
