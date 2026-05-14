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
	if err := model.DeleteSkill(id); err != nil {
		common.ApiError(c, err)
		return
	}
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
	common.ApiSuccess(c, updated)
}

// PostSkillPlazaArticleUnpublish POST /api/skill-plaza/admin/articles/:id/unpublish
func PostSkillPlazaArticleUnpublish(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	if err := model.UpdateSkillArticle(id, map[string]any{
		"status": model.SkillStatusOffline,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	updated, _ := model.GetSkillArticle(id)
	common.ApiSuccess(c, updated)
}
