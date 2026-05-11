package waffo_pancake

// PriceSnapshot overrides the product's static price for one session — used
// when the final charge is computed at runtime (variable top-up amounts).
// MUST be generated server-side; never accept these fields from clients.
type PriceSnapshot struct {
	Amount      string `json:"amount"`      // display format, e.g. "10.00"
	TaxIncluded bool   `json:"taxIncluded"`
	TaxCategory string `json:"taxCategory"` // e.g. "saas", "digital_goods"
}

// BillingDetail pre-fills the checkout's billing block. All fields are
// optional from our side; Pancake will collect anything missing during
// checkout. Country is required when any billingDetail field is supplied.
type BillingDetail struct {
	Country      string `json:"country,omitempty"`
	IsBusiness   bool   `json:"isBusiness,omitempty"`
	State        string `json:"state,omitempty"`
	BusinessName string `json:"businessName,omitempty"`
	TaxId        string `json:"taxId,omitempty"`
	Postcode     string `json:"postcode,omitempty"`
}

// CreateSessionRequest mirrors POST /v1/actions/checkout/create-session.
// See docs.waffo.ai/api-reference/endpoints/orders/create-checkout-session.
type CreateSessionRequest struct {
	StoreId          string            `json:"storeId,omitempty"`
	ProductId        string            `json:"productId"`
	Currency         string            `json:"currency"`
	PriceSnapshot    *PriceSnapshot    `json:"priceSnapshot,omitempty"`
	BuyerEmail       string            `json:"buyerEmail,omitempty"`
	BillingDetail    *BillingDetail    `json:"billingDetail,omitempty"`
	SuccessUrl       string            `json:"successUrl,omitempty"`
	ExpiresInSeconds int               `json:"expiresInSeconds,omitempty"`
	DarkMode         bool              `json:"darkMode,omitempty"`
	Metadata         map[string]string `json:"metadata,omitempty"`
}

// CreateSessionResponse holds the parts of the response we redirect on.
// `expiresAt` is RFC3339 — surface it to the frontend if you want to render
// a countdown, otherwise discard.
type CreateSessionResponse struct {
	SessionId   string `json:"sessionId"`
	CheckoutUrl string `json:"checkoutUrl"`
	ExpiresAt   string `json:"expiresAt"`
}

// CreateCheckoutSession asks Pancake to mint a hosted checkout URL we can
// redirect the buyer to.
func (c *Client) CreateCheckoutSession(req *CreateSessionRequest) (*CreateSessionResponse, error) {
	var resp CreateSessionResponse
	if err := c.do("POST", "/v1/actions/checkout/create-session", req, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}
