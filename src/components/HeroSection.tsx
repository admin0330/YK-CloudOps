import { motion } from 'framer-motion';
import { Github, User, FolderOpen, HelpCircle, MessageCircle } from 'lucide-react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { getHomeLang, t } from '../data/homeI18n';
import LiquidCapsuleSwitch from './ui/LiquidCapsuleSwitch';

const ease = [0.16, 1, 0.3, 1];

export default function HeroSection() {
  const navigate = useNavigate();
  const lang = getHomeLang();
  const siteName = t(lang, 'siteName');

  const enter = async (path: string) => {
    try {
      await api.setFromHome();
    } catch {}
    navigate(path);
  };

  return (
    <section className="relative z-10 overflow-x-hidden px-4 sm:px-8 lg:px-16 pt-[6.75rem] sm:pt-[7.5rem] pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto w-full">
        <motion.p
          className="text-[0.7rem] uppercase tracking-[0.35em] text-[var(--text-muted)] text-center lg:text-left mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease }}
        >
          {lang === 'zh' ? '\u4e2a\u4eba\u4e3b\u9875 / \u9996\u9875' : 'Profile / Home'}
        </motion.p>

        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-10 xl:gap-16 items-center">
          <motion.div
            className="min-w-0 text-center lg:text-left"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease }}
          >
            <h1
              className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)', lineHeight: 1.02, letterSpacing: '-0.04em' }}
            >
              {siteName}
            </h1>

            <motion.h2
              className="mt-5 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease }}
            >
              I'am living a life by design.
            </motion.h2>

            <motion.p
              className="mt-5 text-base sm:text-lg lg:text-xl max-w-xl mx-auto lg:mx-0"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.32, ease }}
            >
              {t(lang, 'heroSubtitle')}
            </motion.p>

            <motion.p
              className="mt-3 text-sm sm:text-base max-w-md mx-auto lg:mx-0"
              style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42, ease }}
            >
              {t(lang, 'heroDescription')}
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.54, ease }}
            >
              <LiquidCapsuleSwitch
                options={[
                  { id: 'chat', label: t(lang, 'ctaPrimary'), icon: MessageCircle, tone: 'var(--accent-blue)' },
                  { id: 'me', label: t(lang, 'ctaSecondary'), icon: User },
                ]}
                value="chat"
                onChange={(id) => enter(id === 'chat' ? '/chat' : '/me')}
                size="lg"
                ariaLabel="Entry selector"
              />
            </motion.div>

            <motion.div
              className="mt-8 flex flex-wrap items-center gap-5 text-xs justify-center lg:justify-start"
              style={{ color: 'var(--text-muted)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.72 }}
            >
              <button
                onClick={() => enter('/projects')}
                className="hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen size={13} />
                {t(lang, 'linkProjects')}
              </button>
              <button
                onClick={() => enter('/ask-me')}
                className="hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle size={13} />
                {t(lang, 'linkAskMe')}
              </button>
              <button
                onClick={() => window.open('https://github.com/admin0330', '_blank', 'noopener')}
                className="hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Github size={13} />
                {t(lang, 'linkGitHub')}
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative hidden lg:block min-h-[30rem] xl:min-h-[32rem]"
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.2, ease }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-[2.25rem] bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.12),transparent_55%),radial-gradient(circle_at_65%_65%,rgba(0,113,227,0.16),transparent_45%)] blur-3xl opacity-60" />
            <div className="relative ml-auto w-full max-w-[24rem] xl:max-w-[26rem] aspect-[4/5] rounded-[2rem] overflow-hidden glass-card border border-[var(--glass-border)] shadow-[0_28px_90px_rgba(0,0,0,0.26)]">
              <img
                src="/home-bg-portrait.jpg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[58%_40%] select-none pointer-events-none opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
              <div className="absolute inset-0 rounded-[2rem] ring-1 ring-white/10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
