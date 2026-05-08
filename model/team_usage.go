package model

import (
	"errors"
	"time"

	"github.com/runcoor/aggre-api/common"
)

// ─────────────────────────────────────────────────────────────────────────────
// Team usage statistics — backs the admin team detail "usage" tab.
//
// The logs table doesn't carry team_id directly. We resolve team scope by
// joining tokens.team_id, so every query in this file follows the shape:
//   logs JOIN tokens ON tokens.id = logs.token_id WHERE tokens.team_id = ?
//
// Day bucketing uses (created_at / 86400) to stay portable across SQLite,
// MySQL, and PostgreSQL — no DATE_FORMAT / strftime / to_char branching.
// ─────────────────────────────────────────────────────────────────────────────

// TeamUsageSummary is the high-level numbers card.
type TeamUsageSummary struct {
	TotalRequests int64 `json:"total_requests"`
	TotalQuota    int64 `json:"total_quota"`
	TodayRequests int64 `json:"today_requests"`
	TodayQuota    int64 `json:"today_quota"`
	MonthRequests int64 `json:"month_requests"`
	MonthQuota    int64 `json:"month_quota"`
}

// TeamUsageByMember rolls up logs by user.
type TeamUsageByMember struct {
	UserId      int    `json:"user_id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Requests    int64  `json:"requests"`
	Quota       int64  `json:"quota"`
}

// TeamUsageByToken rolls up logs by token.
type TeamUsageByToken struct {
	TokenId   int    `json:"token_id"`
	TokenName string `json:"token_name"`
	Requests  int64  `json:"requests"`
	Quota     int64  `json:"quota"`
}

// TeamUsageDailyBucket is one day on the trend chart.
type TeamUsageDailyBucket struct {
	Date     string `json:"date"` // YYYY-MM-DD, in server local time
	Requests int64  `json:"requests"`
	Quota    int64  `json:"quota"`
}

// TeamUsageReport is the full payload for /api/admin/teams/:id/usage.
type TeamUsageReport struct {
	Summary  TeamUsageSummary       `json:"summary"`
	ByMember []TeamUsageByMember    `json:"by_member"`
	ByToken  []TeamUsageByToken     `json:"by_token"`
	Daily    []TeamUsageDailyBucket `json:"daily"`
}

// GetTeamUsageReport returns the full usage report. days controls the
// trend window and the "by_member" / "by_token" rollup window — the
// total/today/month numbers are global to the team's lifetime / day /
// month respectively.
func GetTeamUsageReport(teamId int, days int) (*TeamUsageReport, error) {
	if teamId <= 0 {
		return nil, errors.New("invalid teamId")
	}
	if days <= 0 {
		days = 30
	}
	if days > 365 {
		days = 365
	}

	report := &TeamUsageReport{}

	// Summary cards.
	report.Summary = sumTeamUsage(teamId, 0, common.GetTimestamp())
	todayStart := startOfTodayUnix()
	monthStart := startOfMonthUnix()
	today := sumTeamUsage(teamId, todayStart, common.GetTimestamp())
	month := sumTeamUsage(teamId, monthStart, common.GetTimestamp())
	report.Summary.TodayRequests = today.TotalRequests
	report.Summary.TodayQuota = today.TotalQuota
	report.Summary.MonthRequests = month.TotalRequests
	report.Summary.MonthQuota = month.TotalQuota

	since := time.Now().AddDate(0, 0, -days).Unix()
	report.ByMember = sumTeamUsageByMember(teamId, since)
	report.ByToken = sumTeamUsageByToken(teamId, since)
	report.Daily = sumTeamUsageDaily(teamId, since, days)
	return report, nil
}

// sumTeamUsage runs a single SUM(quota) + COUNT(*) over the join.
func sumTeamUsage(teamId int, since int64, until int64) TeamUsageSummary {
	type row struct {
		R int64
		Q int64
	}
	var r row
	q := DB.Table("logs").
		Select("COUNT(*) AS r, COALESCE(SUM(logs.quota), 0) AS q").
		Joins("JOIN tokens ON tokens.id = logs.token_id").
		Where("tokens.team_id = ?", teamId)
	if since > 0 {
		q = q.Where("logs.created_at >= ?", since)
	}
	if until > 0 {
		q = q.Where("logs.created_at <= ?", until)
	}
	_ = q.Scan(&r).Error
	return TeamUsageSummary{
		TotalRequests: r.R,
		TotalQuota:    r.Q,
	}
}

func sumTeamUsageByMember(teamId int, since int64) []TeamUsageByMember {
	type row struct {
		UserId   int
		Requests int64
		Quota    int64
	}
	var rows []row
	_ = DB.Table("logs").
		Select("logs.user_id AS user_id, COUNT(*) AS requests, COALESCE(SUM(logs.quota), 0) AS quota").
		Joins("JOIN tokens ON tokens.id = logs.token_id").
		Where("tokens.team_id = ? AND logs.created_at >= ?", teamId, since).
		Group("logs.user_id").
		Order("quota desc").
		Scan(&rows).Error

	if len(rows) == 0 {
		return []TeamUsageByMember{}
	}
	userIds := make([]int, 0, len(rows))
	for _, r := range rows {
		userIds = append(userIds, r.UserId)
	}
	var users []User
	_ = DB.Select("id, username, display_name").Where("id IN ?", userIds).Find(&users).Error
	userMap := make(map[int]User, len(users))
	for _, u := range users {
		userMap[u.Id] = u
	}
	out := make([]TeamUsageByMember, 0, len(rows))
	for _, r := range rows {
		u := userMap[r.UserId]
		out = append(out, TeamUsageByMember{
			UserId: r.UserId, Username: u.Username, DisplayName: u.DisplayName,
			Requests: r.Requests, Quota: r.Quota,
		})
	}
	return out
}

func sumTeamUsageByToken(teamId int, since int64) []TeamUsageByToken {
	type row struct {
		TokenId  int
		Requests int64
		Quota    int64
	}
	var rows []row
	_ = DB.Table("logs").
		Select("logs.token_id AS token_id, COUNT(*) AS requests, COALESCE(SUM(logs.quota), 0) AS quota").
		Joins("JOIN tokens ON tokens.id = logs.token_id").
		Where("tokens.team_id = ? AND logs.created_at >= ?", teamId, since).
		Group("logs.token_id").
		Order("quota desc").
		Scan(&rows).Error
	if len(rows) == 0 {
		return []TeamUsageByToken{}
	}
	tokenIds := make([]int, 0, len(rows))
	for _, r := range rows {
		tokenIds = append(tokenIds, r.TokenId)
	}
	var tokens []Token
	_ = DB.Unscoped().Select("id, name").Where("id IN ?", tokenIds).Find(&tokens).Error
	tokenMap := make(map[int]string, len(tokens))
	for _, t := range tokens {
		tokenMap[t.Id] = t.Name
	}
	out := make([]TeamUsageByToken, 0, len(rows))
	for _, r := range rows {
		out = append(out, TeamUsageByToken{
			TokenId: r.TokenId, TokenName: tokenMap[r.TokenId],
			Requests: r.Requests, Quota: r.Quota,
		})
	}
	return out
}

func sumTeamUsageDaily(teamId int, since int64, days int) []TeamUsageDailyBucket {
	type row struct {
		DayIdx   int64
		Requests int64
		Quota    int64
	}
	var rows []row
	_ = DB.Table("logs").
		Select("(logs.created_at / 86400) AS day_idx, COUNT(*) AS requests, COALESCE(SUM(logs.quota), 0) AS quota").
		Joins("JOIN tokens ON tokens.id = logs.token_id").
		Where("tokens.team_id = ? AND logs.created_at >= ?", teamId, since).
		Group("day_idx").
		Order("day_idx asc").
		Scan(&rows).Error
	byDay := make(map[string]row, len(rows))
	for _, r := range rows {
		date := time.Unix(r.DayIdx*86400, 0).Format("2006-01-02")
		byDay[date] = r
	}
	// Backfill empty days so the chart is dense.
	out := make([]TeamUsageDailyBucket, 0, days)
	now := time.Now()
	for i := days - 1; i >= 0; i-- {
		d := now.AddDate(0, 0, -i)
		key := d.Format("2006-01-02")
		if r, ok := byDay[key]; ok {
			out = append(out, TeamUsageDailyBucket{Date: key, Requests: r.Requests, Quota: r.Quota})
		} else {
			out = append(out, TeamUsageDailyBucket{Date: key})
		}
	}
	return out
}
