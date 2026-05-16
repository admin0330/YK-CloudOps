import { motion } from 'framer-motion';
import { ArrowRight, Bot, FolderOpen, Github, Server, Shield, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { getHomeLang, t } from '../data/homeI18n';
import LiquidCapsuleSwitch from './ui/LiquidCapsuleSwitch';
import { useIsMobile } from '../lib/useIsMobile';

const ease = [0.16, 1, 0.3, 1];

export default function HeroSection() {
  const navigate = useNavigate();
  const lang = getHomeLang();
  const isMobile = useIsMobile();
  const siteName = t(lang, 'siteName');
  const heroEase = [0.25, 0.1, 0.25, 1] as const;
  const baseDelay = isMobile ? 0 : 0.1;
  const fastDelay = isMobile ? 0 : 0.2;
  const midDelay = isMobile ? 0 : 0.32;
  const btnDelay = isMobile ? 0 : 0.54;

  const enter = async (path: string) => {
    try {
      await api.setFromHome();
    } catch {}
    navigate(path);
  };

  const stats = [
    { title: lang === 'zh' ? '服务器在线' : 'Servers online', value: '04', note: lang === 'zh' ? '实时连接' : 'Live links', icon: Server },
    { title: lang === 'zh' ? '待审计项' : 'Audits pending', value: '00', note: lang === 'zh' ? '当前为空' : 'None pending', icon: Shield },
    { title: lang === 'zh' ? 'AI 运维助手' : 'AI assistant', value: lang === 'zh' ? '就绪' : 'Ready', note: lang === 'zh' ? '只做辅助' : 'Assist only', icon: Bot },
  ];

  return (
    <section className="relative z-10 overflow-x-hidden px-4 sm:px-8 lg:px-16 pt-[4.9rem] sm:pt-[7.5rem] pb-10 sm:pb-24">
      <div className="max-w-7xl mx-auto w-full">
        <motion.p
          className="text-[0.68rem] uppercase tracking-[0.32em] text-[var(--text-muted)] text-center lg:text-left mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.22 : 0.45, delay: baseDelay, ease: heroEase }}
        >
          {lang === 'zh' ? '首页 / 运维' : 'Home / Ops'}
        </motion.p>

        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-10 xl:gap-16 items-center">
          <motion.div
          className="min-w-0 text-center lg:text-left"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.24 : 0.7, delay: baseDelay + 0.02, ease: heroEase }}
        >
            <h1
              className="text-3xl sm:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)', lineHeight: 1.02, letterSpacing: '-0.04em' }}
          >
            {siteName}
          </h1>

            <motion.h2
              className="mt-3 sm:mt-5 text-xl sm:text-3xl lg:text-4xl font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobile ? 0.22 : 0.55, delay: fastDelay, ease: heroEase }}
          >
              {lang === 'zh' ? '运维管理中心。' : 'Server Management Center.'}
            </motion.h2>

            <motion.p
              className="mt-3 sm:mt-5 text-sm sm:text-lg lg:text-xl max-w-xl mx-auto lg:mx-0"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobile ? 0.22 : 0.55, delay: midDelay, ease: heroEase }}
          >
              {t(lang, 'heroSubtitle')}
            </motion.p>

            <motion.p
              className="mt-2 sm:mt-3 text-xs sm:text-base max-w-md mx-auto lg:mx-0"
            style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobile ? 0.2 : 0.5, delay: midDelay + 0.08, ease: heroEase }}
          >
              {t(lang, 'heroDescription')}
            </motion.p>

            <motion.div
              className="mt-6 sm:mt-8 flex flex-wrap gap-2.5 sm:gap-3 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: isMobile ? 0.2 : 0.5, delay: btnDelay, ease: heroEase }}
            >
              {isMobile ? (
                <div className="grid grid-cols-1 gap-1.5 w-full max-w-sm">
                  <button onClick={() => enter('/cloudops')} className="btn-primary w-full justify-center">
                    <Server size={14} />
                    {t(lang, 'ctaPrimary')}
                  </button>
                  <button onClick={() => enter('/portal')} className="btn-secondary w-full justify-center">
                    <FolderOpen size={14} />
                    {t(lang, 'ctaSecondary')}
                  </button>
                </div>
              ) : (
                <LiquidCapsuleSwitch
                  options={[
                    { id: 'ops', label: t(lang, 'ctaPrimary'), icon: Server, tone: 'var(--accent-blue)' },
                    { id: 'portal', label: t(lang, 'ctaSecondary'), icon: FolderOpen },
                  ]}
                  value="ops"
                  onChange={(id) => enter(id === 'ops' ? '/cloudops' : '/portal')}
                  size="lg"
                  ariaLabel="Entry selector"
                />
              )}
            </motion.div>

            <motion.div
            className="mt-5 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-5 text-xs justify-center lg:justify-start"
            style={{ color: 'var(--text-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: isMobile ? 0.18 : 0.45, delay: isMobile ? 0.02 : 0.72 }}
          >
              <button
                onClick={() => enter('/portal')}
                className="hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen size={13} />
                {t(lang, 'navPortal')}
              </button>
              <button
                onClick={() => enter('/cloudops')}
                className="hover:text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Bot size={13} />
                {lang === 'zh' ? 'AI 运维助手' : 'AI Ops Assistant'}
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
            <div className="relative ml-auto w-full max-w-[26rem] rounded-[2rem] overflow-hidden glass-card border border-[var(--glass-border)] shadow-[0_28px_90px_rgba(0,0,0,0.26)] p-5">
              <div className="flex items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    {lang === 'zh' ? '运维概览' : 'Ops Snapshot'}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {lang === 'zh' ? '实时状态' : 'Live Status'}
                  </h3>
                </div>
                <span className="ct-nav-pill is-active text-xs">{lang === 'zh' ? '在线' : 'Online'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {stats.map((stat) => (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  >
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
                      <stat.icon size={12} style={{ color: 'var(--accent-blue)' }} />
                      {stat.title}
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {stat.value}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {stat.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    <Sparkles size={16} style={{ color: 'var(--accent-blue)' }} />
                    {lang === 'zh' ? '快捷入口' : 'Quick Entry'}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'zh' ? '一页完成' : 'One page'}
                  </span>
                </div>

                <button
                  onClick={() => enter('/portal')}
                  className="w-full rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {lang === 'zh' ? '个人与项目入口' : 'Profile & Projects'}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {lang === 'zh' ? '个人主页、项目和 GitHub 都在次级页面。' : 'Profile, projects, and GitHub live in the secondary page.'}
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--accent-blue)' }} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
