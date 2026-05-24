# ym1r CloudOps Cinematic Frontend Redesign

更新时间：2026-05-25

## 目标

本次改版把 `ym3861.cn` 的首页和主要入口从原来的通用展示页，重构为一个黑色电影感、暖奶油色文字体系的个人 CloudOps 入口。首页不再只是作品陈列，而是作为统一前门，引导用户进入服务器管理、AI 运维助手、个人门户、后台管理和 JS 学习等原有功能。

## 设计方向

- 基础氛围：dark / moody / cinematic / premium。
- 主背景：全屏视频 hero，叠加噪点与黑色渐变，保持高对比和电影感。
- 主色：`#E1E0CC` 用于主要文字，`#DEDBC8` 用于 Tailwind `primary`、按钮和图标。
- 面板色：`#101010` 用于 About 卡片，`#212121` 用于功能卡片。
- 字体：全局使用 Google Font `Almarai`；About 中的强调斜体使用 `Instrument Serif`。
- 动效：使用 `framer-motion` 做文字上拉、淡入、滚动字符透明度变化和功能卡片入场。
- 图标：使用 `lucide-react` 的 `ArrowRight` 与 `Check`，保证按钮和列表动作一致。

## 已修改文件

### `index.html`

- 页面标题改为 `ym1r CloudOps`。
- 加入 `viewport-fit=cover`，适配 iOS 刘海屏和底部安全区。
- 加载 Google Fonts：
  - `Almarai`，权重 `300/400/700/800`
  - `Instrument Serif`，italic
- 保留黑色浏览器主题色，移动端状态栏和页面视觉统一。

### `tailwind.config.js`

- 扩展 `colors.primary = #DEDBC8`。
- 扩展 `fontFamily.serif = ['"Instrument Serif"', 'serif']`。
- 保留原有 Tailwind 配置，避免破坏已有功能页。

### `src/pages/HomePage.tsx`

首页重构为 3 个大区块：

1. Hero
   - 使用远程视频作为背景。
   - 标题改为 `Ym1r's cloudOps`。
   - 导航改为网站真实功能入口：`Home`、`Portal`、`CloudOps`、`JS Study`、`Admin`。
   - CTA 改为 `Enter`，点击后调用 `/api/enter` 并跳转到 `/cloudops`。
   - Hero 文案改成个人 CloudOps 功能定位，说明服务器管理、AI 运维助手、文件与用户后台、个人作品和 JS 学习记录。

2. About
   - 从模板的 creative studio 内容改为 ym1r 个人云端控制台说明。
   - 使用多风格文字组件呈现英文标题和斜体强调。
   - 正文使用逐字符滚动透明度动画，说明旧功能被收束到统一入口。

3. Features
   - 四张功能卡根据原网站功能重新映射：
     - `CloudOps command center.`：进入服务器运营主页。
     - `Server Management.`：服务器连接、状态查看、Linux 命令和安全策略。
     - `AI Ops Assistant.`：AI 对话、报错解释、日志/命令输出分析和附件分析。
     - `Portal & Admin.`：个人门户、项目展示、JS 学习、用户/文件/权限/AI 人设后台。

### `src/index.css`

- 加入 `.noise-overlay` 与 `.bg-noise` 噪点贴图工具。
- 加入 `.prisma-page` 专属字体和噪点作用域，避免污染全部旧页面。
- 追加 `ym1r Cinematic CloudOps System`，把原有通用页面的 glass、button、input、nav、terminal 等视觉语言统一到黑色电影感体系。
- 修复移动端 hero 高度：
  - 首页根节点使用 `100svh` 和 `100dvh`。
  - Hero section 从固定 `h-screen` 改成动态视口最小高度。
  - 短屏手机自动压缩标题、说明文字、按钮和底部间距。
  - Nav 横向内容在窄屏可安全容纳，不挤压页面宽度。
  - CTA 底部使用 `env(safe-area-inset-bottom)`，避免被 iOS 底部手势区域遮挡。

