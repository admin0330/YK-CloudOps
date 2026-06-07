import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FolderOpen, LogOut, Menu, X as XIcon,
  Upload, Download, Trash2, Check, FileText, Plus, Image as ImageIcon,
  Sparkles, Terminal, Server, ExternalLink, RefreshCw, HardDrive, Monitor,
  Edit3, Key, Clock, UserCheck, UserX, AlertTriangle, Search,
  Bell, ChevronDown, Settings, Grid, List, BarChart3, Activity,
  TrendingUp, TrendingDown, Globe, Shield, Zap, Database,
  ChevronLeft, ChevronRight, Maximize2, Download as DownloadIcon,
  Copy, Eye, MoreHorizontal,
} from 'lucide-react';
import HoldToDeleteButton from '../components/ui/HoldToDeleteButton';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { fadeUp, scaleIn, staggerContainer, staggerItem, appleEase } from '../lib/motion';
import ImageViewer from '../components/ImageViewer';
import Navbar from '../components/Navbar';

// ============================================================
// TAB Configuration
// ============================================================
const TABS = [
  { key: 'dashboard', icon: LayoutDashboard, label: { zh: '控制台', en: 'Dashboard' } },
  { key: 'servers', icon: Server, label: { zh: '服务器', en: 'Servers' } },
  { key: 'users', icon: Users, label: { zh: '用户', en: 'Users' } },
  { key: 'files', icon: FolderOpen, label: { zh: '文件', en: 'Files' } },
  { key: 'persona', icon: Sparkles, label: { zh: '人格', en: 'Persona' } },
];

// ============================================================
// Anime.js number counter hook
// ============================================================
function useAnimeCounter(target: number, deps: any[] = []) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = prevRef.current;
    prevRef.current = target;
    // Use anime.js if available
    if (typeof window !== 'undefined' && (window as any).anime) {
      try {
        (window as any).anime({
          targets: el,
          innerHTML: [from, target],
          round: 1,
          easing: 'easeOutExpo',
          duration: 1200,
          update: (a: any) => {
            el.textContent = Math.round(a.animations[0].currentValue).toLocaleString();
          },
        });
      } catch {
        el.textContent = target.toLocaleString();
      }
    } else {
      el.textContent = target.toLocaleString();
    }
  }, [target, ...deps]);

  return ref;
}

// ============================================================
// AnimatedMetric — number with label and trend
// ============================================================
function AnimatedMetric({ label, value, suffix, icon: Icon, trend, trendLabel, color }: {
  label: string; value: number; suffix?: string; icon?: any; trend?: 'up' | 'down'; trendLabel?: string; color?: string;
}) {
  const counterRef = useAnimeCounter(value, [value]);
  const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
    mint: { bg: '#ecfdf5', text: '#059669', iconBg: '#d1fae5' },
    teal: { bg: '#f0fdfa', text: '#0f766e', iconBg: '#ccfbf1' },
    blue: { bg: '#eff6ff', text: '#1d4ed8', iconBg: '#dbeafe' },
    amber: { bg: '#fffbeb', text: '#b45309', iconBg: '#fef3c7' },
    rose: { bg: '#fff1f2', text: '#be123c', iconBg: '#ffe4e6' },
    purple: { bg: '#faf5ff', text: '#7c3aed', iconBg: '#ede9fe' },
  };
  const c = colors[color || 'mint'] || colors.mint;

  return (
    <div className="saas-stat" style={{ animation: 'saasSlideUp 0.5s ease-out forwards' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="stat-label">{label}</div>
          <div className="stat-value mt-1 flex items-baseline gap-1">
            <span ref={counterRef as any}>{value.toLocaleString()}</span>
            {suffix && <span className="text-sm font-medium text-slate-400">{suffix}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend === 'up' ? (
                <TrendingUp size={12} className="text-emerald-500" />
              ) : (
                <TrendingDown size={12} className="text-rose-500" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-500'}`}>
                {trendLabel || ''}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="stat-icon shrink-0 ml-3" style={{ background: c.iconBg, color: c.text }}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ProgressRing — SVG donut chart
// ============================================================
function ProgressRing({ percent, size = 56, strokeWidth = 4, color = '#10b981' }: { percent: number; size?: number; strokeWidth?: number; color?: string }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circumference);
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).anime) {
      try {
        (window as any).anime({
          targets: { o: circumference },
          o: circumference - (percent / 100) * circumference,
          round: 1,
          easing: 'easeOutCubic',
          duration: 1000,
          update: (a: any) => setOffset(a.animations[0].currentValue),
        });
      } catch {
        setOffset(circumference - (percent / 100) * circumference);
      }
    } else {
      setTimeout(() => setOffset(circumference - (percent / 100) * circumference), 100);
    }
  }, [percent]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle
        ref={ref}
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
    </svg>
  );
}

