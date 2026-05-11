package setting

var (
	WaffoPancakeEnabled bool
	WaffoPancakeSandbox bool

	WaffoPancakeMerchantId string

	WaffoPancakePrivateKey        string
	WaffoPancakeSandboxPrivateKey string

	WaffoPancakeWebhookPublicKey        string
	WaffoPancakeSandboxWebhookPublicKey string

	WaffoPancakeStoreId        string
	WaffoPancakeSandboxStoreId string

	WaffoPancakeProductId        string
	WaffoPancakeSandboxProductId string

	WaffoPancakeCurrency  string  = "USD"
	WaffoPancakeMinTopUp  int     = 10
	WaffoPancakeUnitPrice float64 = 1.0

	WaffoPancakeReturnUrl string
)

func GetWaffoPancakePrivateKey() string {
	if WaffoPancakeSandbox {
		return WaffoPancakeSandboxPrivateKey
	}
	return WaffoPancakePrivateKey
}

func GetWaffoPancakeStoreId() string {
	if WaffoPancakeSandbox {
		if WaffoPancakeSandboxStoreId != "" {
			return WaffoPancakeSandboxStoreId
		}
	}
	return WaffoPancakeStoreId
}

func GetWaffoPancakeProductId() string {
	if WaffoPancakeSandbox {
		if WaffoPancakeSandboxProductId != "" {
			return WaffoPancakeSandboxProductId
		}
	}
	return WaffoPancakeProductId
}

// GetWaffoPancakeWebhookPublicKey returns the verification key for the supplied
// payload mode ("test" / "prod"). Pancake test and prod webhooks each have their
// own keypair, so we must dispatch on the event's mode field rather than the
// sandbox toggle (a production deploy may still receive test events during
// dashboard "send test event" actions).
func GetWaffoPancakeWebhookPublicKey(mode string) string {
	if mode == "test" {
		return WaffoPancakeSandboxWebhookPublicKey
	}
	return WaffoPancakeWebhookPublicKey
}

// WaffoPancakeApiBase is fixed; Pancake routes by which keypair signs the request.
const WaffoPancakeApiBase = "https://api.waffo.ai"
