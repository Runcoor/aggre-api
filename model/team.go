package model

import (
	"github.com/runcoor/aggre-api/common"
	"gorm.io/gorm"
)

// ─── Team roles ───
const (
	TeamRoleMember = 1
	TeamRoleAdmin  = 10
	TeamRoleOwner  = 100
)

// ─── Team status ───
const (
	TeamStatusActive   = 1
	TeamStatusDisabled = 2
)

// ─── Team ───
//
// Quota / UsedQuota / RequestCount are intentionally not in the struct
// even though the columns may still exist in old DBs from the legacy
// "team quota pool" model. Billing now routes through team subscriptions
// (see model/team_subscription.go + service/funding_source.go's
// TeamSubscriptionFunding). GORM does not drop columns on AutoMigrate
// so existing data is left in place; nothing reads it.

type Team struct {
	Id         int            `json:"id" gorm:"primaryKey"`
	Name       string         `json:"name" gorm:"type:varchar(128);not null"`
	OwnerId    int            `json:"owner_id" gorm:"index;not null"`
	Status     int            `json:"status" gorm:"type:int;default:1"`
	InviteCode string         `json:"invite_code" gorm:"type:varchar(32);uniqueIndex"`
	CreatedAt  int64          `json:"created_at" gorm:"bigint"`
	UpdatedAt  int64          `json:"updated_at" gorm:"bigint"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

func (t *Team) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	t.CreatedAt = now
	t.UpdatedAt = now
	if t.InviteCode == "" {
		t.InviteCode = common.GetRandomString(8)
	}
	return nil
}

func (t *Team) BeforeUpdate(tx *gorm.DB) error {
	t.UpdatedAt = common.GetTimestamp()
	return nil
}

func CreateTeam(team *Team) error {
	return DB.Create(team).Error
}

func GetTeamById(id int) (*Team, error) {
	var team Team
	err := DB.Where("id = ?", id).First(&team).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

func GetUserTeams(userId int) ([]map[string]interface{}, error) {
	var members []TeamMember
	err := DB.Where("user_id = ? AND status = ?", userId, TeamStatusActive).Find(&members).Error
	if err != nil {
		return nil, err
	}
	if len(members) == 0 {
		return []map[string]interface{}{}, nil
	}

	teamIds := make([]int, 0, len(members))
	memberRoleMap := make(map[int]int)
	for _, m := range members {
		teamIds = append(teamIds, m.TeamId)
		memberRoleMap[m.TeamId] = m.Role
	}

	var teams []Team
	err = DB.Where("id IN ? AND status = ?", teamIds, TeamStatusActive).Find(&teams).Error
	if err != nil {
		return nil, err
	}

	result := make([]map[string]interface{}, 0, len(teams))
	for _, t := range teams {
		memberCount, _ := GetTeamMemberCount(t.Id)
		result = append(result, map[string]interface{}{
			"team":         t,
			"role":         memberRoleMap[t.Id],
			"member_count": memberCount,
		})
	}
	return result, nil
}

func UpdateTeamName(id int, name string) error {
	return DB.Model(&Team{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":       name,
		"updated_at": common.GetTimestamp(),
	}).Error
}

func DeleteTeam(id int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("team_id = ?", id).Delete(&TeamMember{}).Error; err != nil {
			return err
		}
		return tx.Delete(&Team{}, id).Error
	})
}

func GetTeamByInviteCode(code string) (*Team, error) {
	var team Team
	err := DB.Where("invite_code = ? AND status = ?", code, TeamStatusActive).First(&team).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

func RegenerateTeamInviteCode(teamId int) (string, error) {
	code := common.GetRandomString(8)
	err := DB.Model(&Team{}).Where("id = ?", teamId).Updates(map[string]interface{}{
		"invite_code": code,
		"updated_at":  common.GetTimestamp(),
	}).Error
	return code, err
}

// ─── TeamMember ───
//
// QuotaLimit / UsedQuota / RequestCount removed alongside the team-quota
// pool. Per-member billing accounting lives in user logs now (the token
// records who made the call and team subscriptions handle aggregation).

type TeamMember struct {
	Id        int            `json:"id" gorm:"primaryKey"`
	TeamId    int            `json:"team_id" gorm:"uniqueIndex:idx_team_user;not null"`
	UserId    int            `json:"user_id" gorm:"uniqueIndex:idx_team_user;not null;index"`
	Role      int            `json:"role" gorm:"type:int;default:1"`
	Status    int            `json:"status" gorm:"type:int;default:1"`
	JoinedAt  int64          `json:"joined_at" gorm:"bigint"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

func AddTeamMember(member *TeamMember) error {
	if member.JoinedAt == 0 {
		member.JoinedAt = common.GetTimestamp()
	}
	return DB.Create(member).Error
}

func GetTeamMembers(teamId int) ([]map[string]interface{}, error) {
	var members []TeamMember
	err := DB.Where("team_id = ?", teamId).Find(&members).Error
	if err != nil {
		return nil, err
	}

	userIds := make([]int, 0, len(members))
	for _, m := range members {
		userIds = append(userIds, m.UserId)
	}

	var users []User
	if len(userIds) > 0 {
		DB.Select("id, username, display_name, email, status").Where("id IN ?", userIds).Find(&users)
	}
	userMap := make(map[int]User)
	for _, u := range users {
		userMap[u.Id] = u
	}

	result := make([]map[string]interface{}, 0, len(members))
	for _, m := range members {
		u := userMap[m.UserId]
		result = append(result, map[string]interface{}{
			"member":       m,
			"username":     u.Username,
			"display_name": u.DisplayName,
			"email":        u.Email,
		})
	}
	return result, nil
}

func GetTeamMemberByUserAndTeam(userId int, teamId int) (*TeamMember, error) {
	var member TeamMember
	err := DB.Where("user_id = ? AND team_id = ?", userId, teamId).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func GetTeamMemberCount(teamId int) (int64, error) {
	var count int64
	err := DB.Model(&TeamMember{}).Where("team_id = ? AND status = ?", teamId, TeamStatusActive).Count(&count).Error
	return count, err
}

func RemoveTeamMember(teamId int, userId int) error {
	return DB.Where("team_id = ? AND user_id = ?", teamId, userId).Delete(&TeamMember{}).Error
}
