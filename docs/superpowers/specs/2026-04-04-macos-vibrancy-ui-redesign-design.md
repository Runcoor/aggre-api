# macOS Vibrancy UI 全站重写设计规范

> 品牌：ChongYa / 冲鸭 | Logo：占位默认图

## 一、设计决策汇总

| 决策项 | 选择 |
|--------|------|
| 亮/暗模式 | 双模式同等重要 |
| 组件策略 | 混合：核心布局自建，数据组件保留 Semi + 深度定制 |
| 圆角 | 分层体系（8/12/16/full） |
| 动效 | 三级微动效（即时/过渡/装饰）+ reduced-motion 降级 |
| 毛玻璃 | 仅固定层(Header/Sidebar) + 浮动层(Modal/Drawer)使用 |
| 边框 | 光影暗示替代硬线条（0.5px shadow + 色差 + 留白） |
| 色彩 | macOS 系统蓝 + Apple 灰阶 + 语义色板 |
| Icon | 统一 lucide-react，品牌 logo 保留 @lobehub/icons |
| 移动端 | 三断点响应式（<768 / 768-1199 / ≥1200），移动端卡片替代表格 |
| 排版 | Inter + system-ui，JetBrains Mono for code |

## 二、禁忌清单（硬性约束）

1. **禁止** emoji 代替 icon → 必须使用 lucide-react 精美 icon
2. **禁止** 生硬线条 → 用光影/色差/留白替代
3. **禁止** 强烈物理阴影 → 最大使用 `0 4px 6px -1px rgb(0 0 0 / 0.06)`
4. **禁止** 默认原生粗糙组件 → 所有交互组件必须定制样式

## 三、设计 Token 体系

### 3.1 色彩 Token

```css
/* 亮色模式 */
:root {
  /* 背景层级 */
  --bg-base: #FFFFFF;
  --bg-subtle: #F5F5F7;
  --bg-muted: #E8E8ED;
  
  /* 表面（Card/Panel） */
  --surface: #FFFFFF;
  --surface-hover: #F9F9FB;
  --surface-active: #F2F2F5;
  
  /* 文字层级 */
  --text-primary: rgba(0, 0, 0, 0.85);
  --text-secondary: rgba(0, 0, 0, 0.55);
  --text-muted: rgba(0, 0, 0, 0.3);
  
  /* 交互色 */
  --accent: #007AFF;
  --accent-hover: #0066D6;
  --accent-light: rgba(0, 122, 255, 0.08);
  --accent-light-hover: rgba(0, 122, 255, 0.14);
  
  /* 语义色 */
  --success: #34C759;
  --warning: #FF9500;
  --error: #FF3B30;
  --info: #5AC8FA;
  
  /* 边框/分隔 */
  --border-subtle: rgba(0, 0, 0, 0.06);
  --border-default: rgba(0, 0, 0, 0.1);
  --ring-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.06);
  
  /* 毛玻璃 */
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-blur: 20px;
}

/* 暗色模式 */
.dark {
  --bg-base: #1C1C1E;
  --bg-subtle: #2C2C2E;
  --bg-muted: #3A3A3C;
  
  --surface: #2C2C2E;
  --surface-hover: #323234;
  --surface-active: #3A3A3C;
  
  --text-primary: rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(255, 255, 255, 0.55);
  --text-muted: rgba(255, 255, 255, 0.3);
  
  --accent: #0A84FF;
  --accent-hover: #409CFF;
  --accent-light: rgba(10, 132, 255, 0.12);
  --accent-light-hover: rgba(10, 132, 255, 0.2);
  
  --success: #30D158;
  --warning: #FF9F0A;
  --error: #FF453A;
  --info: #64D2FF;
  
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --ring-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.06);
  
  --glass-bg: rgba(28, 28, 30, 0.78);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
}
```

### 3.2 圆角 Token

```css
:root {
  --radius-sm: 8px;    /* Tag, Badge, 小按钮 */
  --radius-md: 12px;   /* Input, Select, Button */
  --radius-lg: 16px;   /* Card, Modal, Panel */
  --radius-xl: 24px;   /* 大型面板, Setup 卡片 */
  --radius-full: 9999px; /* Avatar, Pill 按钮 */
}
```

