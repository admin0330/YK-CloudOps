import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, PenLine, ArrowRight, Monitor } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { fadeUp, appleEase } from '../lib/motion';

const floatingOrb = (delay: number, x: string, y: string, size: number, opacity: number) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: [opacity * 0.5, opacity, opacity * 0.6, opacity],
    scale: [1, 1.08, 0.96, 1],
    transition: {
      repeat: Infinity,
      duration: 8 + delay * 1.5,
      ease: 'linear',
      delay,
    },
  },
});

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    api.getMe()
      .then(() => navigate('/chat', { replace: true }))
      .catch(() => setAuthChecked(true));
  }, [navigate]);

  if (!authChecked) {
    return (
      <div className="h-full flex items-center justify-center bg-apple-bg">
        <div className="text-apple-muted text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full flex flex-col items-center justify-center bg-apple-bg overflow-hidden">
      {/* Ambient light orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ left: '15%', top: '20%', background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)', opacity: 0.12 }}
          variants={floatingOrb(0, '15%', '20%', 600, 0.12)}
          initial="hidden"
          animate="visible"
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ right: '10%', bottom: '15%', background: 'radial-gradient(circle, var(--accent-warm) 0%, transparent 70%)', opacity: 0.10 }}
          variants={floatingOrb(2, '85%', '60%', 500, 0.10)}
          initial="hidden"
          animate="visible"
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full blur-[80px]"
          style={{ left: '50%', top: '50%', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.08 }}
          variants={floatingOrb(4, '50%', '50%', 300, 0.08)}
          initial="hidden"
          animate="visible"
        />
      </div>

      {/* Header controls */}
      <div className="fixed top-4 right-4 z-50 header-actions">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        {/* Title area */}
        <motion.div
          className="text-center mb-10 sm:mb-14"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={fadeUp} transition={appleEase} className="mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-chip text-xs">
              <Monitor size={13} />
              {t('landingWelcome')}
            </span>
          </motion.div>
          <motion.h1
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]"
            variants={fadeUp}
            transition={appleEase}
          >
            {t('landingTitle')}
          </motion.h1>
          <motion.p
            className="text-sm text-[var(--text-muted)] mt-2 max-w-md mx-auto"
            variants={fadeUp}
            transition={appleEase}
          >
            {t('landingSubtitle')}
          </motion.p>
        </motion.div>

        {/* Two cards */}
        <motion.div
          className="grid sm:grid-cols-2 gap-4 sm:gap-5"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}
        >
          {/* ym1r card */}
          <motion.div
            variants={fadeUp}
            transition={appleEase}
            whileHover={{ y: -3, transition: { duration: 0.32 } }}
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate('/login')}
            className="glass-card p-6 sm:p-7 cursor-pointer group relative overflow-hidden"
            role="button"
            tabIndex={0}
            aria-label={t('landingAppEntry')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/login'); }}
          >
            {/* Card glow on hover */}
            <div className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 30% 20%, var(--accent) 0%, transparent 60%)',
                transition: 'opacity 0.5s ease',
                opacity: 'var(--tw-gradient-opacity, 0)',
              }}
            />
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent)]/15"
                style={{ transition: 'background 0.35s ease' }}>
                <Sparkles size={22} className="text-[var(--accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
                {t('landingAppTitle')}
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">
                {t('landingAppDesc')}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] group-hover:gap-2"
                style={{ transition: 'gap 0.3s ease' }}>
                {t('landingEnter')} <ArrowRight size={14} />
              </span>
            </div>
          </motion.div>

          {/* Personal Blog card */}
          <motion.div
            variants={fadeUp}
            transition={appleEase}
            whileHover={{ y: -3, transition: { duration: 0.32 } }}
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate('/me')}
            className="glass-card p-6 sm:p-7 cursor-pointer group relative overflow-hidden"
            role="button"
            tabIndex={0}
            aria-label={t('landingBlogEntry')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/me'); }}
          >
            <div className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 70% 20%, var(--accent-warm) 0%, transparent 60%)',
                transition: 'opacity 0.5s ease',
              }}
            />
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-[var(--accent-warm)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent-warm)]/15"
                style={{ transition: 'background 0.35s ease' }}>
                <PenLine size={22} style={{ color: 'var(--accent-warm)' }} />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
                {t('landingBlogTitle')}
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">
                {t('landingBlogDesc')}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium group-hover:gap-2"
                style={{ color: 'var(--accent-warm)', transition: 'gap 0.3s ease' }}>
                {t('landingEnter')} <ArrowRight size={14} />
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        className="relative z-10 pb-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <p className="text-xs text-[var(--text-weak)]">{t('landingFooter')}</p>
      </motion.div>
    </div>
  );
}
