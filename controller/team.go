package controller

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
)

// ─── Helpers ───

func getTeamAndVerifyRole(c *gin.Context, minRole int) (*model.Team, *model.TeamMember, bool) {
	teamId, _ := strconv.Atoi(c.Param("id"))
	if teamId <= 0 {
		common.ApiErrorMsg(c, "无效的团队ID")
		return nil, nil, false
	}
	team, err := model.GetTeamById(teamId)
	if err != nil {
		common.ApiErrorMsg(c, "团队不存在")
		return nil, nil, false
	}
	userId := c.GetInt("id")
	member, err := model.GetTeamMemberByUserAndTeam(userId, teamId)
	if err != nil || member == nil {
		common.ApiErrorMsg(c, "你不是该团队的成员")
		return nil, nil, false
	}
	if member.Role < minRole {
		common.ApiErrorMsg(c, "权限不足")
		return nil, nil, false
	}
	return team, member, true
}

// ─── Team CRUD ───

type CreateTeamRequest struct {
	Name    string `json:"name"`
	OwnerId int    `json:"owner_id"` // optional; admin can create on behalf of another user
}

// CreateTeam is admin-only. Common users go through the application flow
// (POST /api/team/apply → admin reviews → AdminApproveTeamApplication
// internally calls model.CreateTeam). Admin can directly mint a team for
// themselves or for another user via owner_id.
func CreateTeam(c *gin.Context) {
	var req CreateTeamRequest
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
		// Verify the target owner exists when admin specifies one.
		target, err := model.GetUserById(ownerId, false)
		if err != nil || target == nil {
			common.ApiErrorMsg(c, "目标用户不存在")
			return
		}
	}

	team := &model.Team{
		Name:    name,
		OwnerId: ownerId,
		Status:  model.TeamStatusActive,
	}
	if err := model.CreateTeam(team); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.AddTeamMember(&model.TeamMember{
		TeamId: team.Id,
		UserId: ownerId,
		Role:   model.TeamRoleOwner,
		Status: model.TeamStatusActive,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, team)
}

// GetTeamPermission reports the caller's team-related state. The legacy
// subscription gate has been removed: every authenticated user can browse
// the team page and submit an application. Admins can create directly.
func GetTeamPermission(c *gin.Context) {
	userId := c.GetInt("id")
	role := c.GetInt("role")
	teams, _ := model.GetUserTeams(userId)
	hasPending, _ := model.HasPendingTeamApplication(userId)
	common.ApiSuccess(c, gin.H{
		"enabled":                 true,
		"can_create_directly":     role >= common.RoleAdminUser,
		"can_apply":               true,
		"is_member":               len(teams) > 0,
		"has_pending_application": hasPending,
	})
}

func GetUserTeams(c *gin.Context) {
	userId := c.GetInt("id")
	teams, err := model.GetUserTeams(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, teams)
}

func GetTeam(c *gin.Context) {
	team, member, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	memberCount, _ := model.GetTeamMemberCount(team.Id)
	common.ApiSuccess(c, gin.H{
		"team":         team,
		"role":         member.Role,
		"member_count": memberCount,
	})
}