### 3.3 阴影 Token

```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-float: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.dark {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-float: 0 8px 24px rgba(0, 0, 0, 0.4);
}
```

### 3.4 排版 Token

```css
:root {
  --font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  
  --text-page-title: 600 24px/1.3 var(--font-sans);
  --text-section-title: 600 18px/1.4 var(--font-sans);
  --text-body: 400 14px/1.5 var(--font-sans);
  --text-caption: 500 12px/1.4 var(--font-sans);
  --text-tiny: 600 11px/1 var(--font-sans);
}
```

### 3.5 动效 Token

```css
:root {
  --ease-micro: 150ms ease-out;                /* hover/press */
  --ease-normal: 280ms cubic-bezier(0.2, 0, 0, 1); /* 内容过渡 */
  --ease-slow: 500ms cubic-bezier(0.2, 0, 0, 1);   /* 装饰进场 */
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --ease-micro: 0ms;
    --ease-normal: 0ms;
    --ease-slow: 0ms;
  }
}
```

## 四、80+ 问题与解决方案

### 第一批：基础设施与骨架（#1 - #20）

**#1 — 全局 CSS 变量体系缺失**
- 现状：样式分散在 Semi CSS 变量 + 零散 Tailwind 类中，无统一 Token
- 方案：在 `index.css` 顶部注入上述完整 Token 体系，作为所有组件的样式基础

**#2 — Tailwind preset 未集成 macOS Vibrancy**
- 现状：`tailwind.config.js` 使用默认配置
- 方案：将 `macos-vibrancy-tailwind-preset.js` 集成为 Tailwind preset，扩展自定义色彩/圆角/阴影到 utility class

**#3 — 字体栈过时（Lato）**
- 现状：`body { font-family: Lato, 'Helvetica Neue', Arial... }`
- 方案：替换为 `var(--font-sans)`，添加 Inter web font 引入（CDN 或本地）

**#4 — 全局圆角暴力覆盖**
- 现状：`border-radius: 10px !important` 一刀切覆盖所有 Semi 组件
- 方案：移除全局 `!important`，按组件类型分层应用 `--radius-sm/md/lg`

**#5 — Semi 组件暗色主题适配不足**
- 现状：依赖 Semi 内置 dark mode，自定义色彩未同步
- 方案：通过 Semi CSS 变量覆盖 (`--semi-color-*`)，映射到我们的 Token 体系，确保亮/暗一致

**#6 — Header 毛玻璃效果不完整**
- 现状：`bg-white/75 dark:bg-zinc-900/75 backdrop-blur-lg` 基础实现
- 方案：改用 Token：`background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)); border-bottom: 1px solid var(--glass-border)`，移除硬编码颜色

**#7 — Sidebar 背景无毛玻璃**
- 现状：纯色 `var(--semi-color-bg-0)` 背景
- 方案：应用毛玻璃效果 + 极微透明背景，右侧用 `var(--border-subtle)` 替代无边框

**#8 — Sidebar 分隔线生硬**
- 现状：使用 `<Divider>` + `opacity: 0.15`
- 方案：移除 `<Divider>`，用 `margin-top + padding-top` 留白 + group label 自然分隔

**#9 — Sidebar 折叠按钮样式粗糙**
- 现状：Semi Button outline 样式 + `box-shadow` 分隔
- 方案：自建折叠按钮，使用 lucide `ChevronsLeft` icon，悬浮圆形按钮 + 微渐变背景融合

**#10 — Sidebar 导航项选中态不够精致**
- 现状：`rgba(var(--semi-blue-0), 0.12)` 背景色
- 方案：选中态使用 `var(--accent-light)` + 左侧 3px 圆角指示条 + 文字变 `var(--accent)`

**#11 — PageLayout 内容区 padding 不统一**
- 现状：desktop `24px`，mobile `5px`，硬编码
- 方案：统一使用 CSS 变量，desktop `20px`，tablet `16px`，mobile `12px`

**#12 — Footer 设计过于复杂（demo 模式）+ 硬编码颜色**
- 现状：黄色圆球装饰、多栏布局、`bg-gray-800` 等硬编码
- 方案：简化为单行版权信息 + "Powered by" 链接，使用 Token 颜色，去掉装饰球

