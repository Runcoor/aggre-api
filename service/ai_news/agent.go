package ai_news

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/system_setting"
)

// candidate is one URL we found via a source. Title/desc come from the feed
// or search hit; body is filled in by JinaRead.
type candidate struct {
	Title       string
	URL         string
	Description string
	Source      string // human-readable provenance ("RSS:hackernews", "Search:'agent'")
	Body        string
}

// SourceItem is the lightweight reference stored on a briefing's sources_json.
type SourceItem struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

const (
	// Max candidates to send to the LLM per run (cost control).
	maxCandidatesPerRun = 12
	// Max body length per candidate (~16k chars ≈ 4k tokens).
	maxBodyChars = 16000
	// How far back to look for already-processed URLs.
	dedupWindow = 7 * 24 * time.Hour
)

// RunAgent executes one collection-summarization-draft cycle.
// triggeredBy: 0 for cron, otherwise the admin user id who triggered manually.
//
// Always returns nil for callers that don't care about errors; logs internally.
// The boolean indicates whether at least one briefing was written.
func RunAgent(ctx context.Context, triggeredBy int) (bool, error) {
	settings := system_setting.GetAINewsSettings()

	sources, err := model.ListAINewsSources(true)
	if err != nil {
		common.SysLog("[ai-news] list sources failed: " + err.Error())
		return false, err
	}
	if len(sources) == 0 {
		common.SysLog("[ai-news] no enabled sources configured; nothing to do")
		return false, nil
	}

	// 1) Discover candidates
	candidates := collectCandidates(ctx, sources, settings)
	if len(candidates) == 0 {
		common.SysLog("[ai-news] zero candidates discovered")
		return false, nil
	}

	// 2) Dedup against recent briefings (last 7 days)
	candidates = dedupAgainstRecentBriefings(candidates)
	if len(candidates) == 0 {
		common.SysLog("[ai-news] all candidates already processed in dedup window")
		return false, nil
	}

	// 3) Cap and fetch full bodies (Jina)
	if len(candidates) > maxCandidatesPerRun {
		candidates = candidates[:maxCandidatesPerRun]
	}
	for i := range candidates {
		body, ferr := JinaRead(ctx, candidates[i].URL, settings.JinaAPIKey)
		if ferr != nil {
			common.SysLog(fmt.Sprintf("[ai-news] jina read %s failed: %v", candidates[i].URL, ferr))
			continue
		}
		if len(body) > maxBodyChars {
			body = body[:maxBodyChars]
		}
		candidates[i].Body = body
	}

	// Drop candidates with empty body
	withBody := candidates[:0]
	for _, c := range candidates {
		if strings.TrimSpace(c.Body) != "" {
			withBody = append(withBody, c)
		}
	}
	if len(withBody) == 0 {
		common.SysLog("[ai-news] all candidates failed body extraction")
		return false, nil
	}

	// 4) Generate two briefings (deep + simple)
	deep, derr := generateBriefing(ctx, withBody, model.AINewsBriefingTypeDeep, settings.LLMDeepModel, triggeredBy)
	if derr != nil {
		common.SysLog("[ai-news] deep briefing failed: " + derr.Error())
	}
	simple, serr := generateBriefing(ctx, withBody, model.AINewsBriefingTypeSimple, settings.LLMSimpleModel, triggeredBy)
	if serr != nil {
		common.SysLog("[ai-news] simple briefing failed: " + serr.Error())
	}

	wrote := deep != nil || simple != nil
	if !wrote {
		return false, fmt.Errorf("both briefings failed (deep=%v, simple=%v)", derr, serr)
	}

	// 5) Send admin preview email
	if len(settings.AdminPreviewEmails) > 0 {
		go sendPreviewEmails(settings.AdminPreviewEmails, deep, simple)
	}
	return true, nil
}

func collectCandidates(ctx context.Context, sources []model.AINewsSource, settings system_setting.AINewsSettings) []candidate {
	var out []candidate
	seen := make(map[string]bool)

	for _, src := range sources {
		switch src.Type {
		case model.AINewsSourceTypeRSS:
			items, err := FetchRSS(ctx, src.Value)
			if err != nil {
				common.SysLog(fmt.Sprintf("[ai-news] rss %s: %v", src.Value, err))
				continue
			}
			for _, it := range items {
				if it.URL == "" || seen[it.URL] {
					continue
				}
				seen[it.URL] = true
				out = append(out, candidate{
					Title:       it.Title,
					URL:         it.URL,
					Description: it.Description,
					Source:      "RSS:" + src.Value,
				})
			}
		case model.AINewsSourceTypeSearch:
			results, err := JinaSearch(ctx, src.Value, settings.JinaAPIKey, 10)
			if err != nil {
				common.SysLog(fmt.Sprintf("[ai-news] search %q: %v", src.Value, err))
				continue
			}
			for _, r := range results {
				if r.URL == "" || seen[r.URL] {
					continue
				}
				seen[r.URL] = true
				out = append(out, candidate{
					Title:       r.Title,
					URL:         r.URL,
					Description: r.Description,
					Source:      "Search:" + src.Value,
				})
			}
		}
	}
	return out
}

func dedupAgainstRecentBriefings(candidates []candidate) []candidate {
	cutoff := time.Now().Add(-dedupWindow).Unix()
	var recent []model.AINewsBriefing
	if err := model.DB.Where("generated_at >= ?", cutoff).
		Select("id", "sources_json").
		Find(&recent).Error; err != nil {
		// Fail open — better to over-process than to skip on db errors.
		common.SysLog("[ai-news] dedup query failed (continuing): " + err.Error())
		return candidates
	}
	processed := make(map[string]bool)
	for _, b := range recent {
		var srcs []SourceItem
		if err := common.UnmarshalJsonStr(b.SourcesJSON, &srcs); err == nil {
			for _, s := range srcs {
				processed[s.URL] = true
			}
		}
	}
	if len(processed) == 0 {
		return candidates
	}
	out := candidates[:0]
	for _, c := range candidates {
		if !processed[c.URL] {
			out = append(out, c)
		}
	}
	return out
}

// RunAgentManually is the entry point exposed to admin trigger endpoint.
// It runs in a background goroutine with its own timeout context.
func RunAgentManually(triggeredBy int) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		_, _ = RunAgent(ctx, triggeredBy)
	}()
}
