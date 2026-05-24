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
      title: lang === 'zh' ? '个人主页' : 'Profile',
      desc: lang === 'zh' ? '查看我的个人介绍、学习方向、技术栈和阶段记录。' : 'My profile, learning direction, tech stack, and personal notes.',
      path: '/me',
      external: false,
    },
    {
      icon: Layers3,
      title: lang === 'zh' ? '项目展示' : 'Projects',
      desc: lang === 'zh' ? '查看 ym1r、CloudOps、工具页面和后续可扩展项目。' : 'Active projects including ym1r, CloudOps, tools, and expandable work.',
      path: '/projects',
      external: false,
    },
    {
      icon: Github,
      title: 'GitHub',
      desc: lang === 'zh' ? '查看源码、实验项目、部署记录和开源内容。' : 'Source code, experiments, deployment notes, and open-source work.',
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
              {lang === 'zh' ? '个人入口' : 'Personal Entry'}
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)', lineHeight: 1.05, letterSpacing: '-0.04em' }}
            >
              {lang === 'zh' ? '个人、项目与学习入口。' : 'Profile, Projects & Study.'}
            </h1>
            <p className="mt-4 text-sm sm:text-base max-w-2xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {lang === 'zh'
                ? '这里保留个人展示、项目记录、GitHub 和学习内容；高频运营动作则回到 CloudOps。'
                : 'Profile, projects, GitHub, and study content live here; high-frequency ops return to CloudOps.'}
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
                      {lang === 'zh' ? '进入' : 'Entry'}
                    </span>
                    <ArrowRight size={13} style={{ color: 'var(--accent-blue)' }} />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="mt-10">
            <GlassCard onClick={() => enter('/cloudops')} className="ops-home-cta overflow-hidden">
              <div className="ops-home-cta__inner p-6 sm:p-7 h-full flex flex-col justify-between gap-6">
                <div>
                  <p className="ops-home-cta__eyebrow text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'zh' ? '返回运营主页' : 'Back to Ops'}
                  </p>
                  <h2 className="ops-home-cta__title mt-3 text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {lang === 'zh' ? '回到 CloudOps 控制台。' : 'Return to the CloudOps console.'}
                  </h2>
                  <p className="ops-home-cta__desc mt-3 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    {lang === 'zh'
                      ? '服务器管理、AI 运维助手、用户后台和文件能力都从 CloudOps 开始。'
                      : 'Servers, AI ops, users, files, and admin workflows all start from CloudOps.'}
                  </p>
                </div>
                <div className="ops-home-cta__action inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>
                  {lang === 'zh' ? '进入 CloudOps' : 'Enter CloudOps'}
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