**#13 — Loading 组件需要升级**
- 现状：基础 Semi Spin
- 方案：自建 macOS 风格 loading — 圆形脉冲动画 + skeleton screen 替代纯 spinner

**#14 — Toast 通知样式原生**
- 现状：react-toastify 默认样式
- 方案：定制 toastify CSS，使用毛玻璃背景 + 圆角 `--radius-md` + lucide icon + 微动效进出

**#15 — Modal/Drawer 样式需要统一**
- 现状：Semi Modal 默认样式
- 方案：覆盖 Semi Modal CSS：毛玻璃背景遮罩 + `--radius-lg` 圆角 + 去硬边框 + 自定义关闭按钮；移动端 < 768px Modal 改为底部 Sheet

**#16 — Select/Input 组件样式粗糙**
- 现状：Semi 默认样式 + `10px !important` 圆角
- 方案：覆盖为 `--radius-md` 圆角 + `var(--surface)` 背景 + `var(--border-subtle)` 边框 + focus 态 `var(--accent)` ring

**#17 — Button 样式需要分级**
- 现状：Semi Button + 全局圆角覆盖
- 方案：三种按钮层级 — Primary（`var(--accent)` 实色 + 微渐变）、Secondary（`var(--surface)` + border）、Ghost（无背景 + hover 变色）；全部使用 `--radius-md`

**#18 — Table 组件行样式**
- 现状：默认 Semi Table 带水平分隔线
- 方案：去掉行分隔线，改用极微妙斑马纹（`var(--bg-subtle)` 交替行）+ hover 整行高亮 `var(--surface-hover)`

**#19 — Tag/Badge 组件**
- 现状：Semi Tag 默认样式
- 方案：覆盖为 `--radius-sm` 圆角 + 轻量背景（语义色 opacity 0.1）+ 小字号 `--text-tiny`

**#20 — Tabs 组件**
- 现状：Semi Tabs + `padding: 0 !important` 覆盖
- 方案：自定义 Tab 指示器为底部 2px 圆角线 + 滑动过渡动效 `var(--ease-normal)`

### 第二批：登录/注册/认证页面（#21 - #30）

**#21 — 登录页背景不够精致**
- 现状：`bg-gray-100` + 两个模糊球
- 方案：亮色用 `var(--bg-subtle)` 渐变；暗色用 `var(--bg-base)` + 微妙 radial-gradient 装饰；模糊球改用 Token 色彩 + 更柔和的 opacity

**#22 — 登录卡片缺少毛玻璃**
- 现状：Semi `Card` + `border-0 !rounded-2xl`
- 方案：自建登录卡片 — `var(--surface)` 背景 + `var(--ring-shadow)` + `--radius-lg` + 暗色模式下微半透明

**#23 — OAuth 按钮样式不一致**
- 现状：`!rounded-full border border-gray-200` 硬编码
- 方案：统一 OAuth 按钮：`--radius-full` + `var(--surface)` 背景 + `var(--border-subtle)` 边框 + hover `var(--surface-hover)` + 品牌 icon 保持原色

**#24 — 登录页 Logo + 品牌名展示**
- 现状：`<img>` + Semi `Title`
- 方案：品牌展示区：圆角 logo (48px, `--radius-md`) + "ChongYa" 文字 Inter 600 weight + 副标题 "冲鸭" 灰色

**#25 — 登录表单 Input 样式**
- 现状：Semi Form.Input 默认带前缀 icon
- 方案：覆盖为 `--radius-md` + 无硬边框 + `var(--bg-subtle)` 填充背景 + focus 态底部描边 `var(--accent)`

**#26 — 注册表单页面**
- 现状：与登录相似但独立组件
- 方案：与登录保持相同卡片/背景风格，共享样式 Token

**#27 — 忘记密码页面**
- 现状：独立简单页面
- 方案：同样使用统一认证页卡片样式

**#28 — 2FA 验证弹窗**
- 现状：Semi Modal + 内嵌组件
- 方案：独立全屏覆盖（移动端）或居中卡片（桌面端），数字输入框采用分隔式 6 位 code input

