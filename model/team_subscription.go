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
// Team subscription model — phase P1 of subscription-native team plans.
//
// A team subscription is a UserSubscription row with team_id > 0. UserId still
// records the buyer (the team member who paid / triggered the admin bind), but
// quota is consumed per-team rather than per-user, and User.group of the buyer
// is NEVER elevated by purchasing a team subscription (that would let an admin
// of a free-tier team get premium routing for free).
//
// Refund/PostConsume reuse the personal helpers because they operate on
// UserSubscription.id which is unambiguous.
// ─────────────────────────────────────────────────────────────────────────────

// CreateTeamSubscriptionFromPlanTx creates a team subscription for the given
// teamId, recording buyerUserId for audit. Unlike CreateUserSubscriptionFromPlanTx
// it does NOT touch User.group — team subscriptions don't elevate the buyer's
// personal tier, only the team's request routing.
//
// MaxPurchasePerUser is interpreted per-team here (counts existing team subs
// of this plan for this team), so a team can't stack the same plan past its
// limit. The buyer's personal sub count is unaffected.
func CreateTeamSubscriptionFromPlanTx(tx *gorm.DB, teamId int, buyerUserId int, plan *SubscriptionPlan, source string) (*UserSubscription, error) {
	if tx == nil {
		return nil, errors.New("tx is nil")
	}
	if plan == nil || plan.Id == 0 {
		return nil, errors.New("invalid plan")
	}
	if teamId <= 0 {
		return nil, errors.New("invalid team id")
	}
	if buyerUserId <= 0 {
		return nil, errors.New("invalid buyer user id")
	}
	if plan.MaxPurchasePerUser > 0 {
		var count int64
		if err := tx.Model(&UserSubscription{}).
			Where("team_id = ? AND plan_id = ?", teamId, plan.Id).
			Count(&count).Error; err != nil {
			return nil, err
		}
		if count >= int64(plan.MaxPurchasePerUser) {
			return nil, errors.New("已达到该套餐购买上限")
		}
	}
	nowUnix := GetDBTimestamp()
	now := time.Unix(nowUnix, 0)
	endUnix, err := calcPlanEndTime(now, plan)
	if err != nil {
		return nil, err
	}
	resetBase := now
	nextReset := calcNextResetTime(resetBase, plan, endUnix)
	lastReset := int64(0)
	if nextReset > 0 {
		lastReset = now.Unix()
	}
	sub := &UserSubscription{
		UserId:        buyerUserId,
		TeamId:        teamId,
		PlanId:        plan.Id,
		AmountTotal:   plan.TotalAmount,
		AmountUsed:    0,
		StartTime:     now.Unix(),
		EndTime:       endUnix,
		Status:        "active",
		Source:        source,
		LastResetTime: lastReset,
		NextResetTime: nextReset,
		UpgradeGroup:  strings.TrimSpace(plan.UpgradeGroup),
		PrevUserGroup: "",
		CreatedAt:     common.GetTimestamp(),
		UpdatedAt:     common.GetTimestamp(),
	}
	if err := tx.Create(sub).Error; err != nil {
		return nil, err
	}
	return sub, nil
}

