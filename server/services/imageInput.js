import fs from 'node:fs';
import path from 'node:path';
import { safeFilePath } from './fileExtractor.js';

// Maximum single image size for vision: 5MB
const MAX_IMAGE_BYTES = parseInt(process.env.MAX_IMAGE_PROMPT_MB || '5', 10) * 1024 * 1024;

// Maximum images per message
const MAX_IMAGES_PER_MESSAGE = parseInt(process.env.MAX_IMAGES_PER_MESSAGE || '4', 10);

// Supported image MIME types
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

/**
 * Read image file from disk, convert to base64 data URI for OpenAI-compatible vision API.
 * Returns null if file is too large, missing, or unsupported type.
 */
function readImageAsDataUri(uploadsDir, storedName, mimeType) {
  const filePath = safeFilePath(uploadsDir, storedName);
  if (!filePath || !fs.existsSync(filePath)) return null;

  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_IMAGE_BYTES) {
      return { error: 'too_large', maxBytes: MAX_IMAGE_BYTES, actualBytes: stat.size };
    }
  } catch {
    return null;
  }

  try {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const mediaType = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
    return { dataUri: `data:${mediaType};base64,${base64}` };
  } catch {
    return null;
  }
}

/**
 * Build OpenAI-compatible vision content blocks from image attachments.
 *
 * @param {string} uploadsDir — absolute path to uploads directory
 * @param {Array} imageAttachments — array of { file } from DB (must have storedName, mimeType, originalName, id, size)
 * @returns {Object} { blocks: [...], warnings: [...], imageCount: number }
 *
 *   blocks: OpenAI content blocks like [{ type: "image_url", image_url: { url: "data:..." } }, ...]
 *   warnings: human-readable warnings for images that were skipped
 */
export function buildImageContentBlocks(uploadsDir, imageAttachments) {
  const blocks = [];
  const warnings = [];

  for (const { file } of imageAttachments.slice(0, MAX_IMAGES_PER_MESSAGE)) {
    const mime = (file.mimeType || '').toLowerCase();

    // GIF warning
    let gifWarning = '';
    if (mime === 'image/gif') {
      gifWarning = ` (注意：GIF 动图可能只被读取为静态帧，动画无法被完整理解)`;
    }

    if (!SUPPORTED_IMAGE_TYPES.has(mime)) {
      warnings.push(`文件 ${file.originalName} (${mime}) 不是支持的图片格式`);
      continue;
    }

    const result = readImageAsDataUri(uploadsDir, file.storedName, mime);

    if (!result) {
      warnings.push(`图片 ${file.originalName} 读取失败，可能已被删除`);
      continue;
    }

    if (result.error === 'too_large') {
      const maxMB = (result.maxBytes / (1024 * 1024)).toFixed(1);
      const actualMB = (result.actualBytes / (1024 * 1024)).toFixed(1);
      warnings.push(`图片 ${file.originalName} 过大 (${actualMB}MB，上限 ${maxMB}MB)，已跳过`);
      continue;
    }

    blocks.push({
      type: 'image_url',
      image_url: {
        url: result.dataUri,
      },
    });

    // Include a brief note for the model about the file
    if (gifWarning) {
      blocks.push({
        type: 'text',
        text: `[系统提示：用户上传了 ${file.originalName}${gifWarning}]`,
      });
    }
  }

  if (imageAttachments.length > MAX_IMAGES_PER_MESSAGE) {
    warnings.push(`一次最多发送 ${MAX_IMAGES_PER_MESSAGE} 张图片，已忽略多余的 ${imageAttachments.length - MAX_IMAGES_PER_MESSAGE} 张`);
  }

  return { blocks, warnings, imageCount: blocks.filter(b => b.type === 'image_url').length };
}

/**
 * Check if vision/image understanding is enabled in env config.
 */
export function isImageUnderstandingEnabled() {
  const val = (process.env.ENABLE_IMAGE_UNDERSTANDING || 'true').toLowerCase();
  return val === 'true' || val === '1' || val === 'yes';
}

/**
 * Map model preference to a vision-capable model.
 * Falls back to the configured VISION_MODEL env var, or the provided model.
 */
export function resolveVisionModel(modelPref) {
  if (process.env.VISION_MODEL) return process.env.VISION_MODEL;
  return modelPref;
}
