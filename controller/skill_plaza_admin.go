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
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/service/skill_plaza"
	"github.com/runcoor/aggre-api/setting/operation_setting"
	"gorm.io/gorm"
)

// =====================================================================
// SKILLS 广场 — admin endpoints.
// All routes here sit behind AdminAuth(); see router/api-router.go.
// =====================================================================

func currentAdminID(c *gin.Context) int {
	if id, ok := c.Get("id"); ok {
		switch v := id.(type) {
		case int:
			return v
		case int64:
			return int(v)
		case float64:
			return int(v)
		}
	}
	return 0
}

// =====================================================================
// Import jobs
// =====================================================================

type adminImportRequest struct {
	RepoURL string `json:"repo_url"`
	Branch  string `json:"branch"`
}

// PostSkillPlazaImport POST /api/skill-plaza/admin/imports
// Creates a SkillImportJob and launches the async pipeline.
// Returns the job ID so the UI can poll status.
func PostSkillPlazaImport(c *gin.Context) {
	var req adminImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	req.RepoURL = strings.TrimSpace(req.RepoURL)
	if req.RepoURL == "" {
		common.ApiErrorMsg(c, "repo_url is required")
		return
	}
	// Validate URL early so we can 400 instead of failing async.
	ref, err := skill_plaza.ParseGitHubURL(req.RepoURL)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	branch := strings.TrimSpace(req.Branch)
	if branch == "" {
		branch = ref.Branch
	}

	adminID := currentAdminID(c)
	job := &model.SkillImportJob{
		RepoURL:     ref.CanonicalURL(),
		Branch:      branch,
		Status:      model.SkillImportStatusPending,
		TriggeredBy: adminID,
	}
	if err := model.CreateSkillImportJob(job); err != nil {
		common.ApiError(c, err)
		return
	}
	skill_plaza.StartImportAsync(job.Id, job.RepoURL, branch, adminID)
	common.ApiSuccess(c, job)
}

// GetSkillPlazaImportJob GET /api/skill-plaza/admin/imports/:id
func GetSkillPlazaImportJob(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	job, err := model.GetSkillImportJob(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, job)
}

// ListSkillPlazaImportJobs GET /api/skill-plaza/admin/imports
// Returns recent import jobs (defaults to current admin's jobs unless
// ?all=true is passed).
func ListSkillPlazaImportJobs(c *gin.Context) {
	all := c.Query("all") == "true"
	adminID := 0
	if !all {
		adminID = currentAdminID(c)
	}
	limit, _ := strconv.Atoi(c.Query("limit"))
	jobs, err := model.ListSkillImportJobs(adminID, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, jobs)
}

// =====================================================================
// Skills
// =====================================================================

// ListSkillPlazaSkillsAdmin GET /api/skill-plaza/admin/skills
func ListSkillPlazaSkillsAdmin(c *gin.Context) {
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("page_size"))
	filter := model.ListSkillsAdminFilter{
		Status:     c.Query("status"),
		SourceType: c.Query("source_type"),
		Category:   c.Query("category"),
		Search:     c.Query("search"),
		Page:       page,
		PageSize:   pageSize,
	}
	items, total, err := model.ListSkillsAdmin(filter)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"items": items,
		"total": total,
		"page":  filter.Page,
	})
}

// GetSkillPlazaSkillAdmin GET /api/skill-plaza/admin/skills/:id
// Returns the Skill row plus both language articles.
func GetSkillPlazaSkillAdmin(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	skill, err := model.GetSkillByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	articles, err := model.ListSkillArticlesBySkill(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"skill":    skill,
		"articles": articles,
		"tags":     skill.Tags(),
	})
}

type adminUpdateSkillRequest struct {
	Name     *string  `json:"name"`
	Category *string  `json:"category"`
	Tags     []string `json:"tags"`
	Status   *string  `json:"status"`
	Slug     *string  `json:"slug"`
}

// PutSkillPlazaSkill PUT /api/skill-plaza/admin/skills/:id
// Admin metadata edits (name, category, tags, status, slug).
func PutSkillPlazaSkill(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	var req adminUpdateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	updates := map[string]any{}
	if req.Name != nil {
		updates["name"] = strings.TrimSpace(*req.Name)
	}
	if req.Category != nil {
		updates["category"] = strings.TrimSpace(*req.Category)
	}
	if req.Tags != nil {
		s := &model.Skill{}
		s.SetTags(req.Tags)
		updates["tags"] = s.TagsCSV
	}
	if req.Status != nil {
		updates["status"] = strings.TrimSpace(*req.Status)
	}
	if req.Slug != nil {
		clean := skill_plaza.SanitizeUserSlug(*req.Slug)
		if clean == "" {
			common.ApiErrorMsg(c, "slug must be a-z, 0-9, '-', '_'")
			return
		}
		updates["slug"] = clean
	}
	if len(updates) == 0 {
		common.ApiErrorMsg(c, "nothing to update")
		return
	}
	if err := model.UpdateSkill(id, updates); err != nil {
		common.ApiError(c, err)
		return
	}
	skill, err := model.GetSkillByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, skill)
}

