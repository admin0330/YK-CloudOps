import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Github, Menu, X, Cpu, Globe, Layers, Sparkles, MessageCircle, Shield } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import HeroSection from '../components/HeroSection';
import NavbarControls from '../components/NavbarControls';
import GlassCard from '../components/GlassCard';
import ScrollSection, { SectionHeading, SectionSub } from '../components/ScrollSection';
import { getHomeLang, t } from '../data/homeI18n';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const { lang } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    api.getMe().then(d => setUser(d.user)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  const enter = useCallback(async (path: string) => {
    try { await api.setFromHome(); } catch { /* */ }
    navigate(path);
  }, [navigate]);

  const navigateWithHome = useCallback(async (path: string) => {
    try { await api.setFromHome(); } catch { /* */ }
    navigate(path);
  }, [navigate]);

  const isAdmin = user?.role === 'admin';
  const currentPath = location.pathname;

  return (
    <div className="home-root">

      {/* Navbar */}
      <nav className={`home-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="text-sm font-semibold tracking-tight no-underline shrink-0" style={{ color: 'var(--text-primary)' }}>
            {t(lang, 'siteName')}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1.5">
            {[
              { key: 'navHome',   path: '/' },
              { key: 'navAbout',  path: '/me' },
              { key: 'navWorks',  path: '/projects' },
              { key: 'navChat',   path: '/chat' },
              { key: 'navAskMe',  path: '/ask-me' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigateWithHome(item.path)}
                className={`ct-nav-pill ${currentPath === item.path ? 'is-active' : ''}`}>
                {t(lang, item.key)}
              </button>
            ))}
            {isAdmin && (
              <>
                <button onClick={() => navigateWithHome('/admin')} className="ct-nav-pill ct-nav-pill--accent">Admin</button>
                <button onClick={() => navigateWithHome('/cloudops')} className="ct-nav-pill ct-nav-pill--accent-blue">CloudOps</button>
              </>
            )}
            <span className="ml-1.5 flex items-center gap-1.5">
              <NavbarControls />
            </span>
            <button onClick={() => navigateWithHome('/chat')} className="btn-primary ml-1 text-xs py-1.5 px-4 group">
              <span>{t(lang, 'navLaunch')}</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile */}
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
            className="md:hidden relative z-40 px-4 pt-3"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="ct-surface-panel p-3 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>菜单</span>
                <div className="flex items-center gap-1.5 overflow-x-auto pr-1">
                  <NavbarControls />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'navHome', path: '/' },
                  { key: 'navAbout', path: '/me' },
                  { key: 'navWorks', path: '/projects' },
                  { key: 'navChat', path: '/chat' },
                  { key: 'navAskMe', path: '/ask-me' },
                ].map(item => (
                  <button key={item.path} onClick={() => { navigateWithHome(item.path); setMobileNav(false); }} className={`text-left px-3 py-3 rounded-2xl text-sm ct-nav-pill ct-nav-pill--mobile ${currentPath === item.path ? 'is-active' : ''}`}>
                    {t(lang, item.key)}
                  </button>
                ))}
                {isAdmin && (
                  <>
                    <button onClick={() => { navigateWithHome('/admin'); setMobileNav(false); }} className="text-left px-3 py-3 rounded-2xl text-sm ct-nav-pill ct-nav-pill--mobile ct-nav-pill--accent">Admin</button>
                    <button onClick={() => { navigateWithHome('/cloudops'); setMobileNav(false); }} className="text-left px-3 py-3 rounded-2xl text-sm ct-nav-pill ct-nav-pill--mobile ct-nav-pill--accent-blue">CloudOps</button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero */}
      <HeroSection />

      {/* Section 2 */}
      <ScrollSection className="py-24 sm:py-32 px-4 sm:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <SectionHeading>{t(lang, 's2Title')}</SectionHeading>
          <SectionSub>{t(lang, 's2Sub')}</SectionSub>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-8 mt-12">
            {[
              { icon: MessageCircle, titleKey: 's2Card1Title', descKey: 's2Card1Desc', path: '/chat' },
              { icon: Layers, titleKey: 's2Card2Title', descKey: 's2Card2Desc', path: '/projects' },
              { icon: Sparkles, titleKey: 's2Card3Title', descKey: 's2Card3Desc', path: '/me' },
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

      {/* Section 3 */}
      <ScrollSection className="py-24 sm:py-32 px-4 sm:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <SectionHeading>{t(lang, 's3Title')}</SectionHeading>
          <div className="grid sm:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div className="space-y-4">
              <motion.p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                {t(lang, 's3P1')}
              </motion.p>
              <motion.p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.1 }}>
                {t(lang, 's3P2')}
              </motion.p>
            </div>
            <div className="relative h-56 sm:h-72 hidden sm:flex items-center justify-center">
              <div className="w-48 h-32 rounded-2xl relative" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
                <div className="absolute top-3 left-0 right-0 flex justify-center">
                  <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Section 4 */}
      <ScrollSection className="py-24 sm:py-32 px-4 sm:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <SectionHeading>{t(lang, 's4Title')}</SectionHeading>
          <SectionSub>{t(lang, 's4Sub')}</SectionSub>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-8 mt-12">
            {[
              { icon: Cpu, titleKey: 's4Proj1Title', descKey: 's4Proj1Desc', statusKey: 's4StatusActive', active: true, link: '/chat' },
              { icon: Shield, titleKey: 's4Proj2Title', descKey: 's4Proj2Desc', statusKey: 's4StatusBuilding', active: false, link: '/cloudops' },
              { icon: Globe, titleKey: 's4Proj3Title', descKey: 's4Proj3Desc', statusKey: 's4StatusActive', active: true, link: '/' },
            ].map((proj, i) => (
              <GlassCard key={i} onClick={() => navigateWithHome(proj.link)}>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <proj.icon size={16} style={{ color: 'var(--accent-blue)' }} />
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${proj.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                      {t(lang, proj.statusKey)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{t(lang, proj.titleKey)}</h3>
                  <p className="text-xs mb-5" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{t(lang, proj.descKey)}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-4 sm:px-8 lg:px-16 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t(lang, 'footerTagline')}</p>
          <div className="flex items-center gap-4 text-xs">
            <button onClick={() => navigateWithHome('/chat')} className="transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>{t(lang, 'footerChat')}</button>
            <button onClick={() => navigateWithHome('/me')} className="transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>{t(lang, 'footerAbout')}</button>
            <a href="https://github.com/admin0330" target="_blank" rel="noopener noreferrer" className="transition-colors no-underline flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Github size={12} /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
