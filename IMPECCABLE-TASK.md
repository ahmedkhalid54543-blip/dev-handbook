# Impeccable Design Upgrade — dev-handbook

## 目标
对 dev-handbook 进行一次全面视觉设计升级，基于 impeccable 设计原则，让网站看起来更专业、更有个性，消除「AI slop」感。

## 审计结果（Jarv1s 预分析）

### 核心问题

1. **颜色系统混乱（Critical）**
   - `variables.css` 里 orange/red/purple/blue/cyan/green 六色全开，无主次
   - 进度条 gradient 用了 橙→紫→绿 三色，非常廉价
   - `#333333`、`#666666` 纯灰无色调（impeccable 原则：灰色必须带品牌色的色调）
   - 必须收敛：保留 `#FF6B35` 橙色为唯一主色，其余删除

2. **字体太平庸（High）**
   - 使用系统字体 `PingFang SC`，没有设计感
   - 引入思源黑体（Noto Sans SC）作为正文，让排版更精致

3. **圆角过大（Medium）**
   - `--radius-card: 16px` 过圆，像儿童应用
   - 改为 `10px`，更专业

4. **卡片滥用（Medium）**
   - 多处嵌套卡片，视觉噪音大
   - 不是所有 section 都需要 card 包裹

5. **间距单调（Low）**
   - 所有间距都是 8/12/16/20，没有节奏
   - 大标题和正文之间应有更大的呼吸空间

## 改造任务

### Step 1: 重构 variables.css（核心）

```css
:root {
  /* 品牌色 — 只保留一个主色 */
  --color-brand: #FF6B35;
  --color-brand-dark: #E5561F;
  --color-brand-light: #FF8A5C;

  /* 暖灰系统 — 所有灰色带橙调 */
  --color-gray-900: #1C1410;
  --color-gray-800: #2E2520;
  --color-gray-700: #4A3F38;
  --color-gray-600: #6B5E55;
  --color-gray-500: #8C7D73;
  --color-gray-400: #B0A49C;
  --color-gray-300: #D4CBC5;
  --color-gray-200: #EDE8E4;
  --color-gray-100: #F7F4F1;
  --color-gray-50:  #FDFCFB;

  /* 功能色（最小化） */
  --color-success: #4CAF7D;
  --color-error: #E05252;

  /* 背景 */
  --bg-primary: var(--color-gray-100);
  --bg-card: #FFFFFF;
  --bg-code: var(--color-gray-900);

  /* 文字 */
  --text-primary: var(--color-gray-900);
  --text-secondary: var(--color-gray-600);
  --text-muted: var(--color-gray-400);

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(28, 20, 16, 0.08);
  --shadow-md: 0 4px 12px rgba(28, 20, 16, 0.10);
  --shadow-lg: 0 12px 32px rgba(28, 20, 16, 0.12);

  /* 圆角 */
  --radius-card: 10px;
  --radius-button: 6px;
  --radius-sm: 4px;

  /* 间距 */
  --spacing-page-desktop: 48px;
  --spacing-page-mobile: 20px;
  --bottom-nav-height: 56px;
  --bottom-safe-area: env(safe-area-inset-bottom, 0px);
  --bottom-nav-total: calc(var(--bottom-nav-height) + var(--bottom-safe-area));

  /* 字体 */
  --font-family: 'Noto Sans SC', 'PingFang SC', system-ui, sans-serif;
  --font-display: 'Noto Serif SC', 'PingFang SC', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Menlo', monospace;
}
```

### Step 2: 更新 global.css

1. 在 `<head>` 相关位置（index.html 和 stage.html）添加 Google Fonts 引入：
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
   ```

2. 标题样式升级：
   - `h1` 使用 `--font-display`，更有气质
   - 行高从 1.8 改为正文 1.7，标题 1.2

3. `.btn.primary` 按钮：
   - 背景 `--color-brand`
   - hover 时 `--color-brand-dark`
   - 去掉多色 gradient
   - 加 subtle box-shadow

4. 进度条 gradient 改为单色品牌色：
   ```css
   /* 不再用三色 gradient */
   stroke: var(--color-brand);
   ```

### Step 3: 修复 components.css 中的颜色引用

搜索并替换所有硬编码颜色：
- `#FF6B35` → `var(--color-brand)`
- `#FF5252` → `var(--color-error)`
- `#66BB6A` → `var(--color-success)`
- `#7C4DFF`、`#448AFF`、`#00BCD4` → 删除或替换为品牌色
- `#333333` → `var(--text-primary)`
- `#666666` → `var(--text-secondary)`
- `#F7F9FC`、`#F5F7FA` → `var(--color-gray-100)` 或 `var(--bg-primary)`
- `#1a0a00`（ai-video-handbook 风格色）→ `var(--color-gray-900)`

### Step 4: Stage 卡片视觉升级（index.html）

当前 stage 卡片用多色 emoji 背景，改为：
- 统一使用品牌色系的 gradient（深橙到浅橙）
- 或者白底 + 左侧品牌色竖条（`border-left: 3px solid var(--color-brand)`）
- 卡片 hover 时轻微上移 (`transform: translateY(-2px)`)，shadow 加深

### Step 5: 底部导航栏优化

- 当前底部导航背景是白色，改为 `var(--color-gray-50)` + 顶部 1px 边框
- 激活状态使用品牌色，非激活使用 `--text-muted`

## 实施原则

- **只改 CSS 和 HTML 头部**，不动 JS 逻辑
- 改完后验证：`jq . data/*.json` 确认 JSON 无损
- git commit 每个 Step 后提交一次，方便回滚
- **不要引入新的 npm 依赖**
- 全部改完后运行 `python3 -m http.server 8081` 验证

## 完成后通知

When completely finished, run:
openclaw system event --text "Done: dev-handbook impeccable 视觉升级完成，5步全部完成" --mode now
