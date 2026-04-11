package model

import (
	"database/sql"
	"time"

	"github.com/QuantumNous/aggre-api/common"
)

type FinanceSummary struct {
	KPI                 FinanceKPI                `json:"kpi"`
	RevenueTrend        []RevenueTrendPoint       `json:"revenue_trend"`
	PaymentDistribution []PaymentDistributionItem `json:"payment_distribution"`
	BadOrders           []BadOrderItem            `json:"bad_orders"`
	TopUsers            []TopUserItem             `json:"top_users"`
	RedemptionSummary   []RedemptionSummaryItem   `json:"redemption_summary"`
}

type FinanceKPI struct {
	TotalRevenue           float64   `json:"total_revenue"`
	TotalRevenueTrend      []float64 `json:"total_revenue_trend"`
	OrderTotal             int64     `json:"order_total"`
	OrderSuccess           int64     `json:"order_success"`
	OrderPending           int64     `json:"order_pending"`
	OrderFailed            int64     `json:"order_failed"`
	RedemptionTotalQuota   int64     `json:"redemption_total_quota"`
	RedemptionUsedQuota    int64     `json:"redemption_used_quota"`
	RedemptionExpiredCount int64     `json:"redemption_expired_count"`
	RedemptionTotalCount   int64     `json:"redemption_total_count"`
	RedemptionUsedCount    int64     `json:"redemption_used_count"`
	ActiveSubscriptions    int64     `json:"active_subscriptions"`
	NewSubscriptions       int64     `json:"new_subscriptions_period"`
}

type RevenueTrendPoint struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
}

type PaymentDistributionItem struct {
	Method string  `json:"method"`
	Amount float64 `json:"amount"`
	Count  int64   `json:"count"`
}

type BadOrderItem struct {
	Id            int     `json:"id"`
	UserId        int     `json:"user_id"`
	Username      string  `json:"username"`
	Money         float64 `json:"money"`
	TradeNo       string  `json:"trade_no"`
	PaymentMethod string  `json:"payment_method"`
	CreateTime    int64   `json:"create_time"`
}

type TopUserItem struct {
	UserId     int     `json:"user_id"`
	Username   string  `json:"username"`
	TotalMoney float64 `json:"total_money"`
	OrderCount int64   `json:"order_count"`
}

type RedemptionSummaryItem struct {
	Status     string `json:"status"`
	Count      int64  `json:"count"`
	TotalQuota int64  `json:"total_quota"`
}

func timeRangeToSeconds(timeRange string) int64 {
	switch timeRange {
	case "7d":
		return 7 * 86400
	case "30d":
		return 30 * 86400
	case "90d":
		return 90 * 86400
	case "all":
		return 0
	default:
		return 30 * 86400
	}
}

func GetFinanceSummary(timeRange string) (*FinanceSummary, error) {
	rangeSeconds := timeRangeToSeconds(timeRange)
	now := common.GetTimestamp()
	var startTime int64
	if rangeSeconds > 0 {
		startTime = now - rangeSeconds
	}

	summary := &FinanceSummary{}

	kpi, err := getFinanceKPI(startTime, now)
	if err != nil {
		return nil, err
	}
	summary.KPI = *kpi

	trend, err := getRevenueTrend(startTime)
	if err != nil {
		return nil, err
	}
	summary.RevenueTrend = trend

	dist, err := getPaymentDistribution(startTime)
	if err != nil {
		return nil, err
	}
	summary.PaymentDistribution = dist

	bad, err := getBadOrders(now)
	if err != nil {
		return nil, err
	}
	summary.BadOrders = bad

	topUsers, err := getTopUsers(startTime)
	if err != nil {
		return nil, err
	}
	summary.TopUsers = topUsers

	redemption, err := getRedemptionSummary()
	if err != nil {
		return nil, err
	}
	summary.RedemptionSummary = redemption

	return summary, nil
}

