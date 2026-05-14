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

package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/operation_setting"
)

// =====================================================================
// SKILLS 广场 — public read endpoints. No auth required.
//
// Hidden behind a feature flag (operation_setting.IsSkillPlazaEnabled);
// while disabled the routes 404 so we don't leak the module surface.
// =====================================================================

// isSkillPlazaVisibleForSession reports whether the current request's
// session passes the public visibility checks. Admin/preview override
// is layered on by skillPlazaGate, not here, so this stays a clean
// "would the average user see the module?" decision.
func isSkillPlazaVisibleForSession(c *gin.Context) bool {
	if !operation_setting.IsSkillPlazaEnabled() {
		return false
	}
	if !operation_setting.IsSkillPlazaTestMode() {
		return true
	}
	// Test mode: only super-admin OR allow-listed usernames.
	sess := sessions.Default(c)
	if role, ok := sess.Get("role").(int); ok && role >= common.RoleRootUser {
		return true
	}
	if uname, ok := sess.Get("username").(string); ok && uname != "" {
		if operation_setting.IsSkillPlazaAllowedUser(uname) {
			return true
		}
	}
	return false
}

func skillPlazaGate(c *gin.Context) bool {
	if isSkillPlazaVisibleForSession(c) {
		return true
	}
	// Admins (role >= 10) can preview the Plaza even when the module is
	// hidden from the public — otherwise an admin staging content can't
	// see what end users would see once the gates flip. The nav entry
	// stays hidden for them too; they reach this via /console or by
	// typing the URL directly.
	if role, ok := sessions.Default(c).Get("role").(int); ok && role >= common.RoleAdminUser {
		return true
	}
	c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Not Found"})
	return false
}

// =====================================================================
// Module status (used by the frontend to decide whether to render the
// public nav entry, before any data is fetched).
// =====================================================================

// GetSkillPlazaStatus GET /api/skill-plaza/status
// Returns the module's public state plus a per-request `visible` field
// (true when the caller's session passes the visibility checks). The
// frontend uses this to gate the nav entry without spamming 404s.
// Always 200.
func GetSkillPlazaStatus(c *gin.Context) {
	common.ApiSuccess(c, gin.H{
		"enabled":   operation_setting.IsSkillPlazaEnabled(),
		"test_mode": operation_setting.IsSkillPlazaTestMode(),
		"visible":   isSkillPlazaVisibleForSession(c),
	})
}

// =====================================================================
// Public list / detail
// =====================================================================

// publicSkillCard is the trimmed Skill payload returned in list responses.
// We compose article fields into the same object so the frontend can
// render cards without a second fetch per item.
type publicSkillCard struct {
	Id            int      `json:"id"`
	Slug          string   `json:"slug"`
	Name          string   `json:"name"`
	Title         string   `json:"title"`
	Summary       string   `json:"summary"`
	SourceType    string   `json:"source_type"`
	GitHubURL     string   `json:"github_url"`
	Owner         string   `json:"owner"`
	RepoName      string   `json:"repo_name"`
	CommitHash    string   `json:"commit_hash"`
	License       string   `json:"license"`
	Category      string   `json:"category"`
	CoverSeed     string   `json:"cover_seed"`
	CoverImage    string   `json:"cover_image"`
	Tags          []string `json:"tags"`
	Language      string   `json:"language"`
	RatingAverage float64  `json:"rating_average"`
	RatingCount   int      `json:"rating_count"`
	FavoriteCount int      `json:"favorite_count"`
	CommentCount  int      `json:"comment_count"`
	PublishedAt   int64    `json:"published_at"`
	RepoUpdatedAt int64    `json:"repo_updated_at"`
}

// ListSkillPlazaPublic GET /api/skill-plaza/skills
// Public list — only published skills, with the joined article payload
// for the requested language (falling back to the other language if the
// requested one isn't published).
func ListSkillPlazaPublic(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("page_size"))
	lang := strings.TrimSpace(c.Query("language"))
	if lang == "" {
		lang = model.SkillArticleLangZh
	}
	filter := model.ListSkillsPublicFilter{
		Category:   c.Query("category"),
		SourceType: c.Query("source_type"),
		Tag:        c.Query("tag"),
		Language:   lang,
		Search:     c.Query("search"),
		Sort:       c.Query("sort"),
		Page:       page,
		PageSize:   pageSize,
	}
	skills, total, err := model.ListSkillsPublic(filter)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	items := make([]publicSkillCard, 0, len(skills))
	for i := range skills {
		s := &skills[i]
		card := publicSkillCard{
			Id:            s.Id,
			Slug:          s.Slug,
			Name:          s.Name,
			SourceType:    s.SourceType,
			GitHubURL:     s.GitHubURL,
			Owner:         s.Owner,
			RepoName:      s.RepoName,
			CommitHash:    s.CommitHash,
			License:       s.License,
			Category:      s.Category,
			CoverSeed:     s.CoverSeed,
			Tags:          s.Tags(),
			RepoUpdatedAt: s.RepoUpdatedAt,
			// Aggregates live on the Skill itself (a rating applies to the
			// skill, not the language-specific translation).
			RatingAverage: s.RatingAverage,
			RatingCount:   s.RatingCount,
			FavoriteCount: s.FavoriteCount,
			CommentCount:  s.CommentCount,
		}
		article, err := model.GetPublishedArticleForSkill(s.Id, lang)
		if err == nil && article != nil {
			card.Title = article.Title
			card.Summary = article.Summary
			card.Language = article.Language
			card.CoverImage = article.CoverImage
			card.PublishedAt = article.PublishedAt
		} else {
			card.Title = s.Name
		}
		items = append(items, card)
	}
	common.ApiSuccess(c, gin.H{
		"items": items,
		"total": total,
		"page":  filter.Page,
	})
}

// GetSkillPlazaPublic GET /api/skill-plaza/skills/:slug
// Public detail — Skill metadata + the published article for the
// requested language (falling back if missing).
func GetSkillPlazaPublic(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		common.ApiErrorMsg(c, "slug is required")
		return
	}
	skill, err := model.GetSkillBySlug(slug)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if skill.Status != model.SkillStatusPublished &&
		skill.Status != model.SkillStatusNeedsUpdate {
		common.ApiErrorMsg(c, "skill is not published")
		return
	}
	lang := strings.TrimSpace(c.Query("language"))
	if lang == "" {
		lang = model.SkillArticleLangZh
	}
	article, err := model.GetPublishedArticleForSkill(skill.Id, lang)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	// Best-effort view-count bump.
	model.IncrementArticleViewCount(article.Id)

	// Other-language sibling for the language switcher.
	siblings, _ := model.ListSkillArticlesBySkill(skill.Id)
	availableLanguages := make([]string, 0, len(siblings))
	for _, s := range siblings {
		if s.Status == model.SkillStatusPublished {
			availableLanguages = append(availableLanguages, s.Language)
		}
	}

	common.ApiSuccess(c, gin.H{
		"skill":               skill,
		"article":             article,
		"tags":                skill.Tags(),
		"available_languages": availableLanguages,
	})
}
