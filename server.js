import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream/promises';
import bcrypt from 'bcryptjs';
import multer from 'multer';

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
const execFileAsync = promisify(execFile);

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '3001', 10);
const isHttps = (process.env.APP_ORIGIN || '').startsWith('https://');
const diskRoot = path.resolve(process.env.DISK_STORAGE_DIR || path.join(__dirname, 'data', 'disk'));
const diskTempRoot = path.resolve(process.env.DISK_TEMP_DIR || path.join(diskRoot, '.uploads'));
const diskMaxFileSize = Number(process.env.DISK_MAX_FILE_SIZE || Number.MAX_SAFE_INTEGER);
const diskChunkBodyLimit = process.env.DISK_CHUNK_BODY_LIMIT || '64mb';
const diskPreviewCacheRoot = path.resolve(process.env.DISK_PREVIEW_CACHE_DIR || path.join(diskRoot, '.preview-cache'));
const diskTextPreviewMaxBytes = Number(process.env.DISK_TEXT_PREVIEW_MAX_BYTES || 2 * 1024 * 1024);
const diskOfficePreviewMaxBytes = Number(process.env.DISK_OFFICE_PREVIEW_MAX_BYTES || 200 * 1024 * 1024);
const diskOfficePreviewTimeoutMs = Number(process.env.DISK_OFFICE_PREVIEW_TIMEOUT_MS || 60_000);

fs.mkdirSync(diskRoot, { recursive: true });
fs.mkdirSync(diskTempRoot, { recursive: true });
fs.mkdirSync(diskPreviewCacheRoot, { recursive: true });

function sanitizeDiskSegment(name = '') {
  const cleaned = String(name)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, 120);
}

function sanitizeDiskRelativePath(name = '') {
  if (!String(name).trim()) return '';
  const fallback = `upload-${Date.now()}`;
  const normalized = String(name).replace(/\\/g, '/');
  const parts = normalized
    .split('/')
    .map((part) => sanitizeDiskSegment(part))
    .filter((part) => part && part !== '.' && part !== '..');
  return (parts.join('/') || fallback).slice(0, 420);
}

function uniqueDiskRelativePath(originalName) {
  const safeName = sanitizeDiskRelativePath(originalName) || `upload-${Date.now()}`;
  const dir = path.posix.dirname(safeName) === '.' ? '' : path.posix.dirname(safeName);
  const ext = path.posix.extname(safeName);
  const base = path.posix.basename(safeName, ext);
  let candidate = safeName;
  let index = 1;

  while (fs.existsSync(path.resolve(diskRoot, candidate))) {
    candidate = dir ? `${dir}/${base}-${index}${ext}` : `${base}-${index}${ext}`;
    index += 1;
  }

  return candidate;
}

function resolveDiskPath(name = '') {
  const safeName = sanitizeDiskRelativePath(name);
  const filePath = path.resolve(diskRoot, safeName);
  if (filePath !== diskRoot && !filePath.startsWith(`${diskRoot}${path.sep}`)) {
    return null;
  }
  return { safeName, filePath };
}

function getDiskUploadDir(uploadId) {
  const safeId = sanitizeDiskSegment(uploadId);
  return path.resolve(diskTempRoot, safeId);
}

function getDiskUploadMetaPath(uploadId) {
  return path.join(getDiskUploadDir(uploadId), 'meta.json');
}

function getDiskUploadPartsDir(uploadId) {
  return path.join(getDiskUploadDir(uploadId), 'parts');
}

function getDiskUploadChunkPath(uploadId, chunkIndex) {
  const safeIndex = Number.isInteger(Number(chunkIndex)) ? Number(chunkIndex) : -1;
  return path.join(getDiskUploadPartsDir(uploadId), `part-${String(safeIndex).padStart(8, '0')}.bin`);
}