func getFinanceKPI(startTime, now int64) (*FinanceKPI, error) {
	kpi := &FinanceKPI{}

	topupQuery := DB.Model(&TopUp{}).Where("status = ?", common.TopUpStatusSuccess)
	if startTime > 0 {
		topupQuery = topupQuery.Where("complete_time >= ?", startTime)
	}
	if err := topupQuery.Select("COALESCE(SUM(money), 0)").Scan(&kpi.TotalRevenue).Error; err != nil {
		return nil, err
	}

	orderBase := DB.Model(&TopUp{})
	if startTime > 0 {
		orderBase = orderBase.Where("create_time >= ?", startTime)
	}
	if err := orderBase.Count(&kpi.OrderTotal).Error; err != nil {
		return nil, err
	}

	successQuery := DB.Model(&TopUp{}).Where("status = ?", common.TopUpStatusSuccess)
	if startTime > 0 {
		successQuery = successQuery.Where("create_time >= ?", startTime)
	}
	if err := successQuery.Count(&kpi.OrderSuccess).Error; err != nil {
		return nil, err
	}

	pendingQuery := DB.Model(&TopUp{}).Where("status = ?", common.TopUpStatusPending)
	if startTime > 0 {
		pendingQuery = pendingQuery.Where("create_time >= ?", startTime)
	}
	if err := pendingQuery.Count(&kpi.OrderPending).Error; err != nil {
		return nil, err
	}

	kpi.OrderFailed = kpi.OrderTotal - kpi.OrderSuccess - kpi.OrderPending

	if err := DB.Model(&Redemption{}).Count(&kpi.RedemptionTotalCount).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&Redemption{}).Where("status = ?", common.RedemptionCodeStatusUsed).Count(&kpi.RedemptionUsedCount).Error; err != nil {
		return nil, err
	}

	var totalQuota, usedQuota sql.NullInt64
	if err := DB.Model(&Redemption{}).Select("COALESCE(SUM(quota), 0)").Scan(&totalQuota).Error; err != nil {
		return nil, err
	}
	kpi.RedemptionTotalQuota = totalQuota.Int64
	if err := DB.Model(&Redemption{}).Where("status = ?", common.RedemptionCodeStatusUsed).Select("COALESCE(SUM(quota), 0)").Scan(&usedQuota).Error; err != nil {
		return nil, err
	}
	kpi.RedemptionUsedQuota = usedQuota.Int64

	if err := DB.Model(&Redemption{}).
		Where("status = ? AND expired_time != 0 AND expired_time < ?", common.RedemptionCodeStatusEnabled, now).
		Count(&kpi.RedemptionExpiredCount).Error; err != nil {
		return nil, err
	}

	if err := DB.Model(&UserSubscription{}).Where("status = ? AND end_time > ?", "active", now).Count(&kpi.ActiveSubscriptions).Error; err != nil {
		return nil, err
	}

	subQuery := DB.Model(&UserSubscription{})
	if startTime > 0 {
		subQuery = subQuery.Where("start_time >= ?", startTime)
	}
	if err := subQuery.Count(&kpi.NewSubscriptions).Error; err != nil {
		return nil, err
	}

	kpi.TotalRevenueTrend = getRevenueTrendSparkline(startTime)

	return kpi, nil
}

func getRevenueTrendSparkline(startTime int64) []float64 {
	now := common.GetTimestamp()
	if startTime <= 0 {
		startTime = now - 30*86400
	}
	bucketSize := (now - startTime) / 7
	if bucketSize < 3600 {
		bucketSize = 3600
	}
	trend := make([]float64, 7)
	for i := 0; i < 7; i++ {
		bStart := startTime + int64(i)*bucketSize
		bEnd := bStart + bucketSize
		var revenue float64
		DB.Model(&TopUp{}).
			Where("status = ? AND complete_time >= ? AND complete_time < ?", common.TopUpStatusSuccess, bStart, bEnd).
			Select("COALESCE(SUM(money), 0)").Scan(&revenue)
		trend[i] = revenue
	}
	return trend
}

func getRevenueTrend(startTime int64) ([]RevenueTrendPoint, error) {
	var results []RevenueTrendPoint

	query := DB.Model(&TopUp{}).Where("status = ?", common.TopUpStatusSuccess)
	if startTime > 0 {
		query = query.Where("complete_time >= ?", startTime)
	}

	type dayRow struct {
		DayNum  int64   `gorm:"column:day_num"`
		Revenue float64 `gorm:"column:revenue"`
	}
	var rows []dayRow
	if err := query.
		Select("(complete_time / 86400) as day_num, SUM(money) as revenue").
		Group("day_num").
		Order("day_num").
		Find(&rows).Error; err != nil {
		return nil, err
	}

	for _, r := range rows {
		t := time.Unix(r.DayNum*86400, 0).UTC()
		results = append(results, RevenueTrendPoint{
			Date:    t.Format("2006-01-02"),
			Revenue: r.Revenue,
		})
	}
	return results, nil
}

func getPaymentDistribution(startTime int64) ([]PaymentDistributionItem, error) {
	var results []PaymentDistributionItem

	query := DB.Model(&TopUp{}).Where("status = ?", common.TopUpStatusSuccess)
	if startTime > 0 {
		query = query.Where("complete_time >= ?", startTime)
	}

	type distRow struct {
		PaymentMethod string  `gorm:"column:payment_method"`
		Amount        float64 `gorm:"column:amount"`
		Count         int64   `gorm:"column:count"`
	}
	var rows []distRow
	if err := query.
		Select("payment_method, SUM(money) as amount, COUNT(*) as count").
		Group("payment_method").
		Order("amount DESC").
		Find(&rows).Error; err != nil {
		return nil, err
	}

	for _, r := range rows {
		method := r.PaymentMethod
		if method == "" {
			method = "other"
		}
		results = append(results, PaymentDistributionItem{
			Method: method,
			Amount: r.Amount,
			Count:  r.Count,
		})
	}
	return results, nil
}