// DeleteSkillPlazaSkill DELETE /api/skill-plaza/admin/skills/:id
func DeleteSkillPlazaSkill(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	// Pre-read so the audit summary captures the skill name even after the
	// row is gone. Falls back to id if the read fails.
	var summary string
	if s, err := model.GetSkillByID(id); err == nil && s != nil {
		summary = "删除 Skill: " + s.Name + " (" + s.Slug + ")"
	} else {
		summary = "删除 Skill #" + strconv.Itoa(id)
	}
	if err := model.DeleteSkill(id); err != nil {
		common.ApiError(c, err)
		return
	}
	_ = model.WriteSkillAuditLog(currentAdminID(c),
		model.SkillAuditActionSkillDelete, "skill", id, summary, "")
	common.ApiSuccess(c, gin.H{"id": id})
}

// =====================================================================
// Articles
// =====================================================================

type adminUpdateArticleRequest struct {
	Title      *string `json:"title"`
	Summary    *string `json:"summary"`
	Body       *string `json:"body"`
	CoverImage *string `json:"cover_image"`
}

// PutSkillPlazaArticle PUT /api/skill-plaza/admin/articles/:id
// Admin edits the AI-generated draft.
func PutSkillPlazaArticle(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	var req adminUpdateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	updates := map[string]any{
		"edited_by": currentAdminID(c),
		"edited_at": time.Now().Unix(),
	}
	if req.Title != nil {
		updates["title"] = strings.TrimSpace(*req.Title)
	}
	if req.Summary != nil {
		updates["summary"] = *req.Summary
	}
	if req.Body != nil {
		updates["body"] = *req.Body
	}
	if req.CoverImage != nil {
		updates["cover_image"] = strings.TrimSpace(*req.CoverImage)
	}
	// Bump the human-revisions counter so the regenerate flow can warn
	// admins they'd overwrite their edits.
	updates["human_revisions"] = gorm.Expr("human_revisions + 1")

	if err := model.UpdateSkillArticle(id, updates); err != nil {
		common.ApiError(c, err)
		return
	}
	article, err := model.GetSkillArticle(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, article)
}

// =====================================================================
// Publish / unpublish
// =====================================================================

