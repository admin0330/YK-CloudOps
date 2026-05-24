import { useRef, type MouseEvent } from 'react';
import { motion, useInView, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const PRIMARY_TEXT = '#E1E0CC';
const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4';
const FEATURE_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4';
const ease = [0.16, 1, 0.3, 1] as const;
const cardEase = [0.22, 1, 0.36, 1] as const;
const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Portal', path: '/portal' },
  { label: 'CloudOps', path: '/cloudops' },
  { label: 'JS Study', path: '/js-study' },
  { label: 'Admin', path: '/admin' },
] as const;

type Segment = {
  text: string;
  className?: string;
};

type Word = {
  text: string;
  className?: string;
};

function WordsPullUp({ text, className = '', showAsterisk = false }: { text: string; className?: string; showAsterisk?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const words = text.split(' ');

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, index) => {
        const isLast = index === words.length - 1;
        return (
          <motion.span
            key={`${word}-${index}`}
            className="relative inline-block overflow-visible pr-[0.08em]"
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 0.7, delay: index * 0.08, ease }}
          >
            <span className="relative inline-block">
              {word}
              {showAsterisk && isLast && (
                <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em] leading-none">*</span>
              )}
            </span>
            {index < words.length - 1 && <span>&nbsp;</span>}
          </motion.span>
        );
      })}
    </div>
  );
}

function WordsPullUpMultiStyle({ segments, className = '' }: { segments: Segment[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const words: Word[] = segments.flatMap((segment) =>
    segment.text.trim().split(/\s+/).map((word) => ({ text: word, className: segment.className }))
  );

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={`${word.text}-${index}`}
          className={`inline-block pr-[0.22em] ${word.className ?? ''}`}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.72, delay: index * 0.08, ease }}
        >
          {word.text}
        </motion.span>
      ))}
    </div>
  );
}

function AnimatedLetter({ char, index, total, progress }: { char: string; index: number; total: number; progress: MotionValue<number> }) {
  const charProgress = total <= 1 ? 0 : index / total;
  const opacity = useTransform(progress, [charProgress - 0.1, charProgress + 0.05], [0.2, 1]);

  return (
    <motion.span style={{ opacity }} aria-hidden="true">
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  );
}

function ScrollRevealText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.2'] });
  const chars = Array.from(text);

  return (
    <p ref={ref} className="mx-auto mt-8 max-w-3xl text-xs leading-7 text-[#DEDBC8] sm:mt-10 sm:text-sm md:text-base md:leading-8">
      <span className="sr-only">{text}</span>
      {chars.map((char, index) => (
        <AnimatedLetter key={`${char}-${index}`} char={char} index={index} total={chars.length} progress={scrollYProgress} />
      ))}
    </p>
  );
}

type FeatureCardProps = {
  index: number;
  title?: string;
  number?: string;
  icon?: string;
  items?: string[];
  video?: string;
  videoTitle?: string;
  subtitle?: string;
  path: string;
};

