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

	"github.com/gin-gonic/gin"
	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/service/skill_plaza"
	"gorm.io/gorm"
)

// =====================================================================
// SKILLS 广场 — user article (V1.1 投稿) handlers.
//
// Three route groups:
//   - public:  /skill-plaza/user-articles{,/:slug}        (no auth)
//   - user:    /skill-plaza/{user-articles, me/articles}  (UserAuth)
//   - admin:   /skill-plaza/admin/user-articles/...       (AdminAuth)
//
// Lifecycle: draft → pending → approved (public) | rejected | offline.
// Sensitive-word filtering runs on submit, not on draft save, so authors
// can iterate freely before pushing to the queue.
// =====================================================================

// articleEditableMaxBytes — cap content payload at 200KB. Generous for
// long-form Markdown but prevents runaway DB rows.
const articleEditableMaxBytes = 200 * 1024

type createUserArticleRequest struct {
	Type       string   `json:"type"`
	Language   string   `json:"language"`
	Title      string   `json:"title"`
	Summary    string   `json:"summary"`
	Content    string   `json:"content"`
	CoverImage string   `json:"cover_image"`
	Tags       []string `json:"tags"`
	SkillId    int      `json:"skill_id"`
}

func (r *createUserArticleRequest) normalize() {
	r.Title = strings.TrimSpace(r.Title)
	r.Summary = strings.TrimSpace(r.Summary)
	r.Type = strings.TrimSpace(r.Type)
	r.Language = strings.TrimSpace(r.Language)
}

func (r *createUserArticleRequest) validate() string {
	if r.Title == "" {
		return "title is required"
	}
	if len(r.Title) > 240 {
		return "title too long (max 240 chars)"
	}
	if len(r.Content) > articleEditableMaxBytes {
		return "content too large"
	}
	if r.Type != "" && !model.IsValidSkillUserArticleType(r.Type) {
		return "invalid type"
	}
	return ""
}

// PostUserArticle POST /api/skill-plaza/user-articles
// Creates a new draft. Author = current user. No sensitive-word check
// here — drafts may contain anything until the author submits.
func PostUserArticle(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	var req createUserArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	req.normalize()
	if msg := req.validate(); msg != "" {
		common.ApiErrorMsg(c, msg)
		return
	}
	article := &model.SkillUserArticle{
		AuthorId:   userID,
		Type:       req.Type,
		Language:   req.Language,
		Title:      req.Title,
		Summary:    req.Summary,
		Content:    req.Content,
		CoverImage: req.CoverImage,
		SkillId:    req.SkillId,
	}
	article.SetTags(req.Tags)
	if err := model.CreateSkillUserArticle(article); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, article)
}

// PutMyArticle PUT /api/skill-plaza/me/articles/:id
// Author updates their own article. Only allowed for draft / rejected
// rows — approved / pending articles are locked from this path. To send
// a rejected article back for review, edit then call /submit.
func PutMyArticle(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	cur, err := model.GetSkillUserArticleByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if cur.AuthorId != userID {
		common.ApiErrorMsg(c, "not your article")
		return
	}
	if cur.Status != model.SkillUserArticleStatusDraft &&
		cur.Status != model.SkillUserArticleStatusRejected {
		common.ApiErrorMsg(c, "this article cannot be edited in its current state")
		return
	}
	var req createUserArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	req.normalize()
	if msg := req.validate(); msg != "" {
		common.ApiErrorMsg(c, msg)
		return
	}
	updates := map[string]any{
		"title":       req.Title,
		"summary":     req.Summary,
		"content":     req.Content,
		"cover_image": req.CoverImage,
	}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Language != "" {
		updates["language"] = req.Language
	}
	if req.SkillId >= 0 {
		updates["skill_id"] = req.SkillId
	}
	// Rebuild tags CSV (dedup / trim) — go through SetTags then push the
	// stored string in the updates map so empty input clears the column.
	tmp := &model.SkillUserArticle{}
	tmp.SetTags(req.Tags)
	updates["tags"] = tmp.TagsCSV

	if err := model.UpdateSkillUserArticle(id, updates); err != nil {
		common.ApiError(c, err)
		return
	}
	fresh, _ := model.GetSkillUserArticleByID(id)
	common.ApiSuccess(c, fresh)
}

// DeleteMyArticle DELETE /api/skill-plaza/me/articles/:id
func DeleteMyArticle(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	if err := model.DeleteSkillUserArticle(id, userID, false); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"id": id})
}

// PostMyArticleSubmit POST /api/skill-plaza/me/articles/:id/submit
// Author flips draft / rejected → pending. Sensitive-word filter runs
// here so it can return matched terms for inline UI highlight.
func PostMyArticleSubmit(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	cur, err := model.GetSkillUserArticleByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if cur.AuthorId != userID {
		common.ApiErrorMsg(c, "not your article")
		return
	}
	// Sensitive-word screening — same envelope shape as PostSkillComment
	// so the editor can render `data.sensitive_words` consistently.
	combined := cur.Title + "\n" + cur.Summary + "\n" + cur.Content
	if hits := skill_plaza.DetectSensitive(combined); len(hits) > 0 {
		c.JSON(200, gin.H{
			"success": false,
			"message": "包含敏感词，请修改后重试",
			"data":    gin.H{"sensitive_words": hits},
		})
		return
	}
	if err := model.SubmitSkillUserArticle(id, userID); err != nil {
		common.ApiError(c, err)
		return
	}
	fresh, _ := model.GetSkillUserArticleByID(id)
	common.ApiSuccess(c, fresh)
}

