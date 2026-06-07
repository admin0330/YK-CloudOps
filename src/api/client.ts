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

function createAbortError() {
  const error = new Error('Upload paused');
  error.name = 'AbortError';
  return error;
}

function xhrRequest(path, { method = 'GET', headers = {}, body, onUploadProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const cleanup = () => {
      signal?.removeEventListener('abort', abortRequest);
    };
    const resolveOnce = (value) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const abortRequest = () => xhr.abort();

    if (signal?.aborted) {
      rejectOnce(createAbortError());
      return;
    }

    xhr.open(method, `${API_BASE}${path}`, true);
    xhr.withCredentials = true;

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, String(value));
    });

    signal?.addEventListener('abort', abortRequest, { once: true });

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;

      // An intentionally aborted XHR can reach readyState=4 with status=0
      // before the onabort callback fires. Treat it as an abort instead of a
      // generic Request failed (0), otherwise rapid pause/resume cycles fail.
      if (xhr.status === 0) {
        rejectOnce(signal?.aborted ? createAbortError() : new Error('Network connection interrupted'));
        return;
      }

      const contentType = xhr.getResponseHeader('content-type') || '';
      const responseText = xhr.responseText || '';
      let data;
      try {
        data = contentType.includes('application/json') ? JSON.parse(responseText || '{}') : responseText;
      } catch (error) {
        rejectOnce(error);
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const message = data?.error || data?.message || `Request failed (${xhr.status})`;
        rejectOnce(new Error(message));
        return;
      }

      resolveOnce(data);
    };

    xhr.onerror = () => rejectOnce(signal?.aborted ? createAbortError() : new Error('Network error'));
    xhr.onabort = () => rejectOnce(createAbortError());

    if (xhr.upload && onUploadProgress) {
      xhr.upload.onprogress = onUploadProgress;
    }

    xhr.send(body);
  });
}

const DISK_RESUME_STORAGE_KEY = 'ym1r-disk-upload-resume-v1';