**#29 — 微信登录弹窗**
- 现状：Semi Modal 默认
- 方案：使用自定义 Modal 样式（毛玻璃遮罩 + 圆角卡片），二维码居中 + 验证码输入

**#30 — 用户协议/隐私政策勾选框**
- 现状：Semi Checkbox 默认
- 方案：自定义 Checkbox 样式 — 选中态 `var(--accent)` 填充 + lucide Check icon + 链接使用 `var(--accent)` 色

### 第三批：Dashboard 首页（#31 - #42）

**#31 — Dashboard 整体布局**
- 现状：垂直堆叠的卡片组合
- 方案：响应式网格布局 — desktop 2-3 列 grid，tablet 2 列，mobile 单列；统一 gap `16px`

**#32 — DashboardHeader 样式**
- 现状：基础标题组件
- 方案：`var(--text-page-title)` + 欢迎语 + 当前日期/时间 副文字 `var(--text-secondary)`

**#33 — StatsCards 统计卡片**
- 现状：Semi Card 组件
- 方案：自建 StatsCard — `var(--surface)` 背景 + `var(--ring-shadow)` + 左侧 icon（lucide，24px，语义色）+ 数值 `font-variant-numeric: tabular-nums` + 趋势指示器（上/下箭头）

**#34 — StatsCards 移动端**
- 现状：多列缩小
- 方案：横向可滑动 carousel，每张卡片固定宽度，snap 滚动

**#35 — ChartsPanel 图表面板**
- 现状：VChart 图表 + Semi Card
- 方案：图表容器用 `var(--surface)` 卡片 + `--radius-lg`；VChart 主题色对齐 Token（`var(--accent)` 主色、`var(--success)` 辅助色）

**#36 — AnnouncementsPanel 公告面板**
- 现状：Semi Card 列表
- 方案：卡片内每条公告用 `var(--bg-subtle)` 分隔 + 时间戳 `var(--text-muted)` + Markdown 渲染区

**#37 — ApiInfoPanel API 信息面板**
- 现状：信息展示卡片
- 方案：key-value 布局，key 用 `var(--text-secondary)`，value 用 `var(--text-primary)` + 代码区用 `var(--font-mono)` + 复制按钮

**#38 — FaqPanel FAQ 面板**
- 现状：手风琴/列表
- 方案：自建 Accordion — 展开/折叠用 lucide `ChevronDown` + 旋转动效 `var(--ease-normal)`

**#39 — UptimePanel 状态监控**
- 现状：嵌入组件
- 方案：状态指示点（绿/黄/红语义色）+ 小型 bar chart 式的 uptime 可视化

**#40 — SearchModal 搜索弹窗**
- 现状：Semi Modal 搜索
- 方案：macOS Spotlight 风格 — 顶部居中弹出 + 大号搜索框 + 毛玻璃背景 + 键盘快捷键提示

**#41 — Dashboard 数字动画**
- 现状：静态数字
- 方案：首次加载时数字从 0 计数到目标值（`var(--ease-slow)` 时长），后续切换时淡入替换

**#42 — Dashboard 卡片进场动效**
- 现状：无动效
- 方案：stagger 进场 — 每张卡片依次 fade-in + translate-y(8px→0)，间隔 50ms

### 第四批：表格管理页面通用（#43 - #55）

**#43 — CardPro 容器组件重构**
- 现状：基于 Semi Card，6 个区域插槽
- 方案：去掉 Semi Card 依赖，自建：`var(--surface)` 背景 + `var(--ring-shadow)` + `--radius-lg` + 内部区域用留白分隔（不用 Divider）

**#44 — CardPro 移动端操作按钮**
- 现状："显示/隐藏操作项" 按钮 + 折叠
- 方案：改为 lucide `SlidersHorizontal` icon 按钮，点击展开为底部 Sheet 显示操作和筛选

**#45 — 表格行操作按钮**
- 现状：多个 Semi Button 并排
- 方案：desktop 保留图标按钮行（但换 lucide icon + ghost 样式）；mobile 合并为 `MoreHorizontal` 菜单

**#46 — 表格筛选栏**
- 现状：水平排列的多个 Semi Select/Input
- 方案：desktop 保持水平排列但使用自定义 Select/Input 样式；mobile 折叠为"筛选"按钮 + 底部 Sheet

