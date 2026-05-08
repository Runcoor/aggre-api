package model

import (
	"errors"
	"strings"

	"github.com/runcoor/aggre-api/common"
	"gorm.io/gorm"
)

// ─── Status constants ───
const (
	TeamApplicationPending  = 0
	TeamApplicationApproved = 1
	TeamApplicationRejected = 2
	TeamApplicationCanceled = 3 // user-withdrawn
)

// TeamApplication tracks a user's request to create a team. Common users
// cannot mint teams directly; an admin reviews each application and the
// team is created on approval (with the applicant as owner).
//
// Lifecycle: user submits Pending → admin Approves (TeamId set) /
// Rejects (with comment) / user Withdraws (Canceled).
type TeamApplication struct {
	Id            int    `json:"id" gorm:"primaryKey"`
	UserId        int    `json:"user_id" gorm:"index;not null"`
	Name          string `json:"name" gorm:"type:varchar(128);not null"`
	Reason        string `json:"reason" gorm:"type:text"`
	Status        int    `json:"status" gorm:"type:int;not null;default:0;index"`
	ReviewerId    int    `json:"reviewer_id" gorm:"type:int;not null;default:0"`
	ReviewComment string `json:"review_comment" gorm:"type:text"`
	TeamId        int    `json:"team_id" gorm:"type:int;not null;default:0"`
	CreatedAt     int64  `json:"created_at" gorm:"bigint;index"`
	ReviewedAt    int64  `json:"reviewed_at" gorm:"bigint"`
}

func (a *TeamApplication) BeforeCreate(tx *gorm.DB) error {
	if a.CreatedAt == 0 {
		a.CreatedAt = common.GetTimestamp()
	}
	return nil
}

// ─── User-side ───

// SubmitTeamApplication creates a Pending application after enforcing the
// "at most one Pending per user" invariant. Returns the inserted row.
func SubmitTeamApplication(userId int, name string, reason string) (*TeamApplication, error) {
	if userId <= 0 {
		return nil, errors.New("无效的用户ID")
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, errors.New("团队名称不能为空")
	}
	if len(name) > 128 {
		return nil, errors.New("团队名称过长")
	}
	if len(reason) > 2000 {
		return nil, errors.New("申请理由过长")
	}

	hasPending, err := HasPendingTeamApplication(userId)
	if err != nil {
		return nil, err
	}
	if hasPending {
		return nil, errors.New("已有待审核的申请，请勿重复提交")
	}

	app := &TeamApplication{
		UserId: userId,
		Name:   name,
		Reason: reason,
		Status: TeamApplicationPending,
	}
	if err := DB.Create(app).Error; err != nil {
		return nil, err
	}
	return app, nil
}

// HasPendingTeamApplication is consulted by GetTeamPermission so the UI
// can disable the "apply" button while one is in flight.
func HasPendingTeamApplication(userId int) (bool, error) {
	var count int64
	err := DB.Model(&TeamApplication{}).
		Where("user_id = ? AND status = ?", userId, TeamApplicationPending).
		Count(&count).Error
	return count > 0, err
}

// GetUserTeamApplications returns all applications by a user, newest first.
// Used by the user's own "my applications" history panel.
func GetUserTeamApplications(userId int) ([]TeamApplication, error) {
	var apps []TeamApplication
	err := DB.Where("user_id = ?", userId).
		Order("id desc").
		Find(&apps).Error
	return apps, err
}

