#!/usr/bin/env bash
set -e

# ============================================================
#  ym1r — Ubuntu One-Click Deploy & Launcher
#  Supports: Ubuntu 20.04 / 22.04 / 24.04
#  Usage: see --help or README
# ============================================================

APP="ym1r"
PORT=""
FORCE_PORT=false
USE_PM2=false
USE_DEV=false
IS_STOP=false
IS_RESTART=false

# ── Parse arguments ─────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --force-port) FORCE_PORT=true ;;
    --pm2)        USE_PM2=true ;;
    --dev)        USE_DEV=true ;;
    --stop)       IS_STOP=true ;;
    --restart)    IS_RESTART=true ;;
    --help|-h)
      echo "Usage: ./scripts/start-ubuntu.sh [--pm2] [--dev] [--force-port] [--stop] [--restart]"
      exit 0 ;;
  esac
done

# ============================================================
#  Check: must be run from project root
# ============================================================
echo "[${APP}] Checking project root..."

if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
  echo "[${APP}] Error: Please run this script from the project root."
  exit 1
fi

echo "[${APP}] Project root: $(pwd)"

# ============================================================
#  Read PORT from existing .env (if any) or default
# ============================================================
if [ -f ".env" ]; then
  PORT=$(grep -E '^PORT=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '[:space:]')
fi
PORT="${PORT:-3001}"

# ============================================================
#  STOP mode
# ============================================================
do_stop() {
  echo "[${APP}] Stopping..."

  if command -v pm2 >/dev/null 2>&1 && pm2 list 2>/dev/null | grep -q "${APP}"; then
    pm2 stop "${APP}" 2>/dev/null || true
    echo "[${APP}] PM2 process stopped."
  fi

  if [ -f "logs/${APP}.pid" ]; then
    local pid
    pid=$(cat "logs/${APP}.pid" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
      echo "[${APP}] Stopped PID ${pid}."
    fi
    rm -f "logs/${APP}.pid"
  fi

  echo "[${APP}] Stopped."
}

if [ "$IS_STOP" = true ]; then
  do_stop
  exit 0
fi

# ============================================================
#  RESTART mode: stop first
# ============================================================
if [ "$IS_RESTART" = true ]; then
  do_stop
  sleep 2
fi

# ============================================================
#  System dependency detection & install (Ubuntu)
# ============================================================
echo "[${APP}] Checking Ubuntu dependencies..."

DEB_PACKAGES="curl wget git unzip ca-certificates build-essential python3 python3-pip net-tools lsof openssl netcat-openbsd"
MISSING=""

for pkg in $DEB_PACKAGES; do
  if dpkg -s "$pkg" >/dev/null 2>&1; then
    continue
  fi
  MISSING="$MISSING $pkg"
done

if [ -n "$MISSING" ]; then
  echo "[${APP}] Installing Ubuntu dependencies..."
  sudo apt-get update -qq
  # shellcheck disable=SC2086
  sudo apt-get install -y $MISSING
  echo "[${APP}] System dependencies installed."
else
  echo "[${APP}] All Ubuntu dependencies present."
fi

# ============================================================
#  Node.js 20+ detection and auto-install
# ============================================================
echo "[${APP}] Checking Node.js..."

NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
fi

if [ "$NODE_MAJOR" -ge 20 ]; then
  echo "[${APP}] Node.js $(node -v) — OK"
  echo "[${APP}] npm $(npm -v)"
else
  if [ "$NODE_MAJOR" -gt 0 ]; then
    echo "[${APP}] Node.js v${NODE_MAJOR} is below v20. Upgrading to Node.js 20..."
  else
    echo "[${APP}] Node.js not found. Installing Node.js 20..."
  fi

  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs

  if ! command -v node >/dev/null 2>&1; then
    echo "[${APP}] Error: Node.js installation failed."
    exit 1
  fi
  echo "[${APP}] Node.js $(node -v) installed"
  echo "[${APP}] npm $(npm -v)"
fi

# ============================================================
#  npm dependencies
# ============================================================
echo "[${APP}] Installing npm dependencies..."

if [ -f "package-lock.json" ]; then
  echo "[${APP}] Running npm ci..."
  if npm ci 2>&1; then
    echo "[${APP}] npm ci complete."
  else
    echo "[${APP}] npm ci failed, falling back to npm install..."
    npm install --no-audit --no-fund
    echo "[${APP}] npm install complete."
  fi
else
  npm install --no-audit --no-fund
  echo "[${APP}] npm install complete."
fi

# ============================================================
#  .env creation and completion
# ============================================================
echo "[${APP}] Preparing .env..."

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "[${APP}] Created .env from .env.example"
  else
    touch .env
    echo "[${APP}] Created new .env"
  fi
fi

# Ensure essential keys exist
ensure_env() {
  local key="$1" default="$2"
  if ! grep -qE "^${key}=" .env 2>/dev/null; then
    echo "${key}=${default}" >> .env
  fi
}

ensure_env "PORT" "3001"
ensure_env "NODE_ENV" "production"
ensure_env "SESSION_SECRET" ""
ensure_env "DEEPSEEK_API_KEY" ""

# Reload PORT
PORT=$(grep -E '^PORT=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '[:space:]')
PORT="${PORT:-3001}"

# SESSION_SECRET
SECRET_CURRENT=$(grep -E '^SESSION_SECRET=' .env 2>/dev/null | head -1 | cut -d= -f2-)
if [ -z "$SECRET_CURRENT" ]; then
  NEW_SECRET=$(openssl rand -hex 32)
  sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=${NEW_SECRET}/" .env
  echo "[${APP}] SESSION_SECRET auto-generated."
else
  echo "[${APP}] SESSION_SECRET already set."
fi

# DEEPSEEK_API_KEY
API_KEY_CURRENT=$(grep -E '^DEEPSEEK_API_KEY=' .env 2>/dev/null | head -1 | cut -d= -f2-)
API_KEY_LOWER=$(echo "$API_KEY_CURRENT" | tr '[:upper:]' '[:lower:]')

# Check if API key is empty or a placeholder
if [ -z "$API_KEY_CURRENT" ] || \
   [ "$API_KEY_LOWER" = "your_deepseek_api_key_here" ] || \
   [ "$API_KEY_LOWER" = "your-api-key" ] || \
   [ "$API_KEY_LOWER" = "sk-xxxx" ] || \
   [ "$API_KEY_LOWER" = "sk-your-deepseek-api-key" ] || \
   [ "$API_KEY_LOWER" = "changeme" ] || \
   [ "$API_KEY_LOWER" = "change-me" ] || \
   [ "$API_KEY_LOWER" = "your_deepseek_api_key_here" ]; then

  echo ""
  echo -n "请输入你的 DeepSeek API Key："
  read -s DEEPSEEK_INPUT
  echo ""

  if [ -n "$DEEPSEEK_INPUT" ]; then
    sed -i "s|^DEEPSEEK_API_KEY=.*|DEEPSEEK_API_KEY=${DEEPSEEK_INPUT}|" .env
    echo "[${APP}] DEEPSEEK_API_KEY saved."
  else
    echo "[${APP}] Warning: DEEPSEEK_API_KEY is empty. AI chat may not work."
  fi
else
  echo "[${APP}] DEEPSEEK_API_KEY already set."
fi

# ============================================================
#  Build frontend
# ============================================================
echo "[${APP}] Building frontend..."
npm run build

# ============================================================
#  Backend syntax check
# ============================================================
echo "[${APP}] Checking server syntax..."

node --check server.js && echo "[${APP}] server.js syntax OK"

if [ -f "server/services/weather.js" ]; then
  node --check server/services/weather.js && echo "[${APP}] server/services/weather.js syntax OK"
else
  echo "[${APP}] server/services/weather.js not found, skipping."
fi

if [ -f "server/routes/servers.js" ]; then
  node --check server/routes/servers.js && echo "[${APP}] server/routes/servers.js syntax OK"
else
  echo "[${APP}] server/routes/servers.js not found, skipping."
fi

# ============================================================
#  DEV mode: foreground
# ============================================================
if [ "$USE_DEV" = true ]; then
  echo "[${APP}] Starting in DEV mode..."
  echo "[${APP}] Frontend: http://localhost:5173"
  echo "[${APP}] Backend:  http://localhost:${PORT}"
  npm run dev
  exit 0
fi

# ============================================================
#  Port check
# ============================================================
echo "[${APP}] Checking port ${PORT}..."

mkdir -p logs

PORT_PID=$(sudo lsof -ti :${PORT} 2>/dev/null || true)

if [ -n "$PORT_PID" ]; then
  echo "[${APP}] Port ${PORT} is already in use."
  sudo lsof -i :${PORT} 2>/dev/null || true

  if [ "$FORCE_PORT" = true ]; then
    echo "[${APP}] Releasing port ${PORT}..."
    sudo fuser -k ${PORT}/tcp 2>/dev/null || true
    sleep 1
    echo "[${APP}] Port ${PORT} released."
  else
    echo "[${APP}] Use --force-port to release the port automatically."
    exit 1
  fi
fi

# ============================================================
#  Start server
# ============================================================
echo "[${APP}] Starting server..."

if [ "$USE_PM2" = true ]; then
  # ── PM2 mode ──
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "[${APP}] Installing PM2..."
    sudo npm install -g pm2
  fi

  if pm2 list 2>/dev/null | grep -q "${APP}"; then
    pm2 reload "${APP}" --update-env
    echo "[${APP}] PM2 reloaded."
  else
    pm2 start server.js --name "${APP}" --update-env
    echo "[${APP}] PM2 started."
  fi
  pm2 save
else
  # ── Default: nohup background ──
  nohup npm run start > "logs/${APP}.log" 2>&1 &
  SERVER_PID=$!
  echo "$SERVER_PID" > "logs/${APP}.pid"
  echo "[${APP}] Background PID: ${SERVER_PID}"
fi

# ============================================================
#  Wait for port to open
# ============================================================
echo "[${APP}] Waiting for port ${PORT}..."
MAX_WAIT=60
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
  if nc -z 127.0.0.1 "${PORT}" 2>/dev/null; then
    echo "[${APP}] Server is running on http://127.0.0.1:${PORT}"
    exit 0
  fi
  sleep 2
  WAITED=$((WAITED + 2))
done

# ── Timeout: port not open ──
echo "[${APP}] Error: Port ${PORT} did not open within ${MAX_WAIT}s."
echo ""
echo "[${APP}] Recent logs (last 80 lines):"
tail -n 80 "logs/${APP}.log" 2>/dev/null || echo "(no log file)"

if [ "$USE_PM2" = true ]; then
  echo ""
  echo "[${APP}] PM2 logs (last 80 lines):"
  pm2 logs "${APP}" --lines 80 --nostream 2>/dev/null || true
fi

exit 1
