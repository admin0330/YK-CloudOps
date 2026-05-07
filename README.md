# ym1r

多用户 AI 对话平台，集成 3D 交互粒子球、个人品牌页面和服务器运维面板——基于 Liquid Glass 设计系统。

## 功能

- **首页 Hero** — ym1r 品牌展示 + Three.js 3D 粒子球（斥力 / 引力 / 旋度 / 噪声物理引擎）
- **AI 对话** (`/chat`) — 基于 DeepSeek API 的多用户聊天，支持文件上传与文本提取、图片识别、人设控制、天气查询
- **个人空间** (`/me`, `/projects`, `/ask-me`) — 个人主页、作品展示、AI 问答助手
- **管理后台** (`/admin`) — 用户审批管理、文件管理、全局配置、用量统计
- **CloudOps** (`/cloudops`) — AI 辅助的服务器命令执行，白名单校验 + 审计日志

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18、TypeScript、Vite 6、Tailwind CSS 3、Framer Motion、Three.js |
| 后端 | Node.js、Express 4、express-session |
| 数据库 | SQLite（better-sqlite3，WAL 模式） |
| AI | DeepSeek API（对话 + 视觉） |
| 图标 | Lucide React |
| 部署 | systemd + Nginx（Ubuntu） |

## 快速开始

```bash
npm install
cp .env.example .env
# 编辑 .env 填入你的 API Key
npm run dev        # 开发模式（Vite :5173 + API 代理 :3001）
npm run start      # 生产模式（:3001）
```

### 生产部署

```bash
npm install && npm run build

# systemd 服务
sudo cp deploy/systemd/ym1r.service.example /etc/systemd/system/yk-intelligence.service
sudo systemctl daemon-reload && sudo systemctl enable --now yk-intelligence

# Nginx 反向代理
sudo cp deploy/nginx/ym1r.conf.example /etc/nginx/sites-available/yk-intelligence
sudo ln -s /etc/nginx/sites-available/yk-intelligence /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `PORT` | 否 | 服务端口（默认 3001） |
| `SESSION_SECRET` | 是 | 会话加密密钥 |
| `ADMIN_USERNAME` | 否 | 管理员用户名（默认 admin） |
| `ADMIN_PASSWORD` | 是 | 管理员密码 |
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API 密钥 |
| `DEEPSEEK_BASE_URL` | 否 | API 地址 |
| `DEEPSEEK_MODEL` | 否 | 默认模型 |
| `ALLOW_REGISTER` | 否 | 允许注册（默认 true） |
| `APP_TIMEZONE` | 否 | 时区（默认 Asia/Shanghai） |
| `UPLOAD_DIR` | 否 | 上传目录（默认 ./uploads） |
| `MAX_UPLOAD_MB` | 否 | 上传大小限制 MB（默认 50） |

## 安全

- httpOnly + sameSite Session Cookie
- bcrypt 密码哈希（10 轮）
- 角色权限控制（admin / user）
- 注册审批流程（pending → approved → 可登录）
- CloudOps 命令白名单 + 阻断清单 + 审计日志
- 上传文件路径遍历防护

## 许可证

MIT
