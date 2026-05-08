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

// parseTeamIdParam extracts and validates :id from the URL.
func parseTeamIdParam(c *gin.Context) (int, bool) {
	teamId, _ := strconv.Atoi(c.Param("id"))
	if teamId <= 0 {
		common.ApiErrorMsg(c, "无效的团队ID")
		return 0, false
	}
	return teamId, true
}
