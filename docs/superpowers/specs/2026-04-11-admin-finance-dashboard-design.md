# Admin Finance Dashboard

## Overview

A single-page financial reporting dashboard at `/console/finance`, visible only to admin/root users. Positioned in the sidebar between "Channel Management" and "Subscription Management". Combines a KPI overview with drill-down detail tables.

## Data Sources

All metrics are derived from existing database tables:

| Table | Key Fields | Usage |
|-------|-----------|-------|
| `top_ups` | money, status, payment_method, complete_time, user_id | Revenue, order status, payment distribution, user ranking |
| `redemptions` | quota, status, expired_time, used_user_id | Redemption rate, waste analysis |
| `user_subscriptions` | status, created_at | Active subscription count, growth |
| `subscription_orders` | money, status, payment_method | Subscription revenue |

## Backend API

### `GET /api/finance/summary` (Admin only)

Single endpoint returning all aggregated financial data. Query params:

- `time_range`: `7d` | `30d` | `90d` | `all` (default `30d`)

Response structure:

```json
{
  "success": true,
  "data": {
    "kpi": {
      "total_revenue": 12500.00,
      "total_revenue_trend": [100, 200, 150, ...],
      "order_total": 500,
      "order_success": 480,
      "order_pending": 15,
      "order_failed": 5,
      "redemption_total_quota": 1000000,
      "redemption_used_quota": 750000,
      "redemption_expired_quota": 100000,
      "redemption_total_count": 200,
      "redemption_used_count": 150,
      "active_subscriptions": 42,
      "new_subscriptions_period": 8
    },
    "revenue_trend": [
      {"date": "2026-04-01", "revenue": 500.00, "subscription_revenue": 200.00}
    ],
    "payment_distribution": [
      {"method": "stripe", "amount": 8000.00, "count": 300},
      {"method": "creem", "amount": 3000.00, "count": 150}
    ],
    "bad_orders": [
      {"id": 1, "user_id": 10, "username": "user1", "money": 50.00, "trade_no": "xxx", "payment_method": "stripe", "create_time": 1712000000}
    ],
    "top_users": [
      {"user_id": 10, "username": "user1", "total_money": 500.00, "order_count": 10}
    ],
    "redemption_summary": [
      {"status": "used", "count": 150, "total_quota": 750000},
      {"status": "enabled", "count": 30, "total_quota": 150000},
      {"status": "expired", "count": 20, "total_quota": 100000}
    ]
  }
}
```

### Backend Implementation

- New file: `controller/finance.go` — handler function `FinanceSummary`
- New file: `model/finance.go` — aggregation queries using GORM
- Route: added in `router/api-router.go` under admin auth group
- All queries must be compatible with SQLite, MySQL, and PostgreSQL
- Revenue trend aggregation uses `complete_time` grouped by day
- "Bad orders" = TopUp with status=pending AND create_time older than 24 hours
- Top users query joins TopUp with User table for username

## Frontend

### Route & Navigation

- Route: `/console/finance` (lazy loaded, AdminRoute)
- Sidebar: admin section, between `channel` and `subscription` items
- Icon: `DollarSign` from lucide-react
- Label: "Financial Reports" / "财务报表"

### Page Layout (Editorial style, matching existing dashboard)

**Row 1: KPI Cards (4 columns)**

| Card | Primary Value | Secondary |
|------|--------------|-----------|
| Total Revenue | `$12,500.00` | Mini trend sparkline (7 points) |
| Order Success Rate | `96.0%` | `480 success / 15 pending / 5 failed` |
| Redemption Rate | `75.0%` | `750K used / 1M total quota` |
| Active Subscriptions | `42` | `+8 this period` |

**Row 2: Charts (2 columns, 6:6 grid)**

- Left: Revenue trend area chart (VChart, day/week/month toggle via time_range param)
- Right: Payment method pie chart (VChart)

**Row 3: Detail Tables (Tab switching)**

- Tab 1 "Bad Orders": pending orders >24h, columns: ID, User, Amount, Trade No, Payment Method, Created Time, Action (manual complete button)
- Tab 2 "Top Users": top 20 by total spend, columns: Rank, User, Total Spent, Order Count
- Tab 3 "Redemption Analysis": grouped by status, columns: Status, Count, Total Quota, Percentage

### Files

- `web/src/pages/Finance/index.jsx` — main page component
- `web/src/hooks/dashboard/useFinanceData.js` — data fetching hook
- Reuses existing: VChart, Editorial card styling from dashboard, renderQuota/renderNumber helpers

### i18n Keys

New keys added to both zh (as keys) and en.json:
- 财务报表, 总收入, 订单成功率, 兑换码核销率, 活跃订阅数
- 收入趋势, 支付方式分布, 坏单列表, 充值排行, 兑换码损耗
- 手动补单, 本期新增, 已核销, 未使用, 已过期

## Constraints

- Admin-only access enforced both frontend (AdminRoute) and backend (AdminAuth middleware)
- All DB queries must work on SQLite, MySQL, and PostgreSQL
- No new database tables or migrations needed
- Reuse existing UI patterns (Editorial cards, VChart, Semi UI Table)
