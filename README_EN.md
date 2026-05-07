# ym1r

> [中文文档](README.md)

Multi-user AI chat platform with a 3D interactive particle sphere, personal brand pages, and server operations dashboard — built on a Liquid Glass design system.

## Features

- **Hero** — ym1r brand with Three.js interactive particle sphere (repulsion, attraction, curl, noise physics engine)
- **AI Chat** (`/chat`) — Multi-user DeepSeek-powered conversations with file uploads, text extraction, vision recognition, persona control, and weather queries
- **Personal Space** (`/me`, `/projects`, `/ask-me`) — Profile, portfolio, and personal AI assistant
- **Admin Panel** (`/admin`) — User approval, file management, global config, usage statistics
- **CloudOps** (`/cloudops`) — AI-assisted server command execution with whitelist validation and audit logging

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 3, Framer Motion, Three.js |
| Backend | Node.js, Express 4, express-session |
| Database | SQLite (better-sqlite3, WAL mode) |
| AI | DeepSeek API (chat + vision) |
| Icons | Lucide React |
| Deployment | systemd + Nginx (Ubuntu) |

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev        # Dev mode (Vite :5173 + API proxy :3001)
npm run start      # Production mode (:3001)
```

### Production Deployment

```bash
npm install && npm run build

# systemd service
sudo cp deploy/systemd/ym1r.service.example /etc/systemd/system/yk-intelligence.service
sudo systemctl daemon-reload && sudo systemctl enable --now yk-intelligence

# Nginx reverse proxy
sudo cp deploy/nginx/ym1r.conf.example /etc/nginx/sites-available/yk-intelligence
sudo ln -s /etc/nginx/sites-available/yk-intelligence /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3001) |
| `SESSION_SECRET` | Yes | Session encryption key |
| `ADMIN_USERNAME` | No | Admin username (default: admin) |
| `ADMIN_PASSWORD` | Yes | Admin password |
| `DEEPSEEK_API_KEY` | Yes | DeepSeek API key |
| `DEEPSEEK_BASE_URL` | No | API base URL |
| `DEEPSEEK_MODEL` | No | Default chat model |
| `ALLOW_REGISTER` | No | Enable registration (default: true) |
| `APP_TIMEZONE` | No | Timezone (default: Asia/Shanghai) |
| `UPLOAD_DIR` | No | Upload directory (default: ./uploads) |
| `MAX_UPLOAD_MB` | No | Max upload size in MB (default: 50) |

## Security

- httpOnly + sameSite session cookies
- bcrypt password hashing (10 rounds)
- Role-based access control (admin / user)
- Registration approval workflow (pending → approved → login allowed)
- CloudOps command whitelist + blocklist + audit trail
- Path traversal protection on file uploads

## License

MIT
