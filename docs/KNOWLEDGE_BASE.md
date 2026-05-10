# AggreToken 客户知识库

> 适用范围:本文件用于喂入 PandaWiki 智能客服。每个 `###` 三级标题为一个独立 Q&A,可作为 chunk 单独召回。
> 涵盖人群:C 端订阅用户、B 端开发者、团队管理员、推广分销用户。
> 信息来源:站点源代码 + 法律条款 + 站内文案。最后更新:2026-05-10。

---

## 1. 关于 AggreToken

### Q: AggreToken 是什么?
AggreToken 是一个 AI API 聚合平台,把全球 40+ 个主流 AI 厂商(OpenAI、Anthropic Claude、Google Gemini、DeepSeek、Grok、通义千问、Moonshot 等)的接口聚合到**一个统一端点、一把 API Key** 之下。开发者无需为每家厂商分别注册账户、维护多套 SDK,即可调用 100+ 模型。

### Q: AggreToken 的核心定位是什么?
"优质 API 管理平台。官方一手,为开发者提供稳定、极速、满血版的 API 体验。"

### Q: AggreToken 有什么核心优势?
四大特性:
1. **卓越稳定性** — 企业级 SLA,99.9% 全年在线,多重负载均衡 + 实时熔断
2. **极速响应** — 全球边缘节点并发,毫秒级延迟
3. **满血版体验** — 提供最完整、无限制的 API 功能,释放模型全部潜能
4. **7×24 售后保障** — 顶级技术团队实时待命,接入调试 / 高并发优化全程支持

### Q: AggreToken 的服务承诺有哪些?
余额随时可用、99.9% 可用率、不存储请求数据、按量计费无绑定、7×24 技术支持。

### Q: AggreToken 是开源项目吗?基于什么开源?
是的,基于知名开源项目 **new-api**(由 **QuantumNous** 开源,AGPL-3.0 许可),上游仓库:`https://github.com/QuantumNous/new-api`。本平台源码:`https://github.com/Runcoor/aggre-api`。

### Q: AggreToken 的使命和愿景是什么?
"我们相信 AI 不应被供应商锁定或碎片化的 API 所限制,而应是一个开放、统一、可靠的基础设施。我们致力于消除接入壁垒,让每一位开发者都能用一个端点、一把钥匙驾驭全球领先 AI 模型的全部能力。"

### Q: AggreToken 适合什么人使用?
个人开发者、AI 应用创业者、企业研发团队、需要批量调用 AI 接口的内容/数据公司、用 Claude Code/Cursor/Cline 等 AI 编程工具的程序员。

### Q: 如何联系 AggreToken?

**实时客服渠道**(推荐,响应最快):

| 渠道 | 链接 / 群号 | 适用 |
|---|---|---|
| 📱 Telegram 客服群 | https://t.me/+MvU1Qg3GMSBkMzhl | 海外/全球用户,即时响应 |
| 🐧 QQ 售后群 | **1092290670** | 国内用户,即时响应 |

**邮箱(正式书面渠道)**:

| 用途 | 邮箱 |
|---|---|
| 客户支持 / 技术问题 / 隐私 / 安全报告 | support@aggretoken.com |
| 商务合作 / 企业方案 / 定制 SLA / 批量折扣 | hello@aggretoken.com |
| 账单 / 支付 / 发票 | billing@aggretoken.com |

**遇到问题优先去 TG / QQ 群**,客服会实时响应;退款、对账、发票等需要留痕的事项请走对应邮箱以便留底。

### Q: 客服 TG 群链接?
**Telegram 客服群**:https://t.me/+MvU1Qg3GMSBkMzhl

加入后可在群内向客服提问,工作时间内通常几分钟内响应,适合所有海外/全球用户、海外支付问题、API 紧急故障求助。

### Q: 客服 QQ 群号?
**QQ 售后群**:**1092290670**

国内用户首选渠道,适合中文交流、国内支付问题(支付宝/微信)、人民币账单、国内网络环境调试。加入群后 @管理员 提问即可。

### Q: 客服群和邮箱有什么区别?该用哪个?

| 场景 | 推荐渠道 |
|---|---|
| 充值不到账 / 即时故障 | TG 群 / QQ 群(快) |
| API 调用报错求助 | TG 群 / QQ 群 |
| 模型 / SDK 接入咨询 | TG 群 / QQ 群 |
| 退款申请(需留底) | billing@aggretoken.com + 群里通知客服 |
| 发票申请 | billing@aggretoken.com |
| 商务合作 / 企业定制 | hello@aggretoken.com |
| 隐私权利 / 数据删除 | support@aggretoken.com(法律书面流程) |
| 安全漏洞上报 | support@aggretoken.com |

**简单说:急事进群,留底走邮箱。**

---

## 2. 注册与登录

### Q: 怎么注册 AggreToken?
访问 `aggretoken.com/register`,填写用户名(≤ 20 字符)、密码(8-20 位)、邮箱,可能需要邮箱验证码、Cloudflare 人机校验、勾选《用户协议》和《隐私政策》后提交即可。

### Q: 注册需要邀请码吗?
不强制,但若朋友给了你 `?aff=xxxx` 推广链接,通过该链接进入注册页可自动绑定邀请关系,被邀请人和邀请人都可能获得平台奖励额度(具体金额由管理员配置,首次成功充值后发放)。

### Q: 用户名和密码有什么要求?
用户名最长 **20 个字符**,密码长度 **8-20 位**,注册时两次密码必须一致。

### Q: 注册时一定要邮箱验证吗?
取决于平台是否启用了邮箱验证开关。开启时需输入收到的 6 位验证码,**验证码 10 分钟内有效**,每次发送后需等待 30 秒方可重新发送。

### Q: 支持哪些第三方登录方式?
内置支持:**GitHub、Discord、OIDC、LinuxDO、微信(公众号扫码)、Telegram Bot**。另外管理员可配置任意自定义 OAuth(通用 OAuth Provider)。**注意:目前没有内置 Google OAuth**,如需 Google 登录,可走 OIDC 或自定义 OAuth 接入。

### Q: 支持 Passkey(无密码登录)吗?
支持。系统集成 WebAuthn/Passkey 标准,管理员开启后用户可在个人设置中绑定 Passkey,后续登录无需输入密码,直接通过指纹/Face ID/系统密钥完成认证。

### Q: 支持二步验证(2FA)吗?
支持 **TOTP**(Google Authenticator / 1Password / 微软 Authenticator 等)和 **Passkey/WebAuthn**。开启后登录密码通过后会要求补输 TOTP 验证码或备用恢复码。

### Q: 注册时邮箱有限制吗?
默认情况下系统会校验邮箱格式;若管理员启用了**邮箱域名白名单**,只允许 gmail / 163 / 126 / qq / outlook / hotmail / icloud / yahoo / foxmail 等主流邮箱注册,其它域名需联系管理员开通。

### Q: 邮箱地址带 "+" 或 "." 能注册吗?
若管理员启用了**邮箱别名限制**,带 `+` 号或 `.` 的本地部分(如 `me+test@gmail.com`)将被拒绝。这是为了防止同一邮箱被反复用作"羊毛账户"。

