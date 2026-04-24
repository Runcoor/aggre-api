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

// Trigger modes for RunOptions.
const (
	RunModeAuto    = "auto"    // discovery via configured sources + Jina (default)
	RunModeURLs    = "urls"    // skip discovery; admin pasted URLs; still use Jina to fetch bodies
	RunModeContent = "content" // skip discovery and fetching; admin pasted full article bodies
)

// ManualArticle is one piece of pre-fetched content supplied by the admin via
// the "paste content" trigger mode.
type ManualArticle struct {
	Title   string `json:"title"`
	URL     string `json:"url"`
	Content string `json:"content"`
}

// RunOptions carry the per-trigger inputs that override the default auto path.
// All-zero value means RunModeAuto.
type RunOptions struct {
	Mode     string          `json:"mode"`
	URLs     []string        `json:"urls"`
	Articles []ManualArticle `json:"articles"`
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
func RunAgent(ctx context.Context, triggeredBy int, opts RunOptions) (bool, error) {
	rec := newRecorder(triggeredBy)
	settings := system_setting.GetAINewsSettings()
	mode := opts.Mode
	if mode == "" {
		mode = RunModeAuto
	}
	rec.note("mode=%s", mode)

	var candidates []candidate
	skipDedup := false
	skipFetch := false

	switch mode {
	case RunModeAuto:
		sources, err := model.ListAINewsSources(true)
		if err != nil {
			common.SysLog("[ai-news] list sources failed: " + err.Error())
			rec.finishFail(err)
			return false, err
		}
		rec.update(func(s *RunStatus) { s.SourcesEnabled = len(sources) })
		if len(sources) == 0 {
			common.SysLog("[ai-news] no enabled sources configured; nothing to do")
			rec.note("no enabled sources configured — add at least one RSS feed or search query")
			rec.finishFail(fmt.Errorf("no enabled sources configured"))
			return false, nil
		}
		candidates = collectCandidates(ctx, sources, settings, rec)

	case RunModeURLs:
		urls := dedupAndCleanURLs(opts.URLs)
		if len(urls) == 0 {
			rec.finishFail(fmt.Errorf("no URLs provided in manual-URLs mode"))
			return false, nil
		}
		rec.note("manual URLs: %d", len(urls))
		for _, u := range urls {
			candidates = append(candidates, candidate{
				Title:  u,
				URL:    u,
				Source: "Manual:URL",
			})
		}
		skipDedup = true

	case RunModeContent:
		articles := cleanArticles(opts.Articles)
		if len(articles) == 0 {
			rec.finishFail(fmt.Errorf("no articles provided in manual-content mode"))
			return false, nil
		}
		rec.note("manual articles: %d", len(articles))
		for i, a := range articles {
			body := a.Content
			if len(body) > maxBodyChars {
				body = body[:maxBodyChars]
			}
			title := strings.TrimSpace(a.Title)
			if title == "" {
				title = fmt.Sprintf("Manual article #%d", i+1)
			}
			candidates = append(candidates, candidate{
				Title:  title,
				URL:    strings.TrimSpace(a.URL),
				Source: "Manual:Content",
				Body:   body,
			})
		}
		skipDedup = true
		skipFetch = true

	default:
		err := fmt.Errorf("unknown trigger mode %q", mode)
		rec.finishFail(err)
		return false, err
	}

	rec.update(func(s *RunStatus) { s.CandidatesFound = len(candidates) })
	if len(candidates) == 0 {
		common.SysLog("[ai-news] zero candidates discovered")
		rec.note("zero candidates discovered (see notes above)")
		rec.finishFail(fmt.Errorf("zero candidates discovered"))
		return false, nil
	}

	// 2) Dedup against recent briefings (last 7 days) — skipped for manual modes.
	if !skipDedup {
		rec.phase(RunPhaseDedup)
		candidates = dedupAgainstRecentBriefings(candidates)
		rec.update(func(s *RunStatus) { s.CandidatesAfterDedup = len(candidates) })
		if len(candidates) == 0 {
			common.SysLog("[ai-news] all candidates already processed in dedup window")
			rec.note("all candidates already processed in last %d days", int(dedupWindow.Hours()/24))
			rec.finishFail(fmt.Errorf("all candidates already processed"))
			return false, nil
		}
	} else {
		rec.update(func(s *RunStatus) { s.CandidatesAfterDedup = len(candidates) })
	}

	// 3) Cap and fetch full bodies (Jina) — skipped if bodies were supplied.
	if !skipFetch {
		rec.phase(RunPhaseFetch)
		if len(candidates) > maxCandidatesPerRun {
			candidates = candidates[:maxCandidatesPerRun]
		}
		for i := range candidates {
			body, ferr := JinaRead(ctx, candidates[i].URL, settings.JinaAPIKey)
			if ferr != nil {
				common.SysLog(fmt.Sprintf("[ai-news] jina read %s failed: %v", candidates[i].URL, ferr))
				rec.note("jina read failed: %s — %v", candidates[i].URL, ferr)
				continue
			}
			if len(body) > maxBodyChars {
				body = body[:maxBodyChars]
			}
			candidates[i].Body = body
		}
	} else if len(candidates) > maxCandidatesPerRun {
		candidates = candidates[:maxCandidatesPerRun]
	}

	// Drop candidates with empty body
	withBody := candidates[:0]
	for _, c := range candidates {
		if strings.TrimSpace(c.Body) != "" {
			withBody = append(withBody, c)
		}
	}
	rec.update(func(s *RunStatus) { s.BodiesFetched = len(withBody) })
	if len(withBody) == 0 {
		common.SysLog("[ai-news] all candidates failed body extraction")
		rec.note("no candidates have body content — check Jina API key / connectivity (or paste full article content directly)")
		rec.finishFail(fmt.Errorf("no candidates have body content"))
		return false, nil
	}

	// 4) Generate two briefings (deep + simple)
	rec.phase(RunPhaseGenerate)
	deep, derr := generateBriefing(ctx, withBody, model.AINewsBriefingTypeDeep, settings.LLMDeepModel, triggeredBy)
	if derr != nil {
		common.SysLog("[ai-news] deep briefing failed: " + derr.Error())
		rec.note("deep briefing failed: %v", derr)
	} else if deep != nil {
		rec.update(func(s *RunStatus) { s.DeepBriefingId = deep.Id })
	}
	simple, serr := generateBriefing(ctx, withBody, model.AINewsBriefingTypeSimple, settings.LLMSimpleModel, triggeredBy)
	if serr != nil {
		common.SysLog("[ai-news] simple briefing failed: " + serr.Error())
		rec.note("simple briefing failed: %v", serr)
	} else if simple != nil {
		rec.update(func(s *RunStatus) { s.SimpleBriefingId = simple.Id })
	}

	wrote := deep != nil || simple != nil
	if !wrote {
		err := fmt.Errorf("both briefings failed (deep=%v, simple=%v)", derr, serr)
		rec.finishFail(err)
		return false, err
	}

	// 5) Send admin preview email
	if len(settings.AdminPreviewEmails) > 0 {
		rec.phase(RunPhasePreview)
		go sendPreviewEmails(settings.AdminPreviewEmails, deep, simple)
	}
	rec.finishOK()
	return true, nil
}

func collectCandidates(ctx context.Context, sources []model.AINewsSource, settings system_setting.AINewsSettings, rec *runRecorder) []candidate {
	var out []candidate
	seen := make(map[string]bool)

	for _, src := range sources {
		switch src.Type {
		case model.AINewsSourceTypeRSS:
			items, err := FetchRSS(ctx, src.Value)
			if err != nil {
				common.SysLog(fmt.Sprintf("[ai-news] rss %s: %v", src.Value, err))
				if rec != nil {
					rec.note("rss %s failed: %v", src.Value, err)
				}
				continue
			}
			added := 0
			for _, it := range items {
				if it.URL == "" || seen[it.URL] {
					continue
				}
				seen[it.URL] = true
				added++
				out = append(out, candidate{
					Title:       it.Title,
					URL:         it.URL,
					Description: it.Description,
					Source:      "RSS:" + src.Value,
				})
			}
			if rec != nil {
				rec.note("rss %s: %d items (%d new)", src.Value, len(items), added)
			}
		case model.AINewsSourceTypeSearch:
			results, err := JinaSearch(ctx, src.Value, settings.JinaAPIKey, 10)
			if err != nil {
				common.SysLog(fmt.Sprintf("[ai-news] search %q: %v", src.Value, err))
				if rec != nil {
					rec.note("search %q failed: %v", src.Value, err)
				}
				continue
			}
			added := 0
			for _, r := range results {
				if r.URL == "" || seen[r.URL] {
					continue
				}
				seen[r.URL] = true
				added++
				out = append(out, candidate{
					Title:       r.Title,
					URL:         r.URL,
					Description: r.Description,
					Source:      "Search:" + src.Value,
				})
			}
			if rec != nil {
				rec.note("search %q: %d results (%d new)", src.Value, len(results), added)
			}
		}
	}
	return out
}

func dedupAgainstRecentBriefings(candidates []candidate) []candidate {
	cutoff := time.Now().Add(-dedupWindow).Unix()
	var recent []model.AINewsBriefing
	if err := model.DB.Where("generated_at >= ?", cutoff).
		Where("status <> ?", model.AINewsBriefingStatusArchived).
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

func dedupAndCleanURLs(in []string) []string {
	seen := make(map[string]bool)
	out := make([]string, 0, len(in))
	for _, u := range in {
		u = strings.TrimSpace(u)
		if u == "" || seen[u] {
			continue
		}
		// Reject obvious non-URLs early so the LLM doesn't get junk.
		if !strings.HasPrefix(u, "http://") && !strings.HasPrefix(u, "https://") {
			continue
		}
		seen[u] = true
		out = append(out, u)
	}
	return out
}

func cleanArticles(in []ManualArticle) []ManualArticle {
	out := make([]ManualArticle, 0, len(in))
	for _, a := range in {
		if strings.TrimSpace(a.Content) == "" {
			continue
		}
		out = append(out, a)
	}
	return out
}

// PreflightCheckSettings validates that the AI news agent has the minimum
// configuration to run. Returns a non-nil error with a human-readable message
// if anything obvious would prevent a successful run.
//
// In manual-trigger modes (urls / content), the "no sources configured" check
// is skipped because the admin is supplying inputs directly.
func PreflightCheckSettings(opts RunOptions) error {
	settings := system_setting.GetAINewsSettings()
	switch settings.LLMSource {
	case system_setting.AINewsLLMSourceCustom:
		if strings.TrimSpace(settings.LLMCustomBaseURL) == "" || strings.TrimSpace(settings.LLMCustomAPIKey) == "" {
			return fmt.Errorf("LLM 模式为 custom,但未配置 base_url 或 api_key,请到设置页填写")
		}
	case system_setting.AINewsLLMSourceChannel:
		if settings.LLMChannelId <= 0 {
			return fmt.Errorf("LLM 模式为 channel,但未选择渠道(llm_channel_id),请到设置页选择一个渠道")
		}
		if _, err := getChannelById(settings.LLMChannelId); err != nil {
			return fmt.Errorf("LLM 渠道 #%d 不存在或不可读: %w", settings.LLMChannelId, err)
		}
	default:
		return fmt.Errorf("LLM 模式不合法 (%q),应为 custom 或 channel", settings.LLMSource)
	}
	if strings.TrimSpace(settings.LLMDeepModel) == "" && strings.TrimSpace(settings.LLMSimpleModel) == "" {
		return fmt.Errorf("深度模型和简单模型都未配置")
	}

	mode := opts.Mode
	if mode == "" {
		mode = RunModeAuto
	}
	switch mode {
	case RunModeAuto:
		sources, err := model.ListAINewsSources(true)
		if err != nil {
			return fmt.Errorf("查询信息源失败: %w", err)
		}
		if len(sources) == 0 {
			return fmt.Errorf("尚未配置任何启用的信息源,请到信息源页添加 RSS 或 search,或选择手动模式")
		}
	case RunModeURLs:
		if len(dedupAndCleanURLs(opts.URLs)) == 0 {
			return fmt.Errorf("手动 URL 模式需要至少一个有效的 http(s) 链接")
		}
	case RunModeContent:
		if len(cleanArticles(opts.Articles)) == 0 {
			return fmt.Errorf("手动正文模式需要至少一篇带内容的文章")
		}
	default:
		return fmt.Errorf("未知触发模式: %q", mode)
	}
	return nil
}

// RunAgentManually is the entry point exposed to admin trigger endpoint.
// It runs in a background goroutine with its own timeout context.
func RunAgentManually(triggeredBy int, opts RunOptions) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()
		_, _ = RunAgent(ctx, triggeredBy, opts)
	}()
}
