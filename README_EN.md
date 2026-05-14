# ym1r

`ym1r` is a production-ready personal AI portal and operations dashboard. It includes a landing page, personal profile pages, AI chat, an Admin console, CloudOps controls, and project/about sections. The UI follows an Apple / Liquid Glass inspired design and supports both Chinese and English.

This repository contains the full source code so it can be cloned, reproduced, deployed, and extended easily.

## What You Get

- **Homepage**: brand landing experience and entry points
- **Personal page** (`/me`): profile, projects, skills, and external links
- **AI Chat** (`/chat`): multi-user chat, file upload, image understanding, weather queries, persona control
- **Admin** (`/admin`): user management, file management, server management, usage stats
- **CloudOps** (`/cloudops`): command panel with whitelist and audit controls
- **Projects / Ask Me / About**: personal portfolio and contact entry points
- **Bilingual UI**: instant Chinese / English switching
- **Theme switching**: light / dark mode support

## Repository Contents

This repository ships with:

- React + Vite + TypeScript frontend source
- Express API and SQLite persistence layer
- production deployment scripts
- Nginx and systemd sample configs
- environment variable example file
- Chinese and English README files

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React |
| Backend | Node.js, Express, express-session |
| Database | SQLite (better-sqlite3) |
| AI | DeepSeek API |
| Visuals | Three.js, Liquid Glass UI, responsive layouts |
| Deployment | Ubuntu + systemd + Nginx |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env` and at minimum set:

- `SESSION_SECRET`
- `ADMIN_PASSWORD`
- `DEEPSEEK_API_KEY`

### 3. Development mode

```bash
npm run dev
```

This runs the Vite frontend and the local API proxy.

### 4. Production build and start

```bash
npm run build
npm run start
```

The server defaults to port `3001`, but you can change `PORT` in `.env`.

## Suggested Project Layout

```text
src/       frontend pages, components, contexts, styles
server/    API routes, services, database logic
public/    static assets
uploads/   runtime file uploads
data/      runtime SQLite database files
deploy/    systemd / Nginx sample configs
scripts/   release and deployment scripts
README.md  Chinese guide
README_EN.md English guide
```

## Production Deployment

### Ubuntu / systemd

```bash
npm install
npm run build

sudo cp deploy/systemd/ym1r.service.example /etc/systemd/system/ym1r.service
sudo systemctl daemon-reload
sudo systemctl enable --now ym1r
```

### Nginx reverse proxy

```bash
sudo cp deploy/nginx/ym1r.conf.example /etc/nginx/sites-available/ym1r
sudo ln -s /etc/nginx/sites-available/ym1r /etc/nginx/sites-enabled/ym1r
sudo nginx -t
sudo systemctl reload nginx
```

### Build a release archive

```bash
bash scripts/create-zip-release.sh
```

## Environment Variables

| Variable | Required | Description |
|---|---|
| `PORT` | No | Server port, default `3001` |
| `HOST` | No | Bind address, default `0.0.0.0` |
| `SESSION_SECRET` | Yes | Session encryption key |
| `ADMIN_USERNAME` | No | Admin username, default `admin` |
| `ADMIN_PASSWORD` | Yes | Admin password |
| `DEEPSEEK_API_KEY` | Yes | DeepSeek API key |
| `DEEPSEEK_BASE_URL` | No | DeepSeek API base URL |
| `DEEPSEEK_MODEL` | No | Default model |
| `ALLOW_REGISTER` | No | Whether registration is enabled |
| `APP_TIMEZONE` | No | Timezone, default `Asia/Shanghai` |
| `UPLOAD_DIR` | No | Upload directory |
| `MAX_UPLOAD_MB` | No | Max upload size in MB |

See `.env.example` for the full sample.

## Data and Persistence

- SQLite data lives in `data/`
- uploaded files live in `uploads/`
- static frontend assets are served from `public/` and build output `dist/`
- back up `data/` and `uploads/` when moving or redeploying

## Reproduction Guide

To reproduce the full site quickly:

1. Clone this repository
2. Copy `.env.example` to `.env` and fill in the secrets
3. Run `npm install && npm run build`
4. Start the app with `npm run start` or `systemd`
5. Point Nginx to port `3001` or your custom port

## Security

- `httpOnly` + `sameSite` session cookies
- bcrypt password hashing
- admin / user role-based access control
- registration approval workflow
- CloudOps whitelist and audit logging
- upload path traversal protection

## License

MIT
