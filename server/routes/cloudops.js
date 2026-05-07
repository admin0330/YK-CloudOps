import { Router } from 'express';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { insertCloudOpsLog, listCloudOpsLogs } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// ── Command Whitelist ───────────────────────────────────────────

const SAFE_SERVICES = ['yk-intelligence', 'nginx', 'clash', 'ssh', 'ym1r'];

const ALLOWED_COMMANDS = [
  // Read-only
  'uptime', 'whoami', 'hostname', 'df -h', 'free -h', 'top -bn1', 'ps aux',
  'ss -tulpen', 'node -v', 'npm -v', 'git status', 'git log --oneline -n 5',
  ...SAFE_SERVICES.map(s => `systemctl status ${s}`),
  ...SAFE_SERVICES.map(s => `journalctl -u ${s} -n 100 --no-pager`),
  ...SAFE_SERVICES.map(s => `systemctl restart ${s}`),
  ...SAFE_SERVICES.map(s => `systemctl start ${s}`),
  ...SAFE_SERVICES.map(s => `systemctl stop ${s}`),
];

const BLOCKED_PATTERNS = [
  /\brm\s/, /\brmdir\s/, /\bmkfs\b/, /\bdd\s/, /chmod\s+777/, /chown\s+-R/,
  /curl\s.*\|/, /wget\s.*\|/, /\bsudo\s+su\b/, /\bpasswd\b/, /\buseradd\b/,
  /\buserdel\b/, /\biptables\b/, /\bnft\b/, /\breboot\b/, /\bshutdown\b/,
  /\bpoweroff\b/, /kill\s+-9/, /\/etc\/ssh/, /\bDROP\b/, /\bACCEPT\b/,
  /\.env/, /API.?KEY/i, /TOKEN/i, /PASSWORD/i, /SECRET/i,
  />\s*\/dev\/sda/, /mkfs\./, /:\(\)\s*\{/, /fork\s*bomb/i,
  /rm\s+-rf\s+\/$/, /rm\s+-rf\s+\/\*/, /rm\s+-rf\s+\/home/, /rm\s+-rf\s+\/etc/,
  />\s*\/etc\//, /delete\s+from/i, /drop\s+table/i, /sqlite3.*\.db/,
];

function isCommandAllowed(cmd) {
  const trimmed = cmd.trim();
  for (const allowed of ALLOWED_COMMANDS) {
    if (trimmed === allowed) return true;
  }
  // Allow systemctl status/restart/start/stop on whitelisted services
  const sysMatch = trimmed.match(/^systemctl\s+(status|restart|start|stop)\s+([\w-]+)\s*$/);
  if (sysMatch && SAFE_SERVICES.includes(sysMatch[2])) return true;
  // Allow journalctl on whitelisted services
  const jrnMatch = trimmed.match(/^journalctl\s+-u\s+([\w-]+)\s+-n\s+(\d+)\s+--no-pager\s*$/);
  if (jrnMatch && SAFE_SERVICES.includes(jrnMatch[1])) return true;
  return false;
}

function isCommandBlocked(cmd) {
  return BLOCKED_PATTERNS.some(p => p.test(cmd));
}

function assessRisk(cmd) {
  if (/restart|stop|start/.test(cmd)) return 'medium';
  if (/status|journalctl/.test(cmd)) return 'low';
  return 'low';
}

// ── Output Redaction ────────────────────────────────────────────
const REDACT_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g,
  /Authorization[:\s]+[a-zA-Z0-9\-._~+/]+=*/gi,
  /API[_-]?KEY[=:\s]*[a-zA-Z0-9\-._]+/gi,
  /TOKEN[=:\s]*[a-zA-Z0-9\-._]+/gi,
  /SECRET[=:\s]*[a-zA-Z0-9\-._]+/gi,
  /PASSWORD[=:\s]*\S+/gi,
  /DEEPSEEK_API_KEY[=:\s]*\S+/gi,
  /SESSION_SECRET[=:\s]*\S+/gi,
  /ADMIN_PASSWORD[=:\s]*\S+/gi,
];

function redactOutput(text) {
  let out = text;
  for (const p of REDACT_PATTERNS) {
    out = out.replace(p, '[REDACTED]');
  }
  return out;
}

// ── CloudOps AI System Prompt ───────────────────────────────────

