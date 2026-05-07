import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Github, User, FolderOpen, HelpCircle, MessageCircle } from 'lucide-react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { getHomeLang, t } from '../data/homeI18n';
import LiquidCapsuleSwitch from './ui/LiquidCapsuleSwitch';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        url?: string;
        loading?: string;
        'events-target'?: string;
      }, HTMLElement>;
    }
  }
}

const ease = [0.16, 1, 0.3, 1];

export default function HeroSection() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const splineRef = useRef<HTMLElement>(null);
  const lang = getHomeLang();
  const titleChars = t(lang, 'siteName').split('');

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Remove Spline watermark
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `#spline-watermark,[id*=spline][id*=logo],[id*=spline][id*=watermark],a[href*="spline.design"],div[class*=watermark]{display:none!important;opacity:0!important;pointer-events:none!important;}`;
    document.head.appendChild(style);
    let iv: any;
    const start = () => {
      const el = splineRef.current;
      if (!el) return;
      const nuke = (root: any) => {
        if (!root?.querySelectorAll) return;
        try { root.querySelectorAll('#spline-watermark,[id*=logo],[id*=watermark],a[href*="spline"]').forEach((n: any) => n.remove?.()); } catch {}
        root.querySelectorAll('*').forEach((c: any) => { if (c.shadowRoot) nuke(c.shadowRoot); });
      };
      nuke(el); if ((el as any).shadowRoot) nuke((el as any).shadowRoot);
      iv = setInterval(() => { nuke(el); if ((el as any).shadowRoot) nuke((el as any).shadowRoot); }, 2000);
    };
    const t = setTimeout(start, 2000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, []);

  const enter = async (path: string) => {
    try { await api.setFromHome(); } catch { /* */ }
    navigate(path);
  };

  const goToGitHub = () => {
    window.open('https://github.com/admin0330', '_blank', 'noopener');
  };

  return (
    <section ref={containerRef} className="relative z-10 min-h-screen">
      {/* ── Spline globe hero — full viewport ── */}
      <div className="relative w-full h-screen overflow-hidden">
        <spline-viewer
          ref={splineRef as any}
          url="/scene.splinecode"
          loading="lazy"
          events-target="global"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />

        {/* Radial fade overlay for edge dissolve */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(circle at 50% 48%, transparent 0%, transparent 38%, rgba(18,18,20,0.06) 45%, rgba(18,18,20,0.18) 55%, rgba(18,18,20,0.4) 66%, rgba(18,18,20,0.7) 78%, rgba(18,18,20,0.92) 90%, rgba(18,18,20,1) 100%)`
        }} />

        {/* Floating text on globe */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <motion.h2
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-center px-6"
            style={{ color: 'var(--text-primary)', textShadow: '0 0 60px rgba(0,0,0,0.8)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease }}
          >
            I'am living a life by design.
          </motion.h2>
        </div>
      </div>

      {/* ── Original ym1r content below ── */}
      <div className="px-4 sm:px-8 lg:px-16 pt-16 pb-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 xl:gap-20 items-center">
            <motion.div style={{ y: titleY, opacity: titleOpacity }}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight mb-6" style={{ color: 'var(--text-primary)', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
                {titleChars.map((char, i) => (
                  <motion.span key={i} className="inline-block"
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.55, delay: 0.2 + i * 0.035, ease }}
                    style={char === ' ' ? { width: '0.25em' } : {}}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </h1>

              <motion.p className="text-base sm:text-lg lg:text-xl mb-3 max-w-xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.4, ease }}>
                {t(lang, 'heroSubtitle')}
              </motion.p>

              <motion.p className="text-sm sm:text-base mb-10 max-w-md" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55, ease }}>
                {t(lang, 'heroDescription')}
              </motion.p>

              <motion.div className="flex flex-wrap gap-3 mb-10"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7, ease }}>
                <LiquidCapsuleSwitch
                  options={[
                    { id: 'chat', label: t(lang, 'ctaPrimary'), icon: MessageCircle, tone: 'var(--accent-blue)' },
                    { id: 'me', label: t(lang, 'ctaSecondary'), icon: User },
                  ]}
                  value="chat" onChange={(id) => enter(id === 'chat' ? '/chat' : '/me')} size="lg" ariaLabel="Entry selector"
                />
              </motion.div>

              <motion.div className="flex flex-wrap items-center gap-5 text-xs" style={{ color: 'var(--text-muted)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.85 }}>
                <button onClick={() => enter('/projects')} className="hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer">
                  <FolderOpen size={13} /> {t(lang, 'linkProjects')}
                </button>
                <button onClick={() => enter('/ask-me')} className="hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer">
                  <HelpCircle size={13} /> {t(lang, 'linkAskMe')}
                </button>
                <button onClick={goToGitHub} className="hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer">
                  <Github size={13} /> {t(lang, 'linkGitHub')}
                </button>
              </motion.div>
            </motion.div>

            {/* Right — empty spacer to maintain grid balance */}
            <div />
          </div>
        </div>
      </div>
    </section>
  );
}
