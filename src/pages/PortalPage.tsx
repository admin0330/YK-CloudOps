import { useNavigate } from 'react-router-dom';
import { ArrowRight, Github, Layers3, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';

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
      title: lang === 'zh' ? '????' : 'Profile',
      desc: lang === 'zh' ? '?????????????????' : 'My profile, background, and a few notes.',
      path: '/me',
      external: false,
    },
    {
      icon: Layers3,
      title: lang === 'zh' ? '??' : 'Projects',
      desc: lang === 'zh' ? '??????????????????' : 'Active projects, tools, and extendable work.',
      path: '/projects',
      external: false,
    },
    {
      icon: Github,
      title: 'GitHub',
      desc: lang === 'zh' ? '?????????????' : 'Source code, demos, and open-source work.',
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
              {lang === 'zh' ? '????' : 'Secondary Entry'}
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)', lineHeight: 1.05, letterSpacing: '-0.04em' }}
            >
              {lang === 'zh' ? '??????' : 'Profile & Projects.'}
            </h1>
            <p className="mt-4 text-sm sm:text-base max-w-2xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {lang === 'zh'
                ? '???????? GitHub ??????????????????'
                : 'Profile, projects, and GitHub live here as a companion to the ops center.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {cards.map((card) => (
              <GlassCard
                key={card.title}
                onClick={() => (card.external ? window.open(card.path, '_blank', 'noopener') : enter(card.path))}
                className="overflow-hidden"
              >
                <div className="p-5 sm:p-6 h-full flex flex-col justify-between gap-6">
                  <div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(138,180,255,0.1)' }}>
                      <card.icon size={20} style={{ color: 'var(--accent-blue)' }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {card.title}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      {card.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-emerald-400 bg-emerald-500/10">
                      {lang === 'zh' ? '??' : 'Entry'}
                    </span>
                    <ArrowRight size={13} style={{ color: 'var(--accent-blue)' }} />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="mt-10">
            <GlassCard onClick={() => enter('/')} className="overflow-hidden">
              <div className="p-6 sm:p-7 h-full flex flex-col justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'zh' ? '??????' : 'Back to Ops'}
                  </p>
                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {lang === 'zh' ? '?????????' : 'Return to the ops home.'}
                  </h2>
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    {lang === 'zh'
                      ? '???????????? AI ?????????????'
                      : 'If you need servers, permissions, or the AI ops assistant, go straight back to the home page.'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>
                  {lang === 'zh' ? '??' : 'Home'}
                  <ArrowRight size={14} />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}
