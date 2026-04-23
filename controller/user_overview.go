package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/i18n"
	"github.com/runcoor/aggre-api/model"

	"github.com/gin-gonic/gin"
)

// userOverviewResponse is the aggregated payload returned by GetUserOverview.
type userOverviewResponse struct {
	User                 *model.User              `json:"user"`
	Finance              userOverviewFinance      `json:"finance"`
	SubscriptionsSummary userOverviewSubscription `json:"subscriptions_summary"`
	Security             userOverviewSecurity     `json:"security"`
}

type userOverviewFinance struct {
	WalletQuota     int   `json:"wallet_quota"`
	UsedQuota       int   `json:"used_quota"`
	RequestCount    int   `json:"request_count"`
	TopupTotalCents int64 `json:"topup_total_cents"`
}

type userOverviewSubscription struct {
	ActiveCount         int   `json:"active_count"`
	TotalRemainingQuota int64 `json:"total_remaining_quota"`
	EarliestExpiry      int64 `json:"earliest_expiry"`
}

type userOverviewSecurity struct {
	TwoFactorEnabled   bool `json:"two_factor_enabled"`
	PasskeyEnabled     bool `json:"passkey_enabled"`
	OAuthBindingsCount int  `json:"oauth_bindings_count"`
}

// GetUserOverview returns identity, finance, subscription summary, and
// security badges for a single user. Permission semantics mirror GetUser:
// admins cannot view users with a higher-or-equal role unless they are root.
func GetUserOverview(c *gin.Context) {
	targetUserId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}

	user, err := model.GetUserById(targetUserId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	myRole := c.GetInt("role")
	if myRole <= user.Role && myRole != common.RoleRootUser {
		common.ApiErrorI18n(c, i18n.MsgUserNoPermissionSameLevel)
		return
	}

	// GetUserById already omits password from the SELECT list, so user.Password
	// is the zero value. Also strip the access_token to satisfy the contract.
	user.Password = ""
	user.AccessToken = nil

	// --- Finance -----------------------------------------------------------
	finance := userOverviewFinance{
		WalletQuota:  user.Quota,
		UsedQuota:    user.UsedQuota,
		RequestCount: user.RequestCount,
	}

	// Sum successful topups for this user, expressed in cents.
	// TopUp.Money is a USD float, so multiply by 100 and round to int cents.
	// Aggregating via SUM keeps the work in the DB (compatible with all 3 DBs).
	var topupMoneySum float64
	if err := model.DB.Model(&model.TopUp{}).
		Where("user_id = ? AND status = ?", targetUserId, common.TopUpStatusSuccess).
		Select("COALESCE(SUM(money), 0)").
		Row().Scan(&topupMoneySum); err != nil {
		common.SysLog("GetUserOverview: failed to aggregate topups: " + err.Error())
	}
	// Round to nearest cent to avoid float drift.
	if topupMoneySum < 0 {
		topupMoneySum = 0
	}
	finance.TopupTotalCents = int64(topupMoneySum*100 + 0.5)

	// --- Subscriptions summary --------------------------------------------
	subSummary := userOverviewSubscription{}
	var subs []model.UserSubscription
	if err := model.DB.
		Where("user_id = ? AND status = ?", targetUserId, "active").
		Find(&subs).Error; err != nil {
		common.SysLog("GetUserOverview: failed to load subscriptions: " + err.Error())
	}
	now := time.Now().Unix()
	for _, s := range subs {
		// Skip rows whose end_time has already passed but were not yet
		// reaped by the background expirer.
		if s.EndTime > 0 && s.EndTime < now {
			continue
		}
		subSummary.ActiveCount++
		if remain := s.AmountTotal - s.AmountUsed; remain > 0 {
			subSummary.TotalRemainingQuota += remain
		}
		if s.EndTime > 0 && (subSummary.EarliestExpiry == 0 || s.EndTime < subSummary.EarliestExpiry) {
			subSummary.EarliestExpiry = s.EndTime
		}
	}

	// --- Security badges ---------------------------------------------------
	sec := userOverviewSecurity{}
	sec.TwoFactorEnabled = model.IsTwoFAEnabled(targetUserId)

	if _, err := model.GetPasskeyByUserID(targetUserId); err == nil {
		sec.PasskeyEnabled = true
	}

	var bindingCount int64
	if err := model.DB.Model(&model.UserOAuthBinding{}).
		Where("user_id = ?", targetUserId).
		Count(&bindingCount).Error; err != nil {
		common.SysLog("GetUserOverview: failed to count oauth bindings: " + err.Error())
	}
	sec.OAuthBindingsCount = int(bindingCount)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": userOverviewResponse{
			User:                 user,
			Finance:              finance,
			SubscriptionsSummary: subSummary,
			Security:             sec,
		},
	})
}