func getBadOrders(now int64) ([]BadOrderItem, error) {
	cutoff := now - 86400
	var results []BadOrderItem

	type badRow struct {
		Id            int     `gorm:"column:id"`
		UserId        int     `gorm:"column:user_id"`
		Money         float64 `gorm:"column:money"`
		TradeNo       string  `gorm:"column:trade_no"`
		PaymentMethod string  `gorm:"column:payment_method"`
		CreateTime    int64   `gorm:"column:create_time"`
	}
	var rows []badRow
	if err := DB.Model(&TopUp{}).
		Where("status = ? AND create_time < ?", common.TopUpStatusPending, cutoff).
		Order("create_time DESC").
		Limit(50).
		Find(&rows).Error; err != nil {
		return nil, err
	}

	userIds := make([]int, 0, len(rows))
	for _, r := range rows {
		userIds = append(userIds, r.UserId)
	}
	usernameMap := getFinanceUsernameMap(userIds)

	for _, r := range rows {
		results = append(results, BadOrderItem{
			Id:            r.Id,
			UserId:        r.UserId,
			Username:      usernameMap[r.UserId],
			Money:         r.Money,
			TradeNo:       r.TradeNo,
			PaymentMethod: r.PaymentMethod,
			CreateTime:    r.CreateTime,
		})
	}
	return results, nil
}

func getTopUsers(startTime int64) ([]TopUserItem, error) {
	var results []TopUserItem

	query := DB.Model(&TopUp{}).Where("status = ?", common.TopUpStatusSuccess)
	if startTime > 0 {
		query = query.Where("complete_time >= ?", startTime)
	}

	type userRow struct {
		UserId     int     `gorm:"column:user_id"`
		TotalMoney float64 `gorm:"column:total_money"`
		OrderCount int64   `gorm:"column:order_count"`
	}
	var rows []userRow
	if err := query.
		Select("user_id, SUM(money) as total_money, COUNT(*) as order_count").
		Group("user_id").
		Order("total_money DESC").
		Limit(20).
		Find(&rows).Error; err != nil {
		return nil, err
	}

	userIds := make([]int, 0, len(rows))
	for _, r := range rows {
		userIds = append(userIds, r.UserId)
	}
	usernameMap := getFinanceUsernameMap(userIds)

	for _, r := range rows {
		results = append(results, TopUserItem{
			UserId:     r.UserId,
			Username:   usernameMap[r.UserId],
			TotalMoney: r.TotalMoney,
			OrderCount: r.OrderCount,
		})
	}
	return results, nil
}

func getRedemptionSummary() ([]RedemptionSummaryItem, error) {
	now := common.GetTimestamp()
	var results []RedemptionSummaryItem

	var usedCount int64
	var usedQuota sql.NullInt64
	DB.Model(&Redemption{}).Where("status = ?", common.RedemptionCodeStatusUsed).Count(&usedCount)
	DB.Model(&Redemption{}).Where("status = ?", common.RedemptionCodeStatusUsed).Select("COALESCE(SUM(quota), 0)").Scan(&usedQuota)
	results = append(results, RedemptionSummaryItem{Status: "used", Count: usedCount, TotalQuota: usedQuota.Int64})

	var enabledCount int64
	var enabledQuota sql.NullInt64
	DB.Model(&Redemption{}).Where("status = ? AND (expired_time = 0 OR expired_time >= ?)", common.RedemptionCodeStatusEnabled, now).Count(&enabledCount)
	DB.Model(&Redemption{}).Where("status = ? AND (expired_time = 0 OR expired_time >= ?)", common.RedemptionCodeStatusEnabled, now).Select("COALESCE(SUM(quota), 0)").Scan(&enabledQuota)
	results = append(results, RedemptionSummaryItem{Status: "enabled", Count: enabledCount, TotalQuota: enabledQuota.Int64})

	var expiredCount int64
	var expiredQuota sql.NullInt64
	DB.Model(&Redemption{}).Where("status = ? AND expired_time != 0 AND expired_time < ?", common.RedemptionCodeStatusEnabled, now).Count(&expiredCount)
	DB.Model(&Redemption{}).Where("status = ? AND expired_time != 0 AND expired_time < ?", common.RedemptionCodeStatusEnabled, now).Select("COALESCE(SUM(quota), 0)").Scan(&expiredQuota)
	results = append(results, RedemptionSummaryItem{Status: "expired", Count: expiredCount, TotalQuota: expiredQuota.Int64})

	var disabledCount int64
	var disabledQuota sql.NullInt64
	DB.Model(&Redemption{}).Where("status = ?", common.RedemptionCodeStatusDisabled).Count(&disabledCount)
	DB.Model(&Redemption{}).Where("status = ?", common.RedemptionCodeStatusDisabled).Select("COALESCE(SUM(quota), 0)").Scan(&disabledQuota)
	results = append(results, RedemptionSummaryItem{Status: "disabled", Count: disabledCount, TotalQuota: disabledQuota.Int64})

	return results, nil
}

func getFinanceUsernameMap(userIds []int) map[int]string {
	result := make(map[int]string)
	if len(userIds) == 0 {
		return result
	}
	type userInfo struct {
		Id       int    `gorm:"column:id"`
		Username string `gorm:"column:username"`
	}
	var users []userInfo
	DB.Model(&User{}).Where("id IN ?", userIds).Select("id, username").Find(&users)
	for _, u := range users {
		result[u.Id] = u.Username
	}
	return result
}
