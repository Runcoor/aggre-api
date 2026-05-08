package controller

import (
	"errors"

	"github.com/runcoor/aggre-api/model"
)

// resolveSubscriptionPurchaseScope validates that the given user is allowed
// to purchase a subscription on behalf of the given team (or, when teamId == 0,
// for themselves). It also enforces MaxPurchasePerUser at the appropriate scope.
//
// Returns nil on success. The caller should bail with the returned error
// message via common.ApiErrorMsg.
//
// Used by all subscription payment handlers (stripe / creem / dodo / epay /
// nowpayments) to factor out duplicated validation logic.
func resolveSubscriptionPurchaseScope(userId int, teamId int, plan *model.SubscriptionPlan) error {
	if plan == nil {
		return errors.New("plan is nil")
	}
	if teamId == 0 {
		// Personal purchase — existing semantics.
		if plan.MaxPurchasePerUser > 0 {
			count, err := model.CountUserSubscriptionsByPlan(userId, plan.Id)
			if err != nil {
				return err
			}
			if count >= int64(plan.MaxPurchasePerUser) {
				return errors.New("已达到该套餐购买上限")
			}
		}
		return nil
	}

	// Team purchase — buyer must be the team owner.
	team, err := model.GetTeamById(teamId)
	if err != nil || team == nil {
		return errors.New("团队不存在")
	}
	if team.Status != model.TeamStatusActive {
		return errors.New("团队已停用")
	}
	member, err := model.GetTeamMemberByUserAndTeam(userId, teamId)
	if err != nil || member == nil {
		return errors.New("你不是该团队成员")
	}
	if member.Role < model.TeamRoleOwner {
		return errors.New("仅团队所有者可以为团队购买订阅")
	}
	if plan.MaxPurchasePerUser > 0 {
		count, err := model.CountTeamSubscriptionsByPlan(teamId, plan.Id)
		if err != nil {
			return err
		}
		if count >= int64(plan.MaxPurchasePerUser) {
			return errors.New("该团队已达到该套餐购买上限")
		}
	}
	return nil
}
