import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowLeft, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import NavbarControls from './NavbarControls';
import { runParticleTransition } from '../effects/ParticleTransitionManager';

const NAV_ITEMS = [
  { path: '/',    zh: '首页',     en: 'Home' },
  { path: '/me',  zh: '个人主页', en: 'Profile' },
  { path: '/projects', zh: '项目', en: 'Projects' },
  { path: '/chat', zh: 'AI',     en: 'AI' },
  { path: '/ask-me', zh: '问我', en: 'Ask Me' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api.getMe().then((d) => setUser(d.user)).catch(() => setUser(null));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isActive = (path: string) => location.pathname === path;
  const isHome = location.pathname === '/';

  /** Navigate with particle transition from clicked element */
  const navWithTransition = useCallback((path: string, e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    runParticleTransition({
      origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      type: 'navigation',
      action: () => navigate(path),
    });
  }, [navigate]);

  const handleBack = (e: React.MouseEvent) => {
    if (window.history.length > 1) {
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      runParticleTransition({
        origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        type: 'navigation',
        action: () => navigate(-1),
      });
    } else {
      navigate('/');
    }
  };

  const handleHome = (e: React.MouseEvent) => {
    navWithTransition('/', e);
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-40 border-b" style={{
      background: 'var(--glass-bg)',
      borderColor: 'var(--glass-border)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 flex items-center justify-between gap-2">

        {/* LEFT */}
        <div className="flex items-center gap-1 shrink-0">
          {!isHome && (
            <button onClick={handleBack}
              className="flex items-center gap-1 px-2 sm:px-3 h-9 rounded-full text-xs font-medium border cursor-pointer shrink-0"
              style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-muted)', transition: 'all 200ms ease', minWidth: '40px', justifyContent: 'center' }}
              aria-label="Back">
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          {!isHome && (
            <button onClick={handleHome}
              className="flex items-center gap-1 px-2 sm:px-3 h-9 rounded-full text-xs font-medium border cursor-pointer shrink-0"
              style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-muted)', transition: 'all 200ms ease', minWidth: '40px', justifyContent: 'center' }}
              aria-label="Home">
              <Home size={13} />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
          <Link to="/" className="hidden md:block text-sm font-semibold tracking-tight no-underline ml-2 shrink-0" style={{ color: 'var(--text-primary)' }}>ym1r</Link>
        </div>

        {/* CENTER */}
        <div className="flex-1 min-w-0 text-center md:hidden">
          <Link to="/" className="text-sm font-semibold tracking-tight no-underline truncate" style={{ color: 'var(--text-primary)' }}>ym1r</Link>
        </div>

        {/* RIGHT — Desktop */}
        <div className="hidden md:flex items-center gap-0.5 shrink-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={(e) => navWithTransition(item.path, e)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${
                isActive(item.path)
                  ? 'bg-[var(--active-bg)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
              }`}
              style={{ transition: 'all 200ms ease' }}
            >
              {item[lang]}
            </button>
          ))}
          {isAdmin && (
            <>
              <button onClick={(e) => navWithTransition('/admin', e)} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${isActive('/admin') ? 'bg-amber-500/15 text-amber-500' : 'text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10'}`} style={{ transition: 'all 200ms ease' }}>Admin</button>
              <button onClick={(e) => navWithTransition('/cloudops', e)} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${isActive('/cloudops') ? 'bg-sky-500/15 text-sky-500' : 'text-sky-500/60 hover:text-sky-500 hover:bg-sky-500/10'}`} style={{ transition: 'all 200ms ease' }}>CloudOps</button>
            </>
          )}
          <span className="ml-2 flex items-center gap-1.5">
            <NavbarControls />
          </span>
        </div>

        {/* RIGHT — Mobile */}
        <div className="flex md:hidden items-center gap-1 shrink-0">
          <NavbarControls />
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--hover-bg)]"
            style={{ color: 'var(--text-muted)', minWidth: '40px', minHeight: '40px' }}
            aria-label="Menu">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="md:hidden border-t px-3 py-2 space-y-0.5"
            style={{ background: 'var(--glass-bg-strong)', borderColor: 'var(--glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}>
            {NAV_ITEMS.map((item) => (
              <button key={item.path}
                onClick={(e) => { closeMenu(); navWithTransition(item.path, e); }}
                className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm ${isActive(item.path) ? 'bg-[var(--active-bg)] text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
                {item[lang]}
              </button>
            ))}
            {isAdmin && (
              <>
                <div className="border-t my-1" style={{ borderColor: 'var(--glass-border)' }} />
                <button onClick={(e) => { closeMenu(); navWithTransition('/admin', e); }} className="block w-full text-left px-3 py-2.5 rounded-xl text-sm text-amber-400/70">Admin</button>
                <button onClick={(e) => { closeMenu(); navWithTransition('/cloudops', e); }} className="block w-full text-left px-3 py-2.5 rounded-xl text-sm text-sky-400/70">CloudOps</button>
              </>
            )}
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
