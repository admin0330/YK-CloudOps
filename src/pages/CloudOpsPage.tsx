import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Loader2, AlertTriangle, Check, Terminal, Play,
  Shield, Clock, Zap, ChevronDown, RefreshCw, X,
} from 'lucide-react';
import { api } from '../api/client';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

type RiskLevel = 'low' | 'medium' | 'high';
type CmdStatus = 'pending' | 'executed' | 'error';

interface PlanCommand {
  cmd: string;
  reason: string;
  risk: RiskLevel;
  allowed: boolean;
  blocked: boolean;
}

interface PlanResult {
  summary: string;
  commands: PlanCommand[];
  notes: string;
  input: string;
}

interface ExecResult {
  command: string;
  risk: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface HistoryEntry {
  id: number;
  username: string;
  input: string;
  command: string;
  risk: string;
  status: CmdStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  createdAt: string;
}

const riskConfig: Record<RiskLevel, { zh: string; en: string; color: string; bg: string }> = {
  low: { zh: '低风险', en: 'Low', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  medium: { zh: '中风险', en: 'Medium', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  high: { zh: '高风险', en: 'High', color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function CloudOpsPage() {
  const { lang } = useLanguage();
  const isZh = lang === 'zh';
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState('');
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ExecResult>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    api.adminGetMe()
      .then(d => setAdmin(d.user))
      .catch(() => navigate('/admin-login'))
      .finally(() => setReady(true));
  }, [navigate]);

  const loadHistory = useCallback(() => {
    api.cloudOpsHistory(30).then(d => setHistory(d.logs || [])).catch(() => {});
  }, []);

  useEffect(() => { if (admin) loadHistory(); }, [admin, loadHistory]);

  const handlePlan = async () => {
    if (!input.trim() || planning) return;
    setPlanning(true);
    setError('');
    setPlan(null);
    setResults({});
    try {
      const data = await api.cloudOpsPlan(input.trim());
      setPlan(data);
    } catch (err: any) {
      setError(err.message || (isZh ? '生成计划失败' : 'Plan generation failed'));
    } finally {
      setPlanning(false);
    }
  };

  const handleExecute = async (cmd: PlanCommand) => {
    if (executing || !cmd.allowed || cmd.blocked) return;
    setExecuting(cmd.cmd);
    setError('');
    try {
      const result = await api.cloudOpsExecute(cmd.cmd, cmd.risk, plan?.input, JSON.stringify(plan));
      setResults(prev => ({ ...prev, [cmd.cmd]: result }));
      loadHistory();
    } catch (err: any) {
      setResults(prev => ({ ...prev, [cmd.cmd]: { command: cmd.cmd, risk: cmd.risk, stdout: '', stderr: err.message, exitCode: -1 } }));
    } finally {
      setExecuting(null);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm text-[var(--text-muted)] animate-pulse">{isZh ? '加载中...' : 'Loading...'}</div>
      </div>
    );
  }
  if (!admin) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <Cpu size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-xl font-semibold mb-1">{isZh ? 'CloudOps 运维助手' : 'CloudOps AI Assistant'}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {isZh ? '基于 AI 的服务器运维助手，执行前会先进行安全审批。' : 'AI-powered server operations with safe command approval.'}
          </p>
        </motion.div>

        <motion.div
          className="glass-panel p-4 sm:p-5 mb-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex gap-2 mb-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePlan(); } }}
              placeholder={isZh ? '请输入你要处理的服务器任务，例如：查看 nginx 状态' : 'Describe your server task in natural language... e.g. Check nginx status on the server'}
              rows={2}
              disabled={planning}
              className="flex-1 min-h-[48px]"
              style={{ resize: 'none' }}
            />
            <motion.button
              onClick={handlePlan}
              disabled={planning || !input.trim()}
              className="btn-primary btn-sm flex items-center gap-1.5 self-end shrink-0"
              whileTap={{ scale: 0.97 }}
            >
              {planning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              <span className="hidden sm:inline">{planning ? (isZh ? '生成中...' : 'Planning...') : (isZh ? '生成计划' : 'Generate Plan')}</span>
            </motion.button>
          </div>
          <p className="text-[10px] text-[var(--text-weak)] flex items-center gap-1">
            <Shield size={10} /> {isZh ? '命令会先经过白名单校验，再决定是否允许执行。' : 'Commands are validated against a whitelist before execution.'}
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-5 text-red-400 text-sm py-3 px-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-2"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            >
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto text-xs opacity-60 hover:opacity-100"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {plan && (
            <motion.div
              className="space-y-4 mb-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="glass-panel p-4">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Cpu size={14} className="text-[var(--accent)]" /> {isZh ? '计划摘要' : 'Plan Summary'}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{plan.summary}</p>
              </div>

              <div className="space-y-3">
                {plan.commands.map((cmd, i) => (
                  <div key={i} className="glass-panel p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${riskConfig[cmd.risk].bg} ${riskConfig[cmd.risk].color}`}>
                            {cmd.risk === 'high' ? <AlertTriangle size={10} /> : cmd.risk === 'medium' ? <Shield size={10} /> : <Check size={10} />}
                            {isZh ? riskConfig[cmd.risk].zh : riskConfig[cmd.risk].en} {isZh ? '风险' : 'Risk'}
                          </span>
                          {!cmd.allowed && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 flex items-center gap-1">
                              <X size={10} /> {isZh ? '不允许' : 'Not Allowed'}
                            </span>
                          )}
                          {cmd.blocked && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 flex items-center gap-1">
                              <AlertTriangle size={10} /> {isZh ? '已拦截' : 'Blocked'}
                            </span>
                          )}
                        </div>
                        <code className="text-sm font-mono px-3 py-2 rounded-lg block" style={{ background: 'var(--code-bg)', border: '1px solid var(--code-border)', wordBreak: 'break-all' }}>
                          {cmd.cmd}
                        </code>
                      </div>
                      <motion.button
                        onClick={() => handleExecute(cmd)}
                        disabled={executing === cmd.cmd || !cmd.allowed || cmd.blocked}
                        className="btn-primary btn-sm flex items-center gap-1 shrink-0"
                        whileTap={{ scale: 0.97 }}
                      >
                        {executing === cmd.cmd ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                        <span className="hidden sm:inline">{isZh ? '执行' : 'Execute'}</span>
                      </motion.button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{cmd.reason}</p>
                  </div>
                ))}
              </div>

              {plan.notes && (
                <div className="glass-panel p-4">
                  <h4 className="text-xs font-medium text-[var(--text-muted)] mb-1">{isZh ? '备注' : 'Notes'}</h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{plan.notes}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {Object.keys(results).length > 0 && (
            <motion.div
              className="space-y-3 mb-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Terminal size={14} className="text-[var(--text-muted)]" /> {isZh ? '执行结果' : 'Results'}
              </h3>
              {Object.entries(results).map(([cmd, result]) => (
                <div key={cmd} className="rounded-xl border overflow-hidden terminal-output" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between px-4 py-2.5 terminal-header">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${result.exitCode === 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                      <code className="text-xs font-mono truncate max-w-[300px] terminal-code">{cmd}</code>
                    </div>
                    <span className="text-[10px] terminal-meta">exit={result.exitCode}</span>
                  </div>
                  <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto terminal-body">
                    {result.stdout || <span className="terminal-dim">{isZh ? '暂无输出' : '(no output)'}</span>}
                    {result.stderr && <span className="terminal-error">{'\n' + result.stderr}</span>}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="glass-panel p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
            className="flex items-center gap-2 text-sm font-medium w-full text-left cursor-pointer"
            style={{ color: 'var(--text)', transition: 'opacity 200ms' }}
          >
            <Clock size={14} className="text-[var(--text-muted)]" />
            {isZh ? '执行记录' : 'Execution History'}
            <RefreshCw size={12} className="text-[var(--text-muted)] ml-1 cursor-pointer hover:text-[var(--text)]" onClick={(e) => { e.stopPropagation(); loadHistory(); }} />
            <ChevronDown size={14} className={`ml-auto text-[var(--text-muted)] transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                className="mt-3 space-y-1.5 max-h-64 overflow-y-auto"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {history.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">{isZh ? '暂无执行记录' : 'No execution history yet.'}</p>
                )}
                {history.map(h => (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 text-xs py-2.5 px-3 rounded-lg hover:bg-[var(--hover-bg)] cursor-default"
                    style={{ transition: 'background 200ms' }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${h.exitCode === 0 ? 'bg-green-400' : h.exitCode === null ? 'bg-yellow-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <code className="text-xs font-mono truncate block">{h.command}</code>
                      <span className="text-[var(--text-weak)]">
                        {isZh ? `${h.username} · ${h.createdAt}` : `${h.username} · ${h.createdAt}`}
                      </span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${riskConfig[h.risk as RiskLevel]?.bg || ''} ${riskConfig[h.risk as RiskLevel]?.color || 'text-[var(--text-muted)]'}`}>
                      {isZh ? riskConfig[h.risk as RiskLevel]?.zh || h.risk : riskConfig[h.risk as RiskLevel]?.en || h.risk}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