### `src/components/Navbar.tsx`

- 顶部导航文案改为站点真实功能。
- 点击功能入口时先调用 `api.setFromHome()`，再进行路由跳转，保证受保护的 CloudOps 页面可以从主页进入。
- 导航视觉改成黑色半透明、暖奶油色文字，和新首页风格一致。

### `src/pages/PortalPage.tsx`

- 门户页内容和 CTA 已重新贴合 CloudOps 主页。
- 移动端返回 CloudOps 的卡片做了宽度、居中和文字排版修复，避免 480px 以下屏幕溢出。

## 路由与功能映射

| 首页入口 | 路由 | 说明 |
| --- | --- | --- |
| Home | `/` | 当前电影感 CloudOps 首页 |
| Portal | `/portal` | 个人门户、介绍和作品展示 |
| CloudOps | `/cloudops` | 服务器运营主页和核心运维入口 |
| JS Study | `/js-study` | JS 学习记录 |
| Admin | `/admin` | 后台管理入口 |
| AI Ops Assistant | `/chat` | AI 对话和运维分析助手 |

## 移动端适配说明

本次重点处理了手机浏览器高度变化问题。移动端浏览器的地址栏会改变可视区域，传统 `100vh` 容易导致底部按钮被遮挡或内容被裁切，因此首页 hero 改为：

- `min-h-[100svh]`：以稳定视口高度为基础，减少地址栏影响。
- `min-h-[100dvh]`：在支持动态视口的浏览器里跟随真实可视高度。
- `env(safe-area-inset-bottom)`：为 iPhone 底部手势条预留空间。
- 短屏媒体查询：在 `max-height: 700px` 且 `max-width: 768px` 时收紧标题、文案、按钮和 padding。
- 超小屏媒体查询：在 `max-width: 380px` 且 `max-height: 640px` 时进一步压缩 hero 标题。

## 构建与部署

服务器项目路径：

```bash
/opt/ym1r
```

构建命令：

```bash
npm run build
```

GitHub 远程仓库：

```bash
https://github.com/admin0330/YK-CloudOps.git
```

推荐部署验证流程：

```bash
cd /opt/ym1r
npm run build
git status --short
git add index.html tailwind.config.js src/components/HeroSection.tsx src/components/Navbar.tsx src/index.css src/pages/HomePage.tsx src/pages/PortalPage.tsx YM1R_CLOUDOPS_REDESIGN.md
git commit -m "Refine cinematic CloudOps frontend for mobile"
GIT_TERMINAL_PROMPT=0 git push origin main
```

## 验证项

- 首页可以打开：`https://ym3861.cn/`
- 首页 hero 显示 `Ym1r's cloudOps`。
- `Enter` 按钮进入 `/cloudops`。
- 顶部导航显示真实功能入口。
- `/portal`、`/js-study`、`/admin`、`/chat`、`/cloudops` 保留原有功能路由。
- 手机窄屏和短屏下，hero 标题、说明文案和按钮不会被底部安全区遮挡。
- 构建通过 `npm run build`。

## 已知构建警告

构建过程中可能仍出现以下已有警告，不影响本次页面部署：

- `.env` 中 `NODE_ENV=production` 的 Vite 提示。
- 部分历史 CSS escaped selector 的 minify warning。
- 前端 chunk 大于 500 kB 的 Vite 性能提示。

这些警告属于原项目遗留或体积优化项，本次没有改动构建链路。

## 后续建议

- 继续把 `CloudOpsPage`、`ChatPage`、`AdminPage`、`JSStudyPage` 的局部排版细节统一到同一套黑色电影感卡片语言。
- 给功能入口增加更明确的当前状态反馈，例如服务器在线数、最近 AI 会话、最新文件上传时间。
- 对大型 chunk 做懒加载拆分，降低首屏 JS 体积。
- 如果视频加载速度不稳定，可以把 hero video 下载到服务器本地并通过静态路径提供。