function getExpectedDiskChunkSize(meta, chunkIndex) {
  const totalSize = Number(meta.size) || 0;
  const chunkSize = Number(meta.chunkSize) || 0;
  const totalChunks = Number(meta.totalChunks) || 0;
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= totalChunks) return null;
  if (totalChunks === 1 && totalSize === 0) return 0;
  if (chunkSize <= 0) return null;
  const start = chunkIndex * chunkSize;
  return Math.max(0, Math.min(chunkSize, totalSize - start));
}

function readDiskUploadMeta(uploadId) {
  const metaPath = getDiskUploadMetaPath(uploadId);
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
}

function writeDiskUploadMeta(uploadId, meta) {
  const uploadDir = getDiskUploadDir(uploadId);
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(getDiskUploadMetaPath(uploadId), JSON.stringify(meta, null, 2), 'utf8');
}

function refreshDiskUploadMeta(uploadId, meta) {
  const totalChunks = Number(meta.totalChunks) || 0;
  const receivedChunkIndexes = [];
  let receivedBytes = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const chunkPath = getDiskUploadChunkPath(uploadId, chunkIndex);
    if (!fs.existsSync(chunkPath)) continue;
    const expectedSize = getExpectedDiskChunkSize(meta, chunkIndex);
    const actualSize = fs.statSync(chunkPath).size;
    if (expectedSize === null || actualSize !== expectedSize) continue;
    receivedChunkIndexes.push(chunkIndex);
    receivedBytes += actualSize;
  }

  meta.receivedChunkIndexes = receivedChunkIndexes;
  meta.receivedChunks = receivedChunkIndexes.length;
  meta.receivedBytes = receivedBytes;
  meta.updatedAt = new Date().toISOString();
  writeDiskUploadMeta(uploadId, meta);
  return meta;
}

function createDiskUploadMeta({ relativePath, size, totalChunks, chunkSize }) {
  const uploadId = randomUUID();
  const safeRelativePath = sanitizeDiskRelativePath(relativePath) || `upload-${Date.now()}`;
  const finalRelativePath = uniqueDiskRelativePath(safeRelativePath);
  const meta = {
    uploadId,
    relativePath: safeRelativePath,
    finalRelativePath,
    size: Number(size) || 0,
    totalChunks: Number(totalChunks) || 0,
    chunkSize: Number(chunkSize) || 0,
    receivedChunks: 0,
    receivedBytes: 0,
    receivedChunkIndexes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeDiskUploadMeta(uploadId, meta);
  return meta;
}

function canResumeDiskUploadMeta(meta, { relativePath, size, totalChunks, chunkSize }) {
  if (!meta || !meta.uploadId) return false;
  const safeRelativePath = sanitizeDiskRelativePath(relativePath) || '';
  return fs.existsSync(getDiskUploadDir(meta.uploadId))
    && String(meta.relativePath || '') === safeRelativePath
    && Number(meta.size || 0) === Number(size || 0)
    && Number(meta.totalChunks || 0) === Number(totalChunks || 0)
    && Number(meta.chunkSize || 0) === Number(chunkSize || 0);
}



const DISK_TEXT_PREVIEW_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.log', '.json', '.js', '.jsx', '.ts', '.tsx', '.css', '.scss',
  '.html', '.htm', '.xml', '.yaml', '.yml', '.ini', '.conf', '.env', '.sh', '.bat', '.ps1',
  '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.go', '.rs', '.sql', '.csv', '.toml', '.vue',
]);
const DISK_IMAGE_PREVIEW_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg']);
const DISK_OFFICE_PREVIEW_EXTENSIONS = new Set(['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.odt', '.ods', '.odp']);

function getDiskPreviewKind(name = '') {
  const ext = path.extname(String(name)).toLowerCase();
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.pdf') return 'pdf';
  if (DISK_IMAGE_PREVIEW_EXTENSIONS.has(ext)) return 'image';
  if (DISK_OFFICE_PREVIEW_EXTENSIONS.has(ext)) return 'office';
  if (DISK_TEXT_PREVIEW_EXTENSIONS.has(ext)) return 'text';
  return 'unsupported';
}

