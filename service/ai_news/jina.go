package ai_news

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
)

// JinaSearchResult is one item returned by Jina's search endpoint (s.jina.ai).
type JinaSearchResult struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	Description string `json:"description"`
}

// JinaSearch queries https://s.jina.ai/?q={query} and returns the parsed results.
// API key is optional; pass empty string to use the free tier.
func JinaSearch(ctx context.Context, query, apiKey string, limit int) ([]JinaSearchResult, error) {
	if strings.TrimSpace(query) == "" {
		return nil, fmt.Errorf("query is required")
	}
	endpoint := "https://s.jina.ai/?q=" + url.QueryEscape(query)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}
	resp, err := jinaHTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode/100 != 2 {
		return nil, fmt.Errorf("jina search HTTP %d: %s", resp.StatusCode, truncate(string(body), 256))
	}

	// Jina returns either {"data": [...]} or a plain array depending on the
	// account type; handle both.
	var wrapped struct {
		Data []JinaSearchResult `json:"data"`
	}
	if err := common.Unmarshal(body, &wrapped); err == nil && len(wrapped.Data) > 0 {
		return capResults(wrapped.Data, limit), nil
	}
	var flat []JinaSearchResult
	if err := common.Unmarshal(body, &flat); err == nil {
		return capResults(flat, limit), nil
	}
	return nil, fmt.Errorf("jina search: unrecognized response shape")
}

// JinaRead fetches the readable content of a URL via https://r.jina.ai/{target}.
// Returns the markdown-ish plain text body suitable for LLM consumption.
func JinaRead(ctx context.Context, targetURL, apiKey string) (string, error) {
	targetURL = strings.TrimSpace(targetURL)
	if targetURL == "" {
		return "", fmt.Errorf("target URL is required")
	}
	endpoint := "https://r.jina.ai/" + targetURL
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "text/plain")
	req.Header.Set("X-Return-Format", "markdown")
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}
	resp, err := jinaHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil {
		return "", err
	}
	if resp.StatusCode/100 != 2 {
		return "", fmt.Errorf("jina read HTTP %d: %s", resp.StatusCode, truncate(string(body), 256))
	}
	return string(body), nil
}

var jinaHTTPClient = &http.Client{
	Timeout: 60 * time.Second,
}

func capResults(in []JinaSearchResult, limit int) []JinaSearchResult {
	if limit <= 0 || limit >= len(in) {
		return in
	}
	return in[:limit]
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}