const CLOUDOPS_SYSTEM_PROMPT = `你 是 Ym1r 的安全 CloudOps 助手。
你只能帮助管理员生成服务器运维建议和安全命令。
你不能生成危险命令。
你不能读取或暴露 API Key、token、密码、.env 内容。
你不能建议删除数据、格式化磁盘、关闭服务器、破坏系统。

安全服务白名单（只能操作这些服务）：
${SAFE_SERVICES.join(', ')}

允许的命令类型：
- 查看：uptime, whoami, hostname, df -h, free -h, top -bn1, ps aux, ss -tulpen, systemctl status <service>, journalctl -u <service> -n 100 --no-pager, node -v, npm -v, git status, git log --oneline -n 5
- 服务管理：systemctl restart <service>, systemctl start <service>, systemctl stop <service>（只能是白名单服务）

禁止的命令：rm, rmdir, mkfs, dd, chmod 777, chown -R, curl | sh, wget | sh, sudo su, passwd, useradd, userdel, iptables, nft, reboot, shutdown, poweroff, kill -9, fork bomb, 修改 /etc/ssh, 修改防火墙, 删除数据库, 读取 .env, 输出 API Key / token / 密码

你必须严格输出 JSON（不要 markdown 代码块包裹，直接输出 JSON）：

{
  "summary": "你准备做什么（中文）",
  "commands": [
    {
      "cmd": "具体命令（必须来自允许列表）",
      "reason": "为什么执行这个命令",
      "risk": "low | medium | high"
    }
  ],
  "notes": "注意事项"
}

如果用户要求危险操作，commands 返回空数组，在 summary 和 notes 中说明原因并提供安全替代方案。
不要生成任何白名单之外的命令。`;

// ── POST /api/cloudops/plan ────────────────────────────────────
router.post('/cloudops/plan', requireAdmin, async (req, res) => {
  try {
    const { input } = req.body;
    if (!input?.trim()) return res.status(400).json({ error: 'Input is required' });

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: CLOUDOPS_SYSTEM_PROMPT },
          { role: 'user', content: input.trim() },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `AI service error: ${response.status}` });
    }

    const data = await response.json();
    const raw = (data.choices?.[0]?.message?.content || '').trim();

    // Parse JSON from AI response (strip code fences if present)
    let jsonStr = raw;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    let plan;
    try {
      plan = JSON.parse(jsonStr);
    } catch {
      return res.status(502).json({ error: 'AI returned invalid JSON', raw });
    }

    // Validate each command against whitelist
    const commands = (plan.commands || []).map(c => ({
      ...c,
      allowed: isCommandAllowed((c.cmd || '').trim()),
      blocked: isCommandBlocked((c.cmd || '').trim()),
    }));

    res.json({
      summary: plan.summary || '',
      commands,
      notes: plan.notes || '',
      input: input.trim(),
    });
  } catch (err) {
    console.error('CloudOps plan error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/cloudops/execute ─────────────────────────────────
router.post('/cloudops/execute', requireAdmin, async (req, res) => {
  try {
    const { command, risk, planJson } = req.body;
    if (!command?.trim()) return res.status(400).json({ error: 'Command is required' });

    const cmd = command.trim();

    // Re-validate
    if (!isCommandAllowed(cmd)) {
      return res.status(403).json({ error: 'Command not in whitelist' });
    }
    if (isCommandBlocked(cmd)) {
      return res.status(403).json({ error: 'Command blocked by security policy' });
    }

    const riskLevel = risk || assessRisk(cmd);

    // Execute via spawn (NOT exec)
    const [bin, ...args] = cmd.split(/\s+/);
    const projectRoot = path.resolve(__dirname, '..', '..');

    const result = await new Promise((resolve) => {
      const child = spawn(bin, args, {
        cwd: projectRoot,
        timeout: 15000,
        env: { ...process.env, HOME: process.env.HOME || '/root', PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.stderr.on('data', (d) => { stderr += d.toString(); });

      child.on('close', (code) => {
        resolve({
          stdout: redactOutput(stdout.slice(0, 100000)),
          stderr: redactOutput(stderr.slice(0, 100000)),
          exitCode: code,
        });
      });

      child.on('error', (err) => {
        resolve({
          stdout: '',
          stderr: redactOutput(err.message),
          exitCode: -1,
        });
      });

      // Timeout kill
      setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL');
      }, 15000);
    });

    // Log to DB
    insertCloudOpsLog.run(
      req.session.user.id,
      req.body.input || '',
      cmd,
      riskLevel,
      result.exitCode === 0 ? 'executed' : 'error',
      result.stdout,
      result.stderr,
      result.exitCode,
      planJson || ''
    );

    res.json({
      command: cmd,
      risk: riskLevel,
      ...result,
    });
  } catch (err) {
    console.error('CloudOps execute error:', err.message);
    res.status(500).json({ error: 'Command execution failed' });
  }
});

// ── GET /api/cloudops/history ───────────────────────────────────
router.get('/cloudops/history', requireAdmin, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs = listCloudOpsLogs.all(limit);
    res.json({ logs });
  } catch (err) {
    console.error('CloudOps history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