// ============================================================
// MAIN: AdminPage
// ============================================================
export default function AdminPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [admin, setAdmin] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    api.adminGetMe().then((d) => setAdmin(d.user)).catch(() => navigate('/admin-login')).finally(() => setAuthChecked(true));
  }, [navigate]);

  const handleLogout = async () => { await api.adminLogout().catch(() => {}); navigate('/admin-login'); };
  const switchTab = (key: string) => { setTab(key); setMobileMenuOpen(false); };

  if (!authChecked) {
    return (
      <div className="admin-saas min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-400">{t('loading')}</span>
        </div>
      </div>
    );
  }
  if (!admin) return null;

  const username = admin?.username || 'Admin';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="admin-saas min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      {/* ===== Top Header Bar ===== */}
      <header className="saas-header fixed top-0 inset-x-0 z-30 h-14 flex items-center px-4 lg:px-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile menu toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden saas-btn saas-btn-ghost saas-btn-sm p-2 -ml-1">
            {mobileMenuOpen ? <XIcon size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo */}
          <Link to="/me" className="flex items-center gap-2 shrink-0 no-underline">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Y</span>
            </div>
            <span className="hidden sm:inline text-sm font-semibold text-slate-800">ym1r</span>
          </Link>

          {/* Breadcrumb */}
          <span className="text-sm text-slate-300 hidden sm:inline">/</span>
          <span className="text-sm text-slate-500 font-medium hidden sm:inline">{t('adminPanel')}</span>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center relative mx-4 max-w-xs w-full">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={lang === 'zh' ? '搜索...' : 'Search...'}
            className="saas-input !pl-9 !py-1.5 !text-sm !rounded-xl !bg-slate-50 !border-slate-200"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="saas-btn saas-btn-ghost saas-btn-sm p-2 relative" title={lang === 'zh' ? '通知' : 'Notifications'}>
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          <button className="saas-btn saas-btn-ghost saas-btn-sm p-2 hidden sm:flex" title={lang === 'zh' ? '设置' : 'Settings'}>
            <Settings size={16} />
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="saas-avatar">{initials}</div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-700">{username}</div>
              <div className="text-[10px] text-slate-400">{t('admin')}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Body: Sidebar + Main ===== */}
      <div className="flex flex-1 min-h-0 pt-14 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 min-h-0 saas-sidebar transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${sidebarCollapsed ? 'w-16' : 'w-56'}`}
        >
          {/* Sidebar header */}
          <div className={`flex items-center h-14 px-3 border-b border-slate-100 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <span className={`text-xs font-semibold tracking-widest uppercase text-slate-400 ${sidebarCollapsed ? 'hidden' : ''}`}>
              {lang === 'zh' ? '导航' : 'Navigation'}
            </span>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="saas-btn saas-btn-ghost saas-btn-sm p-1.5 ml-auto text-slate-400 hover:text-slate-600"
            >
              {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {TABS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`saas-sidebar-item ${tab === key ? 'is-active' : ''} ${sidebarCollapsed ? '!justify-center !px-0' : ''}`}
                title={sidebarCollapsed ? label[lang] : undefined}
              >
                <Icon size={18} />
                {!sidebarCollapsed && <span>{label[lang]}</span>}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className={`saas-sidebar-item text-slate-400 hover:text-rose-500 ${sidebarCollapsed ? '!justify-center !px-0' : ''}`}
              title={sidebarCollapsed ? t('signOut') : undefined}
            >
              <LogOut size={18} />
              {!sidebarCollapsed && <span>{t('signOut')}</span>}
            </button>
          </div>
        </aside>

        {/* ===== Main Content ===== */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          {/* Tab label for mobile */}
          <div className="lg:hidden flex items-center justify-between px-4 pt-4 pb-2">
            <h1 className="text-lg font-bold text-slate-800">
              {TABS.find(t => t.key === tab)?.label[lang] || t('dashboard')}
            </h1>
          </div>

          {/* Mobile tab bar */}
          <div className="lg:hidden px-4 pb-3 overflow-x-auto">
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm min-w-max">
              {TABS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => switchTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    tab === key
                      ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={14} />
                  {label[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="px-4 lg:px-6 pb-24 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {tab === 'dashboard' && <DashboardTab lang={lang} t={t} />}
                {tab === 'users' && <UsersTab lang={lang} t={t} />}
                {tab === 'files' && <FilesTab lang={lang} t={t} />}
                {tab === 'persona' && <PersonaTab lang={lang} t={t} />}
                {tab === 'servers' && <ServersTab lang={lang} t={t} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="saas-bottom-nav lg:hidden">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`${tab === key ? 'is-active' : ''}`}
          >
            <Icon size={18} />
            <span>{label[lang]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ============================================================
// DASHBOARD TAB
// ============================================================
function DashboardTab({ lang, t }: { lang: string; t: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sysStatus, setSysStatus] = useState<any>(null);

  useEffect(() => {
    api.getStats().then((d) => setStats(d.stats)).catch(() => {}).finally(() => setLoading(false));
    api.getSystemStatus().then((d) => setSysStatus(d)).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">{t('loading')}</span>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: t('totalUsers'), value: stats?.totalUsers || 0, icon: Users, color: 'mint', trend: stats?.activeUsers > 0 ? 'up' : undefined, trendLabel: `${stats?.activeUsers || 0} ${lang === 'zh' ? '活跃' : 'active'}` },
    { label: t('activeUsers'), value: stats?.activeUsers || 0, icon: Activity, color: 'teal', suffix: '%' },
    { label: lang === 'zh' ? '待审核' : 'Pending', value: stats?.pendingUsers || 0, icon: UserCheck, color: 'amber' },
    { label: t('conversations'), value: stats?.totalConversations || 0, icon: MessageSquare, color: 'blue', trend: 'up', trendLabel: stats?.totalMessages || '0 msgs' },
    { label: lang === 'zh' ? '消息总数' : 'Messages', value: stats?.totalMessages || 0, icon: Activity, color: 'purple' },
    { label: t('uploads'), value: stats?.totalUploads || 0, icon: Upload, color: 'rose' },
  ];

  return (
    <div>
      {/* Welcome row */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {lang === 'zh' ? '概览' : 'Overview'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {lang === 'zh' ? '查看您的平台运行状态和数据统计' : 'View your platform status and analytics'}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {metrics.map((m, i) => (
          <div key={m.label} className="saas-stat" style={{ animationDelay: `${i * 0.06}s` }}>
            <AnimatedMetric {...m} />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* System Status Card */}
        <div className="saas-card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">
              {lang === 'zh' ? '系统状态' : 'System Status'}
            </h3>
            {sysStatus && (
              <span className="saas-badge saas-badge-mint">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                {sysStatus.hostname || '-'}
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <Server size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500">{lang === 'zh' ? 'CPU 负载' : 'CPU Load'}</div>
                  <div className="text-sm font-semibold text-slate-800">{sysStatus?.cpu?.loadAvg1?.toFixed(2) || '-'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">{sysStatus?.cpu?.cores || '-'} {lang === 'zh' ? '核心' : 'cores'}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">{lang === 'zh' ? '内存' : 'Memory'}</span>
                <span className="text-xs font-medium text-slate-700">
                  {sysStatus?.memory?.usagePercent?.toFixed(1) || '-'}%
                </span>
              </div>
              <div className="saas-progress">
                <div className="saas-progress-bar" style={{ width: `${sysStatus?.memory?.usagePercent || 0}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">{lang === 'zh' ? '已用' : 'Used'}</span>
                <span className="text-[10px] text-slate-400">
                  {sysStatus?.memory ? `${(sysStatus.memory.used / 1073741824).toFixed(1)}GB / ${(sysStatus.memory.total / 1073741824).toFixed(1)}GB` : '-'}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">{lang === 'zh' ? '磁盘' : 'Disk'}</span>
                <span className="text-xs font-medium text-slate-700">{sysStatus?.disk?.usagePercent || '-'}</span>
              </div>
              <div className="saas-progress">
                <div className="saas-progress-bar" style={{ width: `${parseInt(sysStatus?.disk?.usagePercent || '0')}%`, background: parseInt(sysStatus?.disk?.usagePercent || '0') > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : undefined }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">{lang === 'zh' ? '已用' : 'Used'}</span>
                <span className="text-[10px] text-slate-400">{sysStatus?.disk?.used || '-'} / {sysStatus?.disk?.total || '-'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Clock size={13} className="text-slate-400" />
              <span className="text-xs text-slate-500">
                {lang === 'zh' ? '运行时间' : 'Uptime'}: {sysStatus?.uptimeFormatted || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="saas-card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">
              {lang === 'zh' ? '快捷操作' : 'Quick Actions'}
            </h3>
            <Zap size={16} className="text-slate-400" />
          </div>
          <div className="space-y-2">
            <Link to="/disk" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors no-underline text-slate-700">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500">
                <HardDrive size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{lang === 'zh' ? '网盘管理' : 'Disk Manager'}</div>
                <div className="text-xs text-slate-400">{lang === 'zh' ? '管理文件和上传' : 'Manage files & uploads'}</div>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </Link>

            <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors no-underline text-slate-700">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                <BarChart3 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{lang === 'zh' ? '运维面板' : 'CloudOps'}</div>
                <div className="text-xs text-slate-400">{lang === 'zh' ? '服务器监控和运维' : 'Server monitoring & ops'}</div>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </Link>

            <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors w-full text-left text-slate-700" onClick={() => {}}>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <RefreshCw size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{lang === 'zh' ? '刷新数据' : 'Refresh Data'}</div>
                <div className="text-xs text-slate-400">{lang === 'zh' ? '更新当前统计信息' : 'Update current statistics'}</div>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </button>

            <Link to="/admin-login" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors no-underline text-slate-700">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                <Shield size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{lang === 'zh' ? '安全设置' : 'Security'}</div>
                <div className="text-xs text-slate-400">{lang === 'zh' ? '账户和访问管理' : 'Account & access'}</div>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// USERS TAB
// ============================================================
function UsersTab({ lang, t }: { lang: string; t: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [passwordUser, setPasswordUser] = useState<any>(null);

  const loadUsers = useCallback(() => { api.getUsers().then((d) => setUsers(d.users)).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const handleStatusChange = async (id: number, status: string) => {
    try { await api.updateUserStatus(id, status); loadUsers(); showToast(t('userStatusUpdated')); } catch (err: any) { setError(err.message); }
  };
  const handleDelete = async (id: number) => {
    try { await api.deleteUser(id); loadUsers(); showToast(t('deleted')); } catch (err: any) { setError(err.message); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { active: 'saas-badge-mint', pending: 'saas-badge-amber', disabled: 'saas-badge-rose' };
    return map[s] || 'saas-badge-gray';
  };
  const statusLabel = (s: string) => t(s === 'active' ? 'active' : s === 'pending' ? 'pending' : 'disabled');

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" /></div>;
  }

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Check size={14} className="shrink-0" />
            {toast}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="saas-input !pl-9 !py-2 !text-sm !w-56" placeholder={lang === 'zh' ? '搜索用户...' : 'Search users...'} />
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="saas-btn saas-btn-primary saas-btn-sm">
          <Plus size={14} />
          {t('addUser')}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="saas-table">
          <thead>
            <tr>
              <th>{t('username')}</th>
              <th>{t('role')}</th>
              <th>{t('status')}</th>
              <th className="hidden md:table-cell">{t('createdAt')}</th>
              <th className="text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">{t('noUsers')}</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.username}</td>
                <td>
                  <span className={`saas-badge ${u.role === 'admin' ? 'saas-badge-teal' : 'saas-badge-blue'}`}>
                    {u.role === 'admin' ? 'Admin' : t('user')}
                  </span>
                </td>
                <td>
                  <span className={`saas-badge ${statusBadge(u.status)}`}>{statusLabel(u.status)}</span>
                </td>
                <td className="hidden md:table-cell text-slate-400 text-xs">{u.createdAt || '-'}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditingUser(u)} className="saas-btn saas-btn-ghost saas-btn-sm p-1.5" title={t('edit')}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => setPasswordUser(u)} className="saas-btn saas-btn-ghost saas-btn-sm p-1.5" title={t('changePassword')}>
                      <Key size={14} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(u.id, u.status === 'active' ? 'disabled' : 'active')}
                      className="saas-btn saas-btn-ghost saas-btn-sm p-1.5"
                      title={u.status === 'active' ? t('disable') : t('enable')}
                    >
                      {u.status === 'active' ? <UserX size={14} className="text-amber-500" /> : <UserCheck size={14} className="text-emerald-500" />}
                    </button>
                    <HoldToDeleteButton
                      size="sm"
                      label=""
                      confirmLabel=""
                      completedLabel=""
                      duration={900}
                      onConfirm={() => handleDelete(u.id)}
                      ariaLabel={t('delete')}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">{t('noUsers')}</div>
        ) : users.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{u.username}</span>
              <span className={`saas-badge ${u.role === 'admin' ? 'saas-badge-teal' : 'saas-badge-blue'}`}>
                {u.role === 'admin' ? 'Admin' : t('user')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`saas-badge ${statusBadge(u.status)}`}>{statusLabel(u.status)}</span>
              <div className="flex gap-1">
                <button onClick={() => setEditingUser(u)} className="saas-btn saas-btn-ghost saas-btn-sm p-1.5"><Edit3 size={14} /></button>
                <HoldToDeleteButton size="sm" label="" confirmLabel="" completedLabel="" duration={900} onConfirm={() => handleDelete(u.id)} ariaLabel={t('delete')} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showCreate && <UserFormModal mode="create" t={t} lang={lang} onDone={() => { setShowCreate(false); loadUsers(); }} onCancel={() => setShowCreate(false)} setError={setError} />}
      {editingUser && <UserFormModal mode="edit" user={editingUser} t={t} lang={lang} onDone={() => { setEditingUser(null); loadUsers(); }} onCancel={() => setEditingUser(null)} setError={setError} />}
      {passwordUser && <PasswordModal user={passwordUser} t={t} lang={lang} onDone={() => { setPasswordUser(null); }} onCancel={() => setPasswordUser(null)} setError={setError} />}
    </div>
  );
}