**#47 — 表格分页组件**
- 现状：Semi Pagination 默认
- 方案：覆盖样式 — 当前页码 `var(--accent)` 高亮 + `--radius-sm` 圆角 + 精简在移动端（只显示"上/下页" + 页码）

**#48 — 表格空状态**
- 现状：默认 Semi 空状态
- 方案：自建空状态 — lucide 线性插画 icon (48px) + 主文案 + 副文案 `var(--text-muted)` + 可选操作按钮

**#49 — 表格加载骨架屏**
- 现状：基础 loading
- 方案：表格区域使用 shimmer 骨架屏（行数匹配 pageSize），脉冲动画 `var(--ease-slow)`

**#50 — ColumnSelectorModal 列选择弹窗**
- 现状：Semi Modal + Checkbox 列表
- 方案：紧凑侧面板 Drawer + 可拖拽排序列表 + 全选/反选

**#51 — 渠道管理 — ChannelsTable 整体**
- 现状：复杂表格 + 多级筛选
- 方案：CardPro type3 容器 + Tab 切换（全部/按标签分组）+ 每行渠道展示：品牌 icon（@lobehub/icons）+ 名称 + 状态指示点

**#52 — 渠道管理 — EditChannelModal**
- 现状：大型 Semi Modal 表单
- 方案：改为 Drawer (从右侧滑入) + 分 section 表单 + 每 section 标题 + 保存按钮固定在底部

**#53 — 渠道管理 — ModelTestModal**
- 现状：模型测试弹窗
- 方案：Drawer + 实时 streaming 输出区（`var(--font-mono)` + `var(--bg-subtle)` 代码区背景）

**#54 — 令牌管理 — TokensTable**
- 现状：表格 + CRUD 弹窗
- 方案：同 CardPro 通用样式；令牌值展示用 `var(--font-mono)` + 一键复制按钮 + 遮挡显示（点击 lucide `Eye` 切换）

**#55 — 令牌管理 — EditTokenModal**
- 现状：Semi Modal 表单
- 方案：Drawer 样式 + 分 section 表单 + 权限选择用 chip 多选而非 Select 多选

### 第五批：日志与监控页面（#56 - #65）

**#56 — 使用日志 — UsageLogsTable**
- 现状：CardPro type2 + 统计信息 + 大量列
- 方案：默认精简列（时间、模型、Token 数、耗时、状态）；完整列通过 ColumnSelector 控制

**#57 — 使用日志 — 状态列展示**
- 现状：文字/Tag 显示
- 方案：成功=绿点 + "成功"、失败=红点 + 错误码 + hover tooltip 显示完整错误

**#58 — 使用日志 — UserInfoModal**
- 现状：Semi Modal 展示用户信息
- 方案：紧凑的 Popover/Card（非全屏 Modal），显示用户头像 + 基本信息

**#59 — 绘图日志 — MjLogsTable**
- 现状：表格 + 图片预览
- 方案：支持切换 grid 视图（图片画廊模式）/ 表格视图；grid 模式下图片用 `--radius-md` 圆角 + hover 放大预览

**#60 — 绘图日志 — ContentModal**
- 现状：内容详情弹窗
- 方案：全屏图片预览 + 底部信息面板（参数、提示词等）

**#61 — 任务日志 — TaskLogsTable**
- 现状：与使用日志类似
- 方案：任务状态用进度条指示器 — pending(灰)/running(蓝动画)/success(绿)/failed(红)

**#62 — 任务日志 — AudioPreviewModal**
- 现状：音频预览弹窗
- 方案：自建音频播放器 — 波形可视化 + 播放/暂停按钮 + 时间进度条，使用 `var(--accent)` 色

**#63 — ParamOverrideEntry 参数覆盖**
- 现状：表格内嵌组件
- 方案：用 Tag 展示覆盖参数，hover 展开详情 Tooltip

**#64 — ChannelAffinityUsageCacheModal**
- 现状：渠道亲和性缓存弹窗
- 方案：信息展示卡片式布局，key-value 对齐

**#65 — 日志筛选组件优化**
- 现状：多个 Select 组件水平排列
- 方案：日期范围选择器自定义样式 + 快捷时间选项（最近1小时/24小时/7天）

