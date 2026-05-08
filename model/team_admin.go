package model

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"gorm.io/gorm"
)

// ─────────────────────────────────────────────────────────────────────────────
// Admin team management — global control plane.
//
// These helpers back the /api/admin/teams routes. They allow an admin to act
// on any team without having to be a member. Status reads are cached in Redis
// so the relay hot-path can short-circuit a banned team's tokens cheaply.
// ─────────────────────────────────────────────────────────────────────────────

// teamStatusCacheKey is the Redis key for the cached team status.
// The cached value is a simple int as string: "1"=active, "2"=disabled,
// "-1"=deleted (soft-deleted). Keep the encoding tiny — this is read on
// every billed request whose token belongs to a team.
func teamStatusCacheKey(teamId int) string {
	return fmt.Sprintf("team:status:%d", teamId)
}

// InvalidateTeamStatusCache drops the cached status. Called by every
// admin write that mutates team.status / team.deleted_at, so the change
// takes effect on the next request rather than waiting for TTL.
func InvalidateTeamStatusCache(teamId int) {
	if !common.RedisEnabled {
		return
	}
	_ = common.RedisDelKey(teamStatusCacheKey(teamId))
}

// GetTeamStatusCached returns the team's effective status with Redis caching.
// Returns:
//
//	1, nil                — active
//	2, nil                — disabled (admin banned)
//	-1, ErrTeamNotFound   — soft-deleted or never existed
//
// On Redis miss it falls back to a primary-key DB lookup and writes back.
// Callers in the hot path (relay token auth) should treat any return value
// other than 1 as a hard rejection.
func GetTeamStatusCached(teamId int) (int, error) {
	if teamId <= 0 {
		return -1, ErrTeamNotFound
	}

	if common.RedisEnabled {
		if v, err := common.RedisGet(teamStatusCacheKey(teamId)); err == nil && v != "" {
			switch v {
			case "1":
				return TeamStatusActive, nil
			case "2":
				return TeamStatusDisabled, nil
			case "-1":
				return -1, ErrTeamNotFound
			}
		}
	}

	// Cache miss — load from DB. We need to see soft-deleted rows so we can
	// cache them as -1 instead of repeatedly missing.
	var t Team
	err := DB.Unscoped().Select("id, status, deleted_at").
		Where("id = ?", teamId).First(&t).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			writeTeamStatusCache(teamId, "-1")
			return -1, ErrTeamNotFound
		}
		return -1, err
	}
	if t.DeletedAt.Valid {
		writeTeamStatusCache(teamId, "-1")
		return -1, ErrTeamNotFound
	}
	switch t.Status {
	case TeamStatusActive:
		writeTeamStatusCache(teamId, "1")
		return TeamStatusActive, nil
	case TeamStatusDisabled:
		writeTeamStatusCache(teamId, "2")
		return TeamStatusDisabled, nil
	default:
		// Legacy rows (status=0) are treated as active to match historical
		// behavior — nothing read this field before today, so existing
		// installs may have un-migrated zero values.
		writeTeamStatusCache(teamId, "1")
		return TeamStatusActive, nil
	}
}

func writeTeamStatusCache(teamId int, val string) {
	if !common.RedisEnabled {
		return
	}
	_ = common.RedisSet(
		teamStatusCacheKey(teamId),
		val,
		time.Duration(common.RedisKeyCacheSeconds())*time.Second,
	)
}

// ErrTeamNotFound is returned when the requested team is missing or soft-deleted.
var ErrTeamNotFound = errors.New("team not found")

// ErrTeamMustAddMemberFirst is returned when transferring ownership to a
// user who isn't already an active member of the team.
var ErrTeamMustAddMemberFirst = errors.New("must add member first")

// ─── Listing ───

// ListTeamsFilter parameterizes the admin team list query.
type ListTeamsFilter struct {
	Keyword        string // matches team.name, owner.username, owner.email
	Status         string // "active", "disabled", "all" (default "all")
	IncludeDeleted bool
	Order          string // "created_at", "name", "member_count"
	OrderDir       string // "asc", "desc" (default "desc")
	Page           int    // 1-based
	PageSize       int    // default 20, max 100
}

