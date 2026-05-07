import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Languages } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { runParticleTransition } from '../effects/ParticleTransitionManager';

export default function NavbarControls() {
  const { theme, setThemeDirect } = useTheme();
  const { lang, setLang } = useLanguage();
  const isDark = theme === 'dark';

  const langRef = useRef<HTMLButtonElement>(null);
  const themeRef = useRef<HTMLButtonElement>(null);

  const transitioning = useRef(false);

  const startTransition = useCallback((type: 'language' | 'theme', e: React.MouseEvent) => {
    if (transitioning.current) return;
    transitioning.current = true;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    runParticleTransition({
      origin,
      type,
      action: () => {
        if (type === 'language') {
          setLang(lang === 'zh' ? 'en' : 'zh');
        } else {
          setThemeDirect(isDark ? 'light' : 'dark');
        }
      },
    }).finally(() => {
      transitioning.current = false;
    });
  }, [lang, isDark, setLang, setThemeDirect]);

  const btnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: '0.5px solid var(--glass-border)',
    background: 'var(--glass-bg)',
    color: 'var(--text-muted)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    transition: 'all 280ms ease',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  };

  return (
    <>
      {/* Language */}
      <motion.button
        ref={langRef}
        onClick={(e) => startTransition('language', e)}
        style={btnBase}
        whileHover={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
        whileTap={{ scale: 0.96 }}
        aria-label="Switch language"
      >
        <Languages size={12} />
        <span className="hidden sm:inline">{lang === 'zh' ? '中文 / EN' : '中文 / EN'}</span>
        <span className="sm:hidden">{lang === 'zh' ? 'EN' : '中文'}</span>
      </motion.button>

      {/* Theme */}
      <motion.button
        ref={themeRef}
        onClick={(e) => startTransition('theme', e)}
        style={btnBase}
        whileHover={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
        whileTap={{ scale: 0.96 }}
        aria-label={isDark ? 'Switch to light' : 'Switch to dark'}
      >
        {isDark ? <Sun size={12} /> : <Moon size={12} />}
        <span className="hidden sm:inline">{isDark ? '浅色' : '深色'}</span>
      </motion.button>
    </>
  );
}
