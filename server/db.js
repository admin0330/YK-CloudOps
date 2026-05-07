import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.resolve(__dirname, '..', 'data', 'app.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('active', 'pending', 'disabled')),
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    lastLoginAt TEXT
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expired TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    originalName TEXT NOT NULL,
    storedName TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploadedBy INTEGER NOT NULL REFERENCES users(id),
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS message_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    messageId INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    uploadId INTEGER NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    UNIQUE(messageId, uploadId)
  );

  CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 22,
    username TEXT NOT NULL DEFAULT 'root',
    authNote TEXT DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS command_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serverId INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    userId INTEGER NOT NULL REFERENCES users(id),
    command TEXT NOT NULL,
    stdout TEXT DEFAULT '',
    stderr TEXT DEFAULT '',
    exitCode INTEGER,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cloudops_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id),
    input TEXT NOT NULL,
    command TEXT NOT NULL,
    risk TEXT NOT NULL DEFAULT 'low' CHECK(risk IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'executed', 'rejected', 'error')),
    stdout TEXT DEFAULT '',
    stderr TEXT DEFAULT '',
    exitCode INTEGER,
    planJson TEXT DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// === Safe migration: add persona columns to users ===
function columnExists(table, column) {
  const cols = db.pragma(`table_info(${table})`);
  return cols.some((c) => c.name === column);
}

if (!columnExists('users', 'personaContent')) {
  db.exec(`ALTER TABLE users ADD COLUMN personaContent TEXT DEFAULT ''`);
}
if (!columnExists('users', 'personaEnabled')) {
  db.exec(`ALTER TABLE users ADD COLUMN personaEnabled INTEGER DEFAULT 0`);
}

// === Safe migration: add text extraction columns to uploads ===
if (!columnExists('uploads', 'extractedText')) {
  db.exec(`ALTER TABLE uploads ADD COLUMN extractedText TEXT DEFAULT ''`);
}
if (!columnExists('uploads', 'extractedAt')) {
  db.exec(`ALTER TABLE uploads ADD COLUMN extractedAt TEXT`);
}
if (!columnExists('uploads', 'extractStatus')) {
  db.exec(`ALTER TABLE uploads ADD COLUMN extractStatus TEXT DEFAULT 'pending'`);
}
if (!columnExists('uploads', 'extractError')) {
  db.exec(`ALTER TABLE uploads ADD COLUMN extractError TEXT`);
}
if (!columnExists('uploads', 'textLength')) {
  db.exec(`ALTER TABLE uploads ADD COLUMN textLength INTEGER DEFAULT 0`);
}

// Global settings table (for global persona and future use)
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Prepared statements for persona
export const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
export const setSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, datetime(\'now\'))');

export const getUserPersona = db.prepare('SELECT personaContent, personaEnabled FROM users WHERE id = ?');
export const updateUserPersona = db.prepare('UPDATE users SET personaContent = ?, personaEnabled = ?, updatedAt = datetime(\'now\') WHERE id = ?');

// Session store implemented as a thin wrapper over the sessions table
class SQLiteSessionStore {
  constructor() {
    this._getStmt = db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expired > ?').pluck();
    this._setStmt = db.prepare('INSERT OR REPLACE INTO sessions (sid, sess, expired) VALUES (?, ?, ?)');
    this._destroyStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
  }

  get(sid) {
    return this._getStmt.get(sid, new Date().toISOString());
  }

  set(sid, sess, expired) {
    this._setStmt.run(sid, sess, expired || new Date(Date.now() + 86400000).toISOString());
  }

  destroy(sid) {
    this._destroyStmt.run(sid);
  }

  tidy() {
    db.prepare('DELETE FROM sessions WHERE expired <= ?').run(new Date().toISOString());
  }
}

const sessionStore = new SQLiteSessionStore();

// Run session cleanup every hour
setInterval(sessionStore.tidy, 1000 * 60 * 60);

export default db;
export { sessionStore };

// Prepared statements for users
export const findUserByUsername = db.prepare('SELECT * FROM users WHERE username = ?');
export const findUserById = db.prepare('SELECT id, username, role, status, createdAt, updatedAt, lastLoginAt FROM users WHERE id = ?');
export const insertUser = db.prepare('INSERT INTO users (username, passwordHash, role, status) VALUES (?, ?, ?, ?)');
export const updateUserStatus = db.prepare('UPDATE users SET status = ?, updatedAt = datetime(\'now\') WHERE id = ?');
export const updateUserPassword = db.prepare('UPDATE users SET passwordHash = ?, updatedAt = datetime(\'now\') WHERE id = ?');
export const updateUserUsername = db.prepare('UPDATE users SET username = ?, updatedAt = datetime(\'now\') WHERE id = ?');
export const isUsernameTaken = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?');
export const updateUserLastLogin = db.prepare('UPDATE users SET lastLoginAt = datetime(\'now\') WHERE id = ?');
export const listUsers = db.prepare('SELECT id, username, role, status, createdAt, updatedAt, lastLoginAt FROM users ORDER BY createdAt DESC');
export const deleteUser = db.prepare('DELETE FROM users WHERE id = ? AND role != \'admin\'');
export const getStats = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM users) as totalUsers,
    (SELECT COUNT(*) FROM users WHERE status = 'active') as activeUsers,
    (SELECT COUNT(*) FROM users WHERE status = 'pending') as pendingUsers,
    (SELECT COUNT(*) FROM conversations) as totalConversations,
    (SELECT COUNT(*) FROM messages) as totalMessages,
    (SELECT COUNT(*) FROM uploads) as totalUploads
