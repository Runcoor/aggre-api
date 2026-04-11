package controller

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/QuantumNous/aggre-api/common"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// ToolBalanceRequest is the request body for the public balance checker tool.
type ToolBalanceRequest struct {
	Provider string `json:"provider" binding:"required"`
	Key      string `json:"key" binding:"required"`
	BaseURL  string `json:"base_url"`
}

// ToolBalanceResult is the response data for the balance checker tool.
type ToolBalanceResult struct {
	Provider string  `json:"provider"`
	Balance  float64 `json:"balance"`
	Currency string  `json:"currency"`
	Used     float64 `json:"used,omitempty"`
	Granted  float64 `json:"granted,omitempty"`
	Limit    float64 `json:"limit,omitempty"`
	ExpiresAt string `json:"expires_at,omitempty"`
	Raw      any     `json:"raw,omitempty"`
}

func toolBalanceHTTPGet(url string, headers http.Header) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	for k := range headers {
		req.Header.Set(k, headers.Get(k))
	}
	client := &http.Client{Timeout: 15 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("HTTP %d: %s", res.StatusCode, string(body))
	}
	return io.ReadAll(res.Body)
}

func bearerHeader(key string) http.Header {
	h := http.Header{}
	h.Set("Authorization", "Bearer "+key)
	return h
}

// ToolCheckBalance handles public API key balance queries.
// POST /api/tool/balance
func ToolCheckBalance(c *gin.Context) {
	var req ToolBalanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request: provider and key are required")
		return
	}

	result, err := queryBalance(req)
	if err != nil {
		common.ApiErrorMsg(c, fmt.Sprintf("query failed: %s", err.Error()))
		return
	}
	common.ApiSuccess(c, result)
}

func queryBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	switch req.Provider {
	case "openai":
		return queryOpenAIBalance(req)
	case "deepseek":
		return queryDeepSeekBalance(req)
	case "moonshot":
		return queryMoonshotBalance(req)
	case "siliconflow":
		return querySiliconFlowBalance(req)
	case "openrouter":
		return queryOpenRouterBalance(req)
	case "closeai", "api2gpt":
		return queryAPI2GPTBalance(req)
	case "aigc2d":
		return queryAIGC2DBalance(req)
	case "custom":
		return queryCustomOpenAIBalance(req)
	case "claude":
		return queryClaudeUsage(req)
	case "grok":
		return queryGrokBalance(req)
	default:
		return nil, fmt.Errorf("provider '%s' is not supported for balance queries", req.Provider)
	}
}

func queryOpenAIBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	baseURL := "https://api.openai.com"
	if req.BaseURL != "" {
		baseURL = req.BaseURL
	}
	headers := bearerHeader(req.Key)

	// subscription
	subURL := fmt.Sprintf("%s/v1/dashboard/billing/subscription", baseURL)
	body, err := toolBalanceHTTPGet(subURL, headers)
	if err != nil {
		return nil, fmt.Errorf("subscription: %w", err)
	}
	var sub OpenAISubscriptionResponse
	if err := json.Unmarshal(body, &sub); err != nil {
		return nil, err
	}

	// usage
	now := time.Now()
	startDate := fmt.Sprintf("%s-01", now.Format("2006-01"))
	endDate := now.Format("2006-01-02")
	if !sub.HasPaymentMethod {
		startDate = now.AddDate(0, 0, -100).Format("2006-01-02")
	}
	usageURL := fmt.Sprintf("%s/v1/dashboard/billing/usage?start_date=%s&end_date=%s", baseURL, startDate, endDate)
	body, err = toolBalanceHTTPGet(usageURL, headers)
	if err != nil {
		return nil, fmt.Errorf("usage: %w", err)
	}
	var usage OpenAIUsageResponse
	if err := json.Unmarshal(body, &usage); err != nil {
		return nil, err
	}

	balance := sub.HardLimitUSD - usage.TotalUsage/100
	result := &ToolBalanceResult{
		Provider: "openai",
		Balance:  balance,
		Currency: "USD",
		Used:     usage.TotalUsage / 100,
		Limit:    sub.HardLimitUSD,
	}
	if sub.AccessUntil > 0 {
		result.ExpiresAt = time.Unix(sub.AccessUntil, 0).Format("2006-01-02")
	}
	return result, nil
}

func queryDeepSeekBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	url := "https://api.deepseek.com/user/balance"
	body, err := toolBalanceHTTPGet(url, bearerHeader(req.Key))
	if err != nil {
		return nil, err
	}
	var resp DeepSeekUsageResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	for _, info := range resp.BalanceInfos {
		if info.Currency == "CNY" {
			total, _ := strconv.ParseFloat(info.TotalBalance, 64)
			granted, _ := strconv.ParseFloat(info.GrantedBalance, 64)
			topped, _ := strconv.ParseFloat(info.ToppedUpBalance, 64)
			return &ToolBalanceResult{
				Provider: "deepseek",
				Balance:  total,
				Currency: "CNY",
				Granted:  granted,
				Used:     granted + topped - total,
			}, nil
		}
	}
	if len(resp.BalanceInfos) > 0 {
		info := resp.BalanceInfos[0]
		total, _ := strconv.ParseFloat(info.TotalBalance, 64)
		return &ToolBalanceResult{
			Provider: "deepseek",
			Balance:  total,
			Currency: info.Currency,
		}, nil
	}
	return nil, fmt.Errorf("no balance info returned")
}

func queryMoonshotBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	url := "https://api.moonshot.cn/v1/users/me/balance"
	body, err := toolBalanceHTTPGet(url, bearerHeader(req.Key))
	if err != nil {
		return nil, err
	}
	type MoonshotResp struct {
		Code   int  `json:"code"`
		Status bool `json:"status"`
		Data   struct {
			AvailableBalance float64 `json:"available_balance"`
			VoucherBalance   float64 `json:"voucher_balance"`
			CashBalance      float64 `json:"cash_balance"`
		} `json:"data"`
	}
	var resp MoonshotResp
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	if !resp.Status || resp.Code != 0 {
		return nil, fmt.Errorf("moonshot API error, code: %d", resp.Code)
	}
	return &ToolBalanceResult{
		Provider: "moonshot",
		Balance:  resp.Data.AvailableBalance,
		Currency: "CNY",
		Granted:  resp.Data.VoucherBalance,
	}, nil
}

func querySiliconFlowBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	url := "https://api.siliconflow.cn/v1/user/info"
	body, err := toolBalanceHTTPGet(url, bearerHeader(req.Key))
	if err != nil {
		return nil, err
	}
	var resp SiliconFlowUsageResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	if resp.Code != 20000 {
		return nil, fmt.Errorf("siliconflow error: %s", resp.Message)
	}
	total, _ := strconv.ParseFloat(resp.Data.TotalBalance, 64)
	charge, _ := strconv.ParseFloat(resp.Data.ChargeBalance, 64)
	free, _ := strconv.ParseFloat(resp.Data.Balance, 64)
	return &ToolBalanceResult{
		Provider: "siliconflow",
		Balance:  total,
		Currency: "CNY",
		Granted:  free,
		Used:     charge + free - total,
	}, nil
}

func queryOpenRouterBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	url := "https://openrouter.ai/api/v1/credits"
	body, err := toolBalanceHTTPGet(url, bearerHeader(req.Key))
	if err != nil {
		return nil, err
	}
	var resp OpenRouterCreditResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	balance := resp.Data.TotalCredits - resp.Data.TotalUsage
	return &ToolBalanceResult{
		Provider:  "openrouter",
		Balance:   balance,
		Currency:  "USD",
		Granted:   resp.Data.TotalCredits,
		Used:      resp.Data.TotalUsage,
	}, nil
}

func queryAPI2GPTBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	url := "https://api.api2gpt.com/dashboard/billing/credit_grants"
	body, err := toolBalanceHTTPGet(url, bearerHeader(req.Key))
	if err != nil {
		return nil, err
	}
	var resp API2GPTUsageResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	return &ToolBalanceResult{
		Provider: "api2gpt",
		Balance:  resp.TotalRemaining,
		Currency: "USD",
		Granted:  resp.TotalGranted,
		Used:     resp.TotalUsed,
	}, nil
}