// GetMyArticle GET /api/skill-plaza/me/articles/:id
// Author fetches their own article (any status). Drafts and rejected
// rows are not visible via the public route.
func GetMyArticle(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	article, err := model.GetSkillUserArticleByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if article.AuthorId != userID {
		common.ApiErrorMsg(c, "not your article")
		return
	}
	common.ApiSuccess(c, article)
}

// ListMyArticles GET /api/skill-plaza/me/articles
func ListMyArticles(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.Query("limit"))
	rows, err := model.ListUserArticlesByAuthor(userID, status, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"items": rows, "total": len(rows)})
}

// =====================================================================
// Public read
// =====================================================================

// ListUserArticlesPublicEndpoint GET /api/skill-plaza/user-articles
func ListUserArticlesPublicEndpoint(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("page_size"))
	rows, total, err := model.ListUserArticlesPublic(model.ListUserArticlesPublicFilter{
		Type:     c.Query("type"),
		Language: c.Query("language"),
		Tag:      c.Query("tag"),
		Search:   c.Query("search"),
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"items": rows, "total": total, "page": page})
}

// GetUserArticlePublic GET /api/skill-plaza/user-articles/:slug
// Only returns approved articles. Bumps view_count by 1 (fire-and-forget).
func GetUserArticlePublic(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		common.ApiErrorMsg(c, "slug is required")
		return
	}
	article, err := model.GetSkillUserArticleBySlug(slug)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if article.Status != model.SkillUserArticleStatusApproved {
		common.ApiErrorMsg(c, "article not found")
		return
	}
	// View counter bump — non-blocking and best-effort. Failures here
	// should never break the read.
	go func(id int) {
		_ = model.DB.Model(&model.SkillUserArticle{}).
			Where("id = ?", id).
			UpdateColumn("view_count", gorm.Expr("view_count + ?", 1)).Error
	}(article.Id)
	common.ApiSuccess(c, article)
}

// =====================================================================
// Admin
// =====================================================================

// ListUserArticlesAdminEndpoint GET /api/skill-plaza/admin/user-articles
func ListUserArticlesAdminEndpoint(c *gin.Context) {
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("page_size"))
	rows, total, err := model.ListUserArticlesAdmin(model.ListUserArticlesAdminFilter{
		Status:   c.Query("status"),
		Type:     c.Query("type"),
		Search:   c.Query("search"),
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	counts, _ := model.CountUserArticlesByStatus()
	common.ApiSuccess(c, gin.H{
		"items":  rows,
		"total":  total,
		"counts": counts,
	})
}

// GetUserArticleAdmin GET /api/skill-plaza/admin/user-articles/:id
func GetUserArticleAdmin(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	article, err := model.GetSkillUserArticleByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, article)
}

type reviewUserArticleRequest struct {
	Reason string `json:"reason"`
}

// PostUserArticleApprove POST /api/skill-plaza/admin/user-articles/:id/approve
func PostUserArticleApprove(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	cur, err := model.GetSkillUserArticleByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.ReviewSkillUserArticle(id, currentAdminID(c), true, ""); err != nil {
		common.ApiError(c, err)
		return
	}
	_ = model.WriteSkillAuditLog(currentAdminID(c),
		model.SkillAuditActionUserArticleApprove, "user_article", id,
		"通过用户投稿: "+cur.Title, "")
	fresh, _ := model.GetSkillUserArticleByID(id)
	common.ApiSuccess(c, fresh)
}

// PostUserArticleReject POST /api/skill-plaza/admin/user-articles/:id/reject
func PostUserArticleReject(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	var req reviewUserArticleRequest
	// Body is optional — ignore parse error and fall through with empty reason.
	_ = c.ShouldBindJSON(&req)
	req.Reason = strings.TrimSpace(req.Reason)
	cur, err := model.GetSkillUserArticleByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.ReviewSkillUserArticle(id, currentAdminID(c), false, req.Reason); err != nil {
		common.ApiError(c, err)
		return
	}
	_ = model.WriteSkillAuditLog(currentAdminID(c),
		model.SkillAuditActionUserArticleReject, "user_article", id,
		"驳回用户投稿: "+cur.Title+" ("+req.Reason+")", "")
	fresh, _ := model.GetSkillUserArticleByID(id)
	common.ApiSuccess(c, fresh)
}

