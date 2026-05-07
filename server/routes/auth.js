import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  findUserByUsername,
  findUserById,
  insertUser,
  updateUserLastLogin,
} from '../db.js';

const router = Router();

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!process.env.ALLOW_REGISTER || process.env.ALLOW_REGISTER === 'false') {
      return res.status(403).json({ error: 'Registration is currently disabled' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = findUserByUsername.get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    insertUser.run(username, passwordHash, 'user', 'pending');

    res.json({ message: 'Registration successful. Please wait for admin approval.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = findUserByUsername.get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Account pending activation. Please wait for admin approval. / 账号待启用，请等待管理员处理' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Account has been disabled. Contact the administrator. / 账号已禁用，请联系管理员' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
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
        console.error('Session save error:', err);
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
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// GET /api/auth/me
router.get('/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = findUserById.get(req.session.user.id);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'User not found' });
  }
  res.json({ user });
});

export default router;
