# 管理员团队管理后台设计

**日期**: 2026-05-08
**状态**: Draft, awaiting user review
**作者**: Claude Opus 4.7 + runcoor

## 1. 背景

当前管理员对团队的实际操作面只有 `/admin/team-applications` 的"审批新建申请"。改名/删团队/管成员/启停/查用量等所有操作,管理员必须先成为团队 owner 才能做,违反"全局管理员"语义。

`Team.Status` 字段长期存在但**没有任何代码读它**,事实上没有"封禁团队"能力。

需要一个完整的 admin 后台,对**任意团队**有 owner 级别的写权限 + 全局列表/统计的读权限。

## 2. 范围(已与用户对齐)

| 决策点 | 结论 |
|---|---|
| 范围 | 全权限一次到位(不留 P1) |
| 禁用语义 | 硬阻断 — relay 鉴权时检查 Team.Status,Disabled → 401 |
| 删除策略 | 软删一套(team + member + team-token),订阅留底标 terminated_by_admin |
| 角色管理 | member ↔ admin ↔ owner 任意调,转让 owner 事务化 |
| 订阅干预 | 只读 + 终止(不代购买/续费/退款) |
| 用量粒度 | 总计 + 成员拆 + token 拆 + 30 天趋势 |
| 菜单 | 「团队管理」下 3 tabs:我的团队 / 全局团队 / 审批申请 |

## 3. 后端设计

### 3.1 路由组 `/api/admin/teams`(AdminAuth 中间件)

```
GET    /api/admin/teams                       全局团队列表
GET    /api/admin/teams/:id                   团队详情
PUT    /api/admin/teams/:id                   改名 / 改 status (启用/禁用)
DELETE /api/admin/teams/:id                   软删团队(级联)
POST   /api/admin/teams/:id/transfer-owner    事务化转让 owner

GET    /api/admin/teams/:id/members           成员列表
POST   /api/admin/teams/:id/members           管理员代加成员
PUT    /api/admin/teams/:id/members/:user_id  改角色
DELETE /api/admin/teams/:id/members/:user_id  移除成员

GET    /api/admin/teams/:id/tokens            team-bound token 列表
DELETE /api/admin/teams/:id/tokens/:token_id  删除 token

GET    /api/admin/teams/:id/subscriptions     订阅(活跃+历史)
POST   /api/admin/teams/:id/subscriptions/:sub_id/terminate  终止订阅

GET    /api/admin/teams/:id/usage             用量(汇总+成员拆+token拆+30天趋势)
```

### 3.2 列表查询参数

```
GET /api/admin/teams
  ?page=1&page_size=20
  &keyword=foo            # 模糊匹配团队名 OR owner email/username
  &status=1|2|all         # 1=Active, 2=Disabled, all=全部
  &include_deleted=false  # 是否包含软删
  &order=created_at|name|member_count
  &order_dir=asc|desc
```

返回每行包含:
- 团队基本字段(id, name, owner_id, status, invite_code, created_at)
- `owner` (用户基本信息: id/username/display_name/email)
- `member_count`
- `active_subscription_count`
- `today_quota`(今日消费,从 logs 表实时算 or 缓存)

### 3.3 详情接口

`GET /api/admin/teams/:id` 返回:
```json
{
  "team": {...},
  "owner": {...},
  "member_count": 5,
  "active_subscriptions": [...],
  "today_quota": "$0.12",
  "month_quota": "$3.45"
}
```

### 3.4 数据模型变更

#### 新增/调整字段

`team_subscription` 表新增(如果还没有):
- `terminated_by INT NULL` — 0=未终止, >0=admin user_id
- `terminated_at BIGINT NULL`
- `terminate_reason VARCHAR(255) NULL`

#### 新增 model 函数

