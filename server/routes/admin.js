import { Router } from 'express';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findUserByUsername,
  findUserById,
  insertUser,
  updateUserStatus,
  updateUserPassword,
  updateUserUsername,
  isUsernameTaken,
  listUsers,
  deleteUser,
  getStats,
  updateUserLastLogin,
  findUploadById,
} from '../db.js';
import { buildImageContentBlocks, isImageUnderstandingEnabled } from '../services/imageInput.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');

const router = Router();

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// POST /api/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = findUserByUsername.get(username);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    updateUserLastLogin.run(user.id);

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    };

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session error' });
      }
      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
        },
      });
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/me
router.get('/admin/me', requireAdmin, (req, res) => {
  const user = findUserById.get(req.session.user.id);
  res.json({ user });
});

// POST /api/admin/logout
router.post('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// GET /api/admin/stats
router.get('/admin/stats', requireAdmin, (req, res) => {
  const stats = getStats.get();
  res.json({ stats });
});

// GET /api/admin/users
router.get('/admin/users', requireAdmin, (req, res) => {
  const users = listUsers.all();
  res.json({ users });
});

// POST /api/admin/users (create user)
router.post('/admin/users', requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existing = findUserByUsername.get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    insertUser.run(username, passwordHash, role === 'admin' ? 'admin' : 'user', 'active');

    res.json({ message: 'User created' });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id
router.patch('/admin/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, role } = req.body;

  const user = findUserById.get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin' && user.username === (process.env.ADMIN_USERNAME || 'admin')) {
    return res.status(403).json({ error: 'Cannot modify the primary admin account' });
  }

  if (status) {
    if (user.role === 'admin' && status !== 'active') {
      return res.status(403).json({ error: 'Cannot disable admin accounts' });
    }
    updateUserStatus.run(status, id);
  }

  if (role && user.role !== 'admin') {
    // Allow role change for non-admin users
    db.prepare('UPDATE users SET role = ?, updatedAt = datetime(\'now\') WHERE id = ?').run(role, id);
  }

  res.json({ message: 'User updated' });
});

import db from '../db.js';

// PATCH /api/admin/users/:id/password
router.patch('/admin/users/:id/password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = findUserById.get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const passwordHash = await bcrypt.hash(password, 10);
    updateUserPassword.run(passwordHash, id);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id/username — update username
router.patch('/admin/users/:id/username', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username || username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    const user = findUserById.get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check for duplicate username
    const existing = isUsernameTaken.get(username, id);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    updateUserUsername.run(username, id);
    res.json({ message: 'Username updated', username });
  } catch (err) {
    console.error('Username update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id/status — update user status
router.patch('/admin/users/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'pending', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: active, pending, or disabled' });
    }

    const user = findUserById.get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Protect primary admin
    if (user.role === 'admin' && user.username === (process.env.ADMIN_USERNAME || 'admin')) {
      return res.status(403).json({ error: 'Cannot modify the primary admin account' });
    }

    // Cannot disable admin accounts
    if (user.role === 'admin' && status !== 'active') {
      return res.status(403).json({ error: 'Cannot disable admin accounts' });
    }

    updateUserStatus.run(status, id);
    res.json({ message: 'User status updated', status });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const user = findUserById.get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'Cannot delete admin accounts' });
  }

  const result = deleteUser.run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ message: 'User deleted' });
});

// GET /api/admin/deepseek/balance — fetch DeepSeek account balance
router.get('/admin/deepseek/balance', requireAdmin, async (req, res) => {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

    if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
      return res.json({ isAvailable: false, error: 'DeepSeek API Key 未配置', balances: [], usageUrl: 'https://platform.deepseek.com/usage' });
    }

    const response = await fetch(`${baseUrl}/user/balance`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) {
      return res.json({ isAvailable: false, error: 'DeepSeek API Key 无效或权限不足', balances: [], usageUrl: 'https://platform.deepseek.com/usage' });
    }
    if (response.status === 402) {
      return res.json({ isAvailable: false, error: 'DeepSeek 余额不足', balances: [], usageUrl: 'https://platform.deepseek.com/usage' });
    }
    if (!response.ok) {
      return res.json({ isAvailable: false, error: '无法连接 DeepSeek 余额接口', balances: [], usageUrl: 'https://platform.deepseek.com/usage' });
    }

    const data = await response.json();

    const balances = (data.balance_infos || []).map((b) => ({
      currency: b.currency || '',
      totalBalance: b.total_balance || '0',
      grantedBalance: b.granted_balance || '0',
      toppedUpBalance: b.topped_up_balance || '0',
    }));

    res.json({
      isAvailable: data.is_available ?? false,
      balances,
      usageUrl: 'https://platform.deepseek.com/usage',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('DeepSeek balance fetch error:', err.message);
    res.json({ isAvailable: false, error: '无法连接 DeepSeek 余额接口', balances: [], usageUrl: 'https://platform.deepseek.com/usage' });
  }
});

// POST /api/admin/vision-test — test image understanding with a file
router.post('/admin/vision-test', requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    const file = findUploadById.get(fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const mime = (file.mimeType || '').toLowerCase();
    if (!mime.startsWith('image/')) {
      return res.status(400).json({ error: 'Selected file is not an image' });
    }

    if (!isImageUnderstandingEnabled()) {
      return res.json({
        supported: false,
        message: 'Image understanding is disabled in server configuration (ENABLE_IMAGE_UNDERSTANDING=false)',
        file: {
          id: file.id,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
        },
      });
    }

    const { blocks, warnings, imageCount } = buildImageContentBlocks(uploadsDir, [{ file }]);

    if (imageCount === 0) {
      return res.json({
        supported: false,
        message: warnings.join('; ') || 'Could not read image file',
        file: {
          id: file.id,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
        },
        warnings,
      });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const model = process.env.VISION_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';

    if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
      return res.status(500).json({ error: 'DeepSeek API key not configured' });
    }

    const apiMessages = [
      { role: 'system', content: 'You are a vision test. Reply concisely.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请用一句话描述这张图片。Please describe this image in one sentence.' },
          ...blocks,
        ],
      },
    ];

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: apiMessages, temperature: 0.7, max_tokens: 256 }),
    });

    if (!response.ok) {
      const errText = await response.text();
      const errLower = errText.toLowerCase();
      const isVisionError =
        errLower.includes('image_url') || errLower.includes('image') ||
        errLower.includes('vision') || errLower.includes('multimodal') ||
        errLower.includes('invalid content') || errLower.includes('unsupported');

      if (isVisionError) {
        return res.json({
          supported: false,
          message: '当前模型或 API 端点不支持图片输入',
          file: {
            id: file.id,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
          },
        });
      }

      return res.status(502).json({
        supported: false,
        message: `API error: ${response.status}`,
        error: errText.slice(0, 300),
      });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    res.json({
      supported: true,
      result,
      model,
      file: {
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
      },
    });
  } catch (err) {
    console.error('Vision test error:', err.message);
    res.status(500).json({ error: 'Vision test failed' });
  }
});

export default router;
