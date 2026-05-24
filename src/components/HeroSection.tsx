import { motion } from 'framer-motion';
import { ArrowRight, Bot, FolderOpen, Github, Server, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { getHomeLang } from '../data/homeI18n';
import { useIsMobile } from '../lib/useIsMobile';

const heroEase = [0.16, 1, 0.3, 1] as const;

export default function HeroSection() {
  const navigate = useNavigate();
  const lang = getHomeLang();
  const isMobile = useIsMobile();

  const enter = async (path: string) => {
    try {
      await api.setFromHome();
    } catch {}
    navigate(path);
  };

  const copy = {
    eyebrow: lang === 'zh' ? 'YM1R / AI CLOUD PORTFOLIO' : 'YM1R / AI CLOUD PORTFOLIO',
    title: lang === 'zh' ? '把云端与 AI，做成我的个人操作系统。' : 'Cloud and AI, shaped into my personal operating system.',
    description: lang === 'zh'
      ? '一个连接作品、服务器运维与 AI 助手的个人网站。以暗色影像作为入口，把我的技术内容收束成更有质感的主页。'
      : 'A personal site connecting projects, server operations, and an AI assistant through a darker, more cinematic front door.',
    primary: lang === 'zh' ? '进入 CloudOps' : 'Enter CloudOps',
    secondary: lang === 'zh' ? '浏览入口' : 'Browse Portal',
    profile: lang === 'zh' ? '个人介绍' : 'Profile',
    github: 'GitHub',
    status: lang === 'zh' ? '主页已上线' : 'Homepage live',
    stack: lang === 'zh' ? 'React / Vite / Linux' : 'React / Vite / Linux',
  };

  const details = [
    { label: lang === 'zh' ? '方向' : 'Focus', value: lang === 'zh' ? 'AI + 云计算' : 'AI + Cloud' },
    { label: lang === 'zh' ? '位置' : 'Base', value: lang === 'zh' ? '长沙 / 远程' : 'Changsha / Remote' },
    { label: lang === 'zh' ? '状态' : 'Status', value: lang === 'zh' ? '持续构建中' : 'Always building' },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-black text-white">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.56)_38%,rgba(0,0,0,0.14)_76%),linear-gradient(180deg,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.84)_100%)]" />
      <div className="absolute inset-0 z-[2] opacity-[0.08] mix-blend-screen bg-[radial-gradient(circle_at_22%_30%,rgba(255,255,255,0.55),transparent_18%),radial-gradient(circle_at_76%_18%,rgba(180,210,255,0.34),transparent_20%)]" />
      <div className="noise-overlay z-[3]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-end px-5 pb-12 pt-28 sm:px-8 sm:pb-16 lg:px-16 lg:pb-20">
        <motion.div
          className="max-w-4xl"
          initial={{ opacity: 0, y: isMobile ? 10 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.38 : 0.8, ease: heroEase }}
        >
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-white/22 bg-white/[0.06] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/78 backdrop-blur-md">
              {copy.eyebrow}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-emerald-200 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.95)]" />
              {copy.status}
            </span>
          </div>

          <h1 className="max-w-4xl text-[clamp(2.85rem,8vw,7.6rem)] font-semibold uppercase leading-[0.88] tracking-[0.055em] text-white drop-shadow-[0_22px_70px_rgba(0,0,0,0.7)]">
            {copy.title}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/74 sm:text-lg lg:text-xl">
            {copy.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => enter('/cloudops')}
              className="group inline-flex min-h-[3.2rem] items-center justify-center gap-2 rounded-full border border-white/75 bg-white px-6 text-sm font-bold uppercase tracking-[0.14em] text-black transition duration-300 hover:-translate-y-0.5 hover:bg-white/88"
            >
              <Server size={16} />
              {copy.primary}
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => enter('/portal')}
              className="group inline-flex min-h-[3.2rem] items-center justify-center gap-2 rounded-full border border-white/32 bg-black/18 px-6 text-sm font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/10"
            >
              <FolderOpen size={16} />
              {copy.secondary}
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-white/62">
            <button onClick={() => enter('/me')} className="inline-flex items-center gap-2 transition hover:text-white">
              <UserRound size={15} />
              {copy.profile}
            </button>
            <button onClick={() => enter('/cloudops')} className="inline-flex items-center gap-2 transition hover:text-white">
              <Bot size={15} />
              AI Ops
            </button>
            <button onClick={() => window.open('https://github.com/admin0330', '_blank', 'noopener')} className="inline-flex items-center gap-2 transition hover:text-white">
              <Github size={15} />
              {copy.github}
            </button>
          </div>
        </motion.div>

        <motion.div
          className="mt-12 grid max-w-4xl grid-cols-1 gap-px overflow-hidden border-y border-white/16 bg-white/12 text-white/78 sm:grid-cols-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isMobile ? 0.32 : 0.7, delay: isMobile ? 0.06 : 0.28, ease: heroEase }}
        >
          {details.map((item) => (
            <div key={item.label} className="bg-black/30 px-4 py-3 backdrop-blur-md sm:px-5 sm:py-4">
              <div className="text-[0.62rem] uppercase tracking-[0.28em] text-white/42">{item.label}</div>
              <div className="mt-1 text-sm font-semibold text-white">{item.value}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="pointer-events-none absolute bottom-5 right-5 z-10 hidden text-[0.65rem] uppercase tracking-[0.32em] text-white/42 sm:block">
        {copy.stack}
      </div>
    </section>
  );
}