`);

// Prepared statements for conversations
export const findConversationsByUser = db.prepare('SELECT * FROM conversations WHERE userId = ? ORDER BY updatedAt DESC');
export const findConversationById = db.prepare('SELECT * FROM conversations WHERE id = ?');
export const insertConversation = db.prepare('INSERT INTO conversations (userId, title) VALUES (?, ?)');
export const deleteConversation = db.prepare('DELETE FROM conversations WHERE id = ?');
export const clearConversationMessages = db.prepare('DELETE FROM messages WHERE conversationId = ?');
export const updateConversationTitle = db.prepare('UPDATE conversations SET title = ?, updatedAt = datetime(\'now\') WHERE id = ?');
export const touchConversation = db.prepare('UPDATE conversations SET updatedAt = datetime(\'now\') WHERE id = ?');

// Prepared statements for messages
export const findMessagesByConversation = db.prepare('SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC');
export const insertMessage = db.prepare('INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?)');

// Prepared statements for uploads
export const insertUpload = db.prepare('INSERT INTO uploads (originalName, storedName, mimeType, size, uploadedBy) VALUES (?, ?, ?, ?, ?)');
export const listUploads = db.prepare('SELECT * FROM uploads ORDER BY createdAt DESC');
export const findUploadById = db.prepare('SELECT * FROM uploads WHERE id = ?');
export const deleteUpload = db.prepare('DELETE FROM uploads WHERE id = ?');
export const updateUploadExtraction = db.prepare('UPDATE uploads SET extractedText = ?, extractStatus = ?, extractError = ?, textLength = ?, extractedAt = datetime(\'now\') WHERE id = ?');
export const findPendingExtraction = db.prepare("SELECT * FROM uploads WHERE extractStatus = 'pending' AND mimeType NOT LIKE 'image/%'");

// Prepared statements for servers
export const listServers = db.prepare('SELECT * FROM servers ORDER BY createdAt DESC');
export const findServerById = db.prepare('SELECT * FROM servers WHERE id = ?');
export const insertServer = db.prepare('INSERT INTO servers (name, ip, port, username, authNote) VALUES (?, ?, ?, ?, ?)');
export const updateServer = db.prepare('UPDATE servers SET name = ?, ip = ?, port = ?, username = ?, authNote = ?, updatedAt = datetime(\'now\') WHERE id = ?');
export const deleteServer = db.prepare('DELETE FROM servers WHERE id = ?');

// Prepared statements for command logs
export const insertCommandLog = db.prepare('INSERT INTO command_logs (serverId, userId, command, stdout, stderr, exitCode) VALUES (?, ?, ?, ?, ?, ?)');
export const listCommandLogs = db.prepare('SELECT cl.*, s.name as serverName, u.username FROM command_logs cl INNER JOIN servers s ON cl.serverId = s.id INNER JOIN users u ON cl.userId = u.id ORDER BY cl.createdAt DESC LIMIT ?');
export const listCommandLogsByServer = db.prepare('SELECT cl.*, s.name as serverName, u.username FROM command_logs cl INNER JOIN servers s ON cl.serverId = s.id INNER JOIN users u ON cl.userId = u.id WHERE cl.serverId = ? ORDER BY cl.createdAt DESC LIMIT ?');

// Prepared statements for cloudops logs
export const insertCloudOpsLog = db.prepare('INSERT INTO cloudops_logs (userId, input, command, risk, status, stdout, stderr, exitCode, planJson) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
export const listCloudOpsLogs = db.prepare('SELECT cl.*, u.username FROM cloudops_logs cl INNER JOIN users u ON cl.userId = u.id ORDER BY cl.createdAt DESC LIMIT ?');

// Prepared statements for message-attachment associations
export const linkAttachment = db.prepare('INSERT OR IGNORE INTO message_attachments (messageId, uploadId) VALUES (?, ?)');
export const findAttachmentsByMessageId = db.prepare(`SELECT u.* FROM uploads u INNER JOIN message_attachments ma ON u.id = ma.uploadId WHERE ma.messageId = ?`);
export const findAttachmentsByMessageIds = db.prepare(`SELECT ma.messageId, u.* FROM uploads u INNER JOIN message_attachments ma ON u.id = ma.uploadId WHERE ma.messageId IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