func queryAIGC2DBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	url := "https://api.aigc2d.com/dashboard/billing/credit_grants"
	body, err := toolBalanceHTTPGet(url, bearerHeader(req.Key))
	if err != nil {
		return nil, err
	}
	var resp APGC2DGPTUsageResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	return &ToolBalanceResult{
		Provider: "aigc2d",
		Balance:  resp.TotalAvailable,
		Currency: "USD",
		Granted:  resp.TotalGranted,
		Used:     resp.TotalUsed,
	}, nil
}

func queryCustomOpenAIBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	if req.BaseURL == "" {
		return nil, fmt.Errorf("base_url is required for custom provider")
	}
	// Reuse OpenAI billing logic with custom base URL
	req.Provider = "openai"
	result, err := queryOpenAIBalance(req)
	if err != nil {
		// Fallback: try credit_grants endpoint
		url := fmt.Sprintf("%s/dashboard/billing/credit_grants", req.BaseURL)
		body, err2 := toolBalanceHTTPGet(url, bearerHeader(req.Key))
		if err2 != nil {
			return nil, fmt.Errorf("subscription: %v; credit_grants: %v", err, err2)
		}
		var grants OpenAICreditGrants
		if err2 := json.Unmarshal(body, &grants); err2 != nil {
			return nil, err
		}
		return &ToolBalanceResult{
			Provider: "custom",
			Balance:  grants.TotalAvailable,
			Currency: "USD",
			Granted:  grants.TotalGranted,
			Used:     grants.TotalUsed,
		}, nil
	}
	result.Provider = "custom"
	return result, nil
}

// ── Claude (Anthropic Admin API) ─────────────────────────────────────────

func queryClaudeUsage(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	// Uses the Admin API cost report for the current month
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	end := now.AddDate(0, 0, 1)

	url := fmt.Sprintf(
		"https://api.anthropic.com/v1/organizations/cost_report?start_date=%s&end_date=%s&granularity=monthly",
		start.Format("2006-01-02"),
		end.Format("2006-01-02"),
	)
	headers := http.Header{}
	headers.Set("x-api-key", req.Key)
	headers.Set("anthropic-version", "2023-06-01")

	body, err := toolBalanceHTTPGet(url, headers)
	if err != nil {
		return nil, fmt.Errorf("claude admin API: %w (requires Admin API Key sk-ant-admin-*)", err)
	}

	type CostItem struct {
		Description string `json:"description"`
		AmountCents int64  `json:"amount_cents"`
	}
	type CostReport struct {
		Data []struct {
			Costs []CostItem `json:"costs"`
		} `json:"data"`
	}

	var report CostReport
	if err := json.Unmarshal(body, &report); err != nil {
		return nil, err
	}

	var totalCents int64
	for _, bucket := range report.Data {
		for _, cost := range bucket.Costs {
			totalCents += cost.AmountCents
		}
	}

	used := float64(totalCents) / 100.0
	return &ToolBalanceResult{
		Provider: "claude",
		Balance:  -1, // no balance concept, only usage
		Currency: "USD",
		Used:     used,
	}, nil
}

// ── Grok (xAI Management API) ───────────────────────────────────────────

type ToolBalanceGrokRequest struct {
	Provider string `json:"provider"`
	Key      string `json:"key"`
	TeamID   string `json:"team_id"`
}

func queryGrokBalance(req ToolBalanceRequest) (*ToolBalanceResult, error) {
	if req.BaseURL == "" {
		return nil, fmt.Errorf("team_id is required for Grok balance query (pass it in base_url field)")
	}
	teamID := req.BaseURL // we reuse base_url to pass team_id

	url := fmt.Sprintf("https://management-api.x.ai/v1/billing/teams/%s/prepaid/balance", teamID)
	headers := bearerHeader(req.Key)

	body, err := toolBalanceHTTPGet(url, headers)
	if err != nil {
		return nil, fmt.Errorf("grok management API: %w (requires Management API Key)", err)
	}

	type GrokBalanceResp struct {
		Balance struct {
			AmountCents int64 `json:"amount_cents"`
		} `json:"balance"`
	}

	var resp GrokBalanceResp
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	balance := float64(resp.Balance.AmountCents) / 100.0
	return &ToolBalanceResult{
		Provider: "grok",
		Balance:  balance,
		Currency: "USD",
	}, nil
}

// keep decimal import used
var _ = decimal.NewFromFloat