### Q: 登录失败了怎么办?
检查:① 用户名/邮箱拼写;② 密码大小写;③ 是否被管理员禁用;④ 是否需要先输入 2FA 验证码;⑤ 是否触发了人机校验。所有登录尝试(成功/失败)都会记录到登录日志,管理员可查阅,异常多次失败可能触发限频。

### Q: 忘记密码怎么办?
登录页点击"忘记密码",输入注册邮箱,系统会发送一封 10 分钟内有效的重置链接邮件。点击链接后系统会生成 12 位随机新密码并发回邮件,登录后请立即去个人设置中改成自己的密码。

### Q: 登录后为什么提示要输入验证码?
平台启用了 **Cloudflare Turnstile** 人机校验。注册、登录、找回密码等敏感接口都可能触发,正常通过即可,无需额外操作。

### Q: 登录受到限流提示怎么办?
登录、注册、找回密码等敏感接口默认 **20 分钟内最多 20 次**。请等待解除后重试,或联系客服 support@aggretoken.com。

### Q: 平台用户角色有哪些?
游客(0)、普通用户(1)、管理员(10)、超级管理员(100)。普通用户无法访问管理后台,管理员可以管理渠道、用户、订单等。

### Q: 平台允许多账号吗?
平台不强制每人单账号,但请注意:邮箱别名(`+`、`.` 变体)在启用别名限制后无法注册多个;每个邮箱只能绑定一个账号;批量注册薅羊毛会触发反作弊。

---

## 3. 个人设置与账户安全

### Q: 在哪里修改密码?
登录后进入"个人中心 → 账户管理",点击"修改密码"。需输入原密码(若是首次绑定密码的 OAuth 账户则不需要),新密码 8-20 位。

### Q: 怎么绑定 / 解绑 GitHub、Discord 等第三方账号?
"个人中心 → 账户管理"中可见所有第三方绑定状态,未绑定的点"绑定",已绑定的点"解绑"。微信走公众号扫码绑定,Telegram 走 Bot 启动命令绑定。

### Q: 怎么修改注册邮箱?
"个人中心 → 账户管理 → 邮箱"中点修改,会发送验证码到新邮箱,验证后立即生效。

### Q: 怎么注销自己的账号?
"个人中心 → 账户管理"中找到"注销账户"。**注意:超级管理员不能自删;注销后所有令牌失效、订阅作废、余额清零,操作不可逆。** 如有未消费的订阅,建议先消费完或联系客服处理。

### Q: 登录时显示"账户已被禁用"怎么办?
账户被管理员禁用,通常因违反《服务条款》(如绕过限速、滥用、欺诈等)。请发邮件至 support@aggretoken.com 申诉。

---

## 4. 钱包充值

### Q: AggreToken 怎么计费?
按 **Token 实时用量计费**,每次 API 调用都会显示消耗的 Token 数和费用。**充值余额永不过期**,不用就一直留着;无月费、无订阅捆绑。

### Q: 1 美元能买多少额度?
**1 美元 = 500,000 quota**(平台内部额度单位)。换言之,平台默认按 "$0.002 / 1K tokens" 的颗粒计价,实际单价由模型决定,详见模型定价页。

### Q: 充值有最低金额吗?
- **首次充值**最低 **\$1**(USD)
- **非首次充值**最低 **\$10**(USD)

不同支付通道(Stripe / Waffo / Cryptomus / NowPayments / DodoPayments)还可能有各自的最低门槛。

### Q: 支持哪些支付方式?
- **Stripe** — 信用卡(Visa / MasterCard / American Express)
- **Creem** — 信用卡 / 全球支付(欧元 / 美元)
- **Waffo** — 全球聚合支付,支持卡 + 多种本地钱包(亚太地区覆盖最广)
- **DodoPayments** — 信用卡 + 国际支付,支持 220+ 国家
- **易支付** — 国内支付宝 / 微信
- **Cryptomus** — USDT / USDC / BTC / ETH 等加密货币
- **NowPayments** — 加密货币
- **兑换码(卡密)** — 适合不便在线支付的用户

### Q: 国内能用支付宝 / 微信支付吗?
可以。后台启用"易支付"通道时支持支付宝、微信扫码支付。具体可在充值页查看实时可用的支付方式。

### Q: 支持 USDT 充值吗?
支持。开启 Cryptomus 或 NowPayments 通道时,可用 USDT(TRC20/ERC20)、USDC、BTC、ETH 等加密货币充值。

### Q: 充值汇率是多少?
默认按 **1 USD = 7.3 CNY** 换算,系统每 10 分钟从 Frankfurter API 拉取实时汇率自动更新,人民币最终金额可能略有波动,以下单页显示为准。

### Q: 充值有打折吗?
平台支持档位折扣。常见预设档位:**\$10 / \$20 / \$50 / \$100 / \$200 / \$500**,管理员可为不同档位单独配置折扣(例如 \$100 档可打 9 折)。下单页会实时显示折后金额。

### Q: 充值后多久到账?
- **信用卡 / 易支付**:支付成功后通常 1-5 秒到账(webhook 回调)
- **加密货币**:需链上确认,通常 1-10 分钟
- **兑换码**:输入后立即到账
- **超过 30 分钟仍未到账**:在"账单历史"中查看订单状态;若订单状态为"已支付但未到账",请联系 billing@aggretoken.com 并提供订单号(`USR...` / `STR...` / `WAF...` / `DODO...` 等前缀)。

### Q: 怎么使用兑换码 / 卡密?
"钱包 → 充值"页可见"兑换码"输入框,粘贴 16+ 位兑换码点兑换即可。兑换码与在线充值并存,无金额限制(具体金额由生成方决定)。

### Q: 充值订单失败 / 长时间 pending 怎么办?
1. 重新发起新订单(旧订单自动过期)
2. 在"账单历史"查看订单详情,订单号格式:`USR{用户ID}NO{时间戳}` / `STR...` / `WAF...` / `DODO...`
3. 若已扣款但订单显示 pending/failed,提交订单号至 billing@aggretoken.com 处理

### Q: 不同支付通道的订单号有什么区别?

| 前缀 | 通道 |
|---|---|
| `USR...NO...` | 易支付(支付宝/微信) |
| `STR...` | Stripe |
| `WAF...` | Waffo |
| `DODO...` | DodoPayments |
| `CRE...` | Creem |
| `NP...` | NowPayments |
| `SUB...` | 订阅订单 |

### Q: 钱包余额会过期吗?
**不会**。钱包余额(`User.quota`)永不过期,直到消费完为止。

### Q: 余额可以退款吗?
按《服务条款》,**预付余额一般不可退款**(法律强制要求或与平台书面另行约定的情况除外)。如需退款,请发邮件至 billing@aggretoken.com 说明原因,平台会按个案处理。

### Q: 我的余额能转给其他用户吗?
不可以。钱包余额绑定账户,不支持转账。但**邀请佣金**(aff_quota)可以划转到自己的可用额度(quota)中,详见"推广分销"章节。

---

## 5. 订阅套餐

