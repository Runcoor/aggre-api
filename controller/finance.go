package controller

import (
	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/gin-gonic/gin"
)

func FinanceSummary(c *gin.Context) {
	timeRange := c.DefaultQuery("time_range", "30d")

	switch timeRange {
	case "7d", "30d", "90d", "all":
	default:
		timeRange = "30d"
	}

	summary, err := model.GetFinanceSummary(timeRange)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, summary)
}
