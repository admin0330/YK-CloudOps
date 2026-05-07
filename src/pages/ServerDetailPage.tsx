import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Terminal, Play, Loader2, AlertTriangle, Check, Copy,
  Clock, FileText, ArrowLeft, Trash2,
} from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';

export default function ServerDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const [server, setServer] = useState(null);
  const [cmd, setCmd] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.getServer(id);
        setServer(d.server);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoaded(true);
      }
      try {
        const l = await api.getServerLogs(id, 50);
        setLogs(l.logs || []);
      } catch {}
    })();
  }, [id]);

  const handleExec = async () => {
    if (!cmd.trim() || running) return;
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const data = await api.execCommand(id, cmd.trim());
      setResult(data);
      // Refresh logs
      try { const l = await api.getServerLogs(id, 50); setLogs(l.logs || []); } catch {}
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  if (!loaded) {
    return <div className="h-full flex items-center justify-center bg-[var(--bg)]"><div className="text-apple-muted animate-pulse">{t('loading')}</div></div>;
  }

  if (!server) {
    return (
      <div className="min-h-full bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertTriangle size={32} className="mx-auto text-red-400" />
          <p className="text-sm text-apple-muted">{error || t('networkError')}</p>
          <Link to="/" className="btn-secondary btn-sm inline-flex">{t('back')}</Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-full bg-[var(--bg)]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5" style={{ paddingTop: '4rem' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded-lg hover:bg-[var(--active-bg)] text-apple-muted">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{server.name}</h1>
            <p className="text-xs text-apple-muted">{server.username}@{server.ip}:{server.port}</p>
          </div>
        </div>

        {/* SSH Command */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal size={15} className="text-apple-muted" />
            <span className="text-sm font-medium">{t('execCommand')}</span>
          </div>
          <div className="flex gap-2">
            <input
              value={cmd}
              onChange={e => setCmd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExec()}
              placeholder={lang === 'zh' ? '输入 Linux 命令...' : 'Enter Linux command...'}
              disabled={running}
              className="flex-1 min-w-0 font-mono text-sm"
            />
            <motion.button
              onClick={handleExec}
              disabled={running || !cmd.trim()}
              className="btn-primary btn-sm flex items-center gap-1.5 shrink-0"
              whileTap={{ scale: 0.97 }}
            >
              {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              {running ? (lang === 'zh' ? '执行中' : 'Running') : (lang === 'zh' ? '执行' : 'Run')}
            </motion.button>
          </div>

          {/* Result */}
          <AnimatePresence>
            {(result || error) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
              >
                {error && (
                  <div className="text-red-400 text-sm py-2 px-3 bg-red-500/10 rounded-lg border border-red-500/20 flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {error}
                  </div>
                )}
                {result && (
                  <div className="rounded-lg border border-[var(--border)] overflow-hidden terminal-output">
                    <div className="flex items-center justify-between px-3 py-2 terminal-header">
                      <span className="text-[10px] font-mono terminal-meta">
                        {t('exitCode')}: {result.exitCode}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(result.stdout + (result.stderr ? '\n[stderr]\n' + result.stderr : ''));
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-[10px] terminal-meta hover:opacity-70 flex items-center gap-1"
                      >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? t('copied') : t('copy')}
                      </button>
                    </div>
                    <div className="p-3 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-80 overflow-y-auto terminal-body">
                      {result.stdout || <span className="terminal-dim">(no output)</span>}
                      {result.stderr && (
                        <span className="terminal-error">{'\n'}{result.stderr}</span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Command Logs */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FileText size={14} className="text-apple-muted" />
            {t('commandLogs')}
          </h3>
          {logs.length === 0 ? (
            <p className="text-xs text-apple-muted py-4 text-center">{lang === 'zh' ? '暂无执行记录' : 'No logs yet'}</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {logs.map((l, i) => (
                <div key={l.id} className="flex items-start gap-2 text-xs py-2 px-3 rounded-lg hover:bg-[var(--hover-bg)]" style={{ transition: 'background 200ms' }}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${l.exitCode === 0 ? 'bg-green-400' : l.exitCode === -1 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono truncate">{l.command}</span>
                    </div>
                    <span className="text-apple-muted">
                      {l.username} · {l.createdAt}
                      {l.exitCode != null && <span className="ml-2">exit={l.exitCode}</span>}
                    </span>
                  </div>
                  {l.stderr && l.stderr !== 'BLOCKED: dangerous command' && (
                    <span className="text-red-400 text-[10px] shrink-0 max-w-[120px] truncate">{l.stderr}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