// PostSkillPlazaArticlePublish POST /api/skill-plaza/admin/articles/:id/publish
// Marks the article published and flips the parent Skill to published
// the first time any of its articles goes live.
func PostSkillPlazaArticlePublish(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	article, err := model.GetSkillArticle(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	now := time.Now().Unix()
	if err := model.UpdateSkillArticle(id, map[string]any{
		"status":       model.SkillStatusPublished,
		"published_at": now,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	// Lift the Skill to published if it's still in draft / needs_update.
	skill, err := model.GetSkillByID(article.SkillId)
	if err == nil && (skill.Status == model.SkillStatusDraft ||
		skill.Status == model.SkillStatusNeedsUpdate ||
		skill.Status == model.SkillStatusReview) {
		_ = model.UpdateSkill(skill.Id, map[string]any{
			"status": model.SkillStatusPublished,
		})
	}
	updated, _ := model.GetSkillArticle(id)
	_ = model.WriteSkillAuditLog(currentAdminID(c),
		model.SkillAuditActionPublish, "article", id,
		"发布文章: "+article.Title, "")
	common.ApiSuccess(c, updated)
}

// =====================================================================
// Module settings
// =====================================================================
//
// We don't go through /api/option/ because that's RootAuth-gated — only
// the super-admin (role 100) can write there. For a single-module config
// that's overkill; module-level config should be writable by anyone with
// access to the module's admin UI (role 10+). This endpoint exposes the
// same skill_plaza_setting.* keys but enforces AdminAuth instead.

// GetSkillPlazaAdminSettings GET /api/skill-plaza/admin/settings
// Returns the full SkillPlazaSetting (sensitive fields included — admins
// already see the settings page).
func GetSkillPlazaAdminSettings(c *gin.Context) {
	common.ApiSuccess(c, operation_setting.GetSkillPlazaSetting())
}

// PutSkillPlazaAdminSettings PUT /api/skill-plaza/admin/settings
// Accepts the whole settings struct. Persists each field as a
// "skill_plaza_setting.<key>" row in the options table so the existing
// reload-from-DB path picks it up too.
func PutSkillPlazaAdminSettings(c *gin.Context) {
	var req operation_setting.SkillPlazaSetting
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}

	// Persist via UpdateOption — same path /api/option/ uses, but without
	// the RootAuth wall. UpdateOption writes the DB row and refreshes the
	// in-memory typed config via config.GlobalConfig.
	pairs := map[string]string{
		"skill_plaza_setting.enabled":             strconv.FormatBool(req.Enabled),
		"skill_plaza_setting.test_mode":           strconv.FormatBool(req.TestMode),
		"skill_plaza_setting.test_mode_users":     strings.TrimSpace(req.TestModeUsers),
		"skill_plaza_setting.sensitive_words":     req.SensitiveWords,
		"skill_plaza_setting.generation_model":    strings.TrimSpace(req.GenerationModel),
		"skill_plaza_setting.server_token":        req.ServerToken,
		"skill_plaza_setting.server_base_url":     strings.TrimSpace(req.ServerBaseURL),
		"skill_plaza_setting.gen_system_prompt_zh": req.GenSystemPromptZh,
		"skill_plaza_setting.gen_system_prompt_en": req.GenSystemPromptEn,
		"skill_plaza_setting.gen_temperature":     strconv.FormatFloat(req.GenTemperature, 'f', -1, 64),
		"skill_plaza_setting.gen_max_tokens":      strconv.Itoa(req.GenMaxTokens),
		"skill_plaza_setting.github_pat":          req.GitHubPAT,
		"skill_plaza_setting.max_repo_size_mb":    strconv.Itoa(req.MaxRepoSizeMB),
		"skill_plaza_setting.max_file_size_kb":    strconv.Itoa(req.MaxFileSizeKB),
		"skill_plaza_setting.max_file_count":      strconv.Itoa(req.MaxFileCount),
	}
	for k, v := range pairs {
		if err := model.UpdateOption(k, v); err != nil {
			common.ApiError(c, err)
			return
		}
	}
	_ = model.WriteSkillAuditLog(currentAdminID(c),
		model.SkillAuditActionSettings, "skill_plaza_setting", 0,
		"更新模块设置", "")
	common.ApiSuccess(c, operation_setting.GetSkillPlazaSetting())
}

// =====================================================================
// Audit log — read-only timeline of admin actions.
// =====================================================================

// ListSkillPlazaAuditLogs GET /api/skill-plaza/admin/audit-logs
func ListSkillPlazaAuditLogs(c *gin.Context) {
	action := c.Query("action")
	targetType := c.Query("target_type")
	limit, _ := strconv.Atoi(c.Query("limit"))
	rows, err := model.ListSkillAuditLogs(action, targetType, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"items": rows})
}

// =====================================================================
// Reports — admin queue handlers.
// =====================================================================

// ListSkillPlazaReports GET /api/skill-plaza/admin/reports?status=open
//
// Optional status filter; defaults to "open" since that's the working
// queue. Pass status=all (or empty after the default kicks in via
// explicit "") to see resolved/dismissed too.
func ListSkillPlazaReports(c *gin.Context) {
	status := c.DefaultQuery("status", model.SkillReportStatusOpen)
	if status == "all" {
		status = ""
	}
	limit, _ := strconv.Atoi(c.Query("limit"))
	rows, err := model.ListSkillReports(status, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	open, _ := model.CountOpenReports()
	common.ApiSuccess(c, gin.H{
		"items":      rows,
		"open_count": open,
	})
}

type resolveReportRequest struct {
	Status string `json:"status"` // resolved | dismissed | open
}

// PostSkillPlazaReportResolve POST /api/skill-plaza/admin/reports/:id/resolve
func PostSkillPlazaReportResolve(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	var req resolveReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	if req.Status == "" {
		req.Status = model.SkillReportStatusResolved
	}
	if err := model.ResolveSkillReport(id, currentAdminID(c), req.Status); err != nil {
		common.ApiError(c, err)
		return
	}
	_ = model.WriteSkillAuditLog(currentAdminID(c),
		model.SkillAuditActionReportResolve, "report", id,
		"处理举报 #"+strconv.Itoa(id)+" → "+req.Status, "")
	common.ApiSuccess(c, gin.H{"id": id, "status": req.Status})
}

// PostSkillPlazaArticleUnpublish POST /api/skill-plaza/admin/articles/:id/unpublish
func PostSkillPlazaArticleUnpublish(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	article, _ := model.GetSkillArticle(id)
	if err := model.UpdateSkillArticle(id, map[string]any{
		"status": model.SkillStatusOffline,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	title := ""
	if article != nil {
		title = article.Title
	}
	_ = model.WriteSkillAuditLog(currentAdminID(c),
		model.SkillAuditActionUnpublish, "article", id,
		"下架文章: "+title, "")
	updated, _ := model.GetSkillArticle(id)
	common.ApiSuccess(c, updated)
}