function readDiskResumeRecords() {
  try {
    return JSON.parse(localStorage.getItem(DISK_RESUME_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeDiskResumeRecords(records) {
  try {
    localStorage.setItem(DISK_RESUME_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Upload still works when browser storage is unavailable.
  }
}

function getDiskResumeFingerprint(item, relativePath, chunkSize) {
  return [relativePath, item.file.size, item.file.lastModified || 0, chunkSize].join('::');
}

function getDiskResumeUploadId(fingerprint) {
  return String(readDiskResumeRecords()[fingerprint] || '');
}

function setDiskResumeUploadId(fingerprint, uploadId) {
  const records = readDiskResumeRecords();
  records[fingerprint] = uploadId;
  writeDiskResumeRecords(records);
}

function clearDiskResumeUploadId(fingerprint) {
  const records = readDiskResumeRecords();
  delete records[fingerprint];
  writeDiskResumeRecords(records);
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

  // Disk
  getDiskSession: () => request('/disk/session'),
  unlockDisk: (password: string) =>
    request('/disk/unlock', { method: 'POST', body: JSON.stringify({ adminPassword: password }) }),
  lockDisk: () => request('/disk/lock', { method: 'POST' }),
  getDiskFiles: (path = '') => request(`/disk/files${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  createDiskUploadTask: (
    items: Array<{ file: File; relativePath?: string }>,
    onProgress?: (progress: {
      totalBytes: number;
      uploadedBytes: number;
      speedBps: number;
      currentFile: string;
      currentFileBytes: number;
      currentFileUploadedBytes: number;
      totalFiles: number;
      completedFiles: number;
      percent: number;
    }) => void,
    onStateChange?: (state: { paused: boolean; cancelled?: boolean }) => void,
  ) => {
    const chunkSize = 8 * 1024 * 1024;
    const chunkConcurrency = 8;
    const maxRetries = 3;
    const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);
    const totalFiles = items.length;
    const activeAbortControllers = new Set<AbortController>();
    const activeSessions = new Map<string, { uploadId: string; fingerprint: string }>();
    const itemFingerprints = items.map((item) => getDiskResumeFingerprint(item, item.relativePath || item.file.name, chunkSize));
    let completedFileBytes = 0;
    let completedFiles = 0;
    let paused = false;
    let cancelled = false;
    let resumeWaiters: Array<() => void> = [];
    let speedSamples: Array<{ at: number; bytes: number }> = [];
    let lastProgress = {
      totalBytes,
      uploadedBytes: 0,
      speedBps: 0,
      currentFile: '',
      currentFileBytes: 0,
      currentFileUploadedBytes: 0,
      totalFiles,
      completedFiles: 0,
      percent: 0,
    };

    const createCancelledError = () => {
      const error = new Error('Upload cancelled');
      error.name = 'UploadCancelledError';
      return error;
    };
    const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const calculateSpeed = (bytes: number) => {
      if (paused) return 0;
      const now = Date.now();
      speedSamples.push({ at: now, bytes });
      speedSamples = speedSamples.filter((sample) => now - sample.at <= 4000);
      const first = speedSamples[0];
      const last = speedSamples[speedSamples.length - 1];
      if (!first || !last || last.at <= first.at) return 0;
      return Math.max(0, (last.bytes - first.bytes) / ((last.at - first.at) / 1000));
    };
    const publishProgress = (progress) => {
      lastProgress = { ...progress, speedBps: calculateSpeed(progress.uploadedBytes) };
      onProgress?.(lastProgress);
    };
    const publishCurrentProgress = () => publishProgress(lastProgress);
    const releaseResumeWaiters = () => {
      const waiters = resumeWaiters;
      resumeWaiters = [];
      waiters.forEach((resolve) => resolve());
    };
    const waitUntilResumed = async () => {
      while (paused && !cancelled) {
        await new Promise<void>((resolve) => resumeWaiters.push(resolve));
      }
      if (cancelled) throw createCancelledError();
    };
    const abortActiveRequests = () => {
      activeAbortControllers.forEach((controller) => controller.abort());
      activeAbortControllers.clear();
    };

    const pauseInternal = (notify = true) => {
      if (paused || cancelled) return;
      paused = true;
      speedSamples = [];
      abortActiveRequests();
      if (notify) onStateChange?.({ paused: true });
      publishCurrentProgress();
    };

    const pause = () => pauseInternal(true);

    // Used when the page is refreshed or closed. Preserve server-side chunks
    // and local resume records instead of cancelling the upload session.
    const suspend = () => pauseInternal(false);

    const resume = () => {
      if (!paused || cancelled) return;
      paused = false;
      speedSamples = [];
      releaseResumeWaiters();
      onStateChange?.({ paused: false });
      publishCurrentProgress();
    };

    const cancel = async () => {
      if (cancelled) return;
      cancelled = true;
      paused = false;
      abortActiveRequests();
      releaseResumeWaiters();
      onStateChange?.({ paused: false, cancelled: true });

      const uploadIds = new Set<string>();
      itemFingerprints.forEach((fingerprint) => {
        const uploadId = activeSessions.get(fingerprint)?.uploadId || getDiskResumeUploadId(fingerprint);
        if (uploadId) uploadIds.add(uploadId);
        clearDiskResumeUploadId(fingerprint);
      });
      await Promise.allSettled([...uploadIds].map((uploadId) => request('/disk/upload/cancel', {
        method: 'POST',
        body: JSON.stringify({ uploadId }),
      })));
    };

    const run = async () => {
      const files: Array<{ name: string; path: string; size: number; modifiedAt: string; downloadUrl: string }> = [];

      for (const item of items) {
        await waitUntilResumed();
        const relativePath = item.relativePath || item.file.name;
        const totalChunks = Math.max(1, Math.ceil(item.file.size / chunkSize));
        const fingerprint = getDiskResumeFingerprint(item, relativePath, chunkSize);
        const resumeUploadId = getDiskResumeUploadId(fingerprint);
        const startPayload = await request('/disk/upload/start', {
          method: 'POST',
          body: JSON.stringify({ relativePath, size: item.file.size, totalChunks, chunkSize, resumeUploadId }),
        });

        const uploadId = String(startPayload.uploadId);
        activeSessions.set(fingerprint, { uploadId, fingerprint });
        setDiskResumeUploadId(fingerprint, uploadId);
        if (cancelled) {
          clearDiskResumeUploadId(fingerprint);
          activeSessions.delete(fingerprint);
          await request('/disk/upload/cancel', { method: 'POST', body: JSON.stringify({ uploadId }) }).catch(() => undefined);
          throw createCancelledError();
        }
        await waitUntilResumed();

        const getChunkSize = (chunkIndex: number) => {
          const start = chunkIndex * chunkSize;
          return Math.max(0, Math.min(chunkSize, item.file.size - start));
        };
        const chunkBytesFor = (indexes: Set<number>) => [...indexes].reduce((sum, chunkIndex) => sum + getChunkSize(chunkIndex), 0);
        let committedIndexes = new Set<number>((startPayload.receivedChunkIndexes || []).map(Number));
        const liveChunkBytes = new Map<number, number>();

        const emitProgress = () => {
          // Display only bytes confirmed by the server. XHR progress events are
          // volatile: a paused request can be aborted after the browser sent
          // bytes but before the server committed the chunk. Counting them made
          // the UI jump backwards or restart from zero after resuming.
          const committedFileBytes = chunkBytesFor(committedIndexes);
          const currentFileUploadedBytes = Math.min(item.file.size, committedFileBytes);
          const liveUploadedBytes = Math.min(totalBytes, completedFileBytes + currentFileUploadedBytes);
          publishProgress({
            totalBytes,
            uploadedBytes: liveUploadedBytes,
            speedBps: 0,
            currentFile: relativePath,
            currentFileBytes: item.file.size,
            currentFileUploadedBytes,
            totalFiles,
            completedFiles,
            percent: totalBytes > 0 ? (liveUploadedBytes / totalBytes) * 100 : 100,
          });
        };

        const syncStatus = async () => {
          await waitUntilResumed();
          const status = await request(`/disk/upload/status?uploadId=${encodeURIComponent(uploadId)}`);
          committedIndexes = new Set<number>((status.receivedChunkIndexes || []).map(Number));
          liveChunkBytes.clear();
          emitProgress();
        };

        const uploadChunk = async (chunkIndex: number) => {
          const start = chunkIndex * chunkSize;
          const end = Math.min(item.file.size, start + chunkSize);
          const chunk = item.file.slice(start, end);
          let attempt = 0;

          while (attempt <= maxRetries) {
            await waitUntilResumed();
            if (committedIndexes.has(chunkIndex)) return;
            const controller = new AbortController();
            activeAbortControllers.add(controller);
            try {
              liveChunkBytes.set(chunkIndex, 0);
              emitProgress();
              await xhrRequest(`/disk/upload/chunk?uploadId=${encodeURIComponent(uploadId)}&chunkIndex=${chunkIndex}&totalChunks=${totalChunks}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: chunk,
                signal: controller.signal,
                onUploadProgress: (event) => {
                  // Keep transport progress internally for debugging, but do
                  // not present it as durable uploaded progress until the
                  // server confirms the complete chunk.
                  liveChunkBytes.set(chunkIndex, Math.min(event.lengthComputable ? event.loaded : chunk.size, chunk.size));
                },
              });
              committedIndexes.add(chunkIndex);
              liveChunkBytes.delete(chunkIndex);
              emitProgress();
              return;
            } catch (error: any) {
              liveChunkBytes.delete(chunkIndex);
              emitProgress();
              if (cancelled) throw createCancelledError();
              if (error?.name === 'AbortError') {
                // Pause/resume can be toggled faster than the XHR abort event is
                // delivered. Always treat an intentional abort as recoverable.
                await waitUntilResumed();
                return;
              }
              if (attempt >= maxRetries) throw error instanceof Error ? error : new Error(`Chunk ${chunkIndex} upload failed`);
              await wait(1000 * 2 ** attempt);
              attempt += 1;
            } finally {
              activeAbortControllers.delete(controller);
            }
          }
        };

        while (true) {
          await syncStatus();
          if (committedIndexes.size >= totalChunks) break;
          const missingChunkIndexes = Array.from({ length: totalChunks }, (_, index) => index)
            .filter((chunkIndex) => !committedIndexes.has(chunkIndex));
          let nextMissingIndex = 0;
          const worker = async () => {
            while (true) {
              await waitUntilResumed();
              const queueIndex = nextMissingIndex;
              nextMissingIndex += 1;
              if (queueIndex >= missingChunkIndexes.length) return;
              await uploadChunk(missingChunkIndexes[queueIndex]);
              if (paused || cancelled) return;
            }
          };
          await Promise.all(Array.from({ length: Math.min(chunkConcurrency, missingChunkIndexes.length) }, () => worker()));
        }

        await waitUntilResumed();
        const completed = await request('/disk/upload/complete', {
          method: 'POST',
          body: JSON.stringify({ uploadId }),
        });

        clearDiskResumeUploadId(fingerprint);
        activeSessions.delete(fingerprint);
        files.push(completed.file);
        completedFileBytes += item.file.size;
        completedFiles += 1;
        publishProgress({
          totalBytes,
          uploadedBytes: completedFileBytes,
          speedBps: 0,
          currentFile: relativePath,
          currentFileBytes: item.file.size,
          currentFileUploadedBytes: item.file.size,
          totalFiles,
          completedFiles,
          percent: totalBytes > 0 ? (completedFileBytes / totalBytes) * 100 : 100,
        });
      }

      return { files };
    };

    const promise = run();
    return { promise, pause, resume, suspend, cancel, isPaused: () => paused, isCancelled: () => cancelled };
  },

  deleteDiskFile: (path: string) =>
    request('/disk/files', {
      method: 'DELETE',
      body: JSON.stringify({ path }),
    }),
  getDiskDownloadUrl: (path: string) => `${API_BASE}/disk/download?path=${encodeURIComponent(path)}`,
  getDiskPreviewMeta: (path: string) => request(`/disk/preview/meta?path=${encodeURIComponent(path)}`),
  getDiskPreviewText: (path: string) => request(`/disk/preview/text?path=${encodeURIComponent(path)}`),
  getDiskPreviewRawUrl: (path: string) => `${API_BASE}/disk/preview/raw?path=${encodeURIComponent(path)}`,
  getDiskPreviewOfficeUrl: (path: string) => `${API_BASE}/disk/preview/office?path=${encodeURIComponent(path)}`,

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
