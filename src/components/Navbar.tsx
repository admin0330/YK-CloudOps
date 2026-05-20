import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowLeft, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import NavbarControls from './NavbarControls';
import { useIsMobile } from '../lib/useIsMobile';

const NAV_ITEMS = [
  { path: '/', zh: '首页', en: 'Home' },
  { path: '/portal', zh: '入口', en: 'Portal' },
  { path: '/cloudops', zh: '助手', en: 'Assistant' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    api.getMe().then((d) => setUser(d.user)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isAdmin = user?.role === 'admin';
  const isActive = (path: string) => location.pathname === path;
  const isHome = location.pathname === '/';

  const navWithTransition = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleBack = () => {
    window.history.back();
  };

  const handleHome = () => {
    navWithTransition('/');
  };

  const closeMenu = () => setMobileOpen(false);
  const openPath = (path: string) => {
    closeMenu();
    window.requestAnimationFrame(() => navWithTransition(path));
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-40 border-b" style={{
      top: '0.75rem',
      left: '0.75rem',
      right: '0.75rem',
      width: 'auto',
      maxWidth: 'min(1240px, calc(100% - 1.5rem))',
      margin: '0 auto',
      background: isMobile ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: isMobile ? '1.25rem' : '1.5rem',
      boxShadow: isMobile ? '0 10px 30px rgba(0, 0, 0, 0.16)' : '0 18px 56px rgba(0, 0, 0, 0.24)',
      backdropFilter: isMobile ? 'blur(14px) saturate(140%)' : 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: isMobile ? 'blur(14px) saturate(140%)' : 'blur(28px) saturate(180%)',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 shrink-0">
          {!isHome && (
            <button onClick={handleBack} className="ct-control ct-control--nav" aria-label="Back">
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          {!isHome && (
            <button onClick={handleHome} className="ct-control ct-control--nav" aria-label="Home">
              <Home size={13} />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
          <Link to="/" className="hidden md:block text-sm font-semibold tracking-tight no-underline ml-2 shrink-0" style={{ color: 'var(--text-primary)' }}>ym1r</Link>
        </div>

        <div className="flex-1 md:hidden" aria-hidden="true" />

        <div className="hidden md:flex items-center gap-0.5 shrink-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => openPath(item.path)}
              className={`ct-nav-pill ${isActive(item.path) ? 'is-active' : ''}`}
            >
              {item[lang]}
            </button>
          ))}
          {isAdmin && (
            <>
              <button onClick={() => openPath('/admin')} className={`ct-nav-pill ${isActive('/admin') ? 'is-active' : ''}`}>Admin</button>
              <button onClick={() => openPath('/cloudops')} className={`ct-nav-pill ${isActive('/cloudops') ? 'is-active' : ''}`}>CloudOps</button>
            </>
          )}
          <span className="ml-2 flex items-center gap-1.5">
            <NavbarControls />
          </span>
        </div>

        <div className="flex md:hidden items-center gap-1 shrink-0">
          <NavbarControls />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="ct-control ct-control--icon" aria-label="Menu">
            {mobileOpen ? <X size={24} strokeWidth={2.4} /> : <Menu size={24} strokeWidth={2.4} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="relative md:hidden fixed left-3 right-3 top-[4.9rem] z-50 space-y-3 ct-surface-panel px-3 py-3"
            style={{
              boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
              backdropFilter: 'blur(16px) saturate(145%)',
              WebkitBackdropFilter: 'blur(16px) saturate(145%)',
            }}
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <button
              aria-label="Close menu"
              onClick={closeMenu}
              className="absolute inset-0 -z-10 cursor-default bg-black/36 backdrop-blur-[6px]"
            />
            <div className="rounded-[1.4rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(138,164,255,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'zh' ? '移动控制台' : 'Mobile Console'}
                  </div>
                  <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ym1r
                  </div>
                </div>
                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
                  {lang === 'zh' ? '在线' : 'Online'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'zh' ? '单手操作' : 'One-hand'}
                </span>
                <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'zh' ? '高可读性' : 'Readable'}
                </span>
              </div>
            </div>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => { openPath(item.path); }}
                className={`ct-nav-pill ct-nav-pill--mobile min-h-[3.8rem] text-left ${isActive(item.path) ? 'is-active' : ''}`}
              >
                {item[lang]}
              </button>
            ))}
            {isAdmin && (
              <>
                <div className="border-t border-white/10 my-1" />
                <button onClick={() => { openPath('/admin'); }} className={`ct-nav-pill ct-nav-pill--mobile min-h-[3.8rem] text-left ct-nav-pill--accent ${isActive('/admin') ? 'is-active' : ''}`}>Admin</button>
                <button onClick={() => { openPath('/cloudops'); }} className={`ct-nav-pill ct-nav-pill--mobile min-h-[3.8rem] text-left ct-nav-pill--accent-blue ${isActive('/cloudops') ? 'is-active' : ''}`}>CloudOps</button>
              </>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => { openPath('/portal'); }} className="btn-secondary w-full justify-center h-11 text-sm">
                {lang === 'zh' ? '门户' : 'Portal'}
              </button>
              <button onClick={() => { openPath('/cloudops'); }} className="btn-primary w-full justify-center h-11 text-sm">
                {lang === 'zh' ? '助手' : 'Assistant'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 -z-10 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMenu} />
        )}
      </AnimatePresence>
    </nav>
  );
}