function FeatureCard({ index, title, number, icon, items = [], video, videoTitle, subtitle, path, onOpen }: FeatureCardProps & { onOpen: (path: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className="relative min-h-[300px] overflow-hidden rounded-2xl bg-[#212121] sm:min-h-[340px] lg:h-[480px]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.72, delay: index * 0.15, ease: cardEase }}
    >
      {video ? (
        <>
          <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
            <source src={video} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <h3 className="text-xl font-normal leading-none sm:text-2xl" style={{ color: PRIMARY_TEXT }}>
              {videoTitle}
            </h3>
            {subtitle && <p className="mt-3 max-w-xs text-sm leading-5 text-primary/70">{subtitle}</p>}
            <button onClick={() => onOpen(path)} className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm font-medium text-primary transition hover:gap-3 hover:border-primary">
              Enter
              <ArrowRight size={15} className="-rotate-45" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col p-5 sm:p-6">
          <img src={icon} alt="" className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12" />
          <div className="mt-7 flex items-start justify-between gap-4">
            <h3 className="max-w-[12rem] text-2xl font-normal leading-[0.95] text-primary sm:text-3xl">
              {title}
            </h3>
            <span className="text-xs text-gray-500">{number}</span>
          </div>

          <div className="mt-8 space-y-3">
            {items.map((item) => (
              <div key={item} className="flex gap-2 text-sm leading-5 text-gray-400">
                <Check size={15} className="mt-0.5 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <button onClick={() => onOpen(path)} className="mt-auto inline-flex items-center gap-2 self-start pt-8 text-sm font-medium text-primary transition hover:gap-3">
            Learn more
            <ArrowRight size={16} className="-rotate-45" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

const featureCards: FeatureCardProps[] = [
  {
    index: 0,
    video: FEATURE_VIDEO,
    videoTitle: 'CloudOps command center.',
    subtitle: '进入你的服务器运营主页，统一查看运维入口、系统状态和常用操作。',
    path: '/cloudops',
  },
  {
    index: 1,
    title: 'Server Management.',
    number: '01',
    icon: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85',
    items: ['集中管理服务器连接与认证信息。', '查看 CPU、内存、磁盘与运行时间。', '执行常用 Linux 命令并保留记录。', '把危险命令交给安全策略拦截。'],
    path: '/cloudops',
  },
  {
    index: 2,
    title: 'AI Ops Assistant.',
    number: '02',
    icon: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85',
    items: ['用 AI 解释报错、日志和命令输出。', '支持附件上传与图片/文件分析。', '保留多轮会话，适合作为排障助手。'],
    path: '/chat',
  },
  {
    index: 3,
    title: 'Portal & Admin.',
    number: '03',
    icon: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85',
    items: ['从 Portal 进入个人主页、项目和 JS 学习。', '后台管理用户、文件、权限和 AI 人设。', '把个人展示与运营工具放在同一站点。'],
    path: '/portal',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const aboutText = 'ym1r CloudOps 把个人主页、项目展示、JS 学习、AI 对话、文件上传、服务器管理和后台审计收束到一个入口。首页负责给出清晰方向，CloudOps 负责承载真正高频的运营动作，Portal 则保留个人介绍与作品展示。';

  const goToPath = async (path: string) => {
    try {
      await api.setFromHome();
    } catch {}
    navigate(path);
  };

  const enterOpsHome = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    await goToPath('/cloudops');
  };

  const openNavPath = async (event: MouseEvent<HTMLButtonElement>, path: string) => {
    event.preventDefault();
    await goToPath(path);
  };

  return (
    <main className="prisma-page min-h-[100dvh] bg-black text-primary">
      <section className="relative min-h-[100svh] p-3 sm:p-4 md:p-6">
        <div className="relative min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-2xl sm:min-h-[calc(100svh-2rem)] md:min-h-[calc(100svh-3rem)] md:rounded-[2rem]">
          <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

          <nav className="prisma-hero-nav absolute left-1/2 top-0 z-20 max-w-[calc(100%-1rem)] -translate-x-1/2 overflow-x-auto rounded-b-2xl bg-black px-3 py-2 md:rounded-b-3xl md:px-8">
            <div className="flex items-center gap-3 whitespace-nowrap text-[10px] sm:gap-6 sm:text-xs md:gap-12 md:text-sm lg:gap-14">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={(event) => openNavPath(event, item.path)}
                  className="transition-colors"
                  style={{ color: 'rgba(225, 224, 204, 0.8)' }}
                  onMouseEnter={(event) => { event.currentTarget.style.color = PRIMARY_TEXT; }}
                  onMouseLeave={(event) => { event.currentTarget.style.color = 'rgba(225, 224, 204, 0.8)'; }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="prisma-hero-content absolute bottom-0 left-0 right-0 z-10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:p-7 md:p-8 lg:p-10">
            <div className="grid items-end gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-8">
                <h1 className="prisma-hero-title" style={{ color: PRIMARY_TEXT }}>
                  <WordsPullUp
                    text="Ym1r's cloudOps"
                    className="prisma-hero-title-text max-w-[11ch] text-[18vw] font-medium leading-[0.85] tracking-[-0.07em] sm:text-[16vw] md:text-[14vw] lg:text-[11vw] xl:text-[10vw] 2xl:text-[9.5vw]"
                  />
                </h1>
              </div>

              <div className="prisma-hero-panel space-y-4 pb-1 sm:space-y-5 sm:pb-2 lg:col-span-4 lg:pb-8">
                <motion.p
                  className="prisma-hero-copy max-w-md text-xs leading-[1.25] text-primary/70 sm:text-sm md:text-base"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.5, ease }}
                >
                  一个面向个人运营的云端控制入口：连接服务器管理、AI 运维助手、文件与用户后台、个人作品展示和 JS 学习记录。
                </motion.p>

                <motion.a
                  href="/cloudops"
                  onClick={enterOpsHome}
                  className="prisma-hero-action group inline-flex items-center gap-2 rounded-full bg-primary py-1.5 pl-5 pr-1.5 text-sm font-medium text-black transition-all duration-300 hover:gap-3 sm:text-base"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.7, ease }}
                >
                  Enter
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowRight size={18} className="text-primary" />
                  </span>
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="bg-black px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] bg-[#101010] px-5 py-16 text-center sm:px-8 sm:py-24 md:rounded-[2.25rem] lg:px-12">
          <div className="text-[10px] text-primary sm:text-xs">Cloud operations</div>
          <h2 className="mx-auto mt-7 max-w-3xl text-3xl leading-[0.95] sm:text-4xl sm:leading-[0.9] md:text-5xl lg:text-6xl xl:text-7xl" style={{ color: PRIMARY_TEXT }}>
            <WordsPullUpMultiStyle
              segments={[
                { text: "This is Ym1r's", className: 'font-normal' },
                { text: 'personal cloud console.', className: 'font-serif italic' },
                { text: 'Built for AI assistance, server operations, study notes, and portfolio entry.', className: 'font-normal' },
              ]}
            />
          </h2>
          <ScrollRevealText text={aboutText} />
        </div>
      </section>

      <section className="relative min-h-screen overflow-hidden bg-black px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="bg-noise pointer-events-none absolute inset-0 opacity-[0.15]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-xl font-normal leading-tight sm:text-2xl md:text-3xl lg:text-4xl">
              <WordsPullUpMultiStyle
                segments={[
                  { text: 'One cinematic front door for every core function.', className: 'text-primary' },
                  { text: 'CloudOps first. Personal content one click away.', className: 'text-gray-500' },
                ]}
              />
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-3 sm:mt-16 sm:gap-2 md:grid-cols-2 md:gap-1 lg:h-[480px] lg:grid-cols-4">
            {featureCards.map((card) => (
              <FeatureCard key={card.index} {...card} onOpen={goToPath} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
