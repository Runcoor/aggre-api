package model

// TokenGroupCleanupHook is a process-wide hook fired whenever a user's
// effective group has changed (subscription created, expired, cancelled,
// or admin-bound). The implementation lives in the service layer
// (service.ClearStaleTokenGroupsForUser) and clears any of the user's
// tokens whose group is no longer reachable under the new user.group,
// so existing keys keep working after a tier transition instead of
// 403'ing on "无权访问 X 分组".
//
// The hook is wired by service.init() at startup. It's a function
// pointer (rather than a direct call from model into service) to break
// the import cycle: model is imported by service, not vice versa.
//
// nil-safe: callers MUST check `if TokenGroupCleanupHook != nil` before
// invoking, since model can be loaded standalone in tests where service
// hasn't initialized.
var TokenGroupCleanupHook func(userId int)

// fireTokenGroupCleanup invokes the cleanup hook for userId if registered.
// Centralized helper so callers don't repeat the nil check.
func fireTokenGroupCleanup(userId int) {
	if TokenGroupCleanupHook == nil || userId <= 0 {
		return
	}
	TokenGroupCleanupHook(userId)
}