// ============================================================
// User Form Modal
// ============================================================
function UserFormModal({ mode, user, t, lang, onDone, onCancel, setError }: {
  mode: 'create' | 'edit'; user?: any; t: any; lang: string; onDone: () => void; onCancel: () => void; setError: (e: string) => void;
}) {
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'user');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) return;
    if (mode === 'create' && !password.trim()) return;
    setSaving(true);
    try {
      if (mode === 'edit' && user) {
        await api.updateUser(user.id, { role });
      } else {
        await api.createUser(username.trim(), password, role);
      }
      onDone();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="saas-modal-overlay" onClick={onCancel} />
      <div className="saas-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          {mode === 'create' ? t('addUser') : t('editUser')}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('username')}</label>
            <input className="saas-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="username" autoFocus />
          </div>
          {mode === 'create' && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('password')}</label>
              <input className="saas-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('role')}</label>
            <select className="saas-input saas-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">{t('user')}</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onCancel} className="saas-btn saas-btn-secondary">{t('cancel')}</button>
          <button onClick={handleSave} disabled={saving || !username.trim() || (mode === 'create' && !password.trim())} className="saas-btn saas-btn-primary">
            {saving ? t('loading') : t('save')}
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Password Modal
// ============================================================
function PasswordModal({ user, t, lang, onDone, onCancel, setError }: {
  user: any; t: any; lang: string; onDone: () => void; onCancel: () => void; setError: (e: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!password.trim()) return;
    setSaving(true);
    try {
      await api.updateUserPassword(user.id, password);
      onDone();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="saas-modal-overlay" onClick={onCancel} />
      <div className="saas-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-1">{t('changePassword')}</h3>
        <p className="text-sm text-slate-500 mb-4">{user?.username}</p>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('newPassword')}</label>
          <input className="saas-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onCancel} className="saas-btn saas-btn-secondary">{t('cancel')}</button>
          <button onClick={handleSave} disabled={saving || !password.trim()} className="saas-btn saas-btn-primary">
            {saving ? t('loading') : t('save')}
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// FILES TAB
// ============================================================
function FilesTab({ lang, t }: { lang: string; t: any }) {
  const [files, setFiles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewSrc, setPreviewSrc] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(() => { api.getFiles().then((d) => setFiles(d.files)).catch(() => {}); }, []);
  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setError(''); setUploading(true); setUploadProgress(0);
    const timer = setInterval(() => setUploadProgress(p => Math.min(p + 0.15, 0.9)), 180);
    try {
      const formData = new FormData(); formData.append('file', file);
      const data = await api.uploadFile(formData);
      clearInterval(timer); setUploadProgress(1);
      if (data.error) throw new Error(data.error);
      setTimeout(() => { setUploadProgress(0); loadFiles(); }, 350);
    } catch (err: any) { clearInterval(timer); setUploadProgress(0); setError(err.message); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDelete = async (id: number) => { try { await api.deleteFile(id); loadFiles(); } catch (err: any) { setError(err.message); } };
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />{error}
            <button onClick={() => setError('')} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg border border-slate-200 flex p-0.5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-100 text-slate-700' : 'text-slate-400'}`}>
              <Grid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-slate-100 text-slate-700' : 'text-slate-400'}`}>
              <List size={16} />
            </button>
          </div>
          <span className="text-xs text-slate-400">{files.length} {lang === 'zh' ? '个文件' : 'files'}</span>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" accept=".png,.jpg,.jpeg,.webp,.gif,.zip,.txt,.md,.json,.pdf,.docx,.xlsx,.csv" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="saas-btn saas-btn-primary saas-btn-sm">
            <Upload size={14} />
            {uploading ? t('uploading') : t('uploadFile')}
          </button>
        </div>
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {uploadProgress > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
            <div className="saas-progress">
              <div className="saas-progress-bar" style={{ width: `${uploadProgress * 100}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File grid */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-2'}`}>
        {files.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText size={32} className="mb-3 opacity-40" />
            <span className="text-sm">{t('noFilesYet')}</span>
          </div>
        )}
        {files.map((f) => (
          viewMode === 'grid' ? (
            <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              {(f.mimeType || '').startsWith('image/') ? (
                <img src={api.getFilePreviewUrl(f.id)} alt={f.originalName} className="w-full h-28 object-cover rounded-lg mb-2 cursor-pointer" onClick={() => setPreviewSrc(api.getFilePreviewUrl(f.id))} />
              ) : (
                <div className="w-full h-28 rounded-lg mb-2 bg-slate-50 flex items-center justify-center">
                  <FileText size={28} className="text-slate-300" />
                </div>
              )}
              <div className="text-xs font-medium truncate text-slate-700 mb-1">{f.originalName}</div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{formatSize(f.size)}</span>
                <div className="flex gap-0.5">
                  {(f.mimeType || '').startsWith('image/') && (
                    <button onClick={() => setPreviewSrc(api.getFilePreviewUrl(f.id))} className="p-1 rounded-md hover:bg-slate-100 text-slate-400"><Eye size={12} /></button>
                  )}
                  <a href={api.getFileDownloadUrl(f.id)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 inline-flex"><DownloadIcon size={12} /></a>
                  <HoldToDeleteButton size="sm" label="" confirmLabel="" completedLabel="" duration={900} onConfirm={() => handleDelete(f.id)} ariaLabel={t('deleteFile')} />
                </div>
              </div>
            </div>
          ) : (
            <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-3 hover:shadow-md transition-all duration-200">
              {(f.mimeType || '').startsWith('image/') ? (
                <img src={api.getFilePreviewUrl(f.id)} alt={f.originalName} className="w-10 h-10 rounded-lg object-cover cursor-pointer shrink-0" onClick={() => setPreviewSrc(api.getFilePreviewUrl(f.id))} />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><FileText size={18} className="text-slate-400" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-slate-700">{f.originalName}</div>
                <div className="text-xs text-slate-400">{formatSize(f.size)}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {(f.mimeType || '').startsWith('image/') && <button onClick={() => setPreviewSrc(api.getFilePreviewUrl(f.id))} className="saas-btn saas-btn-ghost saas-btn-sm p-1.5"><Eye size={14} /></button>}
                <a href={api.getFileDownloadUrl(f.id)} className="saas-btn saas-btn-ghost saas-btn-sm p-1.5 inline-flex"><DownloadIcon size={14} /></a>
                <HoldToDeleteButton size="sm" label="" confirmLabel="" completedLabel="" duration={900} onConfirm={() => handleDelete(f.id)} ariaLabel={t('deleteFile')} />
              </div>
            </div>
          )
        ))}
      </div>

      <ImageViewer src={previewSrc} alt={t('imagePreview')} onClose={() => setPreviewSrc('')} />
    </div>
  );
}

// ============================================================
// PERSONA TAB
// ============================================================
function PersonaTab({ lang, t }: { lang: string; t: any }) {
  const [persona, setPersona] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'ok' | 'err'>('ok');

  useEffect(() => {
    api.getAdminPersona().then((d) => {
      setPersona(d.persona);
      setEnabled(d.persona?.enabled ?? false);
      setContent(d.persona?.content || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMessage('');
    try {
      await api.updateAdminPersona(enabled, content);
      setMessage(t('personaUpdated')); setMessageType('ok');
    } catch (err: any) { setMessage(err.message); setMessageType('err'); }
    finally { setSaving(false); }
  };

  const handleReset = () => {
    if (persona) {
      setEnabled(persona.enabled ?? false);
      setContent(persona.content || '');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">{t('persona')}</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700">{t('enablePersona')}</div>
              <div className="text-xs text-slate-400 mt-0.5">{lang === 'zh' ? '启用后将影响 AI 助手的回复风格' : 'Affects AI assistant response style'}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-400 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('personaContent')}</label>
            <textarea
              className="saas-input !min-h-[200px] resize-y"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={lang === 'zh' ? '输入 AI 助手的人格设定…' : 'Enter AI assistant persona...'}
            />
            <div className="text-[10px] text-slate-400 mt-1">{lang === 'zh' ? '支持 Markdown 格式' : 'Markdown supported'}</div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button onClick={handleReset} className="saas-btn saas-btn-secondary saas-btn-sm">{t('reset')}</button>
            <button onClick={handleSave} disabled={saving} className="saas-btn saas-btn-primary saas-btn-sm">
              {saving ? t('loading') : t('savePersona')}
            </button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`text-sm py-2 px-3 rounded-xl border text-center ${
                  messageType === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SERVERS TAB
// ============================================================
function ServersTab({ lang, t }: { lang: string; t: any }) {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const loadServers = useCallback(() => {
    api.getServers().then(d => setServers(d.servers || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadServers(); }, [loadServers]);

  const handleDelete = async (id: number) => {
    try { await api.deleteServer(id); loadServers(); } catch (err: any) { setError(err.message); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" /></div>;
  }

  return (
    <div>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
            <button onClick={() => setError('')} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="saas-input !pl-9 !py-2 !text-sm !w-56" placeholder={lang === 'zh' ? '搜索服务器...' : 'Search servers...'} />
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="saas-btn saas-btn-primary saas-btn-sm">
          <Plus size={14} />
          {t('addServer')}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="saas-table">
          <thead>
            <tr>
              <th>{t('serverName')}</th>
              <th>{t('serverIP')}</th>
              <th className="hidden md:table-cell">{t('serverUser')}</th>
              <th className="hidden md:table-cell">{t('authNote')}</th>
              <th className="text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {servers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">{t('noServers')}</td></tr>
            ) : servers.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/servers/${s.id}`} className="font-medium text-slate-700 hover:text-emerald-600 no-underline">{s.name}</Link>
                </td>
                <td className="font-mono text-xs">{s.ip}:{s.port}</td>
                <td className="hidden md:table-cell text-xs text-slate-500">{s.username}</td>
                <td className="hidden md:table-cell text-xs text-slate-400 truncate max-w-[200px]">{s.authNote || '-'}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/servers/${s.id}`} className="saas-btn saas-btn-ghost saas-btn-sm p-1.5 inline-flex" title={t('execCommand')}>
                      <Terminal size={14} />
                    </Link>
                    <button onClick={() => setEditing(s)} className="saas-btn saas-btn-ghost saas-btn-sm p-1.5" title={t('editServer')}>
                      <Edit3 size={14} />
                    </button>
                    <HoldToDeleteButton size="sm" label="" confirmLabel="" completedLabel="" duration={1000} onConfirm={() => handleDelete(s.id)} ariaLabel={t('delete')} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {servers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">{t('noServers')}</div>
        ) : servers.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Link to={`/servers/${s.id}`} className="font-medium text-sm text-slate-700 no-underline">{s.name}</Link>
              <span className="text-xs text-slate-400">{s.username}@{s.ip}:{s.port}</span>
            </div>
            {s.authNote && <p className="text-xs text-slate-400 truncate mb-2">{s.authNote}</p>}
            <div className="flex gap-1">
              <button onClick={() => setEditing(s)} className="saas-btn saas-btn-ghost saas-btn-sm p-1.5"><Edit3 size={14} /></button>
              <HoldToDeleteButton size="sm" label="" confirmLabel="" completedLabel="" duration={1000} onConfirm={() => handleDelete(s.id)} ariaLabel={t('delete')} />
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showAdd && <ServerFormModal server={null} t={t} lang={lang} onDone={() => { setShowAdd(false); loadServers(); }} onCancel={() => setShowAdd(false)} setError={setError} />}
      {editing && <ServerFormModal server={editing} t={t} lang={lang} onDone={() => { setEditing(null); loadServers(); }} onCancel={() => setEditing(null)} setError={setError} />}
    </div>
  );
}

function ServerFormModal({ server, t, lang, onDone, onCancel, setError }: {
  server: any; t: any; lang: string; onDone: () => void; onCancel: () => void; setError: (e: string) => void;
}) {
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
        await api.updateServer(server.id, { name: name.trim(), ip: ip.trim(), port: parseInt(String(port)) || 22, username: username.trim() || 'root', authNote: authNote.trim() });
      } else {
        await api.createServer({ name: name.trim(), ip: ip.trim(), port: parseInt(String(port)) || 22, username: username.trim() || 'root', authNote: authNote.trim() });
      }
      onDone();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="saas-modal-overlay" onClick={onCancel} />
      <div className="saas-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4">{server ? t('editServer') : t('addServer')}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('serverName')}</label>
            <input className="saas-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Web Server 1" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('serverIP')}</label>
              <input className="saas-input" value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.1" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('serverPort')}</label>
              <input className="saas-input" value={port} onChange={e => setPort(e.target.value)} placeholder="22" type="number" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('serverUser')}</label>
            <input className="saas-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="root" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('authNote')}</label>
            <input className="saas-input" value={authNote} onChange={e => setAuthNote(e.target.value)} placeholder={t('authNote') + ' (SSH key, password, etc.)'} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onCancel} className="saas-btn saas-btn-secondary">{t('cancel')}</button>
          <button onClick={handleSave} disabled={saving || !name.trim() || !ip.trim()} className="saas-btn saas-btn-primary">{saving ? t('loading') : t('save')}</button>
        </div>
      </div>
    </>
  );
}

// We need MessageSquare icon - re-import
import { MessageSquare } from 'lucide-react';
