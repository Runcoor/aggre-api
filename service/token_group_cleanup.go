package service

import (
	"fmt"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"

	"github.com/bytedance/gopkg/util/gopool"
)

// init wires the model-layer hook so that subscription lifecycle events
// (purchase, expire, cancel, delete) trigger a cleanup of token groups
// that are no longer reachable under the user's new effective group.
//
// We use a function-pointer hook in `model` instead of a direct call from
// model into service to avoid a model→service import cycle. main.go
// imports `service`, so this init() runs at startup before any request.
func init() {
	model.TokenGroupCleanupHook = ClearStaleTokenGroupsForUser
}

// ClearStaleTokenGroupsForUser scans the user's tokens and clears
// (sets to "") any token.group that is no longer reachable under the
// user's CURRENT user.group. This makes the affected tokens fall back
// to user.group at request time, avoiding 403 "无权访问 X 分组" errors
// after a subscription change.
//
// Skips:
//   - tokens with empty group (already correct)
//   - tokens with group="auto" (special; auto-routing handles its own resolution)
//   - tokens with team_id > 0 (team-bound; route through team subscription)
//   - tokens whose current group is still allowed (no-op)
//
// Reads the user's group from the DB (via cache) at call time rather than
// trusting the caller's notion of "new group", which makes the function
// robust to the existing caller-side mismatches (e.g. CompleteSubscriptionOrder
// pre-applies plan.UpgradeGroup unconditionally even when only-up semantics
// kept user.group at a higher tier).
//
// Idempotent. Safe to call from any code path.
func ClearStaleTokenGroupsForUser(userId int) {
	if userId <= 0 {
		return
	}

	currentGroup, err := model.GetUserGroup(userId, false)
	if err != nil || currentGroup == "" {
		return
	}

	usable := GetUserUsableGroups(currentGroup)
	if len(usable) == 0 {
		// Nothing computable; bail rather than nuking every token.
		return
	}

	var tokens []model.Token
	if err := model.DB.
		Where("user_id = ? AND team_id = 0", userId).
		Find(&tokens).Error; err != nil {
		common.SysLog(fmt.Sprintf("[token-group-cleanup] query error userId=%d: %s", userId, err.Error()))
		return
	}

	staleIds := make([]int, 0, len(tokens))
	staleKeys := make([]string, 0, len(tokens))
	for _, tok := range tokens {
		if tok.Group == "" || tok.Group == "auto" {
			continue
		}
		if _, ok := usable[tok.Group]; ok {
			continue
		}
		staleIds = append(staleIds, tok.Id)
		staleKeys = append(staleKeys, tok.Key)
	}
	if len(staleIds) == 0 {
		return
	}

	// Update via GORM's model-aware path so the "group" reserved word gets
	// quoted correctly across MySQL / PostgreSQL / SQLite.
	if err := model.DB.Model(&model.Token{}).
		Where("id IN ?", staleIds).
		Update("group", "").Error; err != nil {
		common.SysLog(fmt.Sprintf("[token-group-cleanup] update error userId=%d ids=%v: %s",
			userId, staleIds, err.Error()))
		return
	}

	common.SysLog(fmt.Sprintf("[token-group-cleanup] cleared %d token(s) for userId=%d (currentGroup=%s)",
		len(staleIds), userId, currentGroup))

	// Cache invalidation. Async — the brief race window where a request
	// might still hit the cached stale token mirrors the existing window
	// in cacheDeleteToken usage (see model/token.go:650).
	if common.RedisEnabled {
		gopool.Go(func() {
			for _, k := range staleKeys {
				_ = model.InvalidateTokenCache(k)
			}
		})
	}
}