### 第六批：模型与定价（#66 - #73）

**#66 — 定价页整体布局**
- 现状：固定侧边栏(PricingSidebar) + 内容区
- 方案：desktop 保持侧边栏+内容区，但侧边栏使用 `var(--bg-subtle)` 背景；mobile 侧边栏隐藏为底部筛选 Sheet

**#67 — 定价卡片视图**
- 现状：PricingCardView 网格
- 方案：每张定价卡片 — `var(--surface)` + `var(--ring-shadow)` + 模型品牌 icon + 输入/输出价格对比 + 能力 Tag 列表

**#68 — 定价表格视图**
- 现状：PricingTable 大表格
- 方案：精简默认列 + 数字右对齐 + `tabular-nums` + 价格用 `var(--accent)` 色加重

**#69 — ModelDetailSideSheet 模型详情**
- 现状：Semi SideSheet
- 方案：Drawer + 分 section 信息展示 + 端点列表 + 价格对比表

**#70 — 模型管理 — ModelsTable**
- 现状：管理员表格
- 方案：CardPro type3 + Tab 分组（全部/按厂商）+ 每行品牌 icon + 状态 Tag

**#71 — 模型管理 — SyncWizardModal**
- 现状：同步向导弹窗
- 方案：分步向导 — Step 指示器 + 内容区 + 上/下步按钮，使用 macOS 风格步骤条

**#72 — 模型管理 — EditModelModal**
- 现状：编辑模型弹窗
- 方案：Drawer + 表单分区（基本信息 / 价格 / 能力标记）

**#73 — Ratio/GroupRatio 设置页面**
- 现状：复杂表单页面
- 方案：使用 Section 卡片布局 — 每个设置组一张卡片 + 标题 + 表单内容

### 第七批：个人/钱包/设置（#74 - #82）

**#74 — PersonalSetting 个人设置布局**
- 现状：多张卡片垂直排列
- 方案：响应式 2 列 grid (desktop)、单列 (mobile)；用户信息头部区域跨列

**#75 — UserInfoHeader 用户信息头部**
- 现状：内嵌组件
- 方案：大 Avatar (80px, `--radius-full`) + 用户名 + 角色 Tag + 简介；背景用微渐变装饰

**#76 — CheckinCalendar 签到日历**
- 现状：日历组件
- 方案：自定义日历网格 — 签到日期用 `var(--accent)` 圆点标记 + 今日高亮 + 连续签到条纹

**#77 — 钱包页面 (TopUp)**
- 现状：充值 + 邀请 + 订阅卡片
- 方案：上方余额展示卡片（大数字 + 微渐变背景 with-pastel-balls）+ 下方操作区 grid

**#78 — RechargeCard 充值卡片**
- 现状：金额选择 + 支付
- 方案：金额选择用 SelectableButtonGroup 风格网格按钮 + 自定义金额 Input + 支付方式选择

**#79 — SubscriptionPlansCard 订阅计划**
- 现状：计划列表
- 方案：水平滚动的计划卡片 — 推荐计划用 `var(--accent)` 边框强调 + "当前方案" 标记

**#80 — TransferModal 转账弹窗**
- 现状：Semi Modal 表单
- 方案：自定义 Modal + 收款方搜索 + 金额 Input + 确认二次验证

**#81 — 系统设置页面整体**
- 现状：Tabs 切换多个设置面板（Operation/System/Model/Payment 等）
- 方案：左侧垂直 Nav (desktop) / 顶部水平 Tabs (mobile) + 右侧内容区每个设置项用 Section 卡片

**#82 — 系统设置 — 各 Section 表单**
- 现状：Semi Form 默认布局
- 方案：每个 Section 一张卡片 — 标题 + 描述 `var(--text-secondary)` + 表单项（Switch/Input/Select 统一样式）+ 保存按钮

### 第八批：Playground/聊天/其他（#83 - #95）

**#83 — Playground 整体布局**
- 现状：左侧设置 + 中间聊天 + 右侧调试
- 方案：三栏自适应 — 设置面板 collapsible (280px) + 聊天区 flex-1 + 调试面板 collapsible；移动端只显示聊天区 + 底部 Tab 切换