function getDiskPreviewMimeType(name = '') {
  const ext = path.extname(String(name)).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function resolveDiskPreviewFile(name = '') {
  const resolved = resolveDiskPath(name);
  if (!resolved || !fs.existsSync(resolved.filePath)) return null;
  const stat = fs.statSync(resolved.filePath);
  if (!stat.isFile()) return null;
  return { ...resolved, stat, kind: getDiskPreviewKind(resolved.safeName) };
}

async function getOfficePreviewPdf(resolved) {
  if (resolved.stat.size > diskOfficePreviewMaxBytes) {
    const error = new Error('Office file is too large to preview online');
    error.statusCode = 413;
    throw error;
  }

  const cacheKey = createHash('sha256')
    .update(`${resolved.safeName}:${resolved.stat.size}:${resolved.stat.mtimeMs}`)
    .digest('hex');
  const cachedPdf = path.join(diskPreviewCacheRoot, `${cacheKey}.pdf`);
  if (fs.existsSync(cachedPdf)) return cachedPdf;

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ym1r-preview-'));
  const profileDir = path.join(workDir, 'profile');
  fs.mkdirSync(profileDir, { recursive: true });

  try {
    await execFileAsync('libreoffice', [
      `-env:UserInstallation=${pathToFileURL(profileDir).href}`,
      '--headless',
      '--convert-to', 'pdf',
      '--outdir', workDir,
      resolved.filePath,
    ], {
      timeout: diskOfficePreviewTimeoutMs,
      maxBuffer: 4 * 1024 * 1024,
    });

    const generatedPdf = path.join(workDir, `${path.basename(resolved.filePath, path.extname(resolved.filePath))}.pdf`);
    if (!fs.existsSync(generatedPdf)) {
      throw new Error('LibreOffice did not generate a preview PDF');
    }

    fs.copyFileSync(generatedPdf, cachedPdf);
    return cachedPdf;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

function requireDiskAdmin(req, res, next) {
  const expectedPassword = process.env.DISK_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const providedPassword = req.get('x-disk-password') || req.body?.adminPassword || '';

  if (!expectedPassword) {
    return res.status(500).json({ error: 'Disk password is not configured' });
  }

  if (providedPassword !== expectedPassword) {
    return res.status(401).json({ error: 'Invalid admin password' });
  }

  req.session.diskUnlocked = true;
  next();
}

function requireDiskUnlocked(req, res, next) {
  if (req.session?.diskUnlocked === true) {
    return next();
  }

  return res.status(401).json({ error: 'Disk is locked' });
}

const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      const relativeName = uniqueDiskRelativePath(file.originalname);
      file.diskRelativeName = relativeName;
      const destination = path.resolve(diskRoot, path.posix.dirname(relativeName));
      fs.mkdirSync(destination, { recursive: true });
      cb(null, destination);
    },
    filename: (_req, file, cb) => cb(null, path.posix.basename(file.diskRelativeName || file.originalname)),
  }),
  preservePath: true,
  limits: {
    fileSize: diskMaxFileSize,
  },
});

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

app.get('/api/disk/session', (req, res) => {
  res.json({ unlocked: req.session?.diskUnlocked === true });
});

app.post('/api/disk/unlock', requireDiskAdmin, (req, res) => {
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    res.json({ ok: true, unlocked: true });
  });
});

app.post('/api/disk/lock', (req, res) => {
  req.session.diskUnlocked = false;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    res.json({ ok: true, unlocked: false });
  });
});



app.get('/api/disk/preview/meta', requireDiskUnlocked, (req, res) => {
  const resolved = resolveDiskPreviewFile(req.query.path || '');
  if (!resolved) return res.status(404).json({ error: 'File not found' });

  res.json({
    ok: true,
    file: {
      name: path.basename(resolved.safeName),
      path: resolved.safeName,
      size: resolved.stat.size,
      modifiedAt: resolved.stat.mtime.toISOString(),
      kind: resolved.kind,
      previewable: resolved.kind !== 'unsupported',
    },
  });
});

