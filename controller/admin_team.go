package controller

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
)

// ─────────────────────────────────────────────────────────────────────────────
// Admin team management — global control plane.
//
// All handlers are mounted under /api/admin/teams with AdminAuth. They give
// an admin owner-equivalent control over any team without having to be a
// member, plus list/detail/usage views that aren't available to team owners.
// ─────────────────────────────────────────────────────────────────────────────

// AdminListTeams returns a paginated, filterable global team list.
func AdminListTeams(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	includeDeleted, _ := strconv.ParseBool(c.DefaultQuery("include_deleted", "false"))
	filter := model.ListTeamsFilter{
		Keyword:        strings.TrimSpace(c.Query("keyword")),
		Status:         strings.ToLower(strings.TrimSpace(c.DefaultQuery("status", "all"))),
		IncludeDeleted: includeDeleted,
		Order:          strings.ToLower(strings.TrimSpace(c.DefaultQuery("order", "created_at"))),
		OrderDir:       strings.ToLower(strings.TrimSpace(c.DefaultQuery("order_dir", "desc"))),
		Page:           page,
		PageSize:       pageSize,
	}
	rows, total, err := model.ListTeamsForAdmin(filter)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"items":     rows,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// AdminGetTeam returns the detail payload for a single team.
// Soft-deleted teams are visible (for audit) only when ?include_deleted=true.
func AdminGetTeam(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	includeDeleted, _ := strconv.ParseBool(c.DefaultQuery("include_deleted", "false"))
	detail, err := model.GetTeamForAdmin(teamId, includeDeleted)
	if err != nil {
		if errors.Is(err, model.ErrTeamNotFound) {
			common.ApiErrorMsg(c, "团队不存在")
			return
		}
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, detail)
}

// AdminUpdateTeamRequest covers both rename and status toggle so the UI can
// PATCH-style send only the changed field.
type AdminUpdateTeamRequest struct {
	Name   string `json:"name"`
	Status int    `json:"status"`
}

// AdminUpdateTeam renames and/or toggles status for any team.
// Refuses to act on soft-deleted teams.
func AdminUpdateTeam(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	var req AdminUpdateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if strings.TrimSpace(req.Name) == "" && req.Status == 0 {
		common.ApiErrorMsg(c, "无可更新字段")
		return
	}
	if req.Status != 0 && req.Status != model.TeamStatusActive && req.Status != model.TeamStatusDisabled {
		common.ApiErrorMsg(c, "无效的状态值")
		return
	}
	if err := model.AdminUpdateTeamFields(teamId, req.Name, req.Status); err != nil {
		if errors.Is(err, model.ErrTeamNotFound) {
			common.ApiErrorMsg(c, "团队不存在")
			return
		}
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// AdminDeleteTeam soft-deletes a team and cascades to members + tokens,
// terminating active subscriptions.
func AdminDeleteTeam(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	adminId := c.GetInt("id")
	if err := model.DeleteTeamCascade(teamId, adminId); err != nil {
		if errors.Is(err, model.ErrTeamNotFound) {
			common.ApiErrorMsg(c, "团队不存在")
			return
		}
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// AdminCreateTeamRequest — admin can mint a team for themselves or any user.
type AdminCreateTeamRequest struct {
	Name    string `json:"name"`
	OwnerId int    `json:"owner_id"`
}

// AdminCreateTeam creates a team with the caller as owner unless owner_id
// names another existing user. Mirrors the legacy POST /api/team/ admin path
// but lives under the unified /api/admin/teams namespace.
func AdminCreateTeam(c *gin.Context) {
	var req AdminCreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		common.ApiErrorMsg(c, "团队名称不能为空")
		return
	}
	ownerId := req.OwnerId
	if ownerId <= 0 {
		ownerId = c.GetInt("id")
	} else {
		target, err := model.GetUserById(ownerId, false)
		if err != nil || target == nil {
			common.ApiErrorMsg(c, "目标用户不存在")
			return
		}
	}
	team, err := model.CreateTeamForOwner(name, ownerId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, team)
}

// ─── Member management ───

// AdminListTeamMembers returns the full active member roster for a team.
func AdminListTeamMembers(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	members, err := model.AdminListTeamMembers(teamId)
	if err != nil {
		if errors.Is(err, model.ErrTeamNotFound) {
			common.ApiErrorMsg(c, "团队不存在")
			return
		}
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, members)
}

// AdminAddTeamMemberRequest accepts user_id (required) and an optional
// initial role. Owner cannot be set here — use transfer-owner.
type AdminAddTeamMemberRequest struct {
	UserId int `json:"user_id"`
	Role   int `json:"role"`
}

// AdminAddTeamMemberHandler adds a user to a team as member (default) or
// admin. Refuses owner role here for clarity.
func AdminAddTeamMemberHandler(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	var req AdminAddTeamMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.UserId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.AdminAddTeamMember(teamId, req.UserId, req.Role); err != nil {
		if errors.Is(err, model.ErrTeamNotFound) {
			common.ApiErrorMsg(c, "团队不存在")
			return
		}
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, nil)
}

// AdminUpdateTeamMemberRequest carries the new role for an existing member.
type AdminUpdateTeamMemberRequest struct {
	Role int `json:"role"`
}

// AdminUpdateTeamMemberHandler changes a member's role between member
// and admin. Owner role is rejected here — caller must use transfer-owner.
func AdminUpdateTeamMemberHandler(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	userId, _ := strconv.Atoi(c.Param("user_id"))
	if userId <= 0 {
		common.ApiErrorMsg(c, "无效的用户ID")
		return
	}
	var req AdminUpdateTeamMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.AdminUpdateTeamMemberRole(teamId, userId, req.Role); err != nil {
		if errors.Is(err, model.ErrTeamNotFound) {
			common.ApiErrorMsg(c, "团队不存在")
			return
		}
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, nil)
}

// AdminRemoveTeamMemberHandler kicks a user out of a team.
func AdminRemoveTeamMemberHandler(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	userId, _ := strconv.Atoi(c.Param("user_id"))
	if userId <= 0 {
		common.ApiErrorMsg(c, "无效的用户ID")
		return
	}
	if err := model.AdminRemoveTeamMember(teamId, userId); err != nil {
		if errors.Is(err, model.ErrTeamNotFound) {
			common.ApiErrorMsg(c, "团队不存在")
			return
		}
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, nil)
}

// AdminTransferOwnerRequest names the new owner.
type AdminTransferOwnerRequest struct {
	ToUserId int `json:"to_user_id"`
}

// AdminTransferTeamOwnershipHandler atomically moves ownership of a team.
// Returns 422 with a clear hint if the target user isn't already a member.
func AdminTransferTeamOwnershipHandler(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	var req AdminTransferOwnerRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.ToUserId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.TransferTeamOwnership(teamId, req.ToUserId); err != nil {
		switch {
		case errors.Is(err, model.ErrTeamNotFound):
			common.ApiErrorMsg(c, "团队不存在")
		case errors.Is(err, model.ErrTeamMustAddMemberFirst):
			common.ApiErrorMsg(c, "目标用户尚未加入该团队，请先添加为成员")
		default:
			common.ApiErrorMsg(c, err.Error())
		}
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Team-bound tokens ───

// AdminListTeamTokens returns the tokens bound to a team. Keys are masked.
func AdminListTeamTokens(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	tokens, err := model.ListTeamOwnedTokens(teamId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, tokens)
}

// AdminDeleteTeamToken soft-deletes a single team-bound token.
func AdminDeleteTeamToken(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	tokenId, _ := strconv.Atoi(c.Param("token_id"))
	if tokenId <= 0 {
		common.ApiErrorMsg(c, "无效的令牌ID")
		return
	}
	if err := model.DeleteTeamOwnedToken(teamId, tokenId); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Subscriptions ───

// AdminListTeamSubscriptions returns active + historical team subscriptions.
func AdminListTeamSubscriptions(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	active, err := model.GetAllActiveTeamSubscriptions(teamId)
	if err != nil {
		active = []model.SubscriptionSummary{}
	}
	all, err := model.GetAllTeamSubscriptions(teamId)
	if err != nil {
		all = []model.SubscriptionSummary{}
	}
	common.ApiSuccess(c, gin.H{
		"team_id":            teamId,
		"active":             active,
		"all_subscriptions":  all,
	})
}

// AdminTerminateTeamSubscriptionRequest carries the optional admin reason.
type AdminTerminateTeamSubscriptionRequest struct {
	Reason string `json:"reason"`
}

// AdminTerminateTeamSubscription cancels one active subscription owned by
// the team. The admin id and reason are stamped on the audit source field.
// Refunds are NOT performed — termination is a billing-stop signal only.
func AdminTerminateTeamSubscription(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	subId, _ := strconv.Atoi(c.Param("sub_id"))
	if subId <= 0 {
		common.ApiErrorMsg(c, "无效的订阅ID")
		return
	}
	var req AdminTerminateTeamSubscriptionRequest
	_ = c.ShouldBindJSON(&req)
	adminId := c.GetInt("id")
	if err := model.AdminTerminateTeamSubscriptionForTeam(teamId, subId, adminId, strings.TrimSpace(req.Reason)); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Usage ───

// AdminGetTeamUsage returns the full usage report for a team.
func AdminGetTeamUsage(c *gin.Context) {
	teamId, ok := parseTeamIdParam(c)
	if !ok {
		return
	}
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	report, err := model.GetTeamUsageReport(teamId, days)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, report)
}

// parseTeamIdParam extracts and validates :id from the URL.
func parseTeamIdParam(c *gin.Context) (int, bool) {
	teamId, _ := strconv.Atoi(c.Param("id"))
	if teamId <= 0 {
		common.ApiErrorMsg(c, "无效的团队ID")
		return 0, false
	}
	return teamId, true
}
