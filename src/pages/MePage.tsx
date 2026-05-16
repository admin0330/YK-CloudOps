import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Mail, MessageCircle, Server, ExternalLink, Cpu, Globe, Router, Terminal, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import { fadeUp } from '../lib/motion';
import { useIsMobile } from '../lib/useIsMobile';

const ease = [0.25, 0.1, 0.25, 1];

const NAV = [
  { key: 'about', zh: '关于', en: 'About' },
  { key: 'tech', zh: '技术栈', en: 'Tech Stack' },
  { key: 'projects', zh: '项目', en: 'Projects' },
  { key: 'roadmap', zh: '路线', en: 'Roadmap' },
  { key: 'serverlab', zh: '服务器实验室', en: 'Server Lab' },
  { key: 'contact', zh: '联系', en: 'Contact' },
];

export default function MePage() {
  const { lang, t } = useLanguage();
  const [active, setActive] = useState('about');
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const sections = NAV.map(n => document.getElementById(`section-${n.key}`)).filter(Boolean);
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el && el.getBoundingClientRect().top <= 160) {
          setActive(NAV[i].key);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (key: string) => {
    setActive(key);
    const el = document.getElementById(`section-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen pt-[6.4rem] sm:pt-[5.85rem]" style={{ background: 'var(--me-bg)', color: 'var(--me-text)' }}>
      <Navbar />

      {/* Section nav — sticky below Navbar, simplified on mobile */}
      <nav
        className={`sticky top-[5.9rem] sm:top-[5.35rem] z-30 transition-all ${
          scrolled ? 'bg-[var(--me-bg)]/80 backdrop-blur-xl border-b border-[var(--me-border)]' : 'bg-transparent'
        }`}
        style={{ transitionDuration: '400ms' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 sm:py-0 min-h-12 flex items-center">
          {/* Desktop: centered tabs */}
          <div className="hidden sm:flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => scrollTo(n.key)}
                className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all shrink-0 ${
                  active === n.key
                    ? 'bg-[var(--me-text)]/8 text-[var(--me-text)] font-medium'
                    : 'text-[var(--me-muted)] hover:text-[var(--me-text)] hover:bg-[var(--me-text)]/4'
                }`}
                style={{ transitionDuration: '280ms' }}
              >
                {n[lang]}
              </button>
            ))}
          </div>
          {/* Mobile: compact wrapped tabs */}
          <div className="grid sm:hidden grid-cols-2 gap-1.5 flex-1">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => scrollTo(n.key)}
                className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all ${
                  active === n.key
                    ? 'bg-[var(--me-text)]/8 text-[var(--me-text)] font-medium'
                    : 'text-[var(--me-muted)] hover:text-[var(--me-text)] hover:bg-[var(--me-text)]/4'
                }`}
                style={{ transitionDuration: '280ms' }}
              >
                {n[lang]}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="section-hero" className="scroll-mt-[8rem] max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-14 pb-8 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="text-center"
        >
          <motion.div
            className="mb-6 inline-block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: isMobile ? 0.22 : 0.8, delay: isMobile ? 0 : 0.1, ease }}
          >
            <div className={isMobile ? 'relative w-16 h-16 mx-auto' : 'relative w-20 h-20 sm:w-24 sm:h-24 mx-auto'}>
              {isMobile ? (
                <div className="absolute inset-0 rounded-2xl bg-[var(--me-card)] border border-[var(--me-border)] overflow-hidden">
                  <img
                    src="/assets/logo.png"
                    alt="Ym1r"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <span
                    className="absolute inset-0 items-center justify-center text-lg font-bold tracking-tight"
                    style={{ display: 'none', color: 'var(--me-accent)' }}
                  >
                    Ym1r
                  </span>
                </div>
              ) : (
                <>
                  {/* Decorative rotated border rings */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--me-accent)]/20 via-transparent to-[var(--accent-soft)]/20 border border-[var(--me-border)] backdrop-blur-sm"
                    style={{ transform: 'rotate(6deg)' }} />
                  <div className="absolute inset-1 rounded-xl bg-[var(--me-card)] border border-[var(--me-border)] overflow-hidden"
                    style={{ transform: 'rotate(-3deg)' }}>
                <img
                  src="/assets/logo.png"
                  alt="Ym1r"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <span
                  className="absolute inset-0 items-center justify-center text-xl sm:text-2xl font-bold tracking-tight"
                  style={{ display: 'none', color: 'var(--me-accent)' }}
                >
                  Ym1r
                </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease }}
          >
            <span style={{
              background: 'linear-gradient(135deg, var(--me-text) 0%, var(--me-accent) 50%, var(--accent-soft) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Ym1r
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-[var(--me-text-secondary)] max-w-lg mx-auto leading-relaxed mb-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
          >
            Cloud & Network Technology Student
          </motion.p>

          <motion.p
            className="text-sm text-[var(--me-muted)] max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
          >
            Focus: Linux / Servers / Deployment / AI Web Apps<br />
            Goal: Work in Singapore
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-3 mt-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease }}
          >
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer no-underline"
              style={{
                background: 'var(--me-text)',
                color: 'var(--me-bg)',
                transition: 'opacity 280ms linear',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <Terminal size={15} /> {lang === 'zh' ? '返回 AI 对话' : 'Back to AI Chat'}
            </Link>
            <a
              href="https://github.com/admin0330"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm border cursor-pointer no-underline"
              style={{
                borderColor: 'var(--me-border)',
                color: 'var(--me-text)',
                background: 'transparent',
                transition: 'background 280ms linear',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--me-text)/6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Github size={15} /> GitHub <ExternalLink size={11} />
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* About Me */}
      <section id="section-about" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-[var(--me-border)]">
        <SectionHeading title={lang === 'zh' ? '关于我' : 'About Me'} />
        <motion.div
          className="max-w-2xl mx-auto space-y-4 text-sm text-[var(--me-text-secondary)] leading-relaxed"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.p variants={fadeUp}>{t('meAboutText1')}</motion.p>
          <motion.p variants={fadeUp}>{t('meAboutText2')}</motion.p>
          <motion.p variants={fadeUp}>{t('meAboutText3')}</motion.p>
        </motion.div>
      </section>

      {/* Tech Stack */}
      <section id="section-tech" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-[var(--me-border)]">
        <SectionHeading title={lang === 'zh' ? '技术栈' : 'Tech Stack'} />
        <div className="max-w-xl mx-auto space-y-5">
          {[
            { cat: lang === 'zh' ? '语言 & 框架' : 'Languages & Frameworks', items: ['JavaScript', 'TypeScript', 'Python (basic)', 'React', 'Express', 'Node.js'] },
            { cat: lang === 'zh' ? '基础设施 & 运维' : 'Infra & DevOps', items: ['Linux', 'Nginx', 'systemd', 'SSH', 'Ubuntu Server', 'DNS'] },
            { cat: lang === 'zh' ? '网络' : 'Networking', items: ['TCP/IP', 'OpenWrt', 'Routing', 'Switching', 'DHCP', 'Firewall'] },
            { cat: lang === 'zh' ? 'AI 与工具' : 'AI & Tools', items: ['DeepSeek API', 'Claude Code', 'Prompt Engineering', 'Git', 'SQLite', 'tmux'] },
          ].map((group, gi) => (
            <motion.div
              key={group.cat}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: gi * 0.08 }}
            >
              <h3 className="text-xs font-medium text-[var(--me-muted)] uppercase tracking-wider mb-2.5">{group.cat}</h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 rounded-full text-xs cursor-default"
                    style={{
                      background: 'var(--me-card)',
                      border: '1px solid var(--me-border)',
                      color: 'var(--me-text-secondary)',
                      transition: 'all 300ms linear',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--me-accent)';
                      e.currentTarget.style.color = 'var(--me-text)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--me-border)';
                      e.currentTarget.style.color = 'var(--me-text-secondary)';
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Selected Projects */}
      <section id="section-projects" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-[var(--me-border)]">
        <SectionHeading title={lang === 'zh' ? '精选项目' : 'Selected Projects'} />
        <div className="grid sm:grid-cols-3 gap-4">
          <MeProjectCard
            i={0}
            icon={<Bot size={20} />}
            title="ym1r"
            status="Active"
            desc={lang === 'zh' ? '多用户 AI 对话平台，接入 DeepSeek + Claude，支持附件上传和人设系统。' : 'Multi-user AI chat with DeepSeek + Claude, attachments, persona system.'}
            stack={['React', 'Express', 'SQLite', 'DeepSeek']}
            link="/chat"
            lang={lang}
          />
          <MeProjectCard
            i={1}
            icon={<Server size={20} />}
            title="ym1r CloudOps"
            status="Building"
            desc={lang === 'zh' ? '云服务器运维平台，支持 SSH 远程执行、系统监控和命令日志。' : 'Cloud server ops with SSH execution, system monitoring, command logging.'}
            stack={['Node.js', 'ssh2', 'Linux', 'systemd']}
            lang={lang}
          />
          <MeProjectCard
            i={2}
            icon={<Globe size={20} />}
            title="Personal Website"
            status="Active"
            desc={lang === 'zh' ? '个人品牌网站，采用更克制的展示风格和 Liquid Glass 设计。' : 'Personal brand site with a more restrained showcase style and Liquid Glass design.'}
            stack={['React', 'Framer Motion', 'Tailwind CSS']}
            link="/"
            lang={lang}
          />
        </div>
      </section>

      {/* Learning Roadmap */}
      <section id="section-roadmap" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-[var(--me-border)]">
        <SectionHeading title={lang === 'zh' ? '学习路线' : 'Learning Roadmap'} />
        <div className="max-w-lg mx-auto space-y-0">
          {[
            { year: '2026', title: lang === 'zh' ? '打磨 ym1r' : 'Polish ym1r', desc: lang === 'zh' ? '继续完善全栈能力和 AI 集成，强化 Linux 服务器部署与运维技能。' : 'Refine full-stack skills and AI integration. Strengthen Linux server deployment and ops skills.' },
            { year: '2027', title: lang === 'zh' ? '深化技术基础' : 'Deepen Foundations', desc: lang === 'zh' ? '继续加深 Linux 系统管理、Docker/K8s、网络安全和英语能力。' : 'Continue deepening Linux sysadmin, Docker/K8s, network security, and English.' },
            { year: '2028+', title: lang === 'zh' ? '走向世界' : 'Go Global', desc: lang === 'zh' ? '争取去新加坡做云网络或运维方向的工作，在国际平台发展。' : 'Target Singapore for cloud networking / DevOps roles on an international stage.' },
          ].map((item, i) => (
            <motion.div
              key={item.year}
              className="relative pl-10 pb-10 last:pb-0"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12, ease }}
            >
              {i < 2 && <div className="absolute left-[12px] top-8 bottom-0 w-px" style={{ background: 'var(--me-border)' }} />}
              <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full border-2" style={{ borderColor: 'var(--me-accent)', background: 'var(--me-bg)' }} />
              <div className="text-xs font-mono mb-1" style={{ color: 'var(--me-accent)' }}>{item.year}</div>
              <h3 className="text-base font-medium text-[var(--me-text)] mb-1">{item.title}</h3>
              <p className="text-sm text-[var(--me-text-secondary)] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Server Lab */}
      <section id="section-serverlab" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-[var(--me-border)]">
        <SectionHeading title={lang === 'zh' ? '服务器实验室' : 'Server Lab'} />
        <motion.div
          className="max-w-lg mx-auto grid sm:grid-cols-2 gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {[
            { icon: Cpu, label: lang === 'zh' ? 'Ubuntu 22.04 VPS' : 'Ubuntu 22.04 VPS', desc: lang === 'zh' ? '承载所有站点与服务的生产服务器。' : 'Production server for all web apps.' },
            { icon: Router, label: lang === 'zh' ? 'Nginx 反向代理' : 'Nginx Reverse Proxy', desc: lang === 'zh' ? '负责 SSL 终止与域名路由。' : 'SSL termination and domain routing.' },
            { icon: Terminal, label: lang === 'zh' ? 'systemd 服务' : 'systemd Services', desc: lang === 'zh' ? '用于监督 yk-intelligence 等后台服务。' : 'Service supervision for yk-intelligence and related processes.' },
            { icon: Server, label: lang === 'zh' ? 'OpenWrt 路由器' : 'OpenWrt Router', desc: lang === 'zh' ? '校园 / 家庭网络网关。' : 'Campus/home network gateway.' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="p-4 rounded-2xl flex items-start gap-3"
              style={{
                background: 'var(--me-card)',
                border: '1px solid var(--me-border)',
                transition: 'all 340ms linear',
              }}
              variants={fadeUp}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--me-accent)';
                e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--me-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--me-tag-bg)' }}>
                <item.icon size={16} style={{ color: 'var(--me-accent)' }} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[var(--me-text)]">{item.label}</h4>
                <p className="text-xs text-[var(--me-muted)] mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Contact */}
      <section id="section-contact" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-[var(--me-border)]">
        <SectionHeading title={lang === 'zh' ? '联系' : 'Contact'} />
        <motion.div
          className="max-w-sm mx-auto space-y-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease }}
        >
          <a
            href="https://github.com/admin0330"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl no-underline cursor-pointer"
            style={{
              background: 'var(--me-card)',
              border: '1px solid var(--me-border)',
              color: 'var(--me-text)',
              transition: 'all 280ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--me-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--me-border)'; }}
          >
            <Github size={18} style={{ color: 'var(--me-text-secondary)' }} />
            <div>
              <div className="text-sm font-medium">{lang === 'zh' ? 'GitHub' : 'GitHub'}</div>
              <div className="text-xs text-[var(--me-muted)]">github.com/admin0330</div>
            </div>
            <ExternalLink size={12} className="ml-auto" style={{ color: 'var(--me-muted)' }} />
          </a>

          <div
            className="flex items-center gap-3 p-4 rounded-xl cursor-default"
            style={{
              background: 'var(--me-card)',
              border: '1px solid var(--me-border)',
              color: 'var(--me-text)',
            }}
          >
            <Mail size={18} style={{ color: 'var(--me-text-secondary)' }} />
            <div>
              <div className="text-sm font-medium">{lang === 'zh' ? '邮箱' : 'Email'}</div>
              <div className="text-xs text-[var(--me-muted)]">gyk995885442@163.com</div>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-4 rounded-xl cursor-default"
            style={{
              background: 'var(--me-card)',
              border: '1px solid var(--me-border)',
              color: 'var(--me-text)',
            }}
          >
            <MessageCircle size={18} style={{ color: 'var(--me-text-secondary)' }} />
            <div>
              <div className="text-sm font-medium">{lang === 'zh' ? '微信' : 'WeChat'}</div>
              <div className="text-xs text-[var(--me-muted)]">GL4EVR</div>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-4 rounded-xl cursor-default"
            style={{
              background: 'var(--me-card)',
              border: '1px solid var(--me-border)',
              color: 'var(--me-text)',
            }}
          >
            <MapPin size={18} style={{ color: 'var(--me-text-secondary)' }} />
            <div>
              <div className="text-sm font-medium">{lang === 'zh' ? '位置' : 'Location'}</div>
              <div className="text-xs text-[var(--me-muted)]">{lang === 'zh' ? '长沙，中国 · 目标新加坡' : 'Changsha, China · Targeting Singapore'}</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12 border-t border-[var(--me-border)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--me-muted)]">
          <p>{lang === 'zh' ? '由 ym1r 制作 · 长沙' : 'Made by ym1r · Changsha'}</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-[var(--me-text)] cursor-pointer no-underline" style={{ color: 'inherit', transition: 'color 280ms' }}>{lang === 'zh' ? '首页' : 'Home'}</Link>
            <Link to="/chat" className="hover:text-[var(--me-text)] cursor-pointer no-underline" style={{ color: 'inherit', transition: 'color 280ms' }}>{lang === 'zh' ? 'AI 对话' : 'AI Chat'}</Link>
            <a href="https://github.com/admin0330" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--me-text)] cursor-pointer no-underline" style={{ color: 'inherit', transition: 'color 280ms' }}>GitHub</a>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--me-text)] cursor-pointer no-underline" style={{ color: 'inherit', transition: 'color 280ms' }}>湘ICP备2026017602号</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Reusable Components ── */

function SectionHeading({ title }: { title: string }) {
  return (
    <motion.div
      className="mb-8 text-center"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease }}
    >
      <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--me-text)]">{title}</h2>
    </motion.div>
  );
}

function MeProjectCard({ title, desc, stack, link, i, icon, status, lang }: {
  title: string; desc: string; stack: string[]; icon: React.ReactNode; status: string; link?: string; i: number; lang: string;
}) {
  const stColor = status === 'Active' ? 'text-emerald-500' : status === 'Building' ? 'text-amber-500' : 'text-blue-500';
  const statusLabel = lang === 'zh'
    ? (status === 'Active' ? '进行中' : status === 'Building' ? '构建中' : '学习中')
    : status;
  return (
    <motion.div
      className="p-5 rounded-2xl h-full cursor-default"
      style={{
        background: 'var(--me-card)',
        border: '1px solid var(--me-border)',
        transition: 'all 340ms linear',
      }}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: i * 0.08, ease }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--me-accent)';
        e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--me-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--me-accent)' }}>
        {icon}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stColor} bg-current/10`}>{statusLabel}</span>
      </div>
      <h3 className="text-sm font-medium text-[var(--me-text)] mb-1.5">{title}</h3>
      <p className="text-xs text-[var(--me-text-secondary)] leading-relaxed mb-4">{desc}</p>
      <div className="flex flex-wrap gap-1.5">
        {stack.map((s) => (
          <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--me-tag-bg)', color: 'var(--me-muted)' }}>{s}</span>
        ))}
      </div>
      {link && (
        <div className="mt-4">
            <Link to={link} className="inline-flex items-center gap-1 text-xs font-medium no-underline hover:gap-1.5" style={{ color: 'var(--me-accent)', transition: 'gap 280ms ease' }}>
            {lang === 'zh' ? '查看' : 'View'} <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </motion.div>
  );
}

// Bot icon as inline component
function Bot({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="9" cy="16" r="1" />
      <circle cx="15" cy="16" r="1" />
    </svg>
  );
}