// HasActiveTeamSubscription returns whether the team has any active subscription.
func HasActiveTeamSubscription(teamId int) (bool, error) {
	if teamId <= 0 {
		return false, errors.New("invalid teamId")
	}
	now := common.GetTimestamp()
	var count int64
	if err := DB.Model(&UserSubscription{}).
		Where("team_id = ? AND status = ? AND end_time > ?", teamId, "active", now).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetActiveTeamSubscriptionGroup returns the UpgradeGroup entitled by the
// team's active subscription (the one expiring last, matching the ordering
// used elsewhere). Empty string means no active subscription or a plan that
// grants no group upgrade. This is the group a team-bound token should run
// under so every member bills the team plan at a consistent tier/ratio,
// independent of their personal user.group.
func GetActiveTeamSubscriptionGroup(teamId int) string {
	if teamId <= 0 {
		return ""
	}
	now := common.GetTimestamp()
	var sub UserSubscription
	err := DB.Select("upgrade_group").
		Where("team_id = ? AND status = ? AND end_time > ?", teamId, "active", now).
		Order("end_time desc, id desc").
		First(&sub).Error
	if err != nil {
		return ""
	}
	return strings.TrimSpace(sub.UpgradeGroup)
}

// HasActiveTeamSubscriptionForPlan checks whether the team holds an active
// subscription for a specific plan. Used by checkout to enforce
// MaxPurchasePerUser semantics at the team scope.
func HasActiveTeamSubscriptionForPlan(teamId int, planId int) (bool, error) {
	if teamId <= 0 || planId <= 0 {
		return false, nil
	}
	now := common.GetTimestamp()
	var count int64
	if err := DB.Model(&UserSubscription{}).
		Where("team_id = ? AND plan_id = ? AND status = ? AND end_time > ?", teamId, planId, "active", now).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetAllActiveTeamSubscriptions returns active subscriptions for a team.
func GetAllActiveTeamSubscriptions(teamId int) ([]SubscriptionSummary, error) {
	if teamId <= 0 {
		return nil, errors.New("invalid teamId")
	}
	now := common.GetTimestamp()
	var subs []UserSubscription
	err := DB.Where("team_id = ? AND status = ? AND end_time > ?", teamId, "active", now).
		Order("end_time desc, id desc").
		Find(&subs).Error
	if err != nil {
		return nil, err
	}
	return buildSubscriptionSummaries(subs), nil
}

// GetAllTeamSubscriptions returns every subscription record for a team
// (including expired/cancelled). Used by the team admin UI history view.
func GetAllTeamSubscriptions(teamId int) ([]SubscriptionSummary, error) {
	if teamId <= 0 {
		return nil, errors.New("invalid teamId")
	}
	var subs []UserSubscription
	err := DB.Where("team_id = ?", teamId).
		Order("end_time desc, id desc").
		Find(&subs).Error
	if err != nil {
		return nil, err
	}
	return buildSubscriptionSummaries(subs), nil
}

// CountTeamSubscriptionsByPlan counts ALL team subscriptions of a given plan
// (active, expired, cancelled). Mirrors CountUserSubscriptionsByPlan.
func CountTeamSubscriptionsByPlan(teamId int, planId int) (int64, error) {
	if teamId <= 0 || planId <= 0 {
		return 0, errors.New("invalid teamId or planId")
	}
	var count int64
	if err := DB.Model(&UserSubscription{}).
		Where("team_id = ? AND plan_id = ?", teamId, planId).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// IsWalletFallbackEnabledForTeam returns true if the team has at least one
// active subscription whose plan has allow_wallet_fallback = true. Mirrors
// IsWalletFallbackEnabledForUser. Currently informational — the actual
// fallback wiring for team requests is not implemented in P1 (out-of-plan
// team requests 503 just like the legacy team pool did).
func IsWalletFallbackEnabledForTeam(teamId int) (bool, error) {
	if teamId <= 0 {
		return false, nil
	}
	now := common.GetTimestamp()
	var count int64
	err := DB.Table("user_subscriptions").
		Joins("JOIN subscription_plans ON subscription_plans.id = user_subscriptions.plan_id").
		Where("user_subscriptions.team_id = ? AND user_subscriptions.status = ? AND user_subscriptions.end_time > ?",
			teamId, "active", now).
		Where("subscription_plans.allow_wallet_fallback = ?", true).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// PreConsumeTeamSubscription is the team-scope counterpart of
// PreConsumeUserSubscription. It reserves `amount` quota from any active
// subscription of the given team, ordered by soonest-to-expire first.
//
// Idempotent by requestId — same request retried returns the same result
// rather than double-debiting.
//
// Refund and post-consume settle through the same helpers used by personal
// subscriptions (RefundSubscriptionPreConsume / PostConsumeUserSubscriptionDelta)
// because those operate on user_subscriptions.id which uniquely identifies
// the row regardless of owner kind.
func PreConsumeTeamSubscription(requestId string, teamId int, modelName string, quotaType int, amount int64) (*SubscriptionPreConsumeResult, error) {
	if teamId <= 0 {
		return nil, errors.New("invalid teamId")
	}
	if strings.TrimSpace(requestId) == "" {
		return nil, errors.New("requestId is empty")
	}
	if amount <= 0 {
		return nil, errors.New("amount must be > 0")
	}
	now := GetDBTimestamp()

	returnValue := &SubscriptionPreConsumeResult{}

	err := DB.Transaction(func(tx *gorm.DB) error {
		var existing SubscriptionPreConsumeRecord
		query := tx.Where("request_id = ?", requestId).Limit(1).Find(&existing)
		if query.Error != nil {
			return query.Error
		}
		if query.RowsAffected > 0 {
			if existing.Status == "refunded" {
				return errors.New("subscription pre-consume already refunded")
			}
			var sub UserSubscription
			if err := tx.Where("id = ?", existing.UserSubscriptionId).First(&sub).Error; err != nil {
				return err
			}
			returnValue.UserSubscriptionId = sub.Id
			returnValue.PreConsumed = existing.PreConsumed
			returnValue.AmountTotal = sub.AmountTotal
			returnValue.AmountUsedBefore = sub.AmountUsed
			returnValue.AmountUsedAfter = sub.AmountUsed
			return nil
		}

		var subs []UserSubscription
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			Where("team_id = ? AND status = ? AND end_time > ?", teamId, "active", now).
			Order("end_time asc, id asc").
			Find(&subs).Error; err != nil {
			common.SysLog(fmt.Sprintf("[team-sub-billing] team %d: query error: %s (now=%d)", teamId, err.Error(), now))
			return errors.New("no active team subscription")
		}
		if len(subs) == 0 {
			common.SysLog(fmt.Sprintf("[team-sub-billing] team %d: no active subscriptions found (now=%d)", teamId, now))
			return errors.New("no active team subscription")
		}
		for _, candidate := range subs {
			sub := candidate
			plan, err := getSubscriptionPlanByIdTx(tx, sub.PlanId)
			if err != nil {
				return err
			}
			if err := maybeResetUserSubscriptionWithPlanTx(tx, &sub, plan, now); err != nil {
				return err
			}
			usedBefore := sub.AmountUsed
			if sub.AmountTotal > 0 {
				remain := sub.AmountTotal - usedBefore
				if remain < amount {
					common.SysLog(fmt.Sprintf("[team-sub-billing] team %d: sub %d (plan=%d) skipped — quota insufficient (total=%d, used=%d, remain=%d, need=%d)",
						teamId, sub.Id, sub.PlanId, sub.AmountTotal, usedBefore, remain, amount))
					continue
				}
			}
			record := &SubscriptionPreConsumeRecord{
				RequestId:          requestId,
				UserId:             sub.UserId,
				UserSubscriptionId: sub.Id,
				PreConsumed:        amount,
				Status:             "consumed",
			}
			if err := tx.Create(record).Error; err != nil {
				var dup SubscriptionPreConsumeRecord
				if err2 := tx.Where("request_id = ?", requestId).First(&dup).Error; err2 == nil {
					if dup.Status == "refunded" {
						return errors.New("subscription pre-consume already refunded")
					}
					returnValue.UserSubscriptionId = sub.Id
					returnValue.PreConsumed = dup.PreConsumed
					returnValue.AmountTotal = sub.AmountTotal
					returnValue.AmountUsedBefore = sub.AmountUsed
					returnValue.AmountUsedAfter = sub.AmountUsed
					return nil
				}
				return err
			}
			sub.AmountUsed += amount
			if err := tx.Save(&sub).Error; err != nil {
				return err
			}
			returnValue.UserSubscriptionId = sub.Id
			returnValue.PreConsumed = amount
			returnValue.AmountTotal = sub.AmountTotal
			returnValue.AmountUsedBefore = usedBefore
			returnValue.AmountUsedAfter = sub.AmountUsed
			return nil
		}
		return fmt.Errorf("team subscription quota insufficient, need=%d", amount)
	})
	if err != nil {
		return nil, err
	}
	return returnValue, nil
}

// AdminBindTeamSubscription is the team counterpart of AdminBindSubscription.
// Creates a team subscription without going through the payment provider.
func AdminBindTeamSubscription(teamId int, buyerUserId int, planId int, sourceNote string) error {
	if teamId <= 0 || planId <= 0 || buyerUserId <= 0 {
		return errors.New("invalid args")
	}
	plan, err := GetSubscriptionPlanById(planId)
	if err != nil {
		return err
	}
	source := "admin"
	if strings.TrimSpace(sourceNote) != "" {
		source = sourceNote
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		_, err := CreateTeamSubscriptionFromPlanTx(tx, teamId, buyerUserId, plan, source)
		return err
	})
}

// AdminTerminateTeamSubscriptionForTeam cancels an active subscription for
// a specific team, validating that the subscription actually belongs to
// that team. The admin id and an optional reason are recorded on the
// source field for audit. Refuses to terminate already-cancelled rows.
func AdminTerminateTeamSubscriptionForTeam(teamId int, userSubscriptionId int, adminUserId int, reason string) error {
	if teamId <= 0 || userSubscriptionId <= 0 {
		return errors.New("invalid args")
	}
	if reason == "" {
		reason = "admin_terminated"
	}
	now := common.GetTimestamp()
	return DB.Transaction(func(tx *gorm.DB) error {
		var sub UserSubscription
		err := tx.Set("gorm:query_option", "FOR UPDATE").
			Where("id = ? AND team_id = ?", userSubscriptionId, teamId).
			First(&sub).Error
		if err != nil {
			return err
		}
		if sub.Status != "active" {
			return errors.New("subscription is not active")
		}
		return tx.Model(&sub).Updates(map[string]interface{}{
			"status":     "cancelled",
			"end_time":   now,
			"source":     fmt.Sprintf("admin:%d:%s", adminUserId, reason),
			"updated_at": now,
		}).Error
	})
}

// AdminInvalidateTeamSubscription cancels a team subscription immediately.
// Unlike the personal counterpart it doesn't touch User.group because team
// subscriptions never elevated it.
func AdminInvalidateTeamSubscription(userSubscriptionId int) error {
	if userSubscriptionId <= 0 {
		return errors.New("invalid userSubscriptionId")
	}
	now := common.GetTimestamp()
	return DB.Transaction(func(tx *gorm.DB) error {
		var sub UserSubscription
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			Where("id = ? AND team_id > 0", userSubscriptionId).First(&sub).Error; err != nil {
			return err
		}
		return tx.Model(&sub).Updates(map[string]interface{}{
			"status":     "cancelled",
			"end_time":   now,
			"updated_at": now,
		}).Error
	})
}