**#84 — Playground — SettingsPanel**
- 现状：左侧设置面板
- 方案：毛玻璃侧边面板 + 模型选择 Dropdown + 参数滑块（自定义样式 slider，轨道用 `var(--accent)`）

**#85 — Playground — ChatArea 聊天区**
- 现状：Semi Chat 组件
- 方案：自定义消息气泡 — 用户消息右对齐 `var(--accent-light)` 背景，AI 消息左对齐 `var(--surface)` 背景；Markdown 渲染优化

**#86 — Playground — MessageContent**
- 现状：Markdown 渲染
- 方案：代码块用 `var(--bg-muted)` 背景 + `var(--font-mono)` + 复制按钮；代码高亮主题匹配亮/暗模式

**#87 — Playground — ThinkingContent**
- 现状：思考过程折叠显示
- 方案：可展开的"思考过程"区域 — lucide `Brain` icon + 折叠/展开 + 内容区 `var(--bg-subtle)` 背景 + 斜体字

**#88 — Playground — DebugPanel**
- 现状：右侧调试面板
- 方案：Tabs (Request/Response/SSE) + JSON 语法高亮 + 复制按钮

**#89 — Playground — FloatingButtons**
- 现状：浮动操作按钮
- 方案：底部悬浮操作条 — 毛玻璃背景 + lucide icon 按钮组 + 新建对话/清空/设置

**#90 — Chat 页面**
- 现状：内嵌聊天组件
- 方案：全屏聊天界面 — 与 Playground 共享 ChatArea 样式

**#91 — Setup 向导页面**
- 现状：分步 Setup 向导（Database/Admin/UsageMode/Complete）
- 方案：全屏居中卡片 + macOS 风格步骤条（水平圆点连线）+ 每步内容 fade-in 过渡 + "ChongYa" 品牌展示

**#92 — NotFound / Forbidden 页面**
- 现状：基础错误页面
- 方案：全屏居中 — 大号 lucide icon (64px) + 错误码 + 描述 + 返回按钮

**#93 — About 页面**
- 现状：关于页面
- 方案：使用 Section 卡片布局 — 品牌区 (logo + 名称 + 版本) + 技术栈 + License 信息

**#94 — NoticeModal 通知弹窗**
- 现状：Semi Modal + Tab 切换
- 方案：Drawer 从右侧滑入 + Tab (系统通知/应用内通知) + 每条通知卡片式布局 + 未读标记蓝点

**#95 — SkeletonWrapper 骨架屏**
- 现状：基础骨架
- 方案：macOS 风格 shimmer — 从左到右的光泽扫过动画 + 形状匹配实际内容

### 第九批：订阅/兑换码/用户管理（#96 - #105）

**#96 — 订阅管理 — SubscriptionsTable**
- 现状：管理员订阅表格
- 方案：CardPro + 订阅计划卡片式行展示 + 状态 Tag (active/expired/cancelled)

**#97 — 订阅管理 — AddEditSubscriptionModal**
- 现状：Semi Modal 大表单
- 方案：Drawer + 分区表单 + 周期选择用 SegmentedControl 风格

**#98 — 兑换码管理 — RedemptionsTable**
- 现状：表格 + CRUD
- 方案：CardPro + 兑换码用 `var(--font-mono)` 展示 + 一键复制 + 批量生成操作

**#99 — 兑换码 — EditRedemptionModal**
- 现状：编辑弹窗
- 方案：Drawer + 简化表单

**#100 — 用户管理 — UsersTable**
- 现状：用户表格 + 多个操作弹窗
- 方案：CardPro + 每行用户：Avatar + 用户名 + 角色 Tag + 状态指示 + 操作菜单

**#101 — 用户管理 — EditUserModal**
- 现状：编辑用户弹窗
- 方案：Drawer + 分区（基本信息 / 配额 / 权限）

**#102 — 用户管理 — 批量操作确认弹窗**
- 现状：多个独立 Modal (Delete/Promote/Demote/Enable/Disable)
- 方案：统一确认弹窗组件 — 危险操作用 `var(--error)` 强调 + 二次输入确认