```go
// model/team.go
func IsTeamDisabled(teamId int) (bool, error)            // 带 in-memory + Redis 缓存
func InvalidateTeamStatusCache(teamId int)              // 启停接口调用
func ListTeamsForAdmin(filter ListTeamsFilter) (...)
func GetTeamDetailForAdmin(teamId int, includeDeleted bool) (...)
func TransferTeamOwnership(teamId, fromUserId, toUserId int) error  // 事务
func SetTeamStatus(teamId, status int) error           // 同时调 InvalidateTeamStatusCache
func UpdateTeamMemberRole(teamId, userId, newRole int) error
func DeleteTeamCascade(teamId, adminUserId int) error  // 事务: 软删 team+members+tokens, 标终止订阅

// model/team_subscription.go
func ListTeamSubscriptions(teamId int) ([]TeamSubscription, error)
func TerminateTeamSubscription(subId, adminUserId int, reason string) error

// model/team_usage.go (新文件)
func GetTeamUsageSummary(teamId int) (UsageSummary, error)
func GetTeamUsageByMember(teamId int, days int) ([]MemberUsage, error)
func GetTeamUsageByToken(teamId int, days int) ([]TokenUsage, error)
func GetTeamUsageDaily(teamId int, days int) ([]DailyBucket, error)
```

### 3.5 关键业务规则

#### 禁用语义(影响请求路径)

`middleware/auth.go` 的 `TokenAuth`:解析 token 后,如果 `token.TeamId > 0`:
1. 查 in-memory 缓存 `team:status:{id}`,5 min TTL
2. 缓存 miss 查 Redis 同 key,2 hour TTL
3. 都 miss 查 DB
4. 如果 status == Disabled → `c.AbortWithStatusJSON(401, {error: "team_disabled"})`

启停接口写 DB 后**同步**调 `cache.Delete(team:status:{id})`(本机+Redis pub/sub 广播给其他节点),立即生效不等 TTL。

#### 删除语义(事务)

`DeleteTeamCascade(teamId, adminUserId)`:
```go
DB.Transaction(func(tx) {
  tx.Where("team_id = ?", teamId).Delete(&Token{})       // soft delete
  tx.Where("team_id = ?", teamId).Delete(&TeamMember{})  // soft delete
  tx.Model(&TeamSubscription{}).Where("team_id = ? AND status = active").Updates({
    terminated_by: adminUserId,
    terminated_at: now,
    terminate_reason: "team_deleted",
    status: terminated,
  })
  tx.Delete(&Team{}, teamId)  // soft delete
  cache.InvalidateTeamStatusCache(teamId)
})
```

#### owner 转让(事务)

`TransferTeamOwnership(teamId, fromUserId, toUserId)`:
```go
DB.Transaction(func(tx) {
  // 校验:新 owner 必须已是 active 成员
  var newMember TeamMember
  tx.Where("team_id=? AND user_id=? AND status=active", teamId, toUserId).First(&newMember)
  if not found { return ErrMustAddMemberFirst }

  tx.Model(&Team{}).Where("id=?", teamId).Update("owner_id", toUserId)
  tx.Model(&TeamMember{}).Where("team_id=? AND user_id=?", teamId, fromUserId).Update("role", TeamRoleAdmin)
  tx.Model(&TeamMember{}).Where("team_id=? AND user_id=?", teamId, toUserId).Update("role", TeamRoleOwner)
})
```

#### 跨库用量统计

不用 MySQL `DATE()` / PG `to_char`,日期分桶改成应用层 INT 运算:
```sql
SELECT (created_at / 86400) AS day_idx, SUM(quota), COUNT(*)
FROM logs
WHERE team_id = ? AND created_at >= ?
GROUP BY day_idx
```
三库通用。Go 端把 day_idx * 86400 转回日期标签。

注:logs 表当前没有 team_id 列,需要走 token → team_id 间接查或在 logs 写入时填充。**先看现状**:

- 如果 logs 表有 token_id,可以 `JOIN tokens ON logs.token_id = tokens.id WHERE tokens.team_id = ?`
- 如果没有,需要给 logs 加 team_id 字段(write path 改造) — 这是较大改动,**实施时确认**

### 3.6 错误码

```
team_not_found      404
team_disabled       401  (relay 路径)
team_already_active 422
team_already_disabled 422
must_add_member_first 422  (transfer-owner 时)
cannot_remove_owner 422  (移除成员时,目标是 owner)
cannot_self_demote  422  (admin 给自己改角色)
subscription_already_terminated 422
```

## 4. 前端设计

### 4.1 菜单合并

`web/src/components/layout/SiderBar.jsx`:移除独立的「团队审批」入口。「团队管理」点开后到 tabs 容器。