### Q: AggreToken 提供哪些订阅套餐?
平台支持灵活的订阅套餐体系,常见档位分为 **Starter / Pro / Ultra** 三档(具体名称、价格、含额度由后台动态配置,以页面实时展示为准)。点击 `aggretoken.com/plans` 查看当前在售套餐。

### Q: 订阅和钱包充值有什么区别?

| 维度 | 钱包充值 | 订阅套餐 |
|---|---|---|
| 计费方式 | 按量,每次扣 quota | 周期内固定额度 |
| 余额过期 | 永不过期 | 周期结束作废 |
| 是否升级会员 | 不升级 | 升级到 Pro / Ultra 等高级分组,享受更高级模型路由 |
| 自动续费 | N/A | **不自动续费**,到期需手动重买 |
| 适合人群 | 用量不固定 / 偶尔使用 | 重度用户 / 项目固定预算 |

### Q: 订阅会自动续费吗?
**不会**。所有订阅都是**一次性付费**,到期后自动转为 expired 状态,**不会自动重新扣款**。如需续订,请到期前手动重新购买。

### Q: 订阅周期有哪些?
支持 **小时 / 天 / 周 / 月 / 年 / 自定义** 多种周期。常见为月付,部分套餐提供年付优惠。

### Q: 订阅期间额度怎么算?
订阅期内按"额度池"扣费。每次 API 调用消耗 Token 后,先从订阅额度扣;**订阅额度不够时**,根据"计费偏好"决定是回退到钱包(默认)还是直接 503 拒绝。

### Q: 订阅额度会按周期重置吗?
取决于套餐配置。可选 `never / daily / weekly / monthly / custom`:
- **每日**:每日 00:00 重置
- **每周**:对齐到下周一 00:00 重置
- **每月**:对齐到次月 1 日 00:00 重置
- **不重置**(`never`):订阅周期内不重置,用完为止

### Q: 订阅可以同时持有多个吗?
可以。一个用户可同时持有多个生效订阅,扣费时按到期时间从早到晚扣(优先用快过期的),避免浪费。

### Q: 订阅怎么优先使用?是先扣订阅还是先扣钱包?
默认 **subscription_first(订阅优先,不够回钱包)**,可在个人设置 / 令牌设置中改为:
- `subscription_first`(默认)— 先订阅,不够走钱包
- `wallet_first` — 先钱包,不够走订阅
- `subscription_only` — 仅订阅,订阅不够直接拒绝
- `wallet_only` — 仅钱包,订阅不参与

### Q: 买高级套餐会升级我的会员等级吗?
会。订阅会把你的用户分组从 `default` 升级到套餐对应的 `Pro` / `Ultra` 等高级分组,享受更高级的模型路由优先级和速率限制上限。**只升不降**:已 Ultra 用户买 Pro 套餐不会被降级。

### Q: 订阅过期了怎么办?
订阅到期后状态自动变为 `expired`,系统重新计算你的用户分组(取剩余 active 订阅中等级最高的;若无,回到 default)。已用完的订阅额度不会作为余额留存。续订请重新购买。

### Q: 订阅可以取消吗?剩余额度退吗?
平台**不支持用户主动取消订阅**。订阅一经购买,到期前持续生效。已支付金额按《服务条款》一般不可退款,剩余额度也不会退还。

### Q: 订阅有"省 X%"的折扣胶囊是什么意思?
当套餐配置了"原价"和"现价"且原价 > 现价时,系统会自动计算折扣百分比并显示"省 X%"标签。例如原价 \$99 / 月、现价 \$59 / 月,显示"省 40%"。

### Q: "推荐套餐"是怎么选的?
显示规则:
- 若有 3 个以上套餐 → 取中间档(通常是 Pro)
- 少于 3 个 → 取标记为 `pro` 升级分组的套餐
- 充值入口的简版套餐卡 → 第一个套餐挂"推荐"角标

### Q: 一个用户能买多少次同一套餐?
取决于套餐的"购买上限"配置(`MaxPurchasePerUser`)。默认 `0` = 无限制;>0 时统计该用户全部历史购买(含已过期/已作废)后限制。已达上限时按钮禁用并显示当前 X/Y。

### Q: 订阅外的模型怎么调用?
默认开启"钱包兜底":若订阅升级分组没有覆盖某个长尾模型,系统会自动回退到 default 分组并强制走钱包计费,避免 503 报错。可在订阅卡上看到"钱包兜底已启用"标识。

### Q: 套餐被下架了,我已经买的还能用吗?
能。已购订单不受套餐启用状态影响,即便管理员把套餐下架(`Enabled=false`),你的订阅依然按购买时的合约执行到期。

---

## 6. 团队功能

### Q: 团队功能是做什么的?
团队功能允许多用户共享一个订阅 / 额度池,适合公司团队、研发小组、家庭账户共享 AI 服务。可统一管理成员、令牌、订阅,做配额隔离。

### Q: 怎么创建团队?
普通用户**不能直接创建**团队,需先提交团队申请,等待管理员审核通过。
- **管理员级账户**(admin / root):可在后台直接创建,无需审核
- **普通用户**:进入"团队"页 → 点"申请创建团队",填写团队名(≤ 128 字符)和申请理由(≤ 2000 字符)
- 每个用户**同时只能有一份待审核申请**

### Q: 团队申请被拒绝了能再提交吗?
可以。被拒绝后申请状态变为 rejected,你可以查看拒绝原因(管理员必填)、调整后重新提交。也可在审核期内主动撤回申请。

### Q: 团队成员有哪些角色?

| 角色 | 等级 | 主要权限 |
|---|---|---|
| **Owner**(所有者) | 100 | 全部权限:改名、删队、加/移除成员、重置邀请码、所有 Admin/Member 权限 |
| **Admin**(管理员) | 10 | 创建/删除团队令牌、查看团队用量、Member 全部权限 |
| **Member**(成员) | 1 | 查看团队信息、订阅、令牌列表;调用 API |

### Q: 怎么邀请成员加入团队?
两种方式:
1. **邀请码**:Owner 在团队详情页查看 8 位邀请码(可重置),分享给成员,成员访问 `/team/join/邀请码` 加入
2. **直接添加**:Owner 输入对方 user_id 直接加入

### Q: 成员可以同时在多个团队吗?
可以,但每个团队独立管理。一个用户在 A 团队是 Owner,在 B 团队可以是 Admin 或 Member。

### Q: 团队怎么购买订阅?和个人订阅有什么区别?
**只有团队 Owner** 可以为团队购买订阅。流程:
1. 进入团队详情 → "订阅"标签 → 选套餐 → 跳转 `/plans?team_id=N`
2. 页面顶部会显示团队购买横幅,提示"正在为团队「X」购买订阅"
3. 完成支付

**与个人订阅的关键区别**:
- 团队订阅**不会升级你的个人会员等级**(避免免费薅羊毛)
- 团队订阅额度池供所有团队令牌共享
- 计费走团队订阅,不扣买家个人钱包
- 团队订阅独立于个人订阅,作废只影响团队

