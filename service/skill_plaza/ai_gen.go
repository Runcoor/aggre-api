/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

package skill_plaza

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/setting/operation_setting"
)

// =====================================================================
// AI tutorial generation
//
// We dogfood our own gateway: the generation call hits this platform's
// /v1/chat/completions endpoint using an admin-configured server token.
// That means usage shows up in billing and admins can swap the model
// from the settings panel without redeploying.
// =====================================================================

// GenerateResult is what GenerateBilingualArticles returns to the
// import orchestrator — one result per language.
type GenerateResult struct {
	Language    string
	Title       string
	Summary     string
	Body        string
	Model       string
	TokensIn    int
	TokensOut   int
	GeneratedAt int64
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Temperature float64       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Stream      bool          `json:"stream"`
}

type chatChoice struct {
	Message chatMessage `json:"message"`
}

type chatUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type chatResponse struct {
	Model   string       `json:"model"`
	Choices []chatChoice `json:"choices"`
	Usage   chatUsage    `json:"usage"`
	Error   *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

// =====================================================================
// Public entry points
// =====================================================================

// GenerateBilingualArticles calls the configured chat model twice
// (once per language) using the system-prompt templates from settings.
// Returns one result per language, in [zh-CN, en] order.
//
// Errors from either call short-circuit the whole batch — partial
// success isn't useful in the admin review flow (admin needs both
// tabs populated).
func GenerateBilingualArticles(ctx context.Context, mf *Manifest) ([]GenerateResult, error) {
	cfg := operation_setting.GetSkillPlazaSetting()
	// Note: we don't gate on cfg.Enabled — that switch only controls
	// public visibility of the Plaza. Admins running this from the
	// admin console are gated by AdminAuth on the route. Blocking
	// generation here would mean admins can't prepare content before
	// flipping the public switch on.
	if strings.TrimSpace(cfg.ServerToken) == "" {
		return nil, errors.New("skill plaza: ServerToken is not configured")
	}
	if strings.TrimSpace(cfg.GenerationModel) == "" {
		return nil, errors.New("skill plaza: GenerationModel is not configured")
	}

	envelope := EnvelopeFiles(mf)
	out := make([]GenerateResult, 0, 2)

	for _, lang := range []string{"zh-CN", "en"} {
		systemPrompt := cfg.GenSystemPromptZh
		if lang == "en" {
			systemPrompt = cfg.GenSystemPromptEn
		}
		userPrompt := buildUserPrompt(mf, envelope, lang)
		body, usage, model, err := callChat(ctx, cfg, systemPrompt, userPrompt)
		if err != nil {
			return nil, fmt.Errorf("generation failed for %s: %w", lang, err)
		}
		title, summary, content := splitArticle(body, mf, lang)
		out = append(out, GenerateResult{
			Language:    lang,
			Title:       title,
			Summary:     summary,
			Body:        content,
			Model:       model,
			TokensIn:    usage.PromptTokens,
			TokensOut:   usage.CompletionTokens,
			GeneratedAt: time.Now().Unix(),
		})
	}
	return out, nil
}

// =====================================================================
// Internals
// =====================================================================

func buildUserPrompt(mf *Manifest, envelope, lang string) string {
	var b strings.Builder
	if lang == "en" {
		b.WriteString("Generate an English-language tutorial for the GitHub repository below.\n")
		b.WriteString("Format the response as: first line `TITLE: <one line>` then `SUMMARY: <one paragraph>` then a `BODY:` line followed by the Markdown body.\n\n")
	} else {
		b.WriteString("请根据下方 GitHub 仓库内容,生成一篇中文教程。\n")
		b.WriteString("响应格式:第一行 `TITLE: <一行标题>`,第二行 `SUMMARY: <一段摘要>`,然后 `BODY:` 一行后接 Markdown 正文。\n\n")
	}
	b.WriteString(envelope)
	b.WriteString(fmt.Sprintf("\nGitHub URL: %s\nCommit: %s\nLicense: %s\n",
		mf.RepoURL, mf.CommitHash, mf.License))
	return b.String()
}

// splitArticle pulls TITLE / SUMMARY / BODY out of the model's response.
// The model is asked to emit those three sentinels (see buildUserPrompt),
// but we still fall back gracefully if it doesn't.
func splitArticle(raw string, mf *Manifest, lang string) (title, summary, body string) {
	scan := raw
	if i := strings.Index(scan, "TITLE:"); i >= 0 {
		scan = scan[i+len("TITLE:"):]
	}
	// Title: first non-empty line
	for {
		nl := strings.IndexByte(scan, '\n')
		if nl < 0 {
			title = strings.TrimSpace(scan)
			scan = ""
			break
		}
		line := strings.TrimSpace(scan[:nl])
		scan = scan[nl+1:]
		if line != "" {
			title = line
			break
		}
	}
	if i := strings.Index(scan, "SUMMARY:"); i >= 0 {
		scan = scan[i+len("SUMMARY:"):]
	}
	if i := strings.Index(scan, "BODY:"); i >= 0 {
		summary = strings.TrimSpace(scan[:i])
		body = strings.TrimSpace(scan[i+len("BODY:"):])
	} else {
		// Model didn't emit BODY sentinel — treat everything as body and
		// derive a summary from the first 240 chars.
		body = strings.TrimSpace(scan)
		summary = firstParagraph(body, 240)
	}
	// Fallbacks if model dropped TITLE entirely.
	if title == "" {
		title = mf.Repo
	}
	if body == "" {
		body = raw
	}
	return title, summary, body
}

func firstParagraph(s string, max int) string {
	s = strings.TrimSpace(s)
	if i := strings.Index(s, "\n\n"); i > 0 {
		s = s[:i]
	}
	// Strip leading Markdown heading markers
	s = strings.TrimLeft(s, "# ")
	if len(s) > max {
		s = s[:max] + "…"
	}
	return s
}

var chatClient = &http.Client{Timeout: 180 * time.Second}

func callChat(ctx context.Context, cfg *operation_setting.SkillPlazaSetting, systemPrompt, userPrompt string) (string, chatUsage, string, error) {
	baseURL := strings.TrimSpace(cfg.ServerBaseURL)
	if baseURL == "" {
		port := 3000
		if common.Port != nil {
			port = *common.Port
		}
		baseURL = fmt.Sprintf("http://127.0.0.1:%d", port)
	}
	baseURL = strings.TrimRight(baseURL, "/")
	endpoint := baseURL + "/v1/chat/completions"

	reqBody := chatRequest{
		Model: cfg.GenerationModel,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: cfg.GenTemperature,
		MaxTokens:   cfg.GenMaxTokens,
		Stream:      false,
	}
	bodyBytes, err := common.Marshal(reqBody)
	if err != nil {
		return "", chatUsage{}, "", fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", chatUsage{}, "", err
	}
	req.Header.Set("Authorization", "Bearer "+cfg.ServerToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "aggre-api/skill-plaza-aigen")

	resp, err := chatClient.Do(req)
	if err != nil {
		return "", chatUsage{}, "", fmt.Errorf("chat call failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		excerpt, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return "", chatUsage{}, "", fmt.Errorf("chat returned %d: %s", resp.StatusCode, strings.TrimSpace(string(excerpt)))
	}

	var parsed chatResponse
	if err := common.DecodeJson(resp.Body, &parsed); err != nil {
		return "", chatUsage{}, "", fmt.Errorf("decode chat response: %w", err)
	}
	if parsed.Error != nil {
		return "", chatUsage{}, "", fmt.Errorf("chat error: %s", parsed.Error.Message)
	}
	if len(parsed.Choices) == 0 {
		return "", chatUsage{}, "", errors.New("chat returned no choices")
	}
	model := parsed.Model
	if model == "" {
		model = cfg.GenerationModel
	}
	return parsed.Choices[0].Message.Content, parsed.Usage, model, nil
}
