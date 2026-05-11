package waffo_pancake

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/setting"
)

// Webhook event types (see docs.waffo.ai/api-reference/webhooks).
const (
	EventOrderCompleted = "order.completed"
	EventRefundSucceeded = "refund.succeeded"
	EventRefundFailed    = "refund.failed"
)

// WebhookEnvelope is the outer shape Pancake POSTs to our endpoint. The
// `data` field's concrete type depends on `eventType` — decode it again
// against the relevant event-specific struct after dispatching.
type WebhookEnvelope struct {
	Id        string `json:"id"`
	Timestamp string `json:"timestamp"`
	EventType string `json:"eventType"`
	EventId   string `json:"eventId"`
	StoreId   string `json:"storeId"`
	StoreName string `json:"storeName"`
	Mode      string `json:"mode"` // "test" | "prod" — selects which public key verifies
	Data      json.RawMessage `json:"data"`
}

// OrderCompletedData covers what we actually need from order.completed.
// Pancake includes more (buyer, billing, line items) — add fields as needed.
//
// Note: the metadata map we POST as `metadata` on create-session is echoed
// back here under the key `orderMetadata`. Pancake also exposes
// `productMetadata` separately, which is the merchant-level metadata
// attached to the product definition — that's not what we want.
type OrderCompletedData struct {
	OrderId     string            `json:"orderId"`
	PaymentId   string            `json:"paymentId"`
	Amount      string            `json:"amount"` // display format, e.g. "10.00"
	Currency    string            `json:"currency"`
	BuyerEmail  string            `json:"buyerEmail"`
	ProductName string            `json:"productName"`
	OrderStatus string            `json:"orderStatus"` // "completed" on success
	Metadata    map[string]string `json:"orderMetadata"`
}

// VerifyWebhookSignature validates the X-Waffo-Signature header against the
// raw request body. Per docs:
//
//	X-Waffo-Signature: t=<unix-millis>,v1=<base64-rsa-sha256-signature>
//	signed payload     = "<t>.<rawBody>"
//
// We also enforce a 5-minute replay window. The verification key is selected
// by the `mode` field of the (untrusted-but-parseable) payload — test events
// can hit prod endpoints during dashboard test-sends, so a single env toggle
// is not enough.
func VerifyWebhookSignature(rawBody []byte, header string, mode string) error {
	t, v1 := parseSignatureHeader(header)
	if t == "" || v1 == "" {
		return errors.New("missing t or v1 in X-Waffo-Signature")
	}

	ts, err := strconv.ParseInt(t, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid timestamp: %w", err)
	}
	now := time.Now().UnixMilli()
	if abs64(now-ts) > 5*60*1000 {
		return fmt.Errorf("timestamp outside 5-minute window (drift=%dms)", now-ts)
	}

	pubKeyPEM := setting.GetWaffoPancakeWebhookPublicKey(mode)
	if pubKeyPEM == "" {
		return fmt.Errorf("no webhook public key configured for mode=%q", mode)
	}
	pub, err := parseRSAPublicKey(pubKeyPEM)
	if err != nil {
		return fmt.Errorf("parse webhook public key: %w", err)
	}

	signed := t + "." + string(rawBody)
	digest := sha256.Sum256([]byte(signed))
	sig, err := base64.StdEncoding.DecodeString(v1)
	if err != nil {
		return fmt.Errorf("decode signature: %w", err)
	}
	if err := rsa.VerifyPKCS1v15(pub, crypto.SHA256, digest[:], sig); err != nil {
		return fmt.Errorf("signature verification failed: %w", err)
	}
	return nil
}

func parseSignatureHeader(h string) (t, v1 string) {
	for _, pair := range strings.Split(h, ",") {
		kv := strings.SplitN(pair, "=", 2)
		if len(kv) != 2 {
			continue
		}
		switch strings.TrimSpace(kv[0]) {
		case "t":
			t = strings.TrimSpace(kv[1])
		case "v1":
			v1 = strings.TrimSpace(kv[1])
		}
	}
	return
}

func abs64(x int64) int64 {
	if x < 0 {
		return -x
	}
	return x
}
