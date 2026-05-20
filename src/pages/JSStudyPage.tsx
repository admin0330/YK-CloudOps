import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Copy, Database, RefreshCw, Search, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import { DEPLOY_NOTES, ROADMAP, STATIC_SECTIONS } from '../../shared/jsStudyContent.js';

type SourceMode = 'auto' | 'mysql' | 'static';
type ResolvedMode = 'mysql' | 'static';

type StudySection = {
  id: string;
  title: string;
  tags?: string[];
  body: string;
  code: string;
  task?: string;
};

const MODE_KEY = 'js-study-source-mode';

function sourceName(mode: SourceMode | ResolvedMode) {
  if (mode === 'mysql') return 'MySQL';
  if (mode === 'static') return '静态';
  return '自动';
}

function codeToCopy(section: StudySection) {
  return `// ${section.title}\n${section.code}`;
}

export default function JSStudyPage() {
  const [requestedMode, setRequestedMode] = useState<SourceMode>(() => {
    const stored = localStorage.getItem(MODE_KEY);
    return stored === 'mysql' || stored === 'static' || stored === 'auto' ? stored : 'auto';
  });
  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>('static');
  const [sections, setSections] = useState<StudySection[]>(STATIC_SECTIONS as StudySection[]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('正在加载内容');

  useEffect(() => {
    localStorage.setItem(MODE_KEY, requestedMode);
  }, [requestedMode]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (requestedMode === 'static') {
          if (!cancelled) {
            setSections(STATIC_SECTIONS as StudySection[]);
            setResolvedMode('static');
            setNotice('当前使用静态版内容');
          }
          return;
        }

        const res = await fetch(`/api/js-study/sections?mode=${requestedMode}`, { cache: 'no-store' });
        const payload = await res.json().catch(() => null);
        const nextSections = Array.isArray(payload?.sections) ? payload.sections : STATIC_SECTIONS;
        const nextResolved: ResolvedMode = payload?.source === 'mysql' ? 'mysql' : 'static';

        if (!cancelled) {
          setSections(nextSections);
          setResolvedMode(nextResolved);
          setNotice(payload?.fallback ? '数据库不可用，已回退静态版' : nextResolved === 'mysql' ? '已接入 MySQL 内容' : '当前使用静态版内容');
        }
      } catch {
        if (!cancelled) {
          setSections(STATIC_SECTIONS as StudySection[]);
          setResolvedMode('static');
          setNotice(requestedMode === 'mysql' ? '数据库不可用，已回退静态版' : '当前使用静态版内容');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [requestedMode]);

  useEffect(() => {
    // Close the source menu when the user presses Escape or taps outside the switcher.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-js-mode-switch]')) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const filteredSections = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sections;
    return sections.filter((section) => {
      const haystack = [section.title, section.body, section.task, ...(section.tags || [])].join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [search, sections]);

  const chapterCount = sections.length;

  const copySection = async (section: StudySection) => {
    try {
      await navigator.clipboard.writeText(codeToCopy(section));
      setNotice('代码已复制');
    } catch {
      setNotice('复制失败，请手动选择代码');
    }
  };

  const jumpToChapter = (id: string) => {
    document.getElementById(`chapter-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  const randomChapter = () => {
    const target = sections[Math.floor(Math.random() * sections.length)];
    if (target) jumpToChapter(target.id);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(138,164,255,0.26),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(255,123,213,0.16),transparent_26%),radial-gradient(circle_at_70%_85%,rgba(96,240,189,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16] bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <Navbar />

      {/* Main study layout: hero summary, source switcher, filtered chapters, and side roadmap. */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 sm:pb-20">
        <motion.section
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-8 lg:p-10 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(138,164,255,0.5),rgba(255,255,255,0)_70%)] blur-2xl" />
          <div className="absolute -bottom-24 right-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(96,240,189,0.32),rgba(255,255,255,0)_70%)] blur-2xl" />

          <div className="relative z-10 lg:hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(138,164,255,0.18),transparent_32%),radial-gradient(circle_at_85%_0%,rgba(96,240,189,0.12),transparent_24%),rgba(255,255,255,0.04)] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <Sparkles size={11} />
                JS Study
              </span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
                {loading ? '加载中' : sourceName(resolvedMode)}
              </span>
            </div>
            <h1 className="mt-4 text-[2.1rem] font-semibold tracking-tight" style={{ color: 'var(--text-primary)', lineHeight: 0.95, letterSpacing: '-0.05em' }}>
              JavaScript 学习手册
            </h1>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.72 }}>
              这是从 zip 整理出来的学习页。手机端会优先展示最常用的信息，搜索、切换版本、复制代码都能单手完成。
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>章节</div>
                <div className="mt-2 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{chapterCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>版本</div>
                <div className="mt-2 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{sourceName(resolvedMode)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>状态</div>
                <div className="mt-2 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{loading ? '加载中' : '就绪'}</div>
              </div>
            </div>
          </div>

          <div className="relative grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="hidden lg:block space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <Sparkles size={13} />
                JavaScript Study
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl" style={{ color: 'var(--text-primary)', lineHeight: 0.96 }}>
                JavaScript 学习手册
              </h1>
              <p className="max-w-2xl text-sm sm:text-base lg:text-lg" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                这是从你给的 zip 里整理出来的 JS 学习页，保留了静态离线版，也能在数据库可用时切到 MySQL 版。
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={randomChapter}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-white/20"
                >
                  <RefreshCw size={15} />
                  随机章节
                </button>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-white/20"
                >
                  回到顶部
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <GlassCard className="p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">章节数</div>
                  <div className="mt-2 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{chapterCount}</div>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">来源</div>
                  <div className="mt-2 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{sourceName(resolvedMode)}</div>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">状态</div>
                  <div className="mt-2 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{loading ? '加载中' : '就绪'}</div>
                </GlassCard>
              </div>
            </div>

            <GlassCard className="relative overflow-hidden p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>版本切换</div>
                  <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    源码 · {sourceName(requestedMode)}
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    当前请求版本是 <strong>{sourceName(requestedMode)}</strong>，实际展示结果是 <strong>{sourceName(resolvedMode)}</strong>。
                  </p>
                </div>

                <div className="relative w-full sm:w-auto" data-js-mode-switch>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-full border border-white/15 bg-gradient-to-r from-emerald-300/20 to-sky-400/15 px-4 text-sm font-semibold text-[var(--text-primary)] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    模式
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-full sm:w-48 rounded-2xl border border-white/10 bg-[rgba(8,10,20,0.92)] p-2 shadow-[0_22px_58px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                      {(['auto', 'mysql', 'static'] as SourceMode[]).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setRequestedMode(item);
                            setMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            requestedMode === item ? 'bg-emerald-300/15 text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <span>{sourceName(item)}</span>
                          {requestedMode === item && <span className="text-xs font-semibold text-emerald-300">选中</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>章节搜索</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{notice}</div>
                </div>
                <label className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Search size={16} style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜索函数、DOM、API..."
                    className="w-full bg-transparent text-base sm:text-sm outline-none placeholder:text-[var(--text-muted)]"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </label>
              </div>
            </GlassCard>
          </div>
        </motion.section>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: '离线可用', value: '100%' },
            { label: 'MySQL 回退', value: '自动' },
            { label: '前端资源', value: '0 CDN' },
            { label: '学习路线', value: '8 周' },
          ].map((item) => (
            <GlassCard key={item.label} className="p-5">
              <div className="text-sm text-[var(--text-muted)]">{item.label}</div>
              <div className="mt-2 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
            </GlassCard>
          ))}
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {filteredSections.map((section, index) => (
              <GlassCard key={section.id} className="p-5 sm:p-6" hoverIntensity="subtle">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      Chapter {String(index + 1).padStart(2, '0')}
                    </div>
                    <h3 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{section.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => copySection(section)}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-white/20"
                >
                    <Copy size={13} />
                    复制代码
                  </button>
                </div>

                <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {section.body}
                </p>

                <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-[rgba(10,12,20,0.95)] p-4 text-sm leading-7 text-slate-100">
                  <code>{section.code}</code>
                </pre>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">任务</div>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {section.task}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(section.tags || []).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--text-muted)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="space-y-4">
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <Database size={16} style={{ color: 'var(--accent-blue)' }} />
                学习路线
              </div>
              <div className="mt-4 space-y-3">
                {ROADMAP.map((item) => (
                  <div key={item.week} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{item.week}</div>
                    <div className="mt-1 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>部署说明</div>
              <div className="mt-4 space-y-3">
                {DEPLOY_NOTES.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                    <div className="mt-1 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>说明</div>
              <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                页面右上角的入口按钮会带你进入这个学习页。进来以后可以在这里切换静态版与 MySQL 版，数据库不可用时会自动回退。
              </p>
            </GlassCard>
          </div>
        </section>
      </main>
    </div>
  );
}