**#103 — 模型部署 — DeploymentsTable**
- 现状：表格
- 方案：CardPro + 部署状态用彩色 Tag + 配置列展示为简化 JSON 预览

**#104 — 模型部署 — CreateDeploymentModal**
- 现状：创建部署弹窗
- 方案：Drawer + 分步表单（选模型 → 配置 → 确认）

**#105 — SelectableButtonGroup 组件**
- 现状：已有自定义组件 + 色彩变体
- 方案：保留但更新样式 — 使用 Token 色彩 + `--radius-sm` + 改进暗色模式变体

### 第十批：全局精修（#106 - #115）

**#106 — 全局滚动条样式**
- 现状：多处自定义 webkit 滚动条 + 部分隐藏
- 方案：统一为 macOS 风格 — 6px 宽 + 圆角 + 半透明 + 不活跃时隐藏 + hover 时显示

**#107 — Tooltip 统一**
- 现状：Semi Tooltip 默认
- 方案：`var(--surface)` 背景 + `var(--shadow-float)` 阴影 + `--radius-sm` + 微 fade-in 动效

**#108 — Dropdown/Popover 统一**
- 现状：Semi Dropdown 默认
- 方案：毛玻璃背景 + `var(--shadow-float)` + `--radius-md` + 菜单项 hover `var(--surface-hover)`

**#109 — Form 验证错误样式**
- 现状：Semi 默认红色提示
- 方案：`var(--error)` 色 + lucide `AlertCircle` icon + 输入框底部描边变红

**#110 — Notification/Banner 全局通知**
- 现状：react-toastify
- 方案：保留 toastify 但完全定制：位置改为右上角 + 毛玻璃背景 + 语义色侧边条（3px）+ lucide icon

**#111 — 暗色模式切换过渡**
- 现状：瞬间切换
- 方案：添加 `transition: background-color 300ms, color 200ms` 到 body 和主要容器

**#112 — 图片/头像全局样式**
- 现状：混合样式
- 方案：统一 Avatar `--radius-full`；缩略图 `--radius-md`；Logo `--radius-md`

**#113 — 代码块全局样式**
- 现状：基础 markdown 渲染
- 方案：代码块 `var(--bg-muted)` 背景 + `var(--font-mono)` + 圆角 `--radius-md` + 顶部语言标签 + 复制按钮

**#114 — 移动端 Drawer 动效统一**
- 现状：各弹窗独立动效
- 方案：底部 Sheet：从底部滑入 `transform: translateY(100%)→0` + 毛玻璃遮罩；侧边 Drawer：从右侧滑入

**#115 — prefers-reduced-motion 降级**
- 现状：未处理
- 方案：统一 `@media (prefers-reduced-motion: reduce)` 规则：所有 transition/animation duration 归零

## 五、分批交付计划

### Batch 1 — 基础设施与骨架
文件范围：`index.css`、`tailwind.config.js`、布局组件（HeaderBar、SiderBar、PageLayout、Footer）、通用 UI 组件（Loading、CardPro）、登录/注册页面
覆盖问题：#1-#30

### Batch 2 — 核心管理页面
文件范围：Dashboard 组件、表格通用样式、ChannelsTable、TokensTable、UsageLogsTable、ModelsTable/Pricing、PersonalSetting、TopUp
覆盖问题：#31-#82

### Batch 3 — 剩余页面与精修
文件范围：Playground、Chat、Setup、MjLogs、TaskLogs、Subscriptions、Redemptions、Users、系统设置子页面、全局精修
覆盖问题：#83-#115

## 六、技术实施约束

1. **保留 Semi Design** 作为数据组件（Table、Form、Select），但通过 CSS 变量覆盖其视觉表现
2. **不新增依赖**（除可能引入 Inter 字体 CDN），充分利用已有 Tailwind + Semi
3. **所有颜色通过 CSS 变量**，不硬编码 hex/rgb（已有的硬编码需迁移）
4. **保持所有功能逻辑不变**，仅修改样式/布局/组件结构
5. **每个组件同时实现亮/暗模式**，通过 `.dark` 类切换
6. **移动端适配为必选项**，每个改动都需要验证三个断点
7. **品牌名 ChongYa / 冲鸭** 应用到 Header Logo、Login 页、Footer、About 页