func UpdateTeam(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	var req CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		common.ApiErrorMsg(c, "团队名称不能为空")
		return
	}
	if err := model.UpdateTeamName(team.Id, name); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func DeleteTeam(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	if err := model.DeleteTeam(team.Id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Members ───

type AddMemberRequest struct {
	UserId int `json:"user_id"`
}

func AddTeamMember(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	var req AddMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.UserId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	// Check user exists
	targetUser, err := model.GetUserById(req.UserId, false)
	if err != nil || targetUser == nil {
		common.ApiErrorMsg(c, "用户不存在")
		return
	}
	// Check not already a member
	existing, _ := model.GetTeamMemberByUserAndTeam(req.UserId, team.Id)
	if existing != nil {
		common.ApiErrorMsg(c, "该用户已是团队成员")
		return
	}
	if err := model.AddTeamMember(&model.TeamMember{
		TeamId: team.Id,
		UserId: req.UserId,
		Role:   model.TeamRoleMember,
		Status: model.TeamStatusActive,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func GetTeamMembers(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	members, err := model.GetTeamMembers(team.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, members)
}

func RemoveTeamMember(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	targetUserId, _ := strconv.Atoi(c.Param("user_id"))
	if targetUserId <= 0 {
		common.ApiErrorMsg(c, "无效的用户ID")
		return
	}
	if targetUserId == team.OwnerId {
		common.ApiErrorMsg(c, "不能移除团队创建者")
		return
	}
	if err := model.RemoveTeamMember(team.Id, targetUserId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Usage ───

func GetTeamUsageStats(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleAdmin)
	if !ok {
		return
	}
	members, err := model.GetTeamMembers(team.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"team":    team,
		"members": members,
	})
}

// ─── Team subscription (P1: subscription-native team plans) ───

// GetTeamSubscriptions returns the team's active and historical subscriptions.
// Visible to any team member; for the team admin/owner UI.
func GetTeamSubscriptions(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	active, err := model.GetAllActiveTeamSubscriptions(team.Id)
	if err != nil {
		active = []model.SubscriptionSummary{}
	}
	all, err := model.GetAllTeamSubscriptions(team.Id)
	if err != nil {
		all = []model.SubscriptionSummary{}
	}
	common.ApiSuccess(c, gin.H{
		"team_id":            team.Id,
		"subscriptions":      active,
		"all_subscriptions":  all,
	})
}

// ─── Team-bound tokens (P1: team-owned API keys) ───

type CreateTeamTokenRequest struct {
	Name string `json:"name"`
}

// CreateTeamToken issues a new team-bound API key. team owner/admin only.
// The token's UserId records the creator (audit), TeamId binds it to the team
// so billing routes through the team's active subscription instead of personal.
func CreateTeamToken(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleAdmin)
	if !ok {
		return
	}
	var req CreateTeamTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		name = "team-key"
	}
	if len(name) > 50 {
		common.ApiErrorMsg(c, "令牌名称过长")
		return
	}
	key, err := common.GenerateKey()
	if err != nil {
		common.ApiErrorMsg(c, "生成令牌失败")
		return
	}
	tok := &model.Token{
		UserId:         c.GetInt("id"),
		TeamId:         team.Id,
		Name:           name,
		Key:            key,
		CreatedTime:    common.GetTimestamp(),
		AccessedTime:   common.GetTimestamp(),
		ExpiredTime:    -1,
		UnlimitedQuota: true,
	}
	if err := tok.Insert(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"id":  tok.Id,
		"key": key,
	})
}

// ListTeamOwnedTokens returns the team-bound tokens (Token.TeamId = teamId).
func ListTeamOwnedTokens(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleMember)
	if !ok {
		return
	}
	tokens, err := model.ListTeamOwnedTokens(team.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, tokens)
}

// DeleteTeamOwnedToken hard-deletes a team-bound token. owner/admin only.
func DeleteTeamOwnedToken(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleAdmin)
	if !ok {
		return
	}
	tokenId, _ := strconv.Atoi(c.Param("token_id"))
	if tokenId <= 0 {
		common.ApiErrorMsg(c, "无效的令牌ID")
		return
	}
	if err := model.DeleteTeamOwnedToken(team.Id, tokenId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Invite ───

func RegenerateInviteCode(c *gin.Context) {
	team, _, ok := getTeamAndVerifyRole(c, model.TeamRoleOwner)
	if !ok {
		return
	}
	code, err := model.RegenerateTeamInviteCode(team.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"invite_code": code})
}

func JoinTeamByInvite(c *gin.Context) {
	code := c.Param("invite_code")
	if code == "" {
		common.ApiErrorMsg(c, "邀请码不能为空")
		return
	}
	team, err := model.GetTeamByInviteCode(code)
	if err != nil {
		common.ApiErrorMsg(c, "邀请码无效或团队已停用")
		return
	}
	userId := c.GetInt("id")
	existing, _ := model.GetTeamMemberByUserAndTeam(userId, team.Id)
	if existing != nil {
		common.ApiErrorMsg(c, "你已是该团队的成员")
		return
	}
	if err := model.AddTeamMember(&model.TeamMember{
		TeamId: team.Id,
		UserId: userId,
		Role:   model.TeamRoleMember,
		Status: model.TeamStatusActive,
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"team_id":   team.Id,
		"team_name": team.Name,
	})
}