// AdminTeamRow is one row in the admin team list.
type AdminTeamRow struct {
	Team                    Team        `json:"team"`
	Owner                   *AdminOwner `json:"owner,omitempty"`
	MemberCount             int64       `json:"member_count"`
	ActiveSubscriptionCount int64       `json:"active_subscription_count"`
	TodayQuota              int64       `json:"today_quota"`
}

// AdminOwner is the trimmed user payload for the team owner column.
type AdminOwner struct {
	Id          int    `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
}

// ListTeamsForAdmin returns a paginated, filterable view of all teams.
// Member count and today's quota are joined per-row to avoid an N+1.
func ListTeamsForAdmin(f ListTeamsFilter) ([]AdminTeamRow, int64, error) {
	page := f.Page
	if page < 1 {
		page = 1
	}
	size := f.PageSize
	if size <= 0 {
		size = 20
	}
	if size > 100 {
		size = 100
	}

	tx := DB.Model(&Team{})
	if f.IncludeDeleted {
		tx = tx.Unscoped()
	}

	switch f.Status {
	case "active":
		tx = tx.Where("teams.status = ?", TeamStatusActive)
	case "disabled":
		tx = tx.Where("teams.status = ?", TeamStatusDisabled)
	}

	if kw := strings.TrimSpace(f.Keyword); kw != "" {
		// Match team name OR owner identity. The owner subquery returns
		// user ids whose username/email/display_name contain the keyword;
		// we intersect with team.owner_id.
		like := "%" + escapeLikeSpecials(kw) + "%"
		var ownerIds []int
		_ = DB.Model(&User{}).
			Where("username LIKE ? ESCAPE '!' OR email LIKE ? ESCAPE '!' OR display_name LIKE ? ESCAPE '!'",
				like, like, like).
			Pluck("id", &ownerIds).Error
		if len(ownerIds) > 0 {
			tx = tx.Where("teams.name LIKE ? ESCAPE '!' OR teams.owner_id IN ?", like, ownerIds)
		} else {
			tx = tx.Where("teams.name LIKE ? ESCAPE '!'", like)
		}
	}

	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	order := "teams.created_at"
	switch f.Order {
	case "name":
		order = "teams.name"
	case "member_count":
		// Sub-select; falls back to created_at to keep query simple.
		order = "teams.created_at"
	}
	dir := "desc"
	if strings.ToLower(f.OrderDir) == "asc" {
		dir = "asc"
	}

	var teams []Team
	err := tx.Order(order + " " + dir).
		Limit(size).Offset((page - 1) * size).
		Find(&teams).Error
	if err != nil {
		return nil, 0, err
	}
	if len(teams) == 0 {
		return []AdminTeamRow{}, total, nil
	}

	teamIds := make([]int, 0, len(teams))
	ownerIds := make([]int, 0, len(teams))
	for _, t := range teams {
		teamIds = append(teamIds, t.Id)
		ownerIds = append(ownerIds, t.OwnerId)
	}

	// Bulk-fetch owners.
	ownerMap := make(map[int]*AdminOwner, len(ownerIds))
	if len(ownerIds) > 0 {
		var users []User
		_ = DB.Select("id, username, display_name, email").Where("id IN ?", ownerIds).Find(&users).Error
		for i := range users {
			u := users[i]
			ownerMap[u.Id] = &AdminOwner{
				Id: u.Id, Username: u.Username, DisplayName: u.DisplayName, Email: u.Email,
			}
		}
	}

	// Bulk-fetch member counts.
	memberCounts := make(map[int]int64, len(teamIds))
	type cntRow struct {
		TeamId int
		Cnt    int64
	}
	var crows []cntRow
	_ = DB.Model(&TeamMember{}).
		Select("team_id, COUNT(*) AS cnt").
		Where("team_id IN ? AND status = ?", teamIds, TeamStatusActive).
		Group("team_id").Scan(&crows).Error
	for _, r := range crows {
		memberCounts[r.TeamId] = r.Cnt
	}

	// Bulk-fetch active subscription counts.
	subCounts := make(map[int]int64, len(teamIds))
	now := common.GetTimestamp()
	var srows []cntRow
	_ = DB.Model(&UserSubscription{}).
		Select("team_id, COUNT(*) AS cnt").
		Where("team_id IN ? AND status = ? AND end_time > ?", teamIds, "active", now).
		Group("team_id").Scan(&srows).Error
	for _, r := range srows {
		subCounts[r.TeamId] = r.Cnt
	}

	// Bulk-fetch today's quota (sum of logs.quota where token.team_id IN teamIds).
	todayStart := startOfTodayUnix()
	type quotaRow struct {
		TeamId int
		Q      int64
	}
	var qrows []quotaRow
	_ = DB.Table("logs").
		Select("tokens.team_id AS team_id, SUM(logs.quota) AS q").
		Joins("JOIN tokens ON tokens.id = logs.token_id").
		Where("tokens.team_id IN ? AND logs.created_at >= ?", teamIds, todayStart).
		Group("tokens.team_id").Scan(&qrows).Error
	todayQuota := make(map[int]int64, len(teamIds))
	for _, r := range qrows {
		todayQuota[r.TeamId] = r.Q
	}

	rows := make([]AdminTeamRow, 0, len(teams))
	for _, t := range teams {
		rows = append(rows, AdminTeamRow{
			Team:                    t,
			Owner:                   ownerMap[t.OwnerId],
			MemberCount:             memberCounts[t.Id],
			ActiveSubscriptionCount: subCounts[t.Id],
			TodayQuota:              todayQuota[t.Id],
		})
	}
	return rows, total, nil
}

// startOfTodayUnix returns the unix timestamp at 00:00 local time.
func startOfTodayUnix() int64 {
	now := time.Now()
	t := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	return t.Unix()
}

// escapeLikeSpecials escapes !, %, _ in a LIKE pattern.
func escapeLikeSpecials(s string) string {
	s = strings.ReplaceAll(s, "!", "!!")
	s = strings.ReplaceAll(s, "%", "!%")
	s = strings.ReplaceAll(s, "_", "!_")
	return s
}

// ─── Detail ───

// AdminTeamDetail is the payload for GET /api/admin/teams/:id.
type AdminTeamDetail struct {
	Team                Team                  `json:"team"`
	Owner               *AdminOwner           `json:"owner,omitempty"`
	MemberCount         int64                 `json:"member_count"`
	ActiveSubscriptions []SubscriptionSummary `json:"active_subscriptions"`
	TodayQuota          int64                 `json:"today_quota"`
	MonthQuota          int64                 `json:"month_quota"`
	IsDeleted           bool                  `json:"is_deleted"`
}

// GetTeamForAdmin returns the team detail. includeDeleted=true allows
// reading soft-deleted rows for audit purposes.
func GetTeamForAdmin(teamId int, includeDeleted bool) (*AdminTeamDetail, error) {
	if teamId <= 0 {
		return nil, ErrTeamNotFound
	}
	q := DB.Model(&Team{})
	if includeDeleted {
		q = q.Unscoped()
	}
	var t Team
	if err := q.Where("id = ?", teamId).First(&t).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTeamNotFound
		}
		return nil, err
	}

	detail := &AdminTeamDetail{Team: t, IsDeleted: t.DeletedAt.Valid}

	if t.OwnerId > 0 {
		var u User
		if err := DB.Select("id, username, display_name, email").
			Where("id = ?", t.OwnerId).First(&u).Error; err == nil {
			detail.Owner = &AdminOwner{
				Id: u.Id, Username: u.Username, DisplayName: u.DisplayName, Email: u.Email,
			}
		}
	}

	cnt, _ := GetTeamMemberCount(t.Id)
	detail.MemberCount = cnt

	if active, err := GetAllActiveTeamSubscriptions(t.Id); err == nil {
		detail.ActiveSubscriptions = active
	} else {
		detail.ActiveSubscriptions = []SubscriptionSummary{}
	}

	todayStart := startOfTodayUnix()
	monthStart := startOfMonthUnix()
	detail.TodayQuota = sumTeamQuotaSince(t.Id, todayStart)
	detail.MonthQuota = sumTeamQuotaSince(t.Id, monthStart)

	return detail, nil
}

func startOfMonthUnix() int64 {
	now := time.Now()
	t := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	return t.Unix()
}

// sumTeamQuotaSince sums logs.quota for tokens belonging to teamId since
// the given unix timestamp. Returns 0 on any error to keep the detail page
// resilient to logging-pipeline outages.
func sumTeamQuotaSince(teamId int, since int64) int64 {
	type r struct{ Q int64 }
	var row r
	_ = DB.Table("logs").
		Select("COALESCE(SUM(logs.quota), 0) AS q").
		Joins("JOIN tokens ON tokens.id = logs.token_id").
		Where("tokens.team_id = ? AND logs.created_at >= ?", teamId, since).
		Scan(&row).Error
	return row.Q
}

// ─── Mutations ───

// AdminUpdateTeamFields updates a team's name and/or status. Empty / zero
// values are treated as "no change". Refuses to operate on soft-deleted
// teams. Invalidates the status cache on success.
func AdminUpdateTeamFields(teamId int, newName string, newStatus int) error {
	if teamId <= 0 {
		return ErrTeamNotFound
	}
	updates := map[string]interface{}{
		"updated_at": common.GetTimestamp(),
	}
	if name := strings.TrimSpace(newName); name != "" {
		updates["name"] = name
	}
	if newStatus == TeamStatusActive || newStatus == TeamStatusDisabled {
		updates["status"] = newStatus
	}
	if len(updates) == 1 {
		return errors.New("nothing to update")
	}
	res := DB.Model(&Team{}).Where("id = ?", teamId).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrTeamNotFound
	}
	InvalidateTeamStatusCache(teamId)
	return nil
}

// DeleteTeamCascade soft-deletes a team and all dependent rows. Active
// team subscriptions are marked terminated (status=cancelled, end_time=now)
// with the admin user id recorded on the existing source field for audit
// since the schema doesn't have a dedicated terminated_by column yet.
//
// Atomic via transaction; the cache invalidation runs after commit.
func DeleteTeamCascade(teamId int, adminUserId int) error {
	if teamId <= 0 {
		return ErrTeamNotFound
	}
	now := common.GetTimestamp()
	err := DB.Transaction(func(tx *gorm.DB) error {
		// Verify team exists and isn't already deleted.
		var t Team
		if err := tx.Where("id = ?", teamId).First(&t).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTeamNotFound
			}
			return err
		}

		// Soft-delete team-bound tokens.
		if err := tx.Where("team_id = ?", teamId).Delete(&Token{}).Error; err != nil {
			return err
		}
		// Soft-delete team members.
		if err := tx.Where("team_id = ?", teamId).Delete(&TeamMember{}).Error; err != nil {
			return err
		}
		// Mark active subscriptions as terminated. We use status="cancelled"
		// + end_time=now to match what AdminInvalidateTeamSubscription does,
		// and overwrite source so the audit trail records who terminated it.
		if err := tx.Model(&UserSubscription{}).
			Where("team_id = ? AND status = ? AND end_time > ?", teamId, "active", now).
			Updates(map[string]interface{}{
				"status":     "cancelled",
				"end_time":   now,
				"source":     fmt.Sprintf("admin:%d:team_deleted", adminUserId),
				"updated_at": now,
			}).Error; err != nil {
			return err
		}
		// Soft-delete the team itself.
		if err := tx.Delete(&Team{}, teamId).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return err
	}
	InvalidateTeamStatusCache(teamId)
	return nil
}

// CreateTeamForOwner is the model-side helper used by both the application
// approve flow and the admin "create team" flow. It atomically creates the
// team row and the owner's TeamMember row.
func CreateTeamForOwner(name string, ownerId int) (*Team, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("team name required")
	}
	if ownerId <= 0 {
		return nil, errors.New("owner id required")
	}
	team := &Team{
		Name:    strings.TrimSpace(name),
		OwnerId: ownerId,
		Status:  TeamStatusActive,
	}
	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(team).Error; err != nil {
			return err
		}
		return tx.Create(&TeamMember{
			TeamId: team.Id,
			UserId: ownerId,
			Role:   TeamRoleOwner,
			Status: TeamStatusActive,
		}).Error
	})
	if err != nil {
		return nil, err
	}
	return team, nil
}