app.get('/api/disk/preview/text', requireDiskUnlocked, (req, res) => {
  const resolved = resolveDiskPreviewFile(req.query.path || '');
  if (!resolved) return res.status(404).json({ error: 'File not found' });
  if (!['text', 'markdown'].includes(resolved.kind)) {
    return res.status(400).json({ error: 'This file is not a text preview' });
  }
  if (resolved.stat.size > diskTextPreviewMaxBytes) {
    return res.status(413).json({ error: `Text preview is limited to ${Math.round(diskTextPreviewMaxBytes / 1024 / 1024)} MB` });
  }

  res.json({
    ok: true,
    text: fs.readFileSync(resolved.filePath, 'utf8'),
  });
});

app.get('/api/disk/preview/raw', requireDiskUnlocked, (req, res) => {
  const resolved = resolveDiskPreviewFile(req.query.path || '');
  if (!resolved) return res.status(404).json({ error: 'File not found' });
  if (!['html', 'pdf', 'image'].includes(resolved.kind)) {
    return res.status(400).json({ error: 'This file cannot be served as a raw preview' });
  }

  res.setHeader('Content-Type', getDiskPreviewMimeType(resolved.safeName));
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(path.basename(resolved.safeName))}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (resolved.kind === 'html') {
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:");
  }
  res.sendFile(resolved.filePath);
});

app.get('/api/disk/preview/office', requireDiskUnlocked, async (req, res, next) => {
  try {
    const resolved = resolveDiskPreviewFile(req.query.path || '');
    if (!resolved) return res.status(404).json({ error: 'File not found' });
    if (resolved.kind !== 'office') {
      return res.status(400).json({ error: 'This file is not an Office document' });
    }

    const previewPdf = await getOfficePreviewPdf(resolved);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(`${path.basename(resolved.safeName)}.pdf`)}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(previewPdf);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
});


const completingDiskUploads = new Set();
const cancelledDiskUploads = new Set();

function getDiskUploadMergeTempPath(uploadId, finalPath) {
  return path.join(path.dirname(finalPath), `.${path.basename(finalPath)}.${sanitizeDiskSegment(uploadId)}.partial`);
}

function removeDiskUploadSession(uploadId) {
  const uploadDir = getDiskUploadDir(uploadId);
  if (fs.existsSync(uploadDir)) fs.rmSync(uploadDir, { recursive: true, force: true });
}

function markDiskUploadCancelled(uploadId) {
  cancelledDiskUploads.add(uploadId);
  // Keep the tombstone long enough for in-flight chunk requests to finish.
  // This prevents a late request from recreating a cancelled upload folder.
  setTimeout(() => cancelledDiskUploads.delete(uploadId), 5 * 60 * 1000).unref?.();
}

app.post('/api/disk/upload/start', requireDiskUnlocked, express.json({ limit: '2mb' }), (req, res) => {
  const {
    relativePath = '',
    size = 0,
    totalChunks = 0,
    chunkSize = 0,
    resumeUploadId = '',
  } = req.body || {};

  if (!String(relativePath).trim()) return res.status(400).json({ error: 'relativePath is required' });
  if (!Number.isFinite(Number(size)) || Number(size) < 0 || Number(size) > diskMaxFileSize) {
    return res.status(400).json({ error: 'Invalid file size' });
  }
  if (!Number.isInteger(Number(totalChunks)) || Number(totalChunks) < 1) {
    return res.status(400).json({ error: 'totalChunks must be a positive integer' });
  }
  if (!Number.isInteger(Number(chunkSize)) || Number(chunkSize) < 1) {
    return res.status(400).json({ error: 'chunkSize must be a positive integer' });
  }

  let meta = null;
  let resumed = false;
  const safeResumeUploadId = sanitizeDiskSegment(resumeUploadId);
  if (safeResumeUploadId && !completingDiskUploads.has(safeResumeUploadId)) {
    const candidate = readDiskUploadMeta(safeResumeUploadId);
    if (canResumeDiskUploadMeta(candidate, { relativePath, size, totalChunks, chunkSize })) {
      meta = refreshDiskUploadMeta(safeResumeUploadId, candidate);
      resumed = true;
    }
  }

  if (!meta) meta = createDiskUploadMeta({ relativePath, size, totalChunks, chunkSize });

  res.json({
    ok: true,
    resumed,
    uploadId: meta.uploadId,
    finalRelativePath: meta.finalRelativePath,
    chunkSize: meta.chunkSize,
    totalChunks: meta.totalChunks,
    receivedChunks: Number(meta.receivedChunks) || 0,
    receivedBytes: Number(meta.receivedBytes) || 0,
    receivedChunkIndexes: Array.isArray(meta.receivedChunkIndexes) ? meta.receivedChunkIndexes : [],
  });
});