### Q: 团队令牌和个人令牌有什么区别?
团队令牌(`team_id > 0`)调用 API 时,**计费走团队订阅**(若团队无订阅则可能 503),不扣个人钱包;个人令牌(`team_id = 0`)正常走个人钱包/订阅。Owner / Admin 可创建团队令牌,Member 只能使用别人创建好的。

### Q: 怎么离开团队?
Member / Admin 可在团队详情页主动退出。**Owner 无法退出**——必须先转让所有权或解散团队。

### Q: Owner 怎么转让 / 解散团队?
- **转让所有权**:目前需联系管理员后台操作(用户端暂无 UI 自助转让)
- **解散团队**:Owner 在团队设置中点"删除团队",所有成员失去权限、所有团队令牌作废、未到期订阅按情况处理

### Q: 团队订阅到期 / 被作废,成员还能调用吗?
不能。订阅作废后所有团队令牌的请求都会因配额不足被拒(若该团队订阅未配置钱包兜底)。Owner 需重新购买订阅或开通新订阅恢复。

---

## 7. API 接入(开发者)

### Q: AggreToken 的 API Base URL 是什么?

| 协议 | Base URL |
|---|---|
| OpenAI 兼容 | `https://aggretoken.com/v1` |
| Anthropic Messages | `https://aggretoken.com`(SDK 配置 base url),或 `/anthropic` 子路径 |
| Gemini 原生 | `https://aggretoken.com/v1beta` |
| Gemini OpenAI 兼容 | `https://aggretoken.com/v1beta/openai` |

### Q: 怎么获取 API Key?
1. 注册并登录 aggretoken.com
2. 进入"令牌"页 → "新建令牌"
3. 设置名称、可用模型范围、额度上限、IP 白名单等
4. 创建后**立即复制 sk-xxx 形式的 Key**(只显示一次,丢失需重置)

### Q: API 鉴权头怎么写?

| 协议 | Header |
|---|---|
| OpenAI 兼容 | `Authorization: Bearer sk-xxx` |
| Anthropic | `x-api-key: sk-xxx` |
| Gemini | `x-goog-api-key: sk-xxx` |
| Claude Code(环境变量) | `ANTHROPIC_AUTH_TOKEN=sk-xxx` + `ANTHROPIC_BASE_URL=https://aggretoken.com` |

### Q: Claude Code 怎么接入?
```bash
export ANTHROPIC_BASE_URL=https://aggretoken.com
export ANTHROPIC_AUTH_TOKEN=sk-你的key
claude
```
启动后所有 Claude Code 请求会走 AggreToken。

### Q: Cursor 怎么接入?
打开 Cursor → Settings → Models → 勾选"Override OpenAI Base URL" → 填 `https://aggretoken.com/v1` → 填 API Key,保存即可。

### Q: Cline / Continue (VSCode) 怎么接入?
"API Provider" 选 **OpenAI Compatible**,Base URL 填 `https://aggretoken.com/v1`,API Key 填 `sk-xxx`,Model ID 示例:`claude-sonnet-4.5` / `gpt-4o`。

### Q: Codex CLI / OpenCode 怎么接入?
```bash
export OPENAI_BASE_URL=https://aggretoken.com/v1
export OPENAI_API_KEY=sk-你的key
```

### Q: 兼容 OpenAI 官方 SDK 吗?
完全兼容。Python/Node/Go 任意 OpenAI SDK 改两行即可:
```python
client = OpenAI(
    base_url="https://aggretoken.com/v1",
    api_key="sk-你的key"
)
```
所有 ChatCompletion / Completion / Embedding / Image / Audio / Moderation 接口都可直接调用。

### Q: 兼容 Anthropic 官方 SDK 吗?
兼容。
```python
from anthropic import Anthropic
client = Anthropic(
    base_url="https://aggretoken.com",
    api_key="sk-你的key"
)
```

### Q: 兼容 Google GenAI SDK 吗?
兼容。base url 配 `https://aggretoken.com/v1beta`,鉴权用 `x-goog-api-key`。也可走 OpenAI 套壳路径 `/v1beta/openai`。

### Q: 国内能直接调用吗?
**可以**,无需翻墙。AggreToken 提供国内可直连的 API 端点,针对国内网络环境做了专项优化,延迟低、稳定。

### Q: 支持流式响应(SSE)吗?
全部聊天端点都支持。请求体加 `"stream": true`,响应以 `data: {...}` 行式推送,以 `data: [DONE]` 结束。

### Q: 支持 Function Calling 吗?
支持。OpenAI / Anthropic / Gemini 三家的 Function Calling / Tool Use 都兼容,包括并行 tool_calls。

### Q: 支持 Vision(图像理解)吗?
支持。OpenAI 格式用 `content: [{type:"image_url", image_url:{url:"https://..."}}]`,可传 URL 或 `data:image/png;base64,...`,`detail` 取 `auto/low/high`。

### Q: 支持结构化 JSON 输出吗?
支持。
- 简易模式:`response_format: {"type": "json_object"}`
- 严格模式:`response_format: {"type": "json_schema", "json_schema": {"name":"...", "schema": {...}, "strict": true}}`

### Q: 支持 Prompt Caching(提示缓存)吗?
全平台支持:
- **OpenAI / GPT-4o**:自动缓存(>1024 tokens),节省约 50%
- **Anthropic Claude**:显式 `cache_control: {"type":"ephemeral"}`,节省约 90%
- **Gemini Context Caching**:节省 50-75%

每次响应的 `usage` 字段含 `cached_tokens` / `cache_read_input_tokens` 等用量明细。

---

## 8. 端点 / 模型

### Q: 支持哪些 API 端点?
**OpenAI 兼容**:
- `POST /v1/chat/completions` — 聊天
- `POST /v1/completions` — 旧版补全
- `POST /v1/responses` — Responses API
- `POST /v1/embeddings` — 向量
- `POST /v1/images/generations`、`/v1/images/edits` — 图像生成/编辑
- `POST /v1/audio/transcriptions`、`/translations`、`/speech` — 语音
- `POST /v1/rerank` — 重排
- `POST /v1/moderations` — 内容审核
- `GET /v1/models` — 模型列表
- `GET /v1/realtime` — Realtime WebSocket

**Anthropic**:`POST /v1/messages`、`/anthropic/v1/messages`

**Gemini**:`POST /v1beta/models/{model}:generateContent`、`:streamGenerateContent`、`:countTokens`

**异步任务**:Sora、Kling、Doubao、Suno、Midjourney(详见"高级功能 / 视频图像")

### Q: 支持哪些 AI 厂商?
40+ 厂商,主要包括:
**国际**:OpenAI、Anthropic Claude、Google Gemini、xAI Grok、Mistral、Cohere、Perplexity、AWS Bedrock、Azure OpenAI、Vertex AI、OpenRouter
**国内**:DeepSeek、Moonshot Kimi、智谱 GLM、百度文心、阿里通义千问、腾讯混元、讯飞星火、360、零一万物、MiniMax、火山方舟豆包、SiliconFlow
**多模态/视频**:Replicate、Cloudflare Workers AI、Midjourney、Suno、Kling、Vidu、Jimeng 即梦、Sora
**国产平台**:Coze、Dify、FastGPT、Ollama、Xinference