// CancelTeamApplication lets a user withdraw their own Pending application.
// No-op if the row does not belong to userId or is no longer Pending.
func CancelTeamApplication(userId int, appId int) error {
	res := DB.Model(&TeamApplication{}).
		Where("id = ? AND user_id = ? AND status = ?", appId, userId, TeamApplicationPending).
		Updates(map[string]interface{}{
			"status":      TeamApplicationCanceled,
			"reviewed_at": common.GetTimestamp(),
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("申请不存在或已不可撤回")
	}
	return nil
}

// ─── Admin-side ───

// ListTeamApplications returns paginated applications filtered by status
// (-1 = any). Newest first. Joins user fields the admin list needs to
// render without an extra round-trip per row.
func ListTeamApplications(status int, page int, pageSize int) ([]map[string]interface{}, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 200 {
		pageSize = 20
	}
	q := DB.Model(&TeamApplication{})
	if status >= 0 {
		q = q.Where("status = ?", status)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var apps []TeamApplication
	if err := q.Order("id desc").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&apps).Error; err != nil {
		return nil, 0, err
	}
	if len(apps) == 0 {
		return []map[string]interface{}{}, total, nil
	}

	userIds := make([]int, 0, len(apps))
	for _, a := range apps {
		userIds = append(userIds, a.UserId)
	}
	var users []User
	DB.Select("id, username, display_name, email, quota, used_quota").
		Where("id IN ?", userIds).Find(&users)
	userMap := make(map[int]User, len(users))
	for _, u := range users {
		userMap[u.Id] = u
	}

	out := make([]map[string]interface{}, 0, len(apps))
	for i := range apps {
		u := userMap[apps[i].UserId]
		out = append(out, map[string]interface{}{
			"application":       apps[i],
			"username":          u.Username,
			"display_name":      u.DisplayName,
			"email":             u.Email,
			"user_quota":        u.Quota,
			"user_used_quota":   u.UsedQuota,
		})
	}
	return out, total, nil
}

// GetTeamApplicationById returns a single application row.
func GetTeamApplicationById(id int) (*TeamApplication, error) {
	var app TeamApplication
	err := DB.Where("id = ?", id).First(&app).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

// TeamApplicationDetail bundles everything the admin review screen needs:
// the application itself, the applicant's profile, wallet quota, recharge
// summary, active subscriptions, and team membership counts.
type TeamApplicationDetail struct {
	Application       *TeamApplication       `json:"application"`
	User              *User                  `json:"user"`
	TopUpTotalAmount  float64                `json:"topup_total_amount"`
	TopUpTotalQuota   int64                  `json:"topup_total_quota"`
	TopUpCount        int64                  `json:"topup_count"`
	ActiveSubs        []SubscriptionSummary  `json:"active_subscriptions"`
	OwnedTeamCount    int64                  `json:"owned_team_count"`
	JoinedTeamCount   int64                  `json:"joined_team_count"`
}

// GetTeamApplicationDetail aggregates the data points an admin needs to
// decide approval: who the applicant is, how much they've paid, what
// subscriptions they hold, and how many teams they're already part of.
//
// Heavy reads are kept independent so a partial failure (e.g. subscription
// table read) does not blank the entire response.
func GetTeamApplicationDetail(appId int) (*TeamApplicationDetail, error) {
	app, err := GetTeamApplicationById(appId)
	if err != nil {
		return nil, err
	}
	user, err := GetUserById(app.UserId, false)
	if err != nil {
		return nil, err
	}

	detail := &TeamApplicationDetail{
		Application: app,
		User:        user,
	}

	// Topup aggregates (status=success only).
	type topupAgg struct {
		TotalMoney  float64
		TotalAmount int64
		Cnt         int64
	}
	var agg topupAgg
	_ = DB.Model(&TopUp{}).
		Select("COALESCE(SUM(money),0) as total_money, COALESCE(SUM(amount),0) as total_amount, COUNT(*) as cnt").
		Where("user_id = ? AND status = ?", app.UserId, common.TopUpStatusSuccess).
		Scan(&agg).Error
	detail.TopUpTotalAmount = agg.TotalMoney
	detail.TopUpTotalQuota = agg.TotalAmount
	detail.TopUpCount = agg.Cnt

	// Active subscriptions.
	subs, err := GetAllActiveUserSubscriptions(app.UserId)
	if err == nil {
		detail.ActiveSubs = subs
	} else {
		detail.ActiveSubs = []SubscriptionSummary{}
	}

	// Team counts. owned: teams where user is owner; joined: distinct
	// active memberships (includes owned, but the admin reads them as
	// separate signals — owned ⊆ joined).
	_ = DB.Model(&Team{}).
		Where("owner_id = ? AND status = ?", app.UserId, TeamStatusActive).
		Count(&detail.OwnedTeamCount).Error
	_ = DB.Model(&TeamMember{}).
		Where("user_id = ? AND status = ?", app.UserId, TeamStatusActive).
		Count(&detail.JoinedTeamCount).Error

	return detail, nil
}

// ApproveTeamApplicationTx atomically approves a Pending application:
// creates the Team, adds the applicant as owner, and stamps the
// application row. Returns the new team's id.
//
// Idempotency is enforced by the WHERE ... AND status = Pending clause on
// the final Updates — a second concurrent approve will see RowsAffected=0.
func ApproveTeamApplicationTx(appId int, reviewerId int, comment string) (int, error) {
	var newTeamId int
	err := DB.Transaction(func(tx *gorm.DB) error {
		var app TeamApplication
		if err := tx.Where("id = ?", appId).First(&app).Error; err != nil {
			return err
		}
		if app.Status != TeamApplicationPending {
			return errors.New("申请已不在待审核状态")
		}

		team := &Team{
			Name:    app.Name,
			OwnerId: app.UserId,
			Status:  TeamStatusActive,
		}
		if err := tx.Create(team).Error; err != nil {
			return err
		}
		member := &TeamMember{
			TeamId:   team.Id,
			UserId:   app.UserId,
			Role:     TeamRoleOwner,
			Status:   TeamStatusActive,
			JoinedAt: common.GetTimestamp(),
		}
		if err := tx.Create(member).Error; err != nil {
			return err
		}

		res := tx.Model(&TeamApplication{}).
			Where("id = ? AND status = ?", appId, TeamApplicationPending).
			Updates(map[string]interface{}{
				"status":         TeamApplicationApproved,
				"reviewer_id":    reviewerId,
				"review_comment": comment,
				"team_id":        team.Id,
				"reviewed_at":    common.GetTimestamp(),
			})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return errors.New("并发更新冲突：申请已被处理")
		}
		newTeamId = team.Id
		return nil
	})
	return newTeamId, err
}

// RejectTeamApplication transitions a Pending application to Rejected.
// Comment is optional but recommended (UI requires non-empty).
func RejectTeamApplication(appId int, reviewerId int, comment string) error {
	res := DB.Model(&TeamApplication{}).
		Where("id = ? AND status = ?", appId, TeamApplicationPending).
		Updates(map[string]interface{}{
			"status":         TeamApplicationRejected,
			"reviewer_id":    reviewerId,
			"review_comment": comment,
			"reviewed_at":    common.GetTimestamp(),
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("申请不存在或已不在待审核状态")
	}
	return nil
}
