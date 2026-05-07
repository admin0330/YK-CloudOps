import fs from 'node:fs';
import path from 'node:path';

// Maximum file size to attempt extraction (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum extracted text length to store (120k chars)
const MAX_TEXT_LENGTH = 120000;

// Text-like extensions
const TEXT_EXTS = new Set([
  '.txt', '.md', '.json', '.csv', '.log', '.xml', '.html', '.htm',
  '.js', '.ts', '.tsx', '.jsx', '.css', '.scss', '.less',
  '.py', '.rb', '.java', '.c', '.cpp', '.h', '.hpp', '.go', '.rs',
  '.yaml', '.yml', '.toml', '.env', '.ini', '.cfg', '.conf',
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat',
  '.sql', '.r', '.m', '.swift', '.kt', '.scala', '.dart',
  '.vue', '.svelte', '.astro', '.graphql', '.prisma', '.php',
  '.svg',
]);

// MIME-based text types
const TEXT_MIME_PREFIXES = [
  'text/', 'application/json', 'application/javascript', 'application/xml',
  'application/x-httpd-php', 'application/x-sh', 'application/x-python',
  'application/x-yaml', 'application/x-toml', 'application/typescript',
  'application/x-shellscript', 'application/x-perl', 'application/x-ruby',
];

// Image MIME types — can't extract text
const IMAGE_MIME_PREFIXES = ['image/'];

function isImageType(mimeType) {
  return IMAGE_MIME_PREFIXES.some((p) => (mimeType || '').startsWith(p));
}

function isTextType(mimeType, fileName) {
  if (isImageType(mimeType)) return false;
  const ext = path.extname(fileName || '').toLowerCase();
  if (TEXT_EXTS.has(ext)) return true;
  return TEXT_MIME_PREFIXES.some((p) => (mimeType || '').startsWith(p));
}

function isPdfType(mimeType, fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  return ext === '.pdf' || (mimeType || '') === 'application/pdf';
}

function isDocxType(mimeType, fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  return (
    ext === '.docx' ||
    (mimeType || '') === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

function isXlsxType(mimeType, fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  return (
    ext === '.xlsx' ||
    (mimeType || '') === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

/**
 * Safely resolve a file path within the uploads directory.
 * Returns null if the path would escape the uploads root.
 */
export function safeFilePath(uploadsDir, storedName) {
  if (!storedName || storedName.includes('..') || storedName.includes('/') || storedName.includes('\\')) {
    return null;
  }
  const normalizedRoot = path.resolve(uploadsDir);
  const resolved = path.resolve(normalizedRoot, storedName);
  if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
    return null;
  }
  return resolved;
}

/**
 * Extract text content from a file.
 *
 * @param {string} uploadsDir — absolute path to the uploads root directory
 * @param {string} storedName — safe file name (no path separators)
 * @param {string} mimeType
 * @param {string} originalName
 * @returns {Promise<{status: string, text: string, error: string|null, textLength: number}>}
 */
export async function extractTextFromFile(uploadsDir, storedName, mimeType, originalName) {
  const filePath = safeFilePath(uploadsDir, storedName);
  if (!filePath) {
    return { status: 'failed', text: '', error: 'Invalid file path', textLength: 0 };
  }

  if (!fs.existsSync(filePath)) {
    return { status: 'failed', text: '', error: 'File not found on disk', textLength: 0 };
  }

  // Check file size
  let stat;
  try { stat = fs.statSync(filePath); } catch {
    return { status: 'failed', text: '', error: 'Cannot stat file', textLength: 0 };
  }

  if (stat.size > MAX_FILE_SIZE) {
    return { status: 'too_large', text: '', error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, textLength: 0 };
  }

  // Images — no text extraction
  if (isImageType(mimeType)) {
    return { status: 'unsupported', text: '', error: 'Image files cannot be read as text', textLength: 0 };
  }

  try {
    let text = '';

    if (isPdfType(mimeType, originalName)) {
      text = await extractPdf(filePath);
    } else if (isDocxType(mimeType, originalName)) {
      text = await extractDocx(filePath);
    } else if (isXlsxType(mimeType, originalName)) {
      // XLSX — currently unsupported for text extraction (would need xlsx package)
      return { status: 'unsupported', text: '', error: 'Excel files are not yet supported for text extraction', textLength: 0 };
    } else if (isTextType(mimeType, originalName)) {
      text = extractTextFile(filePath);
    } else {
      return { status: 'unsupported', text: '', error: 'File type not supported for text extraction', textLength: 0 };
    }

    // Truncate if too long
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH) + '\n\n[内容过长，已截断]';
    }

    return { status: 'success', text, error: null, textLength: Math.min(text.length, MAX_TEXT_LENGTH) };
  } catch (err) {
    return { status: 'failed', text: '', error: (err && err.message) ? err.message : 'Extraction error', textLength: 0 };
  }
}

function extractTextFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

async function extractPdf(filePath) {
  const { PDFParse } = await import('pdf-parse');
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  return result.text || '';
}

async function extractDocx(filePath) {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || '';
}
