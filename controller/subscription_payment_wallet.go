/*
Copyright (C) 2025 QuantumNous

Wallet-funded subscription purchase. Lets a user pay for a subscription plan
with their wallet quota balance instead of going through an external payment
gateway (Stripe / Creem / Epay / NowPayments / DodoPayments).

Flow:
  1. Validate WalletPayEnabled toggle + plan + purchase scope (personal only).
  2. Compute quotaCost = plan.PriceAmount (USD) * common.QuotaPerUnit.
  3. In a single DB transaction:
       - Insert SubscriptionOrder (status=pending, method=wallet).
       - Conditionally UPDATE users SET quota = quota - cost
         WHERE id = ? AND quota >= cost  (atomic optimistic deduction).
       - RowsAffected == 0 -> rollback, return "余额不足".
  4. After commit, invalidate the user's Redis cache and call
     model.CompleteSubscriptionOrder (separate, idempotent transaction) to
     activate the plan. On activation failure, refund quota + expire order.
*/

package controller

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/logger"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// PaymentMethodWallet identifies subscription orders paid with wallet quota.
// Stored verbatim in subscription_orders.payment_method.
const PaymentMethodWallet = "wallet"

type SubscriptionWalletPayRequest struct {
	PlanId int `json:"plan_id"`
}

// SubscriptionRequestWalletPay handles POST /api/subscription/wallet/pay.
// Personal subscriptions only — team purchases via wallet are intentionally
// disabled in this iteration (use external gateways for team orders).
func SubscriptionRequestWalletPay(c *gin.Context) {
	if !operation_setting.GetPaymentSetting().WalletPayEnabled {
		common.ApiErrorMsg(c, "余额支付订阅未启用")
		return
	}

	var req SubscriptionWalletPayRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	plan, err := model.GetSubscriptionPlanById(req.PlanId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if !plan.Enabled {
		common.ApiErrorMsg(c, "套餐未启用")
		return
	}
	if plan.PriceAmount < 0.01 {
		common.ApiErrorMsg(c, "套餐金额过低")
		return
	}

	userId := c.GetInt("id")
	// Team purchases not supported in this phase. resolveSubscriptionPurchaseScope
	// with teamId=0 also enforces MaxPurchasePerUser for personal scope.
	if err := resolveSubscriptionPurchaseScope(userId, 0, plan); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}

	// plan.PriceAmount is USD; QuotaPerUnit is quota-per-USD ($1 = 500k quota
	// by default). No FX-rate multiplication — that's only used when handing
	// off to a fiat gateway.
	quotaCost := int(plan.PriceAmount * common.QuotaPerUnit)
	if quotaCost <= 0 {
		common.ApiErrorMsg(c, "套餐金额过低")
		return
	}

	tradeNo := fmt.Sprintf("SUBUSR%dWALLET%s%d", userId, common.GetRandomString(6), time.Now().UnixMilli())

	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	order := &model.SubscriptionOrder{
		UserId:        userId,
		TeamId:        0,
		PlanId:        plan.Id,
		Money:         plan.PriceAmount,
		TradeNo:       tradeNo,
		PaymentMethod: PaymentMethodWallet,
		CreateTime:    time.Now().Unix(),
		Status:        common.TopUpStatusPending,
	}

	insufficient := false
	err = model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return fmt.Errorf("create subscription order failed: %w", err)
		}
		result := tx.Model(&model.User{}).
			Where("id = ? AND quota >= ?", userId, quotaCost).
			UpdateColumn("quota", gorm.Expr("quota - ?", quotaCost))
		if result.Error != nil {
			return fmt.Errorf("deduct quota failed: %w", result.Error)
		}
		if result.RowsAffected == 0 {
			insufficient = true
			return errors.New("insufficient balance")
		}
		return nil
	})
	if err != nil {
		if insufficient {
			common.ApiErrorMsg(c, "余额不足，请先充值")
			return
		}
		logger.LogError(c.Request.Context(), "wallet subscription order failed: "+err.Error())
		common.ApiErrorMsg(c, "下单失败")
		return
	}

	// Tx modified the users row directly — drop the Redis user-cache entry so
	// the next read repopulates with the new quota. Best-effort: a stale
	// cache entry will be corrected by TTL or by IncreaseUserQuota below if
	// activation rolls back.
	_ = model.InvalidateUserCache(userId)

	// CompleteSubscriptionOrder runs its own transaction (FOR UPDATE on the
	// order row, idempotent). Do NOT call it inside our deduction tx — would
	// nest transactions on the same row.
	payload := fmt.Sprintf(`{"source":"wallet","quota_deducted":%d}`, quotaCost)
	if err := model.CompleteSubscriptionOrder(tradeNo, payload); err != nil {
		// Activation failed — refund deducted quota and mark the order
		// expired so it's not retried. The refund itself is best-effort;
		// log loudly on failure so an operator can reconcile.
		if refundErr := model.IncreaseUserQuota(userId, quotaCost, true); refundErr != nil {
			logger.LogError(c.Request.Context(),
				fmt.Sprintf("wallet subscription refund failed userId=%d trade=%s cost=%d err=%s",
					userId, tradeNo, quotaCost, refundErr.Error()))
		}
		_ = model.ExpireSubscriptionOrder(tradeNo)
		model.RecordLog(userId, model.LogTypeTopup,
			fmt.Sprintf("余额支付订阅失败已自动退款，套餐：%s，退款金额：%d quota，原因：%s",
				plan.Title, quotaCost, err.Error()))
		logger.LogError(c.Request.Context(),
			"complete wallet subscription order failed: "+err.Error())
		common.ApiErrorMsg(c, "订阅激活失败，已退款")
		return
	}

	remain, _ := model.GetUserQuota(userId, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"trade_no":     tradeNo,
			"plan_title":   plan.Title,
			"quota_cost":   quotaCost,
			"remain_quota": remain,
		},
	})
}
