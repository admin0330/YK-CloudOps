import { Router } from 'express';
import { Client } from 'ssh2';
import os from 'node:os';
import { execSync } from 'node:child_process';
import {
  listServers,
  findServerById,
  insertServer,
  updateServer,
  deleteServer,
  insertCommandLog,
  listCommandLogs,
  listCommandLogsByServer,
} from '../db.js';

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

router.use('/admin/servers', requireAdmin);

// ── Dangerous command blocklist ─────────────────────────────
const DANGEROUS_PATTERNS = [
  /\brm\s+.*-rf\b/i,
  /\brm\s+.*-r\s+.*\/($|\s)/i,
  /\bmkfs\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\bhalt\b/i,
  /\bpoweroff\b/i,
  /\bdd\s+if=/i,
  /\b>:\\?\s*\/dev\//i,
  /\bfork\s*bomb\b/i,
  /\b:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/i,
  /\bchmod\s+.*777\s+\//i,
  /\bwget\s+.*\|\s*(ba)?sh\b/i,
  /\bcurl\s+.*\|\s*(ba)?sh\b/i,
];

function isDangerous(command) {
  return DANGEROUS_PATTERNS.some((p) => p.test(command));
}

// ── SSH execution helper ────────────────────────────────────
function execSSH(server, command, timeout = 30000) {
  return new Promise((resolve) => {
    const client = new Client();
    const result = { stdout: '', stderr: '', exitCode: null, error: null };
    const timer = setTimeout(() => {
      client.end();
      resolve({ ...result, error: 'SSH command timed out', exitCode: -1 });
    }, timeout);

    client.on('ready', () => {
      client.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          client.end();
          resolve({ ...result, error: err.message, exitCode: -1 });
          return;
        }
        stream.on('data', (data) => { result.stdout += data.toString(); });
        stream.stderr.on('data', (data) => { result.stderr += data.toString(); });
        stream.on('close', (code) => {
          clearTimeout(timer);
          result.exitCode = code;
          client.end();
          resolve(result);
        });
      });
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ...result, error: err.message, exitCode: -1 });
    });

    client.connect({
      host: server.ip,
      port: server.port || 22,
      username: server.username || 'root',
      readyTimeout: 10000,
    });
  });
}

// ── GET /api/admin/servers ──────────────────────────────────
router.get('/admin/servers', (_req, res) => {
  try {
    const servers = listServers.all();
    res.json({ servers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/servers/:id ──────────────────────────────
router.get('/admin/servers/:id', (req, res) => {
  try {
    const server = findServerById.get(req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    res.json({ server });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/servers ─────────────────────────────────
router.post('/admin/servers', (req, res) => {
  try {
    const { name, ip, port, username, authNote } = req.body;
    if (!name || !ip) {
      return res.status(400).json({ error: 'Name and IP are required' });
    }
    const info = insertServer.run(
      name.trim(),
      ip.trim(),
      port || 22,
      username || 'root',
      authNote || ''
    );
    res.json({ id: info.lastInsertRowid, message: 'Server added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/admin/servers/:id ────────────────────────────
router.patch('/admin/servers/:id', (req, res) => {
  try {
    const server = findServerById.get(req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    const { name, ip, port, username, authNote } = req.body;
    updateServer.run(
      name ?? server.name,
      ip ?? server.ip,
      port ?? server.port,
      username ?? server.username,
      authNote ?? server.authNote,
      server.id
    );
    res.json({ message: 'Server updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/servers/:id ───────────────────────────
router.delete('/admin/servers/:id', (req, res) => {
  try {
    const server = findServerById.get(req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    deleteServer.run(server.id);
    res.json({ message: 'Server deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/servers/:id/exec ────────────────────────
router.post('/admin/servers/:id/exec', async (req, res) => {
  try {
    const server = findServerById.get(req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    const { command } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ error: 'Command is required' });
    }

    if (isDangerous(command)) {
      // Log the blocked attempt
      insertCommandLog.run(server.id, req.session.user.id, command, '', 'BLOCKED: dangerous command', -1);
      return res.status(403).json({ error: 'Command blocked for safety reasons' });
    }

    const result = await execSSH(server, command.trim());

    // Log the command
    insertCommandLog.run(
      server.id,
      req.session.user.id,
      command.trim(),
      result.stdout || '',
      result.stderr || result.error || '',
      result.exitCode
    );

    res.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode,
      error: result.error || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/servers/:id/logs ─────────────────────────
router.get('/admin/servers/:id/logs', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const logs = listCommandLogsByServer.all(req.params.id, limit);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/logs ─────────────────────────────────────
router.get('/admin/logs', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const logs = listCommandLogs.all(limit);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/system/status ────────────────────────────
router.get('/admin/system/status', requireAdmin, (_req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const uptime = os.uptime();

    // Calculate CPU usage from os.loadavg()
    const loadAvg = os.loadavg();

    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime,
      uptimeFormatted: formatUptime(uptime),
      cpu: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
        loadAvg1: loadAvg[0],
        loadAvg5: loadAvg[1],
        loadAvg15: loadAvg[2],
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        usagePercent: ((totalMem - freeMem) / totalMem * 100).toFixed(1),
      },
      disk: getDiskUsage(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

function getDiskUsage() {
  try {
    const out = execSync("df -h / | tail -1 | awk '{print $2,$3,$4,$5}'", { encoding: 'utf-8', timeout: 5000 }).trim();
    const [total, used, avail, pct] = out.split(/\s+/);
    return { total, used, avail, usagePercent: pct };
  } catch {
    return { total: 'N/A', used: 'N/A', avail: 'N/A', usagePercent: 'N/A' };
  }
}

export default router;
