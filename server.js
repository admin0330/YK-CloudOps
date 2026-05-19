import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

import db, { findUserByUsername, insertUser } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import chatRoutes from './server/routes/chat.js';
import adminRoutes from './server/routes/admin.js';
import fileRoutes from './server/routes/files.js';
import personaRoutes from './server/routes/persona.js';
import serverRoutes from './server/routes/servers.js';
import askMeRoutes from './server/routes/askMe.js';
import cloudOpsRoutes from './server/routes/cloudops.js';
import weatherRoutes from './server/routes/weather.js';
import jsStudyRoutes from './server/routes/jsStudy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '3001', 10);
const isHttps = (process.env.APP_ORIGIN || '').startsWith('https://');

// Trust proxy for reverse proxy setups
app.set('trust proxy', 1);

// ============================================================
// SESSION MIDDLEWARE — must come before all routes
// ============================================================
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// ============================================================
// API ROUTES — registered first so they take priority
// ============================================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'ym1r',
    env: process.env.NODE_ENV || 'development',
  });
});

// POST /api/enter — set fromHome session flag from the homepage
app.post('/api/enter', (req, res) => {
  req.session.fromHome = true;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    res.json({ ok: true });
  });
});

// Gateway middleware: redirect to / if visiting a protected page without fromHome
const PROTECTED_PAGES = ['/login', '/admin-login', '/admin', '/me', '/projects', '/chat', '/ask-me', '/cloudops'];
app.use((req, res, next) => {
  const path = req.path;
  if (PROTECTED_PAGES.includes(path) && !req.session.fromHome) {
    return res.redirect('/');
  }
  next();
});

// Server time endpoint
app.get('/api/time', (_req, res) => {
  const timezone = process.env.APP_TIMEZONE || 'Asia/Shanghai';
  const now = new Date();

  const localFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    weekday: 'long',
  });

  const localParts = localFormatter.formatToParts(now);
  const get = (type) => localParts.find(p => p.type === type)?.value || '';

  const localTime = `${get('year')}年${get('month')}月${get('day')}日 ${get('hour')}:${get('minute')}:${get('second')}`;
  const weekday = weekdayFormatter.format(now);

  res.json({
    timestamp: now.getTime(),
    iso: now.toISOString(),
    timezone,
    localTime,
    weekday,
  });
});

app.use('/api', authRoutes);
app.use('/api', chatRoutes);
app.use('/api', adminRoutes);
app.use('/api', fileRoutes);
app.use('/api', personaRoutes);
app.use('/api', serverRoutes);
app.use('/api', askMeRoutes);
app.use('/api', cloudOpsRoutes);
app.use('/api', weatherRoutes);
app.use('/api', jsStudyRoutes);

// ============================================================
// API 404 CATCH-ALL — ensures unmatched /api/* returns JSON, never HTML
// Must come AFTER all API routes but BEFORE static files / SPA fallback
// ============================================================
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// ============================================================
// STATIC FILES — after API routes
// ============================================================
const distPath = path.resolve(__dirname, 'dist');
const publicPath = path.resolve(__dirname, 'public');

// Serve public assets (like apple-logo.png) if they exist
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// /assets alias — serves the same public directory for convenience
app.use('/assets', express.static(publicPath));

// Serve Vite build output
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ============================================================
// FRONTEND FALLBACK — SPA routing, very last
// ============================================================
const indexPath = path.resolve(distPath, 'index.html');

app.get('*', (req, res, next) => {
  // Never intercept API calls
  if (req.path.startsWith('/api/')) {
    return next();
  }
  if (!fs.existsSync(indexPath)) {
    return res.status(503).json({ error: 'Frontend not built. Run: npm run build' });
  }
  res.sendFile(indexPath);
});

// ============================================================
// LAST-RESORT: any /api/* that reaches here gets JSON, never HTML
// ============================================================
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// ============================================================
// Global error handler — ensures /api/* always returns JSON
// ============================================================
app.use((err, req, res, _next) => {
  console.error('[api:error]', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Internal server error', detail: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
  res.status(500).send('Internal server error');
});

// ============================================================
// ENSURE ADMIN USER
// ============================================================
async function ensureAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = findUserByUsername.get(adminUsername);
  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 10);
    insertUser.run(adminUsername, hash, 'admin', 'active');
    console.log(`[setup] Admin user "${adminUsername}" created`);
  } else {
    // Ensure admin is always admin and active
    db.prepare('UPDATE users SET role = ?, status = ?, updatedAt = datetime(\'now\') WHERE username = ? AND (role != ? OR status != ?)')
      .run('admin', 'active', adminUsername, 'admin', 'active');
    console.log(`[setup] Admin user "${adminUsername}" verified`);
  }

  // Start the server
  app.listen(PORT, HOST, () => {
    console.log('');
    console.log('  ym1r — AI + Personal Brand + CloudOps');
    console.log(`  http://${HOST}:${PORT}`);
    console.log('');
    console.log(`  Health:   http://127.0.0.1:${PORT}/api/health`);
    console.log(`  Home:     http://127.0.0.1:${PORT}/`);
    console.log(`  Chat:     http://127.0.0.1:${PORT}/chat`);
    console.log(`  Admin:    http://127.0.0.1:${PORT}/admin-login`);
    console.log('');
  });
}

ensureAdmin().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