app.get('/api/disk/upload/status', requireDiskUnlocked, (req, res) => {
  const uploadId = String(req.query.uploadId || '');
  if (!uploadId) return res.status(400).json({ error: 'uploadId is required' });
  if (completingDiskUploads.has(uploadId)) return res.status(409).json({ error: 'Upload is being finalized' });

  const meta = readDiskUploadMeta(uploadId);
  if (!meta) return res.status(404).json({ error: 'Upload session not found' });
  refreshDiskUploadMeta(uploadId, meta);

  res.json({
    ok: true,
    uploadId,
    totalChunks: Number(meta.totalChunks) || 0,
    receivedChunks: Number(meta.receivedChunks) || 0,
    receivedBytes: Number(meta.receivedBytes) || 0,
    receivedChunkIndexes: Array.isArray(meta.receivedChunkIndexes) ? meta.receivedChunkIndexes : [],
  });
});

app.post('/api/disk/upload/cancel', requireDiskUnlocked, express.json({ limit: '64kb' }), (req, res) => {
  const uploadId = String(req.body?.uploadId || '');
  if (!uploadId) return res.status(400).json({ error: 'uploadId is required' });
  if (completingDiskUploads.has(uploadId)) {
    return res.status(409).json({ error: 'Upload is already being finalized and can no longer be cancelled' });
  }

  markDiskUploadCancelled(uploadId);
  removeDiskUploadSession(uploadId);
  setTimeout(() => removeDiskUploadSession(uploadId), 1500).unref?.();
  res.json({ ok: true, cancelled: true, uploadId });
});

app.put('/api/disk/upload/chunk', requireDiskUnlocked, express.raw({ type: 'application/octet-stream', limit: diskChunkBodyLimit }), (req, res) => {
  const uploadId = String(req.query.uploadId || '');
  const chunkIndex = Number(req.query.chunkIndex);
  const totalChunks = Number(req.query.totalChunks || 0);

  if (!uploadId) return res.status(400).json({ error: 'uploadId is required' });
  if (cancelledDiskUploads.has(uploadId)) return res.status(410).json({ error: 'Upload session was cancelled' });
  if (completingDiskUploads.has(uploadId)) return res.status(409).json({ error: 'Upload is being finalized' });
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
    return res.status(400).json({ error: 'chunkIndex must be a non-negative integer' });
  }

  const meta = readDiskUploadMeta(uploadId);
  if (!meta) return res.status(404).json({ error: 'Upload session not found' });
  if (!Buffer.isBuffer(req.body)) return res.status(400).json({ error: 'Chunk body missing' });

  const configuredTotalChunks = Number(meta.totalChunks) || 0;
  if (!configuredTotalChunks || chunkIndex >= configuredTotalChunks) {
    return res.status(400).json({ error: 'chunkIndex is outside the upload range' });
  }
  if (totalChunks && configuredTotalChunks !== totalChunks) {
    return res.status(409).json({ error: 'Chunk count mismatch' });
  }

  const expectedSize = getExpectedDiskChunkSize(meta, chunkIndex);
  if (expectedSize === null || req.body.length !== expectedSize) {
    return res.status(409).json({ error: `Chunk size mismatch: expected ${expectedSize}, received ${req.body.length}` });
  }

  const partsDir = getDiskUploadPartsDir(uploadId);
  const chunkPath = getDiskUploadChunkPath(uploadId, chunkIndex);
  fs.mkdirSync(partsDir, { recursive: true });

  let alreadyReceived = false;
  if (fs.existsSync(chunkPath)) {
    const existingSize = fs.statSync(chunkPath).size;
    if (existingSize !== req.body.length) {
      return res.status(409).json({ error: 'A conflicting copy of this chunk already exists' });
    }
    alreadyReceived = true;
  } else {
    const temporaryChunkPath = `${chunkPath}.${randomUUID()}.tmp`;
    fs.writeFileSync(temporaryChunkPath, req.body);
    if (cancelledDiskUploads.has(uploadId)) {
      fs.rmSync(temporaryChunkPath, { force: true });
      removeDiskUploadSession(uploadId);
      return res.status(410).json({ error: 'Upload session was cancelled' });
    }
    fs.renameSync(temporaryChunkPath, chunkPath);
  }

  refreshDiskUploadMeta(uploadId, meta);

  res.json({
    ok: true,
    uploadId,
    chunkIndex,
    alreadyReceived,
    receivedChunks: meta.receivedChunks,
    receivedBytes: meta.receivedBytes,
    done: meta.totalChunks > 0 && meta.receivedChunks >= meta.totalChunks,
  });
});

