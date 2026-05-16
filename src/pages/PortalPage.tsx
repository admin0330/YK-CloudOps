import { useNavigate } from 'react-router-dom';
import { ArrowRight, Github, Layers3, Sparkles, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import { t } from '../data/homeI18n';

export default function PortalPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const enter = async (path: string) => {
    try {
      await api.setFromHome();
    } catch {}
    navigate(path);
  };

  const cards = [
    {
      icon: UserRound,
      titleKey: 's4Proj1Title',
      descKey: 's4Proj1Desc',
      path: '/me',
      external: false,
    },
    {
      icon: Layers3,
      titleKey: 's4Proj2Title',
      descKey: 's4Proj2Desc',
      path: '/projects',
      external: false,
    },
    {
      icon: Github,
      titleKey: 's4Proj3Title',
      descKey: 's4Proj3Desc',
      path: 'https://github.com/admin0330',
      external: true,
    },
  ];

  return (
    <div className="relative min-h-screen">
      <Navbar />

      <main className="relative z-10 px-4 sm:px-8 lg:px-16 pt-[7.75rem] pb-20 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-[0.7rem] uppercase tracking-[0.35em] mb-4" style={{ color: 'var(--text-muted)' }}>
              {lang === 'zh' ? '次级入口' : 'Secondary Entry'}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              {lang === 'zh' ? '个人与项目。' : 'Profile & Projects.'}
            </h1>
            <p className="mt-4 text-sm sm:text-base max-w-2xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {lang === 'zh'
                ? '个人主页、项目和 GitHub 都收在这里，作为运维中心的补充入口。'
                : 'Profile, projects, and GitHub live here as a companion to the ops center.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {cards.map((card) => (
              <GlassCard
                key={card.titleKey}
                onClick={() => card.external ? window.open(card.path, '_blank', 'noopener') : enter(card.path)}
                className="overflow-hidden"
              >
                <div className="p-5 sm:p-6 h-full flex flex-col justify-between gap-6">
                  <div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(138,180,255,0.1)' }}>
                      <card.icon size={20} style={{ color: 'var(--accent-blue)' }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {t(lang, card.titleKey)}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      {t(lang, card.descKey)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-emerald-400 bg-emerald-500/10">
                      {lang === 'zh' ? '入口' : 'Entry'}
                    </span>
                    <ArrowRight size={13} style={{ color: 'var(--accent-blue)' }} />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="mt-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-5 sm:gap-8 items-stretch">
            <GlassCard onClick={() => enter('/')} className="overflow-hidden">
              <div className="p-6 sm:p-7 h-full flex flex-col justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'zh' ? '返回运维首页' : 'Back to Ops'}
                  </p>
                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {lang === 'zh' ? '主站只保留运维焦点。' : 'The main site stays ops-focused.'}
                  </h2>
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    {lang === 'zh'
                      ? '如果你要看服务器、权限和 AI 运维助手，回到首页即可。'
                      : 'If you need servers, permissions, or the AI ops assistant, return to the home page.'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>
                  {lang === 'zh' ? '返回首页' : 'Go home'}
                  <ArrowRight size={14} />
                </div>
              </div>
            </GlassCard>

            <GlassCard onClick={() => enter('/cloudops')} className="overflow-hidden">
              <div className="p-6 sm:p-7 h-full flex flex-col justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'zh' ? 'AI 运维助手' : 'AI Ops Assistant'}
                  </p>
                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {lang === 'zh' ? '排障、命令建议、日志解释。' : 'Troubleshooting, command suggestions, and log interpretation.'}
                  </h2>
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    {lang === 'zh'
                      ? 'AI 不做主入口，只在运维需要时帮你分析问题。'
                      : 'AI is not the main entry; it helps only when operations need assistance.'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>
                  {lang === 'zh' ? '打开助手' : 'Open assistant'}
                  <Sparkles size={14} />
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <button onClick={() => enter('/')} className="ct-control ct-control--nav">
              {lang === 'zh' ? '返回首页' : 'Back'}
            </button>
            <button onClick={() => enter('/cloudops')} className="ct-control ct-control--nav">
              {lang === 'zh' ? '运维助手' : 'Assistant'}
            </button>
            <a
              href="https://github.com/admin0330"
              target="_blank"
              rel="noopener noreferrer"
              className="ct-control ct-control--nav no-underline"
            >
              GitHub
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
