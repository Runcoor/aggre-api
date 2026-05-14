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
)

// =====================================================================
// SKILLS 广场 — user-auth endpoints. UserAuth-gated routes that handle
// the social half of the module: ratings, comments, favorites, and the
// "my center" aggregations. The Plaza listing and detail pages remain
// public (read-only); writing requires a logged-in user.
// =====================================================================

func currentUserID(c *gin.Context) int {
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

// resolveSkillIDFromSlug reads the :slug param, looks up the Skill, and
// returns its numeric id. On miss it writes a 200 error response and
// returns ok=false so the caller can early-return cleanly.
func resolveSkillIDFromSlug(c *gin.Context) (int, bool) {
	slug := strings.TrimSpace(c.Param("slug"))
	if slug == "" {
		common.ApiErrorMsg(c, "slug is required")
		return 0, false
	}
	skill, err := model.GetSkillBySlug(slug)
	if err != nil {
		common.ApiError(c, err)
		return 0, false
	}
	return skill.Id, true
}

// =====================================================================
// Ratings
// =====================================================================

type rateSkillRequest struct {
	Usability    int    `json:"usability"`
	Practicality int    `json:"practicality"`
	Clarity      int    `json:"clarity"`
	Stability    int    `json:"stability"`
	Innovation   int    `json:"innovation"`
	VerifiedUsed bool   `json:"verified_used"`
	Comment      string `json:"comment"`
}

func clampDim(v int) int {
	if v < 0 {
		return 0
	}
	if v > 5 {
		return 5
	}
	return v
}

// PostSkillRate POST /api/skill-plaza/skills/:id/rate
// Upserts the caller's rating. Each dim is clamped to [0, 5]; a 0 means
// "no opinion on that dim" and is excluded from the overall mean. The
// parent Skill's aggregates are refreshed in the same transaction.
func PostSkillRate(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	skillID, ok := resolveSkillIDFromSlug(c)
	if !ok {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	var req rateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	r := &model.SkillRating{
		SkillId:      skillID,
		UserId:       userID,
		Usability:    clampDim(req.Usability),
		Practicality: clampDim(req.Practicality),
		Clarity:      clampDim(req.Clarity),
		Stability:    clampDim(req.Stability),
		Innovation:   clampDim(req.Innovation),
		VerifiedUsed: req.VerifiedUsed,
		Comment:      strings.TrimSpace(req.Comment),
	}
	if err := model.UpsertSkillRating(r); err != nil {
		common.ApiError(c, err)
		return
	}
	skill, err := model.GetSkillByID(skillID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"my_rating": r,
		"skill":     skill,
	})
}

// GetSkillRatingSummary GET /api/skill-plaza/skills/:id/ratings
// Aggregates + my rating (so the form is pre-filled if the user already
// rated this skill).
func GetSkillRatingSummary(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	skillID, ok := resolveSkillIDFromSlug(c)
	if !ok {
		return
	}
	skill, err := model.GetSkillByID(skillID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var mine *model.SkillRating
	if userID := currentUserID(c); userID > 0 {
		mine, _ = model.GetUserRating(skillID, userID)
	}
	common.ApiSuccess(c, gin.H{
		"average":      skill.RatingAverage,
		"count":        skill.RatingCount,
		"usability":    skill.RatingUsability,
		"practicality": skill.RatingPracticality,
		"clarity":      skill.RatingClarity,
		"stability":    skill.RatingStability,
		"innovation":   skill.RatingInnovation,
		"my_rating":    mine,
	})
}

// =====================================================================
// Comments
// =====================================================================

type postCommentRequest struct {
	Content  string `json:"content"`
	ParentId int    `json:"parent_id"`
}

// PostSkillComment POST /api/skill-plaza/skills/:id/comments
func PostSkillComment(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	skillID, ok := resolveSkillIDFromSlug(c)
	if !ok {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	var req postCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "invalid request body")
		return
	}
	content := strings.TrimSpace(req.Content)
	if content == "" {
		common.ApiErrorMsg(c, "content is required")
		return
	}
	if len(content) > 2000 {
		common.ApiErrorMsg(c, "content too long (max 2000 chars)")
		return
	}
	comment := &model.SkillComment{
		SkillId:  skillID,
		UserId:   userID,
		ParentId: req.ParentId,
		Content:  content,
	}
	if err := model.CreateSkillComment(comment); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, comment)
}