app.post('/api/disk/upload/complete', requireDiskUnlocked, express.json({ limit: '2mb' }), async (req, res, next) => {
  const uploadId = String(req.body?.uploadId || '');
  if (!uploadId) return res.status(400).json({ error: 'uploadId is required' });
  if (cancelledDiskUploads.has(uploadId)) return res.status(410).json({ error: 'Upload session was cancelled' });
  if (completingDiskUploads.has(uploadId)) return res.status(409).json({ error: 'Upload is already being finalized' });

  completingDiskUploads.add(uploadId);
  let hiddenFinalPath = '';
  try {
    const meta = readDiskUploadMeta(uploadId);
    if (!meta) return res.status(404).json({ error: 'Upload session not found' });

    refreshDiskUploadMeta(uploadId, meta);
    const totalChunks = Number(meta.totalChunks) || 0;
    if (!totalChunks) return res.status(409).json({ error: 'Upload has no chunks' });

    const uploadDir = getDiskUploadDir(uploadId);
    const missingChunks = [];
    let totalBytes = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      const chunkPath = getDiskUploadChunkPath(uploadId, chunkIndex);
      if (!fs.existsSync(chunkPath)) {
        missingChunks.push(chunkIndex);
        continue;
      }
      const actualSize = fs.statSync(chunkPath).size;
      const expectedSize = getExpectedDiskChunkSize(meta, chunkIndex);
      if (expectedSize === null || actualSize !== expectedSize) {
        return res.status(409).json({ error: `Chunk ${chunkIndex} is invalid` });
      }
      totalBytes += actualSize;
    }

    if (missingChunks.length) {
      return res.status(409).json({ error: `Upload is not complete; missing chunks: ${missingChunks.slice(0, 20).join(', ')}` });
    }
    if (totalBytes !== Number(meta.size || 0)) {
      return res.status(409).json({ error: `Uploaded size mismatch: expected ${meta.size}, received ${totalBytes}` });
    }

    const finalRelativePath = fs.existsSync(path.resolve(diskRoot, meta.finalRelativePath))
      ? uniqueDiskRelativePath(meta.finalRelativePath)
      : meta.finalRelativePath;
    const finalPath = path.resolve(diskRoot, finalRelativePath);
    hiddenFinalPath = getDiskUploadMergeTempPath(uploadId, finalPath);
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.rmSync(hiddenFinalPath, { force: true });

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      await pipeline(
        fs.createReadStream(getDiskUploadChunkPath(uploadId, chunkIndex)),
        fs.createWriteStream(hiddenFinalPath, { flags: chunkIndex === 0 ? 'w' : 'a' }),
      );
    }

    const temporaryStat = fs.statSync(hiddenFinalPath);
    if (temporaryStat.size !== Number(meta.size || 0)) {
      fs.rmSync(hiddenFinalPath, { force: true });
      return res.status(409).json({ error: 'Merged file size mismatch' });
    }

    fs.renameSync(hiddenFinalPath, finalPath);
    hiddenFinalPath = '';
    removeDiskUploadSession(uploadId);

    const stat = fs.statSync(finalPath);
    res.json({
      ok: true,
      file: {
        name: path.basename(finalRelativePath),
        path: finalRelativePath,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        downloadUrl: `/api/disk/download?path=${encodeURIComponent(finalRelativePath)}`,
      },
    });
  } catch (error) {
    if (hiddenFinalPath) fs.rmSync(hiddenFinalPath, { force: true });
    next(error);
  } finally {
    completingDiskUploads.delete(uploadId);
  }
});

