import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FolderOpen, LogOut, Menu, X as XIcon,
  Upload, Download, Trash2, Check, FileText, Plus, Image as ImageIcon,
  Sparkles, Terminal, Server, ExternalLink, RefreshCw, HardDrive, Monitor,
  Edit3, Key, Clock, UserCheck, UserX, AlertTriangle,
} from 'lucide-react';
import HoldToDeleteButton from '../components/ui/HoldToDeleteButton';
import LiquidCapsuleSwitch from '../components/ui/LiquidCapsuleSwitch';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { fadeUp, scaleIn, staggerContainer, staggerItem, appleEase } from '../lib/motion';
import ImageViewer from '../components/ImageViewer';
import Navbar from '../components/Navbar';
import ErrorBoundary from '../components/ErrorBoundary';

const TABS = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'servers', icon: Server },
  { key: 'users', icon: Users },
  { key: 'files', icon: FolderOpen },
  { key: 'persona', icon: Sparkles },

];

export default function AdminPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [admin, setAdmin] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    api.adminGetMe().then((d) => setAdmin(d.user)).catch(() => navigate('/admin-login')).finally(() => setAuthChecked(true));
  }, [navigate]);

  const handleLogout = async () => { await api.adminLogout().catch(() => {}); navigate('/admin-login'); };
  const switchTab = (key) => { setTab(key); setSidebarOpen(false); };

  if (!authChecked) {
    return <div className="h-full flex items-center justify-center bg-apple-bg"><div className="text-apple-muted animate-pulse">{t('loading')}</div></div>;
  }
  if (!admin) return null;

  const TAB_LABELS = { dashboard: t('dashboard'), servers: t('serverManagement'), users: t('userManagement'), files: t('fileTransfer'), persona: t('persona') };

  return (
    <div className="min-h-screen flex flex-col bg-apple-bg">
      <Navbar />

      <div className="flex flex-1 min-h-0 pt-[5.85rem] overflow-hidden">
        <aside
          className={`hidden lg:flex shrink-0 min-h-0 flex-col glass border-r border-[var(--border)] transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${sidebarExpanded ? 'w-52' : 'w-[4.75rem]'}`}
          onFocusCapture={() => setSidebarExpanded(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSidebarExpanded(false);
          }}
        >
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-2">
            <Link to="/me" aria-label="Open personal blog" className="cursor-pointer hover:opacity-75 shrink-0" style={{ transition: 'opacity 280ms linear' }}>
              <span className="text-apple-blue2 text-lg font-semibold">{'\uF8FF'}</span>
            </Link>
            <div className={`min-w-0 overflow-hidden transition-all duration-300 ${sidebarExpanded ? 'max-w-[10rem] opacity-100' : 'max-w-0 opacity-0'}`}>
              <span className="text-lg font-semibold tracking-tight whitespace-nowrap">Admin</span>
            </div>
            <button
              type="button"
              className="ml-auto p-2 rounded-xl hover:bg-[var(--hover-bg)] text-apple-muted"
              aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={() => setSidebarExpanded((v) => !v)}
            >
              <Menu size={16} />
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {TABS.map(({ key, icon: Icon }) => (
              <motion.button
                key={key}
                onClick={() => switchTab(key)}
                className={`apple-pill w-full ${tab === key ? 'is-active' : ''} ${sidebarExpanded ? 'justify-start px-3' : 'justify-center px-0'}`}
                whileHover={{ x: sidebarExpanded ? 2 : 0 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon size={16} />
                <span className={`${sidebarExpanded ? 'inline' : 'hidden'}`}>{TAB_LABELS[key]}</span>
              </motion.button>
            ))}
          </nav>
          <div className="p-3 border-t border-[var(--border)] space-y-1.5">
            <motion.button onClick={handleLogout} className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-apple-muted hover:bg-[var(--hover-bg)] hover:text-[var(--text)] ${sidebarExpanded ? 'justify-start' : 'justify-center'}`} whileTap={{ scale: 0.97 }}>
              <LogOut size={14} />
              <span className={`${sidebarExpanded ? 'inline' : 'hidden'}`}>{t('signOut')}</span>
            </motion.button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto p-4 lg:p-6 pb-8">
          <div className="flex items-center justify-between gap-3 mb-4 lg:mb-6">
            <motion.h1 className="text-xl font-semibold hidden lg:block" variants={fadeUp} initial="hidden" animate="visible" transition={appleEase}>{TAB_LABELS[tab]}</motion.h1>
            <div className="lg:hidden flex-1" />
            <div className="lg:hidden mb-0 glass rounded-2xl p-1.5 border border-[var(--border)] overflow-x-auto max-w-full">
              <div className="flex items-center gap-2 min-w-max">
                {TABS.map(({ key, icon: Icon }) => (
                  <motion.button
                    key={key}
                    onClick={() => switchTab(key)}
                    className={`apple-pill ${tab === key ? 'is-active' : ''}`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon size={15} />{TAB_LABELS[key]}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0, y: -8 }} transition={appleEase}>
              {tab === 'dashboard' && <DashboardTab />}
              {tab === 'users' && <UsersTab />}
              {tab === 'files' && <FilesTab />}
              {tab === 'persona' && <PersonaTab />}

              {tab === 'servers' && <ServersTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <motion.div className="glass rounded-2xl p-5 sm:p-5 card-lift" variants={staggerItem} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <div className="text-apple-muted text-xs uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </motion.div>
  );
}

function DashboardTab() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  useEffect(() => { api.getStats().then((d) => setStats(d.stats)).catch(() => {}); }, []);
  if (!stats) return <div className="text-apple-muted">{t('loading')}</div>;

  return (
    <motion.div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5" variants={staggerContainer} initial="hidden" animate="visible">
      <StatCard label={t('totalUsers')} value={stats.totalUsers} />
      <StatCard label={t('activeUsers')} value={stats.activeUsers} />
      <StatCard label={t('pendingUsers')} value={stats.pendingUsers} />
      <StatCard label={t('conversations')} value={stats.totalConversations} />
      <StatCard label={t('messages')} value={stats.totalMessages} />
      <StatCard label={t('uploads')} value={stats.totalUploads} />
    </motion.div>
  );
}

function UsersTab() {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);

  const loadUsers = useCallback(() => { api.getUsers().then((d) => setUsers(d.users)).catch(() => {}); }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const handleStatusChange = async (id, status) => {
    try { await api.updateUserStatus(id, status); loadUsers(); showToast(t('userStatusUpdated')); } catch (err) { setError(err.message); }
  };
  const handleDelete = async (id) => {
    try { await api.deleteUser(id); loadUsers(); showToast(t('deleted')); } catch (err) { setError(err.message); }
  };

  const statusColor = (s) => {
    if (s === 'active') return 'bg-green-500/20 text-green-400';
    if (s === 'pending') return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const statusLabel = (s) => {
    if (s === 'active') return t('active');
    if (s === 'pending') return t('pending');
    return t('disabled');
  };

  const isPrimaryAdmin = (u) => u.role === 'admin';

  return (
    <div>
      {/* Error / Toast */}
      <AnimatePresence>
        {error && (
          <motion.div className="mb-4 text-red-400 text-sm py-2 px-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-2" variants={fadeUp} initial="hidden" animate="visible" exit="hidden">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto shrink-0 text-xs opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 right-4 sm:bottom-20 z-[100] px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium bg-green-500/90 text-white border-green-400/30"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center gap-2"><Check size={15} />{toast}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end mb-3">
        <motion.button onClick={() => setShowCreate(!showCreate)} className="btn-secondary btn-sm flex items-center gap-1.5" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}><Plus size={14} /> {t('newUser')}</motion.button>
      </div>

      <AnimatePresence>{showCreate && <CreateUserForm onDone={() => { setShowCreate(false); loadUsers(); }} onCancel={() => setShowCreate(false)} />}</AnimatePresence>

      {/* Edit username modal */}
      <AnimatePresence>
        {editingUser && (
          <EditUsernameModal user={editingUser} t={t} onDone={(msg) => { setEditingUser(null); loadUsers(); showToast(msg); }} onCancel={() => setEditingUser(null)} setError={setError} />
        )}
      </AnimatePresence>

      {/* Change password modal */}
      <AnimatePresence>
        {passwordUser && (
          <ChangePasswordModal user={passwordUser} t={t} onDone={(msg) => { setPasswordUser(null); loadUsers(); showToast(msg); }} onCancel={() => setPasswordUser(null)} setError={setError} />
        )}
      </AnimatePresence>

      {/* Mobile cards */}
      <motion.div className="sm:hidden space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
        {users.map((u, i) => (
          <motion.div key={u.id} className="glass rounded-2xl p-4 space-y-3.5 card-lift" variants={staggerItem} custom={i}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{u.username}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-[var(--active-bg)] text-apple-muted'}`}>{u.role === 'admin' ? t('admin') : t('user')}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded-full ${statusColor(u.status)}`}>{statusLabel(u.status)}</span>
              <span className="text-apple-muted">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '-'}</span>
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-1 flex-wrap">
              {!isPrimaryAdmin(u) && (
                <LiquidCapsuleSwitch
                  options={[
                    { id: 'active', label: t('active'), icon: UserCheck, tone: 'var(--accent-green)' },
                    { id: 'pending', label: t('pending'), icon: Clock, tone: '#fbbf24' },
                    { id: 'disabled', label: t('disabled'), icon: UserX, tone: 'var(--danger)' },
                  ]}
                  value={u.status}
                  onChange={(status) => handleStatusChange(u.id, status)}
                  size="sm"
                  ariaLabel={t('status')}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <motion.button onClick={() => setEditingUser(u)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400" whileTap={{ scale: 0.85 }} title={t('editUsername')}><Edit3 size={14} /></motion.button>
              <motion.button onClick={() => setPasswordUser(u)} className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-400" whileTap={{ scale: 0.85 }} title={t('changePassword')}><Key size={14} /></motion.button>
              {!isPrimaryAdmin(u) && (
                <HoldToDeleteButton
                  size="sm"
                  label=""
                  confirmLabel=""
                  completedLabel=""
                  duration={1000}
                  onConfirm={() => handleDelete(u.id)}
                  ariaLabel={t('deleteUser')}
                />
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Desktop table */}
      <motion.div className="hidden sm:block glass rounded-2xl overflow-x-auto" variants={fadeUp} initial="hidden" animate="visible">
        <table className="w-full text-sm min-w-[700px]">
          <thead><tr className="border-b border-[var(--border)]">
            <th className="text-left p-3 text-apple-muted font-medium">{t('username')}</th>
            <th className="text-left p-3 text-apple-muted font-medium">{t('role')}</th>
            <th className="text-left p-3 text-apple-muted font-medium">{t('status')}</th>
            <th className="text-left p-3 text-apple-muted font-medium hidden md:table-cell">{t('createdAt')}</th>
            <th className="text-left p-3 text-apple-muted font-medium hidden md:table-cell">{t('lastLogin')}</th>
            <th className="text-right p-3 text-apple-muted font-medium">{t('actions')}</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <motion.tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--hover-bg)]" variants={fadeUp}>
                <td className="p-3">
                  <span>{u.username}</span>
                  <button onClick={() => setEditingUser(u)} className="ml-2 p-1 rounded hover:bg-blue-500/15 text-blue-400 inline-block align-middle opacity-60 hover:opacity-100" title={t('editUsername')}><Edit3 size={12} /></button>
                </td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-[var(--active-bg)] text-apple-muted'}`}>{u.role === 'admin' ? t('admin') : t('user')}</span></td>
                <td className="p-3">
                  {isPrimaryAdmin(u) ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(u.status)}`}>{statusLabel(u.status)}</span>
                  ) : (
                    <LiquidCapsuleSwitch
                      options={[
                        { id: 'active', label: t('active'), icon: UserCheck, tone: 'var(--accent-green)' },
                        { id: 'pending', label: t('pending'), icon: Clock, tone: '#fbbf24' },
                        { id: 'disabled', label: t('disabled'), icon: UserX, tone: 'var(--danger)' },
                      ]}
                      value={u.status}
                      onChange={(status) => handleStatusChange(u.id, status)}
                      size="sm"
                      ariaLabel={t('status')}
                    />
                  )}
                </td>
                <td className="p-3 text-apple-muted text-xs hidden md:table-cell">{u.createdAt}</td>
                <td className="p-3 text-apple-muted text-xs hidden md:table-cell">{u.lastLoginAt || '-'}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <motion.button onClick={() => setPasswordUser(u)} className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-400" whileTap={{ scale: 0.85 }} title={t('changePassword')}><Key size={14} /></motion.button>
                    {!isPrimaryAdmin(u) && (
                      <HoldToDeleteButton
                        size="sm"
                        label=""
                        confirmLabel=""
                        completedLabel=""
                        duration={1000}
                        onConfirm={() => handleDelete(u.id)}
                        ariaLabel={t('deleteUser')}
                      />
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

/* ── Edit Username Modal ─────────────────────────────────── */
function EditUsernameModal({ user, t, onDone, onCancel, setError }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 3) return;
    setSaving(true);
    try {
      const data = await api.updateUserUsername(user.id, trimmed);
      onDone(data.message || t('usernameUpdated'));
    } catch (err) {
      setError(err.message);
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-[var(--overlay-bg)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
      <motion.div className="fixed inset-x-4 top-24 z-50 max-w-sm mx-auto glass rounded-2xl p-5 border border-[var(--border)] shadow-2xl max-h-[calc(100dvh-8rem)] overflow-y-auto" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.32 }}>
        <h3 className="text-sm font-medium mb-1">{t('editUsername')}</h3>
        <p className="text-xs text-apple-muted mb-4">{user.username} → ?</p>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={t('enterNewUsername')} className="mb-3" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
        <div className="flex gap-2 justify-end">
          <motion.button onClick={onCancel} className="btn-secondary btn-sm" whileTap={{ scale: 0.95 }}>{t('cancel')}</motion.button>
          <motion.button onClick={handleSave} disabled={saving || !value.trim() || value.trim().length < 3} className="btn-primary btn-sm" whileTap={{ scale: 0.95 }}>{saving ? t('loading') : t('save')}</motion.button>
        </div>
      </motion.div>
    </>
  );
}

/* ── Change Password Modal ───────────────────────────────── */
function ChangePasswordModal({ user, t, onDone, onCancel, setError }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!value || value.length < 6) return;
    setSaving(true);
    try {
      await api.updateUserPassword(user.id, value);
      onDone(t('passwordUpdated'));
    } catch (err) {
      setError(err.message);
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-[var(--overlay-bg)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
      <motion.div className="fixed inset-x-4 top-24 z-50 max-w-sm mx-auto glass rounded-2xl p-5 border border-[var(--border)] shadow-2xl max-h-[calc(100dvh-8rem)] overflow-y-auto" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.32 }}>
        <h3 className="text-sm font-medium mb-1">{t('changePassword')}</h3>
        <p className="text-xs text-apple-muted mb-4">{user.username}</p>
        <input type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder={t('enterNewPassword')} className="mb-3" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
        <div className="flex gap-2 justify-end">
          <motion.button onClick={onCancel} className="btn-secondary btn-sm" whileTap={{ scale: 0.95 }}>{t('cancel')}</motion.button>
          <motion.button onClick={handleSave} disabled={saving || value.length < 6} className="btn-primary btn-sm" whileTap={{ scale: 0.95 }}>{saving ? t('loading') : t('save')}</motion.button>
        </div>
      </motion.div>
    </>
  );
}

function CreateUserForm({ onDone, onCancel }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.createUser(username, password, role); onDone(); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <motion.form onSubmit={handleSubmit} className="glass rounded-2xl p-5 mb-5 space-y-4" variants={scaleIn} initial="hidden" animate="visible" exit="hidden">
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('username')} className="flex-1" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} className="flex-1" required />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm text-apple-text sm:w-24">
          <option value="user">{t('user')}</option>
          <option value="admin">{t('admin')}</option>
        </select>
      </div>
      {error && <div className="text-red-400 text-sm py-1.5 px-3 bg-red-500/10 rounded-lg border border-red-500/20">{error}</div>}
      <div className="flex gap-2 justify-end">
        <motion.button type="button" onClick={onCancel} className="btn-secondary btn-sm" whileTap={{ scale: 0.95 }}>{t('cancel')}</motion.button>
        <motion.button type="submit" className="btn-primary btn-sm" disabled={loading} whileTap={{ scale: 0.95 }}>{loading ? t('loading') : t('save')}</motion.button>
      </div>
    </motion.form>
  );
}

function PersonaTab() {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');

  useEffect(() => {
    api.getAdminPersona().then((d) => {
      setEnabled(d.enabled);
      setContent(d.content || '');
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const showMsg = (text: string, type: 'ok' | 'err') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 2400);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await api.updateAdminPersona(enabled, content);
      setEnabled(data.enabled);
      setContent(data.content);
      showMsg(t('personaSaved'), 'ok');
    } catch (err) {
      showMsg(t('personaSaveFailed'), 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await api.updateAdminPersona(false, '');
    setEnabled(false);
    setContent('');
    showMsg(t('personaSaved'), 'ok');
  };

  if (!loaded) return <div className="text-apple-muted">{t('loading')}</div>;

  return (
    <motion.div className="max-w-2xl" variants={fadeUp} initial="hidden" animate="visible" transition={{ ...appleEase, duration: 0.6 }}>
      <div className="glass rounded-2xl p-6 space-y-5 border border-[var(--border)]">

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">{t('globalPersona')}</h3>
            <p className="text-apple-muted text-xs mt-0.5">{t('personaDesc')}</p>
          </div>
          <motion.button
            onClick={() => setEnabled(!enabled)}
            className={`w-10 h-5 rounded-full flex items-center px-0.5 ${enabled ? 'bg-apple-blue2' : 'bg-[var(--active-bg)]'}`}
            whileTap={{ scale: 0.95 }}
            style={{ transition: 'background-color 300ms linear' }}
          >
            <motion.div
              className="w-4 h-4 rounded-full bg-white/90 shadow-sm"
              initial={false}
              animate={{ x: enabled ? 18 : 1 }}
              transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </motion.button>
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: enabled ? 1 : 0.4, height: enabled ? 'auto' : 0 }}
          transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('personaPlaceholder')}
            rows={5}
            maxLength={4000}
            disabled={!enabled}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2.5 text-sm text-apple-text placeholder:text-apple-muted/50 resize-none focus:outline-none focus:border-[var(--accent)] disabled:opacity-30"
            style={{ transition: 'border-color 320ms linear' }}
          />
          <div className="text-right text-apple-muted text-xs mt-1">{content.length} / 4000 {t('personaCharCount')}</div>
        </motion.div>

        <div className="flex items-center gap-2 justify-end">
          <motion.button
            onClick={handleReset}
            className="btn-secondary btn-sm"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ transitionDuration: '240ms' }}
          >
            {t('reset')}
          </motion.button>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary btn-sm"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ transitionDuration: '240ms' }}
          >
            {saving ? t('loading') : t('savePersona')}
          </motion.button>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div
              className={`text-sm py-2 px-3 rounded-xl border text-center ${msgType === 'ok' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function FilesTab() {
  const { t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewSrc, setPreviewSrc] = useState('');
  const fileInputRef = useRef(null);

  const loadFiles = useCallback(() => { api.getFiles().then((d) => setFiles(d.files)).catch(() => {}); }, []);
  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setError(''); setUploading(true); setUploadProgress(0);
    const timer = setInterval(() => setUploadProgress(p => Math.min(p + 0.15, 0.9)), 180);
    try {
      const formData = new FormData(); formData.append('file', file);
      const data = await api.uploadFile(formData);
      clearInterval(timer); setUploadProgress(1);
      if (data.error) throw new Error(data.error);
      setTimeout(() => { setUploadProgress(0); loadFiles(); }, 350);
    } catch (err) { clearInterval(timer); setUploadProgress(0); setError(err.message); } finally {
      setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => { try { await api.deleteFile(id); loadFiles(); } catch (err) { setError(err.message); } };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <AnimatePresence>{error && <motion.div className="mb-4 text-red-400 text-sm py-2 px-3 bg-red-500/10 rounded-xl border border-red-500/20" variants={fadeUp} initial="hidden" animate="visible" exit="hidden">{error}</motion.div>}</AnimatePresence>

      <div className="flex justify-end mb-3">
        <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" accept=".png,.jpg,.jpeg,.webp,.gif,.zip,.txt,.md,.json,.pdf,.docx,.xlsx,.csv" />
        <motion.button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary btn-sm flex items-center gap-1.5" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Upload size={14} />{uploading ? t('uploading') : t('uploadFile')}
        </motion.button>
      </div>

      <AnimatePresence>
        {uploadProgress > 0 && (
          <motion.div className="mb-5 glass rounded-2xl p-1 overflow-hidden" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <motion.div className="h-1.5 rounded-lg bg-apple-blue2" initial={{ width: '0%' }} animate={{ width: `${uploadProgress * 100}%` }} transition={{ duration: 0.28 }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile cards */}
      <motion.div className="sm:hidden space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
        {files.length === 0 && <motion.div className="glass rounded-xl p-8 text-center text-apple-muted" variants={staggerItem}><FileText size={24} className="mx-auto mb-2 opacity-30" />{t('noFilesYet')}</motion.div>}
        {files.map((f, i) => (
          <motion.div key={f.id} className="glass rounded-2xl p-4 space-y-2.5 card-lift" variants={staggerItem} custom={i}>
            {(f.mimeType || '').startsWith('image/') && (
              <img src={api.getFilePreviewUrl(f.id)} alt={f.originalName} className="img-thumb w-full max-h-40 object-cover cursor-pointer mb-2" onClick={() => setPreviewSrc(api.getFilePreviewUrl(f.id))} />
            )}
            <div className="font-medium text-sm truncate">{f.originalName}</div>
            <div className="flex items-center justify-between text-xs text-apple-muted"><span>{formatSize(f.size)}</span><span>{f.createdAt}</span></div>
            <div className="flex items-center gap-1 justify-end">
              {(f.mimeType || '').startsWith('image/') && <motion.button onClick={() => setPreviewSrc(api.getFilePreviewUrl(f.id))} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400" whileTap={{ scale: 0.85 }}><ImageIcon size={14} /></motion.button>}
              <motion.a href={api.getFileDownloadUrl(f.id)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400" whileTap={{ scale: 0.85 }}><Download size={14} /></motion.a>
              <HoldToDeleteButton
                size="sm"
                label=""
                confirmLabel=""
                completedLabel=""
                duration={900}
                onConfirm={() => handleDelete(f.id)}
                ariaLabel={t('deleteFile')}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Desktop table */}
      <motion.div className="hidden sm:block glass rounded-2xl overflow-x-auto" variants={fadeUp} initial="hidden" animate="visible">
        <table className="w-full text-sm min-w-[500px]">
          <thead><tr className="border-b border-[var(--border)]">
            <th className="text-left p-3 text-apple-muted font-medium">{t('fileName')}</th>
            <th className="text-left p-3 text-apple-muted font-medium hidden md:table-cell">{t('fileType')}</th>
            <th className="text-left p-3 text-apple-muted font-medium">{t('fileSize')}</th>
            <th className="text-left p-3 text-apple-muted font-medium hidden md:table-cell">{t('uploadedAt')}</th>
            <th className="text-right p-3 text-apple-muted font-medium">{t('actions')}</th>
          </tr></thead>
          <tbody>
            {files.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-apple-muted"><FileText size={24} className="mx-auto mb-2 opacity-30" />{t('noFilesYet')}</td></tr>}
            {files.map((f) => (
              <motion.tr key={f.id} className="border-b border-[var(--border)] hover:bg-[var(--hover-bg)]" variants={fadeUp}>
                <td className="p-3 text-sm truncate max-w-[200px]">
                  {(f.mimeType || '').startsWith('image/') ? (
                    <button onClick={() => setPreviewSrc(api.getFilePreviewUrl(f.id))} className="text-apple-blue2 hover:underline text-left">{f.originalName}</button>
                  ) : f.originalName}
                </td>
                <td className="p-3 text-apple-muted text-xs hidden md:table-cell">{f.mimeType}</td>
                <td className="p-3 text-apple-muted text-xs">{formatSize(f.size)}</td>
                <td className="p-3 text-apple-muted text-xs hidden md:table-cell">{f.createdAt}</td>
                <td className="p-3 text-right"><div className="flex items-center justify-end gap-1">
                  {(f.mimeType || '').startsWith('image/') && <motion.button onClick={() => setPreviewSrc(api.getFilePreviewUrl(f.id))} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400" whileTap={{ scale: 0.85 }}><ImageIcon size={14} /></motion.button>}
                  <motion.a href={api.getFileDownloadUrl(f.id)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400" whileTap={{ scale: 0.85 }}><Download size={14} /></motion.a>
                  <HoldToDeleteButton
                    size="sm"
                    label=""
                    confirmLabel=""
                    completedLabel=""
                    duration={900}
                    onConfirm={() => handleDelete(f.id)}
                    ariaLabel={t('deleteFile')}
                  />
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <ImageViewer src={previewSrc} alt={t('imagePreview')} onClose={() => setPreviewSrc('')} />
    </div>
  );
}

function ServersTab() {
  const { t, lang } = useLanguage();
  const [servers, setServers] = useState([]);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadServers = useCallback(() => {
    api.getServers().then(d => setServers(d.servers || [])).catch(() => {});
  }, []);
  useEffect(() => { loadServers(); }, [loadServers]);

  const handleDelete = async (id) => {
    try { await api.deleteServer(id); loadServers(); } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <AnimatePresence>
        {error && (
          <motion.div className="mb-4 text-red-400 text-sm py-2 px-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-2" variants={fadeUp} initial="hidden" animate="visible" exit="hidden">
            <AlertTriangle size={14} /> {error}
            <button onClick={() => setError('')} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end mb-3">
        <motion.button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Plus size={14} /> {t('addServer')}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && <ServerFormModal server={null} t={t} onDone={() => { setShowAdd(false); loadServers(); }} onCancel={() => setShowAdd(false)} setError={setError} />}
        {editing && <ServerFormModal server={editing} t={t} onDone={() => { setEditing(null); loadServers(); }} onCancel={() => setEditing(null)} setError={setError} />}
      </AnimatePresence>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {servers.map((s) => (
          <div key={s.id} className="glass rounded-2xl p-4 space-y-2.5 card-lift">
            <div className="flex items-center justify-between">
              <Link to={`/servers/${s.id}`} className="font-medium text-sm no-underline hover:text-[var(--accent)]" style={{ color: 'inherit', transition: 'color 200ms' }}>{s.name}</Link>
              <span className="text-xs text-apple-muted">{s.username}@{s.ip}:{s.port}</span>
            </div>
            {s.authNote && <p className="text-xs text-apple-muted truncate">{s.authNote}</p>}
            <div className="flex gap-1">
              <motion.button onClick={() => setEditing(s)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400" whileTap={{ scale: 0.85 }}><Edit3 size={14} /></motion.button>
              <HoldToDeleteButton
                size="sm"
                label=""
                confirmLabel=""
                completedLabel=""
                duration={1000}
                onConfirm={() => handleDelete(s.id)}
                ariaLabel={t('delete')}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block glass rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead><tr className="border-b border-[var(--border)]">
            <th className="text-left p-3 text-apple-muted font-medium">{t('serverName')}</th>
            <th className="text-left p-3 text-apple-muted font-medium">{t('serverIP')}</th>
            <th className="text-left p-3 text-apple-muted font-medium hidden md:table-cell">{t('serverUser')}</th>
            <th className="text-left p-3 text-apple-muted font-medium hidden md:table-cell">{t('authNote')}</th>
            <th className="text-right p-3 text-apple-muted font-medium">{t('actions')}</th>
          </tr></thead>
          <tbody>
            {servers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-apple-muted">{t('noServers')}</td></tr>
            ) : servers.map((s) => (
              <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--hover-bg)]">
                <td className="p-3">
                  <Link to={`/servers/${s.id}`} className="text-sm no-underline hover:text-[var(--accent)]" style={{ color: 'inherit', transition: 'color 200ms' }}>{s.name}</Link>
                </td>
                <td className="p-3 text-xs font-mono">{s.ip}:{s.port}</td>
                <td className="p-3 text-xs hidden md:table-cell">{s.username}</td>
                <td className="p-3 text-xs text-apple-muted hidden md:table-cell truncate max-w-[200px]">{s.authNote || '-'}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/servers/${s.id}`} className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 inline-flex" title={t('execCommand')}><Monitor size={14} /></Link>
                    <motion.button onClick={() => setEditing(s)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400" whileTap={{ scale: 0.85 }} title={t('editServer')}><Edit3 size={14} /></motion.button>
                    <HoldToDeleteButton
                      size="sm"
                      label=""
                      confirmLabel=""
                      completedLabel=""
                      duration={1000}
                      onConfirm={() => handleDelete(s.id)}
                      ariaLabel={t('delete')}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServerFormModal({ server, t, onDone, onCancel, setError }) {
  const [name, setName] = useState(server?.name || '');
  const [ip, setIp] = useState(server?.ip || '');
  const [port, setPort] = useState(server?.port || 22);
  const [username, setUsername] = useState(server?.username || 'root');
  const [authNote, setAuthNote] = useState(server?.authNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !ip.trim()) return;
    setSaving(true);
    try {
      if (server) {
        await api.updateServer(server.id, { name: name.trim(), ip: ip.trim(), port: parseInt(port) || 22, username: username.trim() || 'root', authNote: authNote.trim() });
      } else {
        await api.createServer({ name: name.trim(), ip: ip.trim(), port: parseInt(port) || 22, username: username.trim() || 'root', authNote: authNote.trim() });
      }
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-[var(--overlay-bg)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
      <motion.div className="fixed inset-x-4 top-24 z-50 max-w-md mx-auto glass rounded-2xl p-5 border border-[var(--border)] shadow-2xl max-h-[calc(100dvh-8rem)] overflow-y-auto" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.32 }}>
        <h3 className="text-sm font-medium mb-4">{server ? t('editServer') : t('addServer')}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-apple-muted block mb-1">{t('serverName')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Web Server 1" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-apple-muted block mb-1">{t('serverIP')}</label>
              <input value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.1" />
            </div>
            <div>
              <label className="text-xs text-apple-muted block mb-1">{t('serverPort')}</label>
              <input value={port} onChange={e => setPort(e.target.value)} placeholder="22" type="number" />
            </div>
          </div>
          <div>
            <label className="text-xs text-apple-muted block mb-1">{t('serverUser')}</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="root" />
          </div>
          <div>
            <label className="text-xs text-apple-muted block mb-1">{t('authNote')}</label>
            <input value={authNote} onChange={e => setAuthNote(e.target.value)} placeholder={t('authNote') + ' (SSH key, password, etc.)'} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <motion.button onClick={onCancel} className="btn-secondary btn-sm" whileTap={{ scale: 0.95 }}>{t('cancel')}</motion.button>
          <motion.button onClick={handleSave} disabled={saving || !name.trim() || !ip.trim()} className="btn-primary btn-sm" whileTap={{ scale: 0.95 }}>{saving ? t('loading') : t('save')}</motion.button>
        </div>
      </motion.div>
    </>
  );
}