### Q: 支持哪些知名模型?
聚合 100+ 模型,常用如:
- **OpenAI**:gpt-4o / gpt-4o-mini / o3 / dall-e-3
- **Anthropic**:claude-opus / claude-sonnet-4.5 / claude-haiku
- **Google**:gemini-2.5-pro / gemini-2.5-flash
- **DeepSeek**:deepseek-chat / deepseek-r1
- **Qwen**:qwen-max / qwen-coder / qwen-vl
- **Embeddings**:text-embedding-3-small/large、bge-m3 (中文)

### Q: 怎么查看完整可用模型清单?
调用 `GET /v1/models`(OpenAI 兼容)或 `/anthropic/v1/models` / `/v1beta/models` 拿到当前账号可用模型列表。Web 端在"模型"页可见所有支持模型及单价。

### Q: 不同套餐能用的模型有差异吗?
有。订阅套餐通常会定义 `upgrade_group`(如 Pro / Ultra),每个分组对应不同的模型权限和路由优先级。Pro / Ultra 用户可访问更高级、最新发布的模型,普通 default 用户可能仅能访问基础模型。

### Q: 我想用的模型不在列表里怎么办?
- 检查模型名拼写(平台用上游官方名)
- 联系 hello@aggretoken.com 提需求,平台支持快速接入新模型

### Q: 不同模型怎么计费?
按 Token 用量,**输入 Token × 输入单价 + 输出 Token × 输出单价 + 缓存读/写 + 图像张数 + 音频秒数**。具体单价以 `GET /v1/models` 返回的 `pricing.prompt` / `pricing.completion` 字段为准(USD per Token)。

---

## 9. 令牌(API Key)管理

### Q: 一个账号最多能创建多少个令牌?
默认每用户最多 **1000 个**。达到上限后需要先删除旧令牌才能新建。

### Q: 令牌的字段有哪些?

| 字段 | 说明 |
|---|---|
| `name` | 令牌名(≤ 50 字符,便于识别用途) |
| `expired_time` | 过期时间(`-1` = 永不过期) |
| `remain_quota` | 剩余额度 |
| `unlimited_quota` | 无限额度开关 |
| `model_limits_enabled` + `model_limits` | 限定可调用模型(逗号分隔) |
| `allow_ips` | IP 白名单(换行分隔,留空 = 不限制) |
| `group` | 走哪个上游分组(default / vip / Pro / Ultra / auto) |
| `cross_group_retry` | 仅 auto 分组时,跨分组重试开关 |

### Q: 令牌怎么设 IP 白名单?
创建/编辑令牌时,在"IP 白名单"框内每行填一个 IP(支持 `192.168.1.1` 或 CIDR `10.0.0.0/8`)。留空表示不限制。

### Q: 令牌过期了怎么续?
进入"令牌"页编辑该令牌,把 `expired_time` 改晚或设为 `-1`(永不过期),保存即可。**注意:已过期或已用完的令牌需先恢复有效期/额度才能重新启用。**

### Q: 令牌额度用完了怎么办?
两种处理:
1. 把 `unlimited_quota` 打开,使用账户钱包/订阅总额度
2. 给令牌单独加额度(`remain_quota`)

### Q: 令牌列表里 Key 是脱敏的怎么看完整 Key?
列表 API 出于安全考虑只返回 `xxxx**********xxxx` 形式。**完整 Key 仅在创建时显示一次**,请创建后立即保存。丢失后无法找回,只能删除该令牌重新创建。

### Q: 令牌泄露了怎么办?
立即在"令牌"页删除该令牌,同时检查"日志"页看是否有可疑调用,必要时联系 support@aggretoken.com 协助核查。建议泄露后所有相关凭证、AWS Key、GitHub Token 一并轮换。

### Q: 令牌的"分组(group)"是什么?
令牌的 `group` 字段决定走哪个上游路由分组:
- `default` — 默认分组,所有用户可用
- `vip` / `Pro` / `Ultra` — 付费高级分组,需对应套餐
- `auto` — 自动选最优分组
- 其它自定义分组(管理员配置)

不同分组路由的上游渠道、优先级、速率限制不同。

### Q: 注册时送的"初始令牌"是什么?
若管理员开启 `GenerateDefaultToken`,新用户注册成功后会自动获得一枚名为「{用户名}的初始令牌」的令牌,**永不过期、无限额度**(消费走账户钱包/订阅)。可在"令牌"页查看和使用。

### Q: 我想用模型 Fallback 怎么配?
方法 1:令牌设为 `auto` 分组并开启 `cross_group_retry`,系统自动跨分组重试。
方法 2:请求体扩展参数 `provider`:
```json
{
  "model": "gpt-4o",
  "provider": {
    "routing": "balanced",
    "allow": ["azure"],
    "deny": ["x"],
    "fallback": ["claude-sonnet-4.5", "gemini-2.5-flash"]
  }
}
```
触发条件:5xx / 429 / 超时 / 模型不可用。4xx(非 429)与内容安全过滤**不**回退。

---

## 10. 错误码与限流

### Q: API 返回错误的格式是什么?
统一格式:
```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "...",
    "type": "authentication_error"
  }
}
```

### Q: 常见错误码及含义?

| HTTP | type | 是否可重试 | 处理建议 |
|---|---|---|---|
| 400 | invalid_request_error | ❌ | 检查请求参数 |
| 401 | authentication_error | ❌ | 检查 API Key 是否正确 / 已删除 |
| 403 | permission_error | ❌ | 余额不足 / 模型无权限 / IP 不在白名单 |
| 404 | not_found_error | ❌ | 检查 endpoint / model 名 |
| 429 | rate_limit_error | ✅ | 限流,指数退避重试 |
| 500 | internal_error | ✅ | 平台内部错误,稍后重试 |
| 502 | upstream_error | ✅ | 上游故障,可配 fallback 模型 |
| 503 | service_unavailable | ✅ | 服务不可用,重试或换模型 |

### Q: 收到 429 限流错误怎么办?
按指数退避重试:`wait = (2 ** attempt) + random()` 秒,推荐最多重试 5 次。建议:
- 用 SDK 自带的 retry 逻辑
- 降低并发数
- 升级到更高分组(订阅 Pro / Ultra)

### Q: 收到 401 怎么办?
1. 确认 API Key 拼写、前缀是 `sk-`
2. 确认 Key 没被删除/禁用
3. 确认调用了正确的 base URL
4. 检查 Header 名称是否正确(Bearer / x-api-key / x-goog-api-key)

### Q: 收到 403 怎么办?
1. 余额不足 → 充值 / 续订
2. 模型不在令牌允许范围内 → 编辑令牌的 `model_limits`
3. IP 不在白名单 → 编辑令牌的 `allow_ips`
4. 调用的模型需要更高分组 → 升级订阅

### Q: 调用超时建议设多少?
- 普通对话(非流式):**60 秒**
- 流式对话:**120-300 秒**
- Embedding:**30 秒**
- 图像生成:**300 秒**