app.get('/api/disk/files', requireDiskUnlocked, (req, res) => {
  const currentPath = String(req.query.path || '');
  const resolved = resolveDiskPath(currentPath);
  if (!resolved || !fs.existsSync(resolved.filePath)) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  const stat = fs.statSync(resolved.filePath);
  if (!stat.isDirectory()) {
    return res.status(400).json({ error: 'Path is not a folder' });
  }

  const entries = fs.readdirSync(resolved.filePath, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.') && !entry.name.endsWith('.tmp') && !entry.name.endsWith('.partial'))
    .map((entry) => {
      const entryPath = resolved.safeName ? `${resolved.safeName}/${entry.name}` : entry.name;
      const filePath = path.join(resolved.filePath, entry.name);
      const entryStat = fs.statSync(filePath);
      return {
        name: entry.name,
        path: entryPath,
        type: entry.isDirectory() ? 'folder' : 'file',
        size: entry.isDirectory() ? 0 : entryStat.size,
        modifiedAt: entryStat.mtime.toISOString(),
        downloadUrl: entry.isDirectory() ? null : `/api/disk/download?path=${encodeURIComponent(entryPath)}`,
      };
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name, 'zh-CN');
    });

  res.json({ path: resolved.safeName, entries });
});

app.post('/api/disk/upload', requireDiskUnlocked, diskUpload.array('files', 500), (req, res) => {
  const uploadedFiles = req.files || [];
  if (!uploadedFiles.length) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    ok: true,
    files: uploadedFiles.map((file) => ({
      name: file.filename,
      path: file.diskRelativeName || file.filename,
      size: file.size,
      modifiedAt: new Date().toISOString(),
      downloadUrl: `/api/disk/download?path=${encodeURIComponent(file.diskRelativeName || file.filename)}`,
    })),
  });
});

app.get('/api/disk/download', requireDiskUnlocked, (req, res) => {
  const resolved = resolveDiskPath(req.query.path || '');
  if (!resolved || !fs.existsSync(resolved.filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stat = fs.statSync(resolved.filePath);
  if (!stat.isFile()) {
    return res.status(400).json({ error: 'Folders cannot be downloaded directly' });
  }

  res.download(resolved.filePath, path.basename(resolved.safeName));
});

app.get('/api/disk/download/:name', requireDiskUnlocked, (req, res) => {
  const resolved = resolveDiskPath(req.params.name);
  if (!resolved || !fs.existsSync(resolved.filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stat = fs.statSync(resolved.filePath);
  if (!stat.isFile()) {
    return res.status(400).json({ error: 'Folders cannot be downloaded directly' });
  }

  res.download(resolved.filePath, path.basename(resolved.safeName));
});

app.delete('/api/disk/files', requireDiskUnlocked, (req, res) => {
  const resolved = resolveDiskPath(req.body?.path || '');
  if (!resolved || !fs.existsSync(resolved.filePath) || resolved.filePath === diskRoot) {
    return res.status(404).json({ error: 'File or folder not found' });
  }

  fs.rmSync(resolved.filePath, { recursive: true, force: true });
  res.json({ ok: true });
});

app.delete('/api/disk/files/:name', requireDiskUnlocked, (req, res) => {
  const resolved = resolveDiskPath(req.params.name);
  if (!resolved || !fs.existsSync(resolved.filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.rmSync(resolved.filePath, { recursive: true, force: true });
  res.json({ ok: true });
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
