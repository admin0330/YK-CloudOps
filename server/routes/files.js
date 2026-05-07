import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { insertUpload, listUploads, findUploadById, deleteUpload, updateUploadExtraction } from '../db.js';
import { extractTextFromFile } from '../services/fileExtractor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

const uploadDir = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const normalizedUploadDir = path.resolve(uploadDir);

function safeFilePath(storedName) {
  if (!storedName || storedName.includes('..') || storedName.includes('/') || storedName.includes('\\')) {
    return null;
  }
  const resolved = path.resolve(normalizedUploadDir, storedName);
  if (!resolved.startsWith(normalizedUploadDir + path.sep) && resolved !== normalizedUploadDir) {
    return null;
  }
  return resolved;
}

function serveFileInline(req, res, file) {
  const filePath = safeFilePath(file.storedName);
  if (!filePath) return res.status(403).json({ error: 'Access denied' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

  const isImage = (file.mimeType || '').startsWith('image/');
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', isImage ? `inline; filename="${encodeURIComponent(file.originalName)}"` : `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  fs.createReadStream(filePath).pipe(res);
}

// Check file access: admin can access all, regular users can only access their own
function canAccessFile(user, file) {
  if (user.role === 'admin') return true;
  return file.uploadedBy === user.id;
}

// ── Trigger text extraction for an upload record ──
async function extractAndSave(file) {
  try {
    const result = await extractTextFromFile(
      normalizedUploadDir,
      file.storedName,
      file.mimeType,
      file.originalName
    );
    updateUploadExtraction.run(
      result.text || '',
      result.status,
      result.error || null,
      result.textLength,
      file.id
    );
    return result;
  } catch (err) {
    updateUploadExtraction.run('', 'failed', (err && err.message) || 'Extraction error', 0, file.id);
    return { status: 'failed', text: '', error: (err && err.message) || 'Extraction error', textLength: 0 };
  }
}

const maxSize = parseInt(process.env.MAX_UPLOAD_MB || '50', 10) * 1024 * 1024;

const ALLOWED_EXTS = [
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg',
  '.zip', '.txt', '.md', '.json', '.pdf', '.docx', '.xlsx', '.csv',
  '.mp3', '.mp4', '.mov', '.avi', '.webm',
  '.xml', '.html', '.js', '.ts', '.tsx', '.jsx', '.css',
  '.py', '.java', '.c', '.cpp', '.go', '.rs', '.yaml', '.yml', '.log',
];

function fileFilter(_req, file, cb) {
  // Accept all file types
  cb(null, true);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage, limits: { fileSize: maxSize }, fileFilter });

// POST /api/admin/files/upload — admin upload with extraction
router.post('/admin/files/upload', requireAdmin, async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: `File too large. Maximum size is ${process.env.MAX_UPLOAD_MB || 50}MB` });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = insertUpload.run(
      req.file.originalname,
      req.file.filename,
      req.file.mimetype,
      req.file.size,
      req.session.user.id
    );
    const fileId = result.lastInsertRowid;

    // Trigger async extraction (don't block response)
    const file = findUploadById.get(fileId);
    extractAndSave(file).catch(() => {});

    res.json({
      message: 'File uploaded',
      file: {
        id: fileId,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        extractStatus: 'pending',
        textLength: 0,
      },
    });
  });
});

// GET /api/admin/files — list all files
router.get('/admin/files', requireAdmin, (req, res) => {
  const files = listUploads.all();
  // Strip extractedText from list response (too heavy)
  const safe = files.map((f) => ({
    id: f.id,
    originalName: f.originalName,
    storedName: f.storedName,
    mimeType: f.mimeType,
    size: f.size,
    uploadedBy: f.uploadedBy,
    extractStatus: f.extractStatus || 'pending',
    textLength: f.textLength || 0,
    extractedAt: f.extractedAt || null,
    createdAt: f.createdAt,
  }));
  res.json({ files: safe });
});

// GET /api/files/:id/preview — inline preview (auth required)
router.get('/files/:id/preview', requireAuth, (req, res) => {
  const file = findUploadById.get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  if (!canAccessFile(req.session.user, file)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  serveFileInline(req, res, file);
});

// GET /api/files/:id/download — force download (auth required)
router.get('/files/:id/download', requireAuth, (req, res) => {
  const file = findUploadById.get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  if (!canAccessFile(req.session.user, file)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const filePath = safeFilePath(file.storedName);
  if (!filePath) return res.status(403).json({ error: 'Access denied' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  res.download(filePath, file.originalName);
});

// GET /api/files/:id/text — view extracted text
router.get('/files/:id/text', requireAuth, (req, res) => {
  const file = findUploadById.get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  if (!canAccessFile(req.session.user, file)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const status = file.extractStatus || 'pending';

  if (status === 'unsupported') {
    return res.json({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      extractStatus: 'unsupported',
      message: 'This file type does not support text extraction',
    });
  }

  if (status === 'pending') {
    return res.json({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      extractStatus: 'pending',
      message: 'Text extraction is still in progress',
    });
  }

  if (status === 'too_large') {
    return res.json({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      extractStatus: 'too_large',
      message: 'File is too large for text extraction (max 10MB)',
    });
  }

  if (status === 'failed') {
    return res.json({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      extractStatus: 'failed',
      message: 'Text extraction failed',
      error: file.extractError ? String(file.extractError).slice(0, 200) : null,
    });
  }

  // status === 'success'
  res.json({
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    extractStatus: 'success',
    textLength: file.textLength || 0,
    text: file.extractedText || '',
  });
});

// POST /api/files/:id/reextract — re-extract text from a file
router.post('/files/:id/reextract', requireAuth, async (req, res) => {
  const file = findUploadById.get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  if (!canAccessFile(req.session.user, file)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const result = await extractAndSave(file);

  res.json({
    id: file.id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    extractStatus: result.status,
    textLength: result.textLength,
    error: result.error ? String(result.error).slice(0, 200) : null,
  });
});

// GET /api/admin/files/:id/preview — admin preview (convenience alias)
router.get('/admin/files/:id/preview', requireAdmin, (req, res) => {
  const file = findUploadById.get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  serveFileInline(req, res, file);
});

// GET /api/admin/files/:id/download — force download (admin)
router.get('/admin/files/:id/download', requireAdmin, (req, res) => {
  const file = findUploadById.get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const filePath = safeFilePath(file.storedName);
  if (!filePath) return res.status(403).json({ error: 'Access denied' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  res.download(filePath, file.originalName);
});

// DELETE /api/admin/files/:id
router.delete('/admin/files/:id', requireAdmin, (req, res) => {
  const file = findUploadById.get(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const filePath = safeFilePath(file.storedName);
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  deleteUpload.run(req.params.id);
  res.json({ message: 'File deleted' });
});

export default router;