### Q: 平台对调用速率有什么限制?
速率限制按"用户分组 × 模型"分别计算。default 分组限速较紧,Pro / Ultra 分组限速宽松。具体每分钟请求数(RPM)/ 每分钟 Token 数(TPM)以平台公布的速率表为准,可在"模型"页查看。

### Q: 怎么查看历史调用日志?
登录后进入"日志"页,可按时间、令牌、模型、状态过滤查看每一次调用的:
- 输入/输出 Token 数
- 消耗 quota
- 上游渠道、耗时
- 错误信息(如有)

---

## 11. 计费与额度

### Q: AggreToken 怎么计费?
按 **Token 实时计费**。每次请求结束后立即从令牌额度 / 订阅额度 / 钱包余额中扣除对应 quota。

### Q: 1 Token 多少钱?
不同模型单价不同。基准换算:**1 USD = 500,000 quota**(约合 $0.002 / 1K tokens 的颗粒)。例如 GPT-4o 输入 \$2.5 / 1M tokens、输出 \$10 / 1M tokens,单次 1K tokens 输入 + 1K tokens 输出 ≈ \$0.0125。

### Q: 余额怎么查看?
登录后右上角始终显示当前钱包余额(USD/CNY/Tokens 三种显示模式可切换)。详细消费明细在"日志"页和"账单历史"页。

### Q: 缓存命中能省多少?
- OpenAI:命中后输入 Token 单价降至原价 50%
- Anthropic:命中后输入 Token 单价降至原价 10%
- Gemini:50-75%

### Q: 流式响应也按 Token 计费吗?
是。流式和非流式计费完全一致,以最终 `usage` 字段返回的实际 Token 数为准。

### Q: function call、vision、JSON 模式有额外费用吗?
没有额外手续费。这些都是模型原生能力,Token 怎么数就怎么收。Vision 调用时图片会被转换成 Token(具体由模型决定,如 GPT-4o 一张 1024×1024 ≈ 765 tokens)。

### Q: 失败的请求会扣费吗?
只有**成功完成**的请求才扣费;返回 4xx/5xx 错误的请求不扣费。流式中途断开时,平台按已传输的 Token 数收费。

---

## 12. 安全与合规

### Q: 我的请求内容会被用于训练吗?
**绝对不会**。平台明确承诺:"绝不会将您的请求内容用于模型训练,也不会出售您的个人信息给第三方。" 详见隐私政策。

### Q: AggreToken 会保存我的请求和响应内容吗?
**默认不持久化请求内容**。仅在用户**显式开启日志**功能时,内容才会存入数据库供回查。API 调用元数据(时间、Token 数、模型、状态)默认保留 **90 天**。

### Q: 数据加密用了什么标准?
- **静态加密**:AES-256
- **传输加密**:TLS 1.3 强制
- **API Key**:Argon2id 哈希存储,可一键失效
- **密钥管理**:HSM

### Q: 平台过了哪些合规认证?
- **ISO 27001**(信息安全管理)
- **SOC 2 Type II**(运营审计)
- **CSA STAR**(云安全)
- **GDPR** 合规(欧盟数据保护)
- **个人信息保护法 / 网络安全法 / 数据安全法**(中国)
- **等保 2.0 三级**(中国)
- **HIPAA**(美国医疗,需签 BAA)

### Q: 支持企业 SSO 登录吗?
支持 **OAuth 2.0 / OIDC / SAML 2.0** 三种 SSO 接入。企业用户可联系 hello@aggretoken.com 配置专属 IdP(Okta / Azure AD / Google Workspace 等)。

### Q: 能 BYOK(Bring Your Own Key)吗?
企业版支持。可指定数据驻留区域,用自有 KMS 密钥加密数据。详询 hello@aggretoken.com。

### Q: 我可以彻底删除我的数据吗?
可以。根据隐私政策中的"被遗忘权"条款,用户可发邮件至 support@aggretoken.com 申请彻底删除账户全部数据,平台将在 **30 个工作日内**完成响应。

### Q: 平台日志保存多久?
- API 调用元数据:**默认 90 天**
- 登录日志:管理员可配置,通常 180 天
- 安全审计日志:**至少 180 天**
- 显式开启的请求内容日志:用户可控,可随时删除

### Q: 服务的 SLA 是多少?
**企业级 99.9% 月度可用性**。具体补偿条款见 SLA 文件,如需企业 SLA 协议联系 hello@aggretoken.com。

### Q: 安全事件响应时效?
- 7×24 SOC 监控
- 严重事件首次响应 **< 15 分钟**
- 72 小时内书面通知受影响客户(符合 GDPR 第 33 条)

### Q: 发现安全漏洞了怎么报告?
发邮件至 **support@aggretoken.com**,平台承诺 24 小时内确认,不对善意研究人员采取法律行动,提供致谢/赏金。

### Q: 平台支持双因素认证(2FA)吗?
支持 **TOTP**(Google Authenticator / 1Password 等)和 **WebAuthn / Passkey**(指纹 / Face ID / 系统密钥)两种,建议在个人设置中开启。

---

## 13. 推广分销 / 邀请奖励

### Q: 邀请朋友能赚什么?
通过推广链接 `https://aggretoken.com/?aff=你的邀请码` 邀请新用户,在被邀请人**首次成功充值或购买订阅**时:
- 邀请人获得 `QuotaForInviter` 奖励
- 被邀请人获得 `QuotaForInvitee` 奖励
- 新用户额外获得 `QuotaForNewUser` 注册赠送

具体金额由管理员在"运营设置 → 额度设置"中配置,默认可能为 0,以平台实时公示为准。

### Q: 我的邀请码在哪里看?
"个人中心 → 推广分销"页可见自己的 4 位邀请码和推广链接。系统在你注册时自动分配,可保持稳定使用。

### Q: 邀请奖励什么时候到账?
**不在被邀请人注册时发放**,而是在被邀请人**首次成功支付**(钱包充值或购买订阅)时一次性触发,避免免费薅羊毛。

### Q: 有阶梯奖励吗?
若管理员启用了 `AffTierEnabled`,邀请达到一定数量可解锁额外奖励。默认档位:
- 邀请 3 人:奖励 \$2
- 邀请 10 人:奖励 \$10
- 邀请 25 人:奖励 \$30
- 邀请 50 人:奖励 \$80

每档仅发放一次,有唯一索引防重复。

### Q: 邀请佣金怎么变成可用余额?
"个人中心 → 推广分销 → 额度划转",把累积的 `aff_quota` 划转到可用 `quota`。**单次划转最少 1 个 USD 等值额度**(500,000 quota),不足 \$1 不能划转。

### Q: 可以提现到银行卡 / 微信吗?
**不可以**。平台只提供站内消费场景,不支持法币提现。所有邀请佣金以平台 quota 形式累积,仅能划转到自己的可用余额并消费 AI 服务。

### Q: 推广链接被薅羊毛了怎么办?
平台已做反作弊:
- 邮箱别名限制(`+`、`.` 变体)
- 奖励仅在首次付费后发放
- 风控团队监控异常注册模式

