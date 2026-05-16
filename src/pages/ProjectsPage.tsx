import { motion } from 'framer-motion';
import { ExternalLink, Wrench, Globe, Bot, Layers, Clock, CheckCircle, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

const ease = [0.25, 0.1, 0.25, 1];

interface Project {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  stack: string[];
  status: 'active' | 'building' | 'learning';
  link?: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const statusConfig = {
  active: { zh: '进行中', en: 'Active', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
  building: { zh: '构建中', en: 'Building', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', icon: Wrench },
  learning: { zh: '学习中', en: 'Learning', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', icon: Clock },
};

export default function ProjectsPage() {
  const { lang } = useLanguage();
  const isZh = lang === 'zh';

  const projects: Project[] = [
    {
      id: 'yk-intelligence',
      title: 'ym1r',
      subtitle: isZh ? 'AI 对话平台' : 'AI Chat Platform',
      desc: isZh
        ? '多用户 AI 对话 Web 应用，接入 DeepSeek API。支持用户注册与管理员审核、附件上传和文本提取、全局与个人人设、服务器时间上下文注入、Claude Code 控制台和 tmux 集成，并配有完整的管理后台。'
        : 'Multi-user AI chat web app powered by DeepSeek API. Features include user registration with admin approval, file uploads with text extraction, custom AI personas (global + per-user), server time context injection, Claude Code console with tmux integration, and a full admin dashboard for user management, server management, and DeepSeek usage tracking.',
      stack: ['React', 'TypeScript', 'Express', 'SQLite', 'DeepSeek API', 'Tailwind CSS', 'Framer Motion', 'tmux', 'systemd'],
      status: 'active',
      link: '/chat',
      icon: Bot,
    },
    {
      id: 'yk-cloudops',
      title: 'ym1r CloudOps',
      subtitle: isZh ? '服务器运维平台' : 'Server Operations Platform',
      desc: isZh
        ? '云服务器管理平台，支持 SSH 远程执行、命令日志、服务器健康监控（CPU、内存、磁盘、运行时间）和实时系统状态展示。专为个人云基础设施管理而设计，优先保证命令执行安全。'
        : 'Cloud server management platform with SSH remote execution, command logging, server health monitoring (CPU, memory, disk, uptime), and real-time system status display. Built for managing personal cloud infrastructure with safety-first command execution policies.',
      stack: ['Node.js', 'Express', 'ssh2', 'SQLite', 'React', 'Linux'],
      status: 'building',
      icon: Layers,
    },
    {
      id: 'personal-website',
      title: isZh ? '个人网站' : 'Personal Website',
      subtitle: isZh ? '品牌与作品集站点' : 'Brand & Portfolio Site',
      desc: isZh
        ? '高完成度的个人品牌网站，把 AI 能力和作品展示放在同一处。视觉上采用更克制的展示语言和 Liquid Glass 效果，作为统一入口的个人站点。'
        : 'High-design personal brand website combining AI capabilities with portfolio presentation. Features a craftz.dog-inspired aesthetic with Liquid Glass effects and pixel-fusion accents. Single entry point architecture with session-based navigation control for security.',
      stack: ['React', 'TypeScript', 'Framer Motion', 'Tailwind CSS', 'Express'],
      status: 'active',
      link: '/',
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{isZh ? '项目展示' : 'Projects'}</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            {isZh ? '展示我已经完成的内容，以及仍在持续构建中的项目。' : "Things I've built and things I'm still building."}
          </p>
        </motion.div>

        <div className="space-y-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              className="glass-panel p-6 sm:p-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12, ease }}
              whileHover={{ y: -2 }}
              style={{ transition: 'transform 0.34s ease-in-out' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--active-bg)' }}>
                    <project.icon size={22} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
                      {project.title}
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusConfig[project.status].color}`}>
                        {(() => {
                          const S = statusConfig[project.status].icon;
                          return <S size={11} />;
                        })()}
                        {isZh ? statusConfig[project.status].zh : statusConfig[project.status].en}
                      </span>
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">{project.subtitle}</p>
                  </div>
                </div>
                {project.link && (
                  <a
                    href={project.link}
                    className="flex items-center gap-1.5 text-xs font-medium no-underline shrink-0 self-start px-3 py-1.5 rounded-full border cursor-pointer"
                    style={{
                      borderColor: 'var(--glass-border)',
                      color: 'var(--accent)',
                      background: 'var(--glass-bg)',
                      transition: 'all 280ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                  >
                    {isZh ? '查看' : 'View'} <ExternalLink size={11} />
                  </a>
                )}
              </div>

              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
                {project.desc}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="text-xs px-2.5 py-0.5 rounded-full"
                    style={{
                      background: 'var(--hover-bg)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <p className="text-xs text-[var(--text-weak)] mb-3">
            {isZh ? '还有更多内容，持续构建中。' : 'More on the way. Always building.'}
          </p>
          <a
            href="https://github.com/admin0330"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium no-underline"
            style={{ color: 'var(--accent)' }}
          >
            <Zap size={12} /> github.com/admin0330
          </a>
        </motion.div>
      </div>
    </div>
  );
}
