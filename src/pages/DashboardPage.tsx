import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Server, Cpu, HardDrive, MemoryStick, Clock, ArrowRight, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [servers, setServers] = useState([]);
  const [sysStatus, setSysStatus] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getMe().then(d => setUser(d.user)).catch(() => {});
    api.getServers().then(d => setServers(d.servers || [])).catch(() => {});
    api.getSystemStatus().then(d => setSysStatus(d)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const isAdmin = user?.role === 'admin';

  if (!loaded) {
    return <div className="h-full flex items-center justify-center bg-[var(--bg)]"><div className="text-apple-muted text-sm animate-pulse">{t('loading')}</div></div>;
  }

  return (
    <div className="min-h-full bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('cloudOps')}</h1>
            <p className="text-sm text-apple-muted mt-1">
              {lang === 'zh' ? '运维管理平台' : 'Operations Management Platform'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin" className="btn-secondary btn-sm">
                {t('adminPanel')}
              </Link>
            )}
            {user ? (
              <button onClick={() => api.logout().then(() => navigate('/login'))} className="btn-secondary btn-sm">
                {t('logout')}
              </button>
            ) : (
              <Link to="/login" className="btn-primary btn-sm">{t('login')}</Link>
            )}
          </div>
        </div>

        {/* System Status */}
        {sysStatus && (
          <motion.div
            className="glass-panel p-4 sm:p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Cpu size={16} className="text-apple-muted" />
              {t('systemStatus')} · {sysStatus.hostname}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBadge icon={Cpu} label={t('cpu')} value={`${sysStatus.cpu.loadAvg1?.toFixed(1) || '-'}`} sub={`${sysStatus.cpu.cores} ${t('cores')}`} />
              <StatBadge icon={MemoryStick} label={t('memory')} value={`${sysStatus.memory.usagePercent}%`} sub={`${formatBytes(sysStatus.memory.used)} / ${formatBytes(sysStatus.memory.total)}`} />
              <StatBadge icon={HardDrive} label={t('disk')} value={sysStatus.disk.usagePercent || 'N/A'} sub={`${sysStatus.disk.used || '-'} / ${sysStatus.disk.total || '-'}`} />
              <StatBadge icon={Clock} label={t('uptime')} value={sysStatus.uptimeFormatted} />
            </div>
          </motion.div>
        )}

        {/* Server List */}
        <motion.div
          className="glass-panel p-4 sm:p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Server size={16} className="text-apple-muted" />
              {t('servers')}
            </h2>
            {isAdmin && (
              <Link to="/admin" className="btn-primary btn-sm flex items-center gap-1.5">
                <Plus size={13} /> {t('addServer')}
              </Link>
            )}
          </div>

          {servers.length === 0 ? (
            <div className="text-center py-10 text-apple-muted">
              <Server size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('noServers')}</p>
              {isAdmin && (
                <Link to="/admin" className="btn-primary btn-sm mt-4 inline-flex">{t('addServer')}</Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {servers.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  <Link
                    to={`/servers/${s.id}`}
                    className="block glass-card p-4 rounded-xl hover:border-[var(--border-strong)] cursor-pointer no-underline"
                    style={{ transition: 'all 280ms ease-in-out', color: 'inherit' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate">{s.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--active-bg)] text-apple-muted">{s.username}@{s.ip}:{s.port}</span>
                    </div>
                    {s.authNote && <p className="text-xs text-apple-muted truncate">{s.authNote}</p>}
                    <div className="flex items-center gap-1 text-apple-blue2 text-xs mt-3">
                      {lang === 'zh' ? '查看详情' : 'View Details'} <ArrowRight size={11} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatBadge({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-xl p-3 card-lift">
      <div className="flex items-center gap-1.5 text-apple-muted text-[10px] mb-1.5">
        <Icon size={12} /> {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
      {sub && <div className="text-[10px] text-apple-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}
