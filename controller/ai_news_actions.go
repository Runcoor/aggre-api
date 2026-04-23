package controller

import (
	"context"
	"strconv"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/service/ai_news"

	"github.com/gin-gonic/gin"
)

// TriggerAINewsRun fires the agent in a background goroutine and returns 202.
// Admins use this to "regenerate now" without waiting for the cron.
func TriggerAINewsRun(c *gin.Context) {
	adminId := c.GetInt("id")
	ai_news.RunAgentManually(adminId)
	common.ApiSuccess(c, gin.H{"message": "agent triggered (running in background)"})
}

// SendAINewsBriefing dispatches a briefing by email to all eligible subscribers.
// Synchronous so the admin gets immediate feedback on count.
func SendAINewsBriefing(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "invalid id")
		return
	}
	br, err := model.GetAINewsBriefing(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if br.Status != model.AINewsBriefingStatusApproved &&
		br.Status != model.AINewsBriefingStatusDraft {
		common.ApiErrorMsg(c, "briefing must be in draft or approved status to send")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()
	sent, failed, err := ai_news.SendBriefingToUsers(ctx, id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"sent":   sent,
		"failed": failed,
	})
}
