import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowLeft, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import NavbarControls from './NavbarControls';

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

  useEffect(() => {
    api.getMe().then((d) => setUser(d.user)).catch(() => setUser(null));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isActive = (path: string) => location.pathname === path;
  const isHome = location.pathname === '/';

  const navWithTransition = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const handleHome = () => {
    navWithTransition('/');
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-40 border-b" style={{
      top: '0.75rem',
      left: '0.75rem',
      right: '0.75rem',
      width: 'auto',
      maxWidth: 'min(1240px, calc(100% - 1.5rem))',
      margin: '0 auto',
      background: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.14)',
      borderRadius: '1.5rem',
      boxShadow: '0 18px 56px rgba(0, 0, 0, 0.24)',
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
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
              onClick={() => navWithTransition(item.path)}
              className={`ct-nav-pill ${isActive(item.path) ? 'is-active' : ''}`}
            >
              {item[lang]}
            </button>
          ))}
          {isAdmin && (
            <>
              <button onClick={() => navWithTransition('/admin')} className={`ct-nav-pill ${isActive('/admin') ? 'is-active' : ''}`}>Admin</button>
              <button onClick={() => navWithTransition('/cloudops')} className={`ct-nav-pill ${isActive('/cloudops') ? 'is-active' : ''}`}>CloudOps</button>
            </>
          )}
          <span className="ml-2 flex items-center gap-1.5">
            <NavbarControls />
          </span>
        </div>

        <div className="flex md:hidden items-center gap-1 shrink-0">
          <NavbarControls />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="ct-control ct-control--icon" aria-label="Menu">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden border-t px-3 py-2.5 space-y-1 ct-surface-panel"
            style={{ margin: '0.5rem 0.75rem 0.75rem' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => { closeMenu(); navWithTransition(item.path); }}
                className={`ct-nav-pill ct-nav-pill--mobile ${isActive(item.path) ? 'is-active' : ''}`}
              >
                {item[lang]}
              </button>
            ))}
            {isAdmin && (
              <>
                <div className="border-t my-1" style={{ borderColor: 'var(--glass-border)' }} />
                <button onClick={() => { closeMenu(); navWithTransition('/admin'); }} className={`ct-nav-pill ct-nav-pill--mobile ct-nav-pill--accent ${isActive('/admin') ? 'is-active' : ''}`}>Admin</button>
                <button onClick={() => { closeMenu(); navWithTransition('/cloudops'); }} className={`ct-nav-pill ct-nav-pill--mobile ct-nav-pill--accent-blue ${isActive('/cloudops') ? 'is-active' : ''}`}>CloudOps</button>
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
