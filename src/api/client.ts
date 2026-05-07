const API_BASE = '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  // Check content-type before parsing to avoid "Unexpected token '<'" on HTML responses
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      throw new Error('Server returned HTML instead of JSON. The API route may not be registered, or the server may need a restart.');
    }
    throw new Error(`Unexpected response type (${contentType || 'unknown'}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Admin auth
  adminLogin: (username, password) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  adminGetMe: () => request('/admin/me'),
  adminLogout: () => request('/admin/logout', { method: 'POST' }),

  // Admin users
  getStats: () => request('/admin/stats'),
  getUsers: () => request('/admin/users'),
  createUser: (username, password, role) =>
    request('/admin/users', { method: 'POST', body: JSON.stringify({ username, password, role }) }),
  updateUser: (id, data) =>
    request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateUserUsername: (id, username) =>
    request(`/admin/users/${id}/username`, { method: 'PATCH', body: JSON.stringify({ username }) }),
  updateUserPassword: (id, password) =>
    request(`/admin/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  updateUserStatus: (id, status) =>
    request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteUser: (id) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),

  // Chat
  getConversations: () => request('/conversations'),
  createConversation: (title) =>
    request('/conversations', { method: 'POST', body: JSON.stringify({ title }) }),
  getConversation: (id) => request(`/conversations/${id}`),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),
  clearConversation: (id) => request(`/conversations/${id}/clear`, { method: 'POST' }),

  // Chat — text only, supports attachmentIds
  chat: (conversationId, message, model = 'pro', attachmentIds = []) =>
    request('/chat', { method: 'POST', body: JSON.stringify({ conversationId, message, model, attachmentIds }) }),

  // Upload attachment BEFORE sending (new flow)
  uploadChatAttachment: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/chat/attachments/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.error || 'Upload failed'); });
      return r.json();
    });
  },
  // Chat — with file attachment (multipart)
  chatWithFile: (conversationId, message, file, model = 'pro') => {
    const formData = new FormData();
    if (conversationId) formData.append('conversationId', String(conversationId));
    if (message) formData.append('message', message);
    formData.append('model', model);
    formData.append('file', file);
    return fetch(`${API_BASE}/chat/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(r => {
      if (!r.ok) return r.json().then(d => { throw new Error(d.error || 'Upload failed'); });
      return r.json();
    });
  },

  // Persona
  getAdminPersona: () => request('/admin/persona'),
  updateAdminPersona: (enabled, content) =>
    request('/admin/persona', { method: 'PUT', body: JSON.stringify({ enabled, content }) }),
  getMyPersona: () => request('/me/persona'),
  updateMyPersona: (enabled, content) =>
    request('/me/persona', { method: 'PUT', body: JSON.stringify({ enabled, content }) }),
  getEffectivePersona: () => request('/persona/effective'),

  // Claude Code — tmux-based persistent terminal
  getClaudeSessionStatus: () => request('/admin/claude/session/status'),
  startClaudeSession: () => request('/admin/claude/session/start', { method: 'POST' }),
  sendClaudeInput: (text: string) =>
    request('/admin/claude/session/input', { method: 'POST', body: JSON.stringify({ text }) }),
  restartClaudeSession: () => request('/admin/claude/session/restart', { method: 'POST' }),
  getClaudeOutput: () => request('/admin/claude/session/output'),
  getClaudeFullOutput: () => request('/admin/claude/session/output/full'),
  getClaudeCapture: () => request('/admin/claude/session/capture'),

  // Servers
  getServers: () => request('/admin/servers'),
  getServer: (id) => request(`/admin/servers/${id}`),
  createServer: (data) => request('/admin/servers', { method: 'POST', body: JSON.stringify(data) }),
  updateServer: (id, data) => request(`/admin/servers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteServer: (id) => request(`/admin/servers/${id}`, { method: 'DELETE' }),
  execCommand: (id, command) => request(`/admin/servers/${id}/exec`, { method: 'POST', body: JSON.stringify({ command }) }),
  getServerLogs: (id, limit) => request(`/admin/servers/${id}/logs?limit=${limit || 100}`),
  getAllLogs: (limit) => request(`/admin/logs?limit=${limit || 100}`),
  getSystemStatus: () => request('/admin/system/status'),

  // Weather
  getWeather: (city?: string) =>
    request(`/weather/current${city ? `?city=${encodeURIComponent(city)}` : ''}`),

  // Ask Me — Ym1r personal AI assistant
  setFromHome: () => request('/enter', { method: 'POST' }),
  askMe: (question: string) =>
    request('/ask-me', { method: 'POST', body: JSON.stringify({ question }) }),

  // CloudOps AI Assistant
  cloudOpsPlan: (input: string) =>
    request('/cloudops/plan', { method: 'POST', body: JSON.stringify({ input }) }),
  cloudOpsExecute: (command: string, risk?: string, input?: string, planJson?: string) =>
    request('/cloudops/execute', { method: 'POST', body: JSON.stringify({ command, risk, input, planJson }) }),
  cloudOpsHistory: (limit = 50) =>
    request(`/cloudops/history?limit=${limit}`),

  // Files
  uploadFile: (formData) =>
    fetch(`${API_BASE}/admin/files/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(r => r.json()),
  getFiles: () => request('/admin/files'),
  deleteFile: (id) => request(`/admin/files/${id}`, { method: 'DELETE' }),
  getFileDownloadUrl: (id) => `${API_BASE}/admin/files/${id}/download`,
  getFilePreviewUrl: (id) => `${API_BASE}/files/${id}/preview`,
};