// GetSkillComments GET /api/skill-plaza/skills/:id/comments
// Mounted with TryUserAuth — when the caller is logged in, each item
// gets a `liked_by_me` flag so the heart icon can render in its filled
// state without an extra round-trip.
func GetSkillComments(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	skillID, ok := resolveSkillIDFromSlug(c)
	if !ok {
		return
	}
	limit, _ := strconv.Atoi(c.Query("limit"))
	comments, err := model.ListSkillComments(skillID, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	// Hydrate liked_by_me when we know who's asking. TryUserAuth leaves
	// `id` unset for anonymous callers, so currentUserID returns 0 and
	// the helper short-circuits to an empty set.
	if userID := currentUserID(c); userID > 0 && len(comments) > 0 {
		ids := make([]int, 0, len(comments))
		for _, m := range comments {
			ids = append(ids, m.Id)
		}
		likes, lerr := model.ListCommentLikesByUser(userID, ids)
		if lerr == nil {
			for i := range comments {
				if likes[comments[i].Id] {
					comments[i].LikedByMe = true
				}
			}
		}
	}
	common.ApiSuccess(c, gin.H{
		"items": comments,
		"total": len(comments),
	})
}

// PostSkillCommentLikeToggle POST /api/skill-plaza/comments/:id/like
// Toggles the like state for the calling user. Returns the new state
// and the resulting like_count.
func PostSkillCommentLikeToggle(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid comment id")
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	liked, count, err := model.ToggleSkillCommentLike(userID, commentID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"liked":      liked,
		"like_count": count,
		"id":         commentID,
	})
}

// DeleteSkillCommentUser DELETE /api/skill-plaza/comments/:id
// Owner or admin can delete.
func DeleteSkillCommentUser(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	commentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid comment id")
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	role := 0
	if r, ok := c.Get("role"); ok {
		if rr, ok := r.(int); ok {
			role = rr
		}
	}
	if err := model.DeleteSkillComment(commentID, userID, role >= common.RoleAdminUser); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"id": commentID})
}

// =====================================================================
// Favorites
// =====================================================================

// PostSkillFavoriteToggle POST /api/skill-plaza/skills/:id/favorite-toggle
// Returns the new state so the UI doesn't need to re-query.
func PostSkillFavoriteToggle(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	skillID, ok := resolveSkillIDFromSlug(c)
	if !ok {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	favored, err := model.ToggleSkillFavorite(skillID, userID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	skill, err := model.GetSkillByID(skillID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"favored":        favored,
		"favorite_count": skill.FavoriteCount,
	})
}

// GetSkillFavoriteState GET /api/skill-plaza/skills/:id/favorite-state
// Returns whether the caller has favorited this skill — used to set the
// bookmark filled-state on the detail page initial render.
func GetSkillFavoriteState(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	skillID, ok := resolveSkillIDFromSlug(c)
	if !ok {
		return
	}
	userID := currentUserID(c)
	favored, err := model.IsFavorited(skillID, userID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"favored": favored})
}

// =====================================================================
// My center
// =====================================================================

// GetMySkillFavorites GET /api/skill-plaza/me/favorites
func GetMySkillFavorites(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	limit, _ := strconv.Atoi(c.Query("limit"))
	ids, err := model.ListUserFavoriteSkillIds(userID, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	skills, err := model.GetSkillsByIDs(ids)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"items": skills,
		"total": len(skills),
	})
}

// GetMySkillRatings GET /api/skill-plaza/me/ratings
func GetMySkillRatings(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	limit, _ := strconv.Atoi(c.Query("limit"))
	rows, err := model.ListUserRatings(userID, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"items": rows,
		"total": len(rows),
	})
}

// GetMySkillComments GET /api/skill-plaza/me/comments
func GetMySkillComments(c *gin.Context) {
	if !skillPlazaGate(c) {
		return
	}
	userID := currentUserID(c)
	if userID == 0 {
		common.ApiErrorMsg(c, "login required")
		return
	}
	limit, _ := strconv.Atoi(c.Query("limit"))
	rows, err := model.ListUserComments(userID, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"items": rows,
		"total": len(rows),
	})
}
