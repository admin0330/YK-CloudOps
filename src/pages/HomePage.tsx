import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Github, Menu, X, Cpu, Shield, Server } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import HeroSection from '../components/HeroSection';
import NavbarControls from '../components/NavbarControls';
import GlassCard from '../components/GlassCard';
import ScrollSection, { SectionHeading, SectionSub } from '../components/ScrollSection';
import { t } from '../data/homeI18n';
import { useIsMobile } from '../lib/useIsMobile';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    api.getMe().then((d) => setUser(d.user)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileNav(false);
  }, [location.pathname]);

  const navigateWithHome = useCallback(async (path: string) => {
    try { await api.setFromHome(); } catch {}
    navigate(path);
  }, [navigate]);

  const isAdmin = user?.role === 'admin';
  const currentPath = location.pathname;
  const navItems = [
    { key: 'navHome', path: '/' },
    { key: 'navPortal', path: '/portal' },
    { key: 'navCloudOps', path: '/cloudops' },
    { key: 'navJsStudy', path: '/js-study', label: 'JS' },
  ];
  const openPath = useCallback(async (path: string) => {
    try { await api.setFromHome(); } catch {}
    setMobileNav(false);
    window.requestAnimationFrame(() => navigate(path));
  }, [navigate]);

  return (
    <div className="home-root">
      <nav className={`home-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2.5">
          <Link to="/" className="hidden sm:block text-sm font-semibold tracking-tight no-underline shrink-0" style={{ color: 'var(--text-primary)' }}>
            {t(lang, 'siteName')}
          </Link>

          <div className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigateWithHome(item.path)}
                className={`ct-nav-pill ${currentPath === item.path ? 'is-active' : ''}`}
              >
                {item.label ?? t(lang, item.key)}
              </button>
            ))}
            {isAdmin && (
              <>
                <button onClick={() => navigateWithHome('/admin')} className="ct-nav-pill ct-nav-pill--accent">Admin</button>
                <button onClick={() => navigateWithHome('/cloudops')} className="ct-nav-pill ct-nav-pill--accent-blue">CloudOps</button>
              </>
            )}
            <button
              onClick={() => navigateWithHome('/js-study')}
              className={`ct-nav-pill ${currentPath === '/js-study' ? 'is-active' : ''}`}
            >
              JS
            </button>
            <span className="ml-1.5 flex items-center gap-1.5">
              <NavbarControls />
            </span>
            <button onClick={() => navigateWithHome('/cloudops')} className="btn-primary ml-1 text-xs py-1.5 px-4 group">
              <span>{lang === 'zh' ? '打开运维助手' : 'Open Assistant'}</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <button onClick={() => setMobileNav(!mobileNav)} className="ct-control ct-control--icon" aria-label="Open menu">
              {mobileNav ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {mobileNav && (
          <motion.div
            key="mobile-menu"
            className="md:hidden relative z-40 px-3 pt-2"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div
              className="ct-surface-panel p-2.5 space-y-2.5 overflow-hidden"
              style={isMobile ? { boxShadow: 'none', backdropFilter: 'blur(10px) saturate(120%)', WebkitBackdropFilter: 'blur(10px) saturate(120%)' } : undefined}
            >
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{lang === 'zh' ? '导航' : 'Navigation'}</span>
                <div className="flex items-center gap-1.5 overflow-x-auto pr-1">
                  <NavbarControls />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { openPath(item.path); }}
                    className={`text-left px-3 py-2.5 rounded-2xl text-sm ct-nav-pill ct-nav-pill--mobile ${currentPath === item.path ? 'is-active' : ''}`}
                  >
                    {item.label ?? t(lang, item.key)}
                  </button>
                ))}
                {isAdmin && (
                  <>
                    <button onClick={() => { openPath('/admin'); }} className="text-left px-3 py-3 rounded-2xl text-sm ct-nav-pill ct-nav-pill--mobile ct-nav-pill--accent">Admin</button>
                    <button onClick={() => { openPath('/cloudops'); }} className="text-left px-3 py-3 rounded-2xl text-sm ct-nav-pill ct-nav-pill--mobile ct-nav-pill--accent-blue">CloudOps</button>
                  </>
                )}
                <button
                  onClick={() => { openPath('/js-study'); }}
                  className={`text-left px-3 py-2.5 rounded-2xl text-sm ct-nav-pill ct-nav-pill--mobile ${currentPath === '/js-study' ? 'is-active' : ''}`}
                >
                  JS
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HeroSection />

      <ScrollSection className="py-16 sm:py-32 px-4 sm:px-8 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <SectionHeading>{t(lang, 's2Title')}</SectionHeading>
          <SectionSub>{t(lang, 's2Sub')}</SectionSub>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-12">
            {[
              { icon: Server, titleKey: 's2Card1Title', descKey: 's2Card1Desc', path: '/cloudops' },
              { icon: Shield, titleKey: 's2Card2Title', descKey: 's2Card2Desc', path: '/admin' },
              { icon: Cpu, titleKey: 's2Card3Title', descKey: 's2Card3Desc', path: '/cloudops' },
            ].map((card, i) => (
              <GlassCard key={i} onClick={() => navigateWithHome(card.path)}>
                <div className="p-5 sm:p-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(138,180,255,0.1)' }}>
                    <card.icon size={20} style={{ color: 'var(--accent-blue)' }} />
                  </div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{t(lang, card.titleKey)}</h3>
                  <p className="text-xs mb-5" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{t(lang, card.descKey)}</p>
                  <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent-blue)' }}>
                    {t(lang, 's2Explore')} <ArrowRight size={11} />
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </ScrollSection>

      <ScrollSection className="py-16 sm:py-32 px-4 sm:px-8 lg:px-16">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-8 sm:gap-16 items-center">
          <div className="space-y-4">
            <SectionHeading>{t(lang, 's3Title')}</SectionHeading>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {t(lang, 's3P1')}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {t(lang, 's3P2')}
            </p>
          </div>
          <div className="glass-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              <Server size={16} style={{ color: 'var(--accent-blue)' }} />
              {lang === 'zh' ? '运维优先' : 'Ops First'}
            </div>
            <div className="space-y-3 text-xs sm:text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <p>{lang === 'zh' ? '把服务器管理、日志分析、权限审计和 AI 排障放到同一个入口。' : 'Server management, log analysis, permission auditing, and AI troubleshooting live in one entry point.'}</p>
              <p>{lang === 'zh' ? 'AI 只作为运维助手，帮你解释错误并给出修复建议。' : 'AI works only as an ops assistant, helping explain errors and suggest fixes.'}</p>
              <p>{lang === 'zh' ? '个人主页和项目页移到次级入口，作为补充页面。' : 'Profile and project pages move to the secondary entry as a companion page.'}</p>
            </div>
          </div>
        </div>
      </ScrollSection>

      <ScrollSection className="py-16 sm:py-32 px-4 sm:px-8 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <SectionHeading>{t(lang, 's4Title')}</SectionHeading>
          <SectionSub>{t(lang, 's4Sub')}</SectionSub>
          <GlassCard onClick={() => navigateWithHome('/')} className="mt-8 sm:mt-10 overflow-hidden">
            <div className="p-5 sm:p-7 lg:p-8 grid gap-5 lg:grid-cols-[1fr_auto] items-center">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'zh' ? '返回运维主页' : 'Back to Ops Home'}
                </div>
                <h3 className="mt-3 text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)', lineHeight: 1.25 }}>
                  {lang === 'zh' ? '直接回到运维主页。' : 'Return to the ops home.'}
                </h3>
                <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {lang === 'zh'
                    ? '个人主页、项目和 GitHub 已移动到次级入口页面。'
                    : 'Profile, projects, and GitHub now live on the secondary entry page.'}
                </p>
              </div>
              <div className="flex items-center justify-start lg:justify-end">
                <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium" style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {t(lang, 'navHome')}
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </ScrollSection>

      <footer className="relative z-10 py-10 sm:py-16 px-4 sm:px-8 lg:px-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t(lang, 'footerTagline')}</p>
          <div className="flex items-center gap-4 text-xs">
            <button onClick={() => navigateWithHome('/portal')} className="transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>{t(lang, 'navPortal')}</button>
            <button onClick={() => navigateWithHome('/cloudops')} className="transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>{t(lang, 'footerChat')}</button>
            <a href="https://github.com/admin0330" target="_blank" rel="noopener noreferrer" className="transition-colors no-underline flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Github size={12} /> GitHub
            </a>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="transition-colors no-underline" style={{ color: 'var(--text-muted)' }}>
              湘ICP备2026017602号
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