如发现刷量,可联系 support@aggretoken.com 申诉。

---

## 14. 异步任务(图像 / 视频 / 音乐)

### Q: 支持哪些图像生成模型?
- **OpenAI DALL-E 3 / GPT Image** — `/v1/images/generations`
- **Midjourney** — `POST /mj/submit/imagine` 等任务接口
- **Stable Diffusion / Replicate** — 通过 Replicate 通道
- **国产**:即梦 Jimeng

### Q: 支持哪些视频生成模型?
- **OpenAI Sora** — `POST /v1/video/generations` / `/v1/videos`
- **Kling 可灵** — `POST /kling/v1/videos/text2video` / `image2video`
- **豆包(Doubao)Video** — `POST /api/v3/contents/generations/tasks`
- **Vidu**
- **即梦 Jimeng**

### Q: 支持音乐 / 语音生成吗?
- **音乐**:Suno — `POST /suno/submit/{action}`,`POST /suno/fetch` 拉结果
- **TTS**:OpenAI `/v1/audio/speech`
- **STT(语音转文字)**:OpenAI `/v1/audio/transcriptions`、`/translations`

### Q: 异步任务怎么查询进度?
所有异步任务都返回 `task_id`,后续用 GET 接口轮询状态:
- Sora:`GET /v1/videos/:task_id`
- Kling:`GET /kling/v1/videos/{task_id}`
- Doubao:`GET /api/v3/contents/generations/tasks/:task_id`
- Suno:`POST /suno/fetch`
- Midjourney:`GET /mj/image/:id`

### Q: 异步任务计费是怎么算的?
按"任务"计费,提交时预扣额度,任务失败自动退款,任务成功后实际消耗 = 预扣 ± 用量差额。具体单价以模型定价页为准。

---

## 15. 退款 / 投诉 / 联系

### Q: 我想退款怎么办?
按《服务条款》,**预付余额一般不可退款**(法律强制要求或与平台书面另行约定的情况除外)。如确需退款,**两个渠道任选**:

**渠道 1 — 客服群(快速响应)**:
- 📱 Telegram 客服群:https://t.me/+MvU1Qg3GMSBkMzhl
- 🐧 QQ 售后群:**1092290670**

进群后 @客服,提供订单号 + 注册邮箱 + 退款原因。

**渠道 2 — 邮箱(正式留底)**:
发邮件至 **billing@aggretoken.com**,提供:
- 注册邮箱 / 用户名
- 订单号(USR... / STR... / WAF... 等)
- 退款原因
- 期望处理方式

平台会按个案处理,简单情况群里几小时内可解决,复杂个案邮件 30 天内回复。

**建议:先进群联系客服快速处理,涉及金额较大或需留底的事项,补一封邮件到 billing@。**

### Q: 充值不到账怎么联系售后?
**最快方式**:进客服群,@客服,贴订单号:
- 📱 TG 群:https://t.me/+MvU1Qg3GMSBkMzhl
- 🐧 QQ 群:**1092290670**

客服核实后 5-30 分钟内可补单到账。备用渠道 billing@aggretoken.com。

### Q: 售后 / 客服群在哪?
- 📱 **Telegram**:https://t.me/+MvU1Qg3GMSBkMzhl
- 🐧 **QQ 群号**:**1092290670**

任选其一加入即可,客服会在工作时间实时响应。

### Q: 我对账单有异议怎么办?
进入"账单历史"页查看订单详情;若确实有异议(重复扣款、金额不符等),**任选**:
- 进 TG / QQ 群直接 @客服快速核查
  - 📱 https://t.me/+MvU1Qg3GMSBkMzhl
  - 🐧 QQ 群:**1092290670**
- 或发邮件至 billing@aggretoken.com,附上**订单号**和**截图**

### Q: 我对调用日志有疑问怎么办?
进入"日志"页查看每次调用的输入 Token、输出 Token、模型、消耗 quota。若发现异常调用(明显非自己发起),立即:
1. 在"令牌"页删除/禁用该令牌
2. 进客服群求助:📱 TG https://t.me/+MvU1Qg3GMSBkMzhl 或 🐧 QQ 群 **1092290670**
3. 同步发邮件至 support@aggretoken.com 说明情况留底

### Q: 我要申请发票 / 报销凭证怎么办?
发邮件至 **billing@aggretoken.com**,提供:
- 公司全称
- 税号
- 开票金额对应的订单号
- 邮寄/电子发票偏好

需要催办或紧急处理可在 TG / QQ 群通知客服:📱 https://t.me/+MvU1Qg3GMSBkMzhl / 🐧 **1092290670**。

### Q: 我有商务合作 / 企业定制需求怎么办?
发邮件至 **hello@aggretoken.com**。AggreToken 提供企业方案,包括:
- 独立部署
- 专属渠道
- 优先技术支持
- 自定义 SLA
- 批量折扣
- 企业 SSO / SAML
- BYOK / 数据驻留

### Q: 我有产品功能建议 / Bug 反馈怎么办?
发邮件至 **support@aggretoken.com**,或在 GitHub `https://github.com/Runcoor/aggre-api` 提 issue。

### Q: 客服响应时长是多久?

**实时渠道**(秒级 / 分钟级):
- 📱 Telegram 群:https://t.me/+MvU1Qg3GMSBkMzhl,工作时间内通常几分钟内响应
- 🐧 QQ 群:**1092290670**,工作时间内通常几分钟内响应

**邮箱渠道**(工作日响应):
- **support@aggretoken.com**:24 小时内响应
- **billing@aggretoken.com**:1-3 天内响应
- **hello@aggretoken.com**:1-2 天内响应

**特殊事件**:
- 严重安全事件:首次响应 < 15 分钟(7×24)
- 隐私权利请求:30 个工作日内处理

**建议**:急事进群,留底走邮箱。

---

## 16. 站点状态 / 故障

### Q: 在哪里查看平台实时状态?
访问 `https://aggretoken.com/status`(若有公开状态页),或登录后控制台首页查看渠道实时健康状况。

### Q: 我的请求一直 500 / 超时怎么办?
1. **临时方案**:在请求体加 `provider.fallback` 参数,自动回退到其它模型
2. **检查上游**:特定模型可能上游临时故障,试试备选模型(claude-sonnet-4.5 ↔ gpt-4o ↔ gemini-2.5-pro 互为备选)
3. **检查令牌**:确认令牌未过期 / 未禁用 / 有足够额度 / 模型在允许范围内
4. **联系客服**:持续 5 分钟以上无法恢复,**进群最快**:
   - 📱 TG:https://t.me/+MvU1Qg3GMSBkMzhl
   - 🐧 QQ 群:**1092290670**
   - 备用邮箱:support@aggretoken.com(附请求 ID)

### Q: 服务突然慢了 / 延迟高了怎么办?
1. 检查自己的网络
2. 在"日志"页对比平时和现在的耗时
3. 切换不同模型/不同分组测试
4. 持续异常进客服群反馈:📱 https://t.me/+MvU1Qg3GMSBkMzhl 或 🐧 QQ 群 **1092290670**