### 4.2 Tabs 容器(改造 `web/src/pages/Team/index.jsx`)

```jsx
const tabs = [
  { key: 'mine', label: '我的团队', show: true },
  { key: 'admin-list', label: '全局团队', show: isAdmin },
  { key: 'applications', label: '审批申请', show: isAdmin },
];
const defaultTab = isAdmin ? 'admin-list' : 'mine';
```

URL 同步:`/team?tab=admin-list`

### 4.3 全局团队列表(`web/src/pages/Admin/Teams/index.jsx`)

- 工具栏:搜索框 + 状态 Select + "包含已删除" Switch + "新建团队"按钮
- Semi `<Table>` 列:
  - ID
  - 名称(可点击进详情)
  - Owner(头像+username,可点击跳用户详情)
  - 状态 pill(active 绿/disabled 红/deleted 灰)
  - 成员数
  - 活跃订阅
  - 今日调用
  - 创建时间
  - 操作(查看 / 启停 inline / 删除)
- 删除 Modal:要求**输入团队名匹配**才能确认按钮 enable
- 启停 inline `<Switch>`,confirm popover 后调用

### 4.4 全局团队详情(`web/src/pages/Admin/Teams/Detail.jsx`)

头部:
- 团队信息卡(名+ID+Owner+创建时间+invite code)
- 状态 pill
- 操作按钮:改名 / 启停 / 重置邀请码 / 转让 owner / 删除

四个 tabs:
1. **成员** — 表格(用户/角色下拉/加入时间/操作-移除),"添加成员"按钮(用户搜索弹窗)
2. **Token** — team-bound token 列表(name/key 末四位/创建时间/最后使用),删除按钮
3. **订阅** — 活跃订阅卡片(plan/到期时间/终止按钮) + 历史订阅表格(含 terminated_by 标签)
4. **用量** — 汇总卡(总调用/总消费/今日/本月) + 成员表 + token 表 + 30 天 area chart(已有 ECharts)

### 4.5 i18n

zh-CN + en 两份。新增 ~30 个 key(管理员后台标签、状态文案、错误提示、确认 Modal 文案等)。

## 5. 风险与权衡

1. **logs 表无 team_id**(待实施时确认):若是,用 JOIN tokens 兜底,不强制改 write path。
2. **缓存一致性**:启停后立即 cache delete + Redis 广播,跨节点最长 100ms 内一致。压力测试不在本期范围。
3. **退款不做**:终止订阅 / 删团队均**不触发退款**,仅 termination 标记,财务介入人工。设计 doc 明确,UI 提示文案需标注。
4. **历史 Team.Status 数据**:之前没人读这个字段,现有 DB 里的值可能是 0(default)/1(模型 default 1)。迁移需要 `UPDATE team SET status = 1 WHERE status = 0`(只对没设的兜底)。
5. **转让 owner 旧 owner 默认降 admin 而非 member**:保持双管理员,避免误操作锁死。
6. **菜单合并的链接迁移**:之前 `/admin/team-applications` 的旧链接 redirect 到 `/team?tab=applications`。

## 6. 实施顺序(预期 6 个 commit)

1. **后端 P0**: list / detail / update(改名/启停) / delete + relay 中间件读 Team.Status + tests
2. **后端 P1**: 成员管理(get/add/update-role/remove) + transfer-owner 事务 + tests
3. **后端 P2**: tokens(list/delete) + subscriptions(list/terminate) + usage stats + tests
4. **前端 P0**: 「团队管理」tabs 改造 + 菜单去重
5. **前端 P1**: 全局团队列表(`Admin/Teams/index.jsx`)
6. **前端 P2**: 全局团队详情(4 tabs) + i18n(zh-CN + en)

每个 commit 都要 `go build ./... && go vet ./...` 通过 + GH Actions Docker build 不破。

## 7. 待确认事项(实施时回看)

- [ ] logs 表是否已有 team_id 字段?如无,JOIN tokens 兜底是否性能可接受?
- [ ] team_subscription 表 terminated_by/at/reason 字段是否已存在?
- [ ] 前端 Recharts/ECharts 选哪个画 30 天面积图(看现有 dashboard 用了哪个)
- [ ] 「转让 owner」UI 是否要求二次密码 / 短信验证?(本设计假设 admin 已经登录就够)
