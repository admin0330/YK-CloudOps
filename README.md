# ym1r

`ym1r` 是一套可直接上线的个人 AI 门户与运维工作台，包含首页、个人主页、AI 对话、Admin 管理、CloudOps、项目展示等页面，整体采用 Apple / Liquid Glass 风格，并支持中英文切换。

如果你想把这套站点作为 GitHub 仓库复刻、部署、二次开发，这个仓库就是完整源码。

## 主要功能

- **首页**：品牌首屏、导航入口、视觉展示
- **个人主页** (`/me`)：个人介绍、项目、技能、外链
- **AI 对话** (`/chat`)：多用户对话、文件上传、图片识别、天气查询、人设控制
- **Admin 管理** (`/admin`)：用户管理、文件管理、服务器管理、数据统计
- **CloudOps** (`/cloudops`)：服务器命令面板、审计与白名单控制
- **项目 / 问我 / About**：个人作品与联系入口
- **多语支持**：中文 / English 即时切换
- **主题支持**：浅色 / 深色模式切换

## 仓库内容

本仓库包含：

- 前端 React + Vite + TypeScript 源码
- 后端 Express API 与 SQLite 数据层
- 生产部署脚本
- Nginx 与 systemd 示例配置
- 环境变量示例文件
- 中英文 README 文档

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18、TypeScript、Vite、Tailwind CSS、Framer Motion、Lucide React |
| 后端 | Node.js、Express、express-session |
| 数据库 | SQLite（better-sqlite3） |
| AI | DeepSeek API |
| 视觉 | Three.js、Liquid Glass 风格 UI、响应式布局 |
| 部署 | Ubuntu + systemd + Nginx |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

然后编辑 `.env`，至少补充：

- `SESSION_SECRET`
- `ADMIN_PASSWORD`
- `DEEPSEEK_API_KEY`

### 3. 开发模式

```bash
npm run dev
```

默认会启动 Vite 开发服务器与本地 API 代理。

### 4. 生产构建与启动

```bash
npm run build
npm run start
```

默认服务端口为 `3001`，你也可以通过 `.env` 修改 `PORT`。

## 推荐目录结构

```text
?? src/                # 前端页面、组件、上下文、样式
?? server/             # API 路由、服务与数据库逻辑
?? public/             # 静态资源
?? uploads/            # 用户上传文件（运行时生成）
?? data/               # SQLite 数据文件（运行时生成）
?? deploy/             # systemd / Nginx 示例配置
?? scripts/            # 发布与部署脚本
?? README.md / README_EN.md
```

## 生产部署

### Ubuntu / systemd

```bash
npm install
npm run build

sudo cp deploy/systemd/ym1r.service.example /etc/systemd/system/ym1r.service
sudo systemctl daemon-reload
sudo systemctl enable --now ym1r
```

### Nginx 反向代理

```bash
sudo cp deploy/nginx/ym1r.conf.example /etc/nginx/sites-available/ym1r
sudo ln -s /etc/nginx/sites-available/ym1r /etc/nginx/sites-enabled/ym1r
sudo nginx -t
sudo systemctl reload nginx
```

### 一键打包

```bash
bash scripts/create-zip-release.sh
```

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `PORT` | 否 | 服务端口，默认 `3001` |
| `HOST` | 否 | 监听地址，默认 `0.0.0.0` |
| `SESSION_SECRET` | 是 | 会话加密密钥 |
| `ADMIN_USERNAME` | 否 | 管理员用户名，默认 `admin` |
| `ADMIN_PASSWORD` | 是 | 管理员密码 |
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API Key |
| `DEEPSEEK_BASE_URL` | 否 | DeepSeek API 地址 |
| `DEEPSEEK_MODEL` | 否 | 默认模型 |
| `ALLOW_REGISTER` | 否 | 是否允许注册 |
| `APP_TIMEZONE` | 否 | 时区，默认 `Asia/Shanghai` |
| `UPLOAD_DIR` | 否 | 上传目录 |
| `MAX_UPLOAD_MB` | 否 | 上传大小上限（MB） |

更多示例请直接查看 `.env.example`。

## 数据与持久化

- SQLite 数据库会保存在 `data/`
- 用户上传文件会保存在 `uploads/`
- 前端静态资源由 `public/` 与构建输出 `dist/` 提供
- 部署时建议把 `data/` 与 `uploads/` 目录一并备份

## 复刻建议

如果你想快速复刻这套网站：

1. 直接 clone 本仓库
2. 复制 `.env.example` 并配置 API Key / 管理员密码
3. 执行 `npm install && npm run build`
4. 用 `npm run start` 或 systemd 启动
5. 将 Nginx 反代到 `3001` 或你的自定义端口

## 安全特性

- `httpOnly` + `sameSite` Session Cookie
- bcrypt 密码哈希
- 管理员 / 用户角色控制
- 注册审批流程
- CloudOps 命令白名单与审计日志
- 上传路径遍历防护

## 许可证

MIT