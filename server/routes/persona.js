import { Router } from 'express';
import { getSetting, setSetting, getUserPersona, updateUserPersona, findUserByUsername } from '../db.js';

const router = Router();
const MAX_PERSONA_LENGTH = 4000;

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

function readGlobalPersona() {
  const contentRow = getSetting.get('global_persona_content');
  const enabledRow = getSetting.get('global_persona_enabled');
  return {
    enabled: enabledRow ? enabledRow.value === 'true' : false,
    content: contentRow ? contentRow.value : '',
  };
}

// GET /api/admin/persona
router.get('/admin/persona', requireAdmin, (_req, res) => {
  res.json(readGlobalPersona());
});

// PUT /api/admin/persona
router.put('/admin/persona', requireAdmin, (req, res) => {
  let { enabled, content } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled must be a boolean' });
  }

  content = (content || '').trim();

  if (content.length > MAX_PERSONA_LENGTH) {
    return res.status(400).json({ error: `Content exceeds maximum length of ${MAX_PERSONA_LENGTH} characters` });
  }

  // If content is empty/blank, force enabled to false
  if (!content && enabled) {
    enabled = false;
  }

  setSetting.run('global_persona_content', content);
  setSetting.run('global_persona_enabled', String(enabled));

  res.json({ enabled, content });
});

// GET /api/me/persona
router.get('/me/persona', requireAuth, (req, res) => {
  const row = getUserPersona.get(req.session.user.id);
  res.json({
    enabled: row ? !!row.personaEnabled : false,
    content: row ? (row.personaContent || '') : '',
  });
});

// PUT /api/me/persona
router.put('/me/persona', requireAuth, (req, res) => {
  let { enabled, content } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled must be a boolean' });
  }

  content = (content || '').trim();

  if (content.length > MAX_PERSONA_LENGTH) {
    return res.status(400).json({ error: `Content exceeds maximum length of ${MAX_PERSONA_LENGTH} characters` });
  }

  if (!content && enabled) {
    enabled = false;
  }

  updateUserPersona.run(content, enabled ? 1 : 0, req.session.user.id);

  res.json({ enabled, content });
});

// GET /api/persona/effective
router.get('/persona/effective', requireAuth, (_req, res) => {
  const global = readGlobalPersona();
  const userRow = getUserPersona.get(_req.session.user.id);
  const personal = {
    enabled: userRow ? !!userRow.personaEnabled : false,
    content: userRow ? (userRow.personaContent || '') : '',
  };

  res.json({ global, personal });
});

// Export helpers for use in chat.js
export { readGlobalPersona };

export default router;
