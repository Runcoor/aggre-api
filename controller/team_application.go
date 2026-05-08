package controller

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
)

// ─── User-side ───

type ApplyTeamRequest struct {
	Name   string `json:"name"`
	Reason string `json:"reason"`
}

// ApplyForTeam lets any authenticated user submit a team-creation request.
// At most one Pending row per user is enforced in the model layer.
func ApplyForTeam(c *gin.Context) {
	var req ApplyTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	userId := c.GetInt("id")
	app, err := model.SubmitTeamApplication(userId, req.Name, req.Reason)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, app)
}

// GetSelfTeamApplications lists the caller's applications (newest first).
func GetSelfTeamApplications(c *gin.Context) {
	userId := c.GetInt("id")
	apps, err := model.GetUserTeamApplications(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, apps)
}

// WithdrawTeamApplication cancels a Pending application owned by the caller.
func WithdrawTeamApplication(c *gin.Context) {
	appId, _ := strconv.Atoi(c.Param("id"))
	if appId <= 0 {
		common.ApiErrorMsg(c, "无效的申请ID")
		return
	}
	userId := c.GetInt("id")
	if err := model.CancelTeamApplication(userId, appId); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, nil)
}

// ─── Admin-side ───

// AdminListTeamApplications: GET /api/admin/team-applications?status=&p=&size=
// status: -1 (or omitted) = all, 0 pending, 1 approved, 2 rejected, 3 canceled.
func AdminListTeamApplications(c *gin.Context) {
	status := -1
	if s := c.Query("status"); s != "" {
		if v, err := strconv.Atoi(s); err == nil {
			status = v
		}
	}
	page, _ := strconv.Atoi(c.DefaultQuery("p", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

	rows, total, err := model.ListTeamApplications(status, page, pageSize)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"items": rows,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

// AdminGetTeamApplicationDetail returns the full review payload (applicant
// profile, recharge stats, active subs, team membership counts).
func AdminGetTeamApplicationDetail(c *gin.Context) {
	appId, _ := strconv.Atoi(c.Param("id"))
	if appId <= 0 {
		common.ApiErrorMsg(c, "无效的申请ID")
		return
	}
	detail, err := model.GetTeamApplicationDetail(appId)
	if err != nil {
		common.ApiErrorMsg(c, "申请不存在")
		return
	}
	common.ApiSuccess(c, detail)
}

type ReviewTeamApplicationRequest struct {
	Comment string `json:"comment"`
}

// AdminApproveTeamApplication mints the team and stamps the application.
func AdminApproveTeamApplication(c *gin.Context) {
	appId, _ := strconv.Atoi(c.Param("id"))
	if appId <= 0 {
		common.ApiErrorMsg(c, "无效的申请ID")
		return
	}
	var req ReviewTeamApplicationRequest
	_ = c.ShouldBindJSON(&req)
	reviewerId := c.GetInt("id")

	teamId, err := model.ApproveTeamApplicationTx(appId, reviewerId, strings.TrimSpace(req.Comment))
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, gin.H{"team_id": teamId})
}

// AdminRejectTeamApplication transitions the application to Rejected.
func AdminRejectTeamApplication(c *gin.Context) {
	appId, _ := strconv.Atoi(c.Param("id"))
	if appId <= 0 {
		common.ApiErrorMsg(c, "无效的申请ID")
		return
	}
	var req ReviewTeamApplicationRequest
	_ = c.ShouldBindJSON(&req)
	comment := strings.TrimSpace(req.Comment)
	if comment == "" {
		common.ApiErrorMsg(c, "请填写驳回原因")
		return
	}
	reviewerId := c.GetInt("id")
	if err := model.RejectTeamApplication(appId, reviewerId, comment); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, nil)
}