// PostUserArticleOffline POST /api/skill-plaza/admin/user-articles/:id/offline
func PostUserArticleOffline(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	var req reviewUserArticleRequest
	_ = c.ShouldBindJSON(&req)
	req.Reason = strings.TrimSpace(req.Reason)
	cur, err := model.GetSkillUserArticleByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.OfflineSkillUserArticle(id, currentAdminID(c), req.Reason); err != nil {
		common.ApiError(c, err)
		return
	}
	_ = model.WriteSkillAuditLog(currentAdminID(c),
		model.SkillAuditActionUserArticleOffline, "user_article", id,
		"下架用户投稿: "+cur.Title+" ("+req.Reason+")", "")
	fresh, _ := model.GetSkillUserArticleByID(id)
	common.ApiSuccess(c, fresh)
}

// =====================================================================
// P4-4 — Version history snapshots.
//
// The editor calls /snapshot every ~30s while editing. Only the author
// can snapshot / list / restore.  Restore is rejected for approved
// articles to prevent silent edits of public content — the author has
// to take it offline (or wait for admin offline) first.
// =====================================================================

// PostMyArticleSnapshot POST /api/skill-plaza/me/articles/:id/snapshot
func PostMyArticleSnapshot(c *gin.Context) {
	uid := c.GetInt("id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	src := c.Query("source")
	v, err := model.CreateUserArticleSnapshot(id, uid, src)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"id":         v.Id,
		"created_at": v.CreatedAt,
		"source":     v.Source,
	})
}

// GetMyArticleVersions GET /api/skill-plaza/me/articles/:id/versions
func GetMyArticleVersions(c *gin.Context) {
	uid := c.GetInt("id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	rows, err := model.ListUserArticleVersions(id, uid)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	// Strip Content from list view — clients ask for the full version body
	// via the detail endpoint to keep listing cheap.
	type listItem struct {
		Id        int    `json:"id"`
		Source    string `json:"source"`
		Title     string `json:"title"`
		CreatedAt int64  `json:"created_at"`
	}
	out := make([]listItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, listItem{
			Id:        r.Id,
			Source:    r.Source,
			Title:     r.Title,
			CreatedAt: r.CreatedAt,
		})
	}
	common.ApiSuccess(c, gin.H{"items": out})
}

// GetMyArticleVersion GET /api/skill-plaza/me/articles/:id/versions/:vid
func GetMyArticleVersion(c *gin.Context) {
	uid := c.GetInt("id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	vid, err := strconv.Atoi(c.Param("vid"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid vid")
		return
	}
	v, err := model.GetUserArticleVersion(id, uid, vid)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"id":         v.Id,
		"article_id": v.ArticleId,
		"title":      v.Title,
		"summary":    v.Summary,
		"content":    v.Content,
		"tags":       v.Tags(),
		"type":       v.Type,
		"source":     v.Source,
		"created_at": v.CreatedAt,
	})
}

// PostMyArticleVersionRestore POST /api/skill-plaza/me/articles/:id/versions/:vid/restore
func PostMyArticleVersionRestore(c *gin.Context) {
	uid := c.GetInt("id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	vid, err := strconv.Atoi(c.Param("vid"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid vid")
		return
	}
	if err := model.RestoreUserArticleVersion(id, uid, vid); err != nil {
		common.ApiError(c, err)
		return
	}
	fresh, _ := model.GetSkillUserArticleByID(id)
	common.ApiSuccess(c, fresh)
}

// =====================================================================
// P4-6 — Public author profile.
// =====================================================================

// GetAuthorProfilePublic GET /api/skill-plaza/u/:username
//
// Returns the author profile + their approved articles. Anyone can view;
// the user table stores the username as a unique handle so we don't
// need auth for this lookup.
func GetAuthorProfilePublic(c *gin.Context) {
	username := strings.TrimSpace(c.Param("username"))
	if username == "" {
		common.ApiErrorMsg(c, "username required")
		return
	}
	p, err := model.GetAuthorProfile(username)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	rows, _, err := model.ListUserArticlesPublic(model.ListUserArticlesPublicFilter{
		AuthorId: p.UserId,
		Limit:    100,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	items := make([]gin.H, 0, len(rows))
	for _, r := range rows {
		items = append(items, gin.H{
			"id":           r.Id,
			"slug":         r.Slug,
			"title":        r.Title,
			"summary":      r.Summary,
			"type":         r.Type,
			"cover_image":  r.CoverImage,
			"tags":         r.Tags(),
			"view_count":   r.ViewCount,
			"like_count":   r.LikeCount,
			"published_at": r.PublishedAt,
			"skill_name":   r.SkillName,
			"skill_slug":   r.SkillSlug,
		})
	}
	common.ApiSuccess(c, gin.H{
		"profile":  p,
		"articles": items,
	})
}

// DeleteUserArticleAdmin DELETE /api/skill-plaza/admin/user-articles/:id
func DeleteUserArticleAdmin(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	cur, _ := model.GetSkillUserArticleByID(id)
	if err := model.DeleteSkillUserArticle(id, 0, true); err != nil {
		common.ApiError(c, err)
		return
	}
	title := ""
	if cur != nil {
		title = cur.Title
	}
	_ = model.WriteSkillAuditLog(currentAdminID(c),
		model.SkillAuditActionUserArticleOffline, "user_article", id,
		"删除用户投稿: "+title, "")
	common.ApiSuccess(c, gin.H{"id": id})
}