### Q: 我购买了订阅,但 API 还是报"额度不足"怎么办?
检查:
1. **计费偏好**:令牌可能设了 `wallet_only`,不走订阅
2. **模型不在套餐范围**:订阅升级分组未覆盖该模型,且该订阅未开钱包兜底
3. **订阅已过期**:看"订阅"页订阅状态
4. **订阅额度本周期已用完且未到重置时间**

如仍异常:
- 进群快速咨询:📱 TG https://t.me/+MvU1Qg3GMSBkMzhl 或 🐧 QQ 群 **1092290670**
- 留底邮箱:billing@aggretoken.com,提供令牌名 + 订阅 ID

---

## 17. 常用术语速查

### Q: 什么是 quota?
平台内部统一的额度计数单位。**1 USD = 500,000 quota**。所有钱包余额、订阅额度、令牌限额都用 quota 计。

### Q: 什么是上游分组(group)?
渠道路由策略的分类。同一模型可挂多个上游渠道,按"分组"划分优先级。`default` = 通用;`Pro` / `Ultra` = 高级订阅专属;`auto` = 自动选优。

### Q: 什么是令牌(Token)?
两个含义:
- **API Key 令牌**:用户用来调用 API 的鉴权字符串(`sk-xxx`)
- **AI Token**:模型计费单位(1 个英文单词 ≈ 1 Token,1 个中文字 ≈ 2 Token)

上下文区分。

### Q: 什么是 webhook?
支付通道完成支付后回调平台的接口,用于异步通知充值结果。无需用户操作。

### Q: 什么是 fallback?
故障转移。主模型不可用时自动切到备选模型,保证业务连续。在请求体 `provider.fallback` 中配置。

### Q: 什么是 BYOK?
"Bring Your Own Key",自带密钥。企业可用自有 KMS 密钥加密静态数据,用 hello@aggretoken.com 联系开通。

### Q: 什么是 SSO?
"Single Sign-On",单点登录。企业可用 Okta / Azure AD / Google Workspace 等 IdP 一次登录,免去重复输密码。AggreToken 支持 OAuth 2.0 / OIDC / SAML 2.0 三种协议。

### Q: 什么是 RBAC?
"Role-Based Access Control",基于角色的权限控制。团队功能用 RBAC:Owner > Admin > Member 三级角色。

---

## 18. 法律条款摘要

### Q: 服务条款核心要点?
- 计费按 Token 用量或预付套餐;**预付余额一般不可退款**
- 企业月结 15 个自然日内付款;税款用户自担
- SLA:99.9% 月度可用性
- 禁止违法、儿童剥削、恐怖主义、DDoS、逆向工程、绕过限速、用输出训练竞品模型
- 责任上限:不超过事故前 12 个月内你向平台实际支付的费用总额
- 重大变更提前 15 天通知
- 管辖法律:**中华人民共和国法律**
- 完整条款:`/terms-of-service`

### Q: 隐私政策核心要点?
- **不用于模型训练、不出售个人信息**
- 数据中心 ISO 27001 / SOC 2 Type II
- 静态 AES-256 + 传输 TLS 1.3
- 元数据保留 90 天,请求内容默认不持久化
- Cookie 仅必要会话用途,不做跨站追踪
- 用户权利:访问 / 更正 / 删除 / 限制 / 可携
- 30 个工作日内响应
- 完整条款:`/privacy-policy`

### Q: 安全政策核心要点?
- ISO 27001 / SOC 2 Type II / CSA STAR / GDPR / 等保 2.0 三级
- 多可用区 + VPC 隔离 + DDoS 防护
- API Key Argon2id 哈希存储
- 7×24 SOC,严重事件 15 分钟响应,72 小时内书面通知
- 完整条款:`/security`

### Q: 隐私权利怎么行使?
邮件至 support@aggretoken.com,主题注明"GDPR 数据请求"或"被遗忘权请求",附身份验证(注册邮箱 + 用户名),平台 30 个工作日内响应。

### Q: 平台版权归谁?
基于开源项目 **new-api**(QuantumNous 出品,AGPL-3.0 许可)。本平台代码:`https://github.com/Runcoor/aggre-api`。所有商业服务由 AggreToken 运营主体提供。

---

## 19. 高频补充问答

### Q: 我可以同时调用多个模型吗?
可以。同一令牌可调用所有 `model_limits` 范围内的模型,无并发数硬限制(只受分组的速率限制约束)。

### Q: 平台支持图片 OCR / PDF 解析吗?
间接支持 — 通过支持 Vision 的模型(GPT-4o、Claude Sonnet、Gemini 2.5 Pro)传图,模型本身可识别文字、解析表格、阅读 PDF 截图等。

### Q: 怎么估算我每月需要多少额度?
- **聊天日常使用**(类似 ChatGPT):一次对话约 2-5K Token,每天 50 次对话,月用量约 \$5-15
- **AI 编程**(Claude Code / Cursor 重度):月用量约 \$30-200
- **生产 API 集成**:按业务规模估算,可联系 hello@aggretoken.com 评估

### Q: 我能切换不同的语言界面吗?
可以。平台前端支持中文、英文、法语、俄语、日语、越南语六种语言。在右上角语言切换器选择即可。

### Q: 可以批量调用 / 批处理 API 吗?
原生支持 OpenAI Batch API(`/v1/batches`)和异步任务接口。如需高并发批量处理,建议:
- 升级到 Pro / Ultra 订阅,放宽限速
- 用 `provider.fallback` 配置故障转移
- 联系 hello@aggretoken.com 申请企业并发额度

### Q: 平台能搭配 LangChain / LlamaIndex / AutoGPT 用吗?
可以。这些框架都基于 OpenAI / Anthropic SDK,改 base URL 即可无缝接入 AggreToken。

### Q: 如何获取最新模型 / 公告?
- 关注 `https://aggretoken.com/changelog`(更新日志)
- 邮件订阅(在个人设置开启通知)
- GitHub Watch:`https://github.com/Runcoor/aggre-api`

### Q: 老用户能享有哪些优惠?
- 充值档位折扣(\$100 / \$200 / \$500 等)
- 订阅老用户续订优惠(若管理员配置)
- 企业用户批量折扣(联系 hello@aggretoken.com)

### Q: 可以申请试用吗?
**新用户注册可能赠送注册额度**(由管理员配置 `QuotaForNewUser`,以平台公示为准)。企业试用方案联系 hello@aggretoken.com。

### Q: 我可以推荐 AggreToken 给朋友吗?
当然!分享你的推广链接 `https://aggretoken.com/?aff=你的邀请码`,朋友首次付费后你可获得邀请奖励。详见"推广分销"章节。

---

> **文档维护说明**:本文件由 AggreToken 团队维护,所有规则以平台**实时配置**为准。如发现条款变更未及时同步,请联系 support@aggretoken.com 反馈。

> **PandaWiki 录入建议**:
> - 整体导入,按 `###` 三级标题自动切分 chunk
> - 每个 Q&A 都自带"问题 + 答案",检索友好
> - 同一主题下的 Q&A 顺序无强依赖,可单独召回
> - 涉及金额、时长的数字部分可定期 review 更新
