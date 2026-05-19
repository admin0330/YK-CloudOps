import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Languages } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { runTopDownWipeTransition } from '../effects/LinearTransitionManager';

export default function NavbarControls() {
  const { theme, setThemeDirect } = useTheme();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';
  const isJsStudy = location.pathname === '/js-study';

  const startTransition = useCallback((type: 'language' | 'theme') => {
    const nextTheme = isDark ? 'light' : 'dark';
    const overlay = type === 'theme'
      ? (nextTheme === 'dark'
        ? 'linear-gradient(180deg, rgba(5, 5, 7, 0.98) 0%, rgba(11, 13, 18, 0.98) 100%)'
        : 'linear-gradient(180deg, rgba(247, 244, 239, 0.98) 0%, rgba(236, 230, 220, 0.98) 100%)')
      : 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)';

    void runTopDownWipeTransition({
      background: overlay,
      action: () => {
        if (type === 'language') {
          setLang(lang === 'zh' ? 'en' : 'zh');
        } else {
          setThemeDirect(nextTheme);
        }
      },
    });
  }, [isDark, lang, setLang, setThemeDirect]);

  return (
    <>
      <motion.button
        onClick={() => navigate('/js-study')}
        className={`ct-control ${isJsStudy ? 'is-active' : ''}`}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        aria-label="Open JavaScript study"
      >
        <span className="font-semibold tracking-[0.18em]">JS</span>
      </motion.button>

      <motion.button
        onClick={() => startTransition('language')}
        className="ct-control"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        aria-label="Switch language"
      >
        <Languages size={12} />
        <span className="hidden sm:inline">{lang === 'zh' ? '中文 / EN' : 'EN / 中文'}</span>
        <span className="sm:hidden">{lang === 'zh' ? 'EN' : '中文'}</span>
      </motion.button>

      <motion.button
        onClick={() => startTransition('theme')}
        className="ct-control"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        aria-label={isDark ? 'Switch to light' : 'Switch to dark'}
      >
        {isDark ? <Sun size={12} /> : <Moon size={12} />}
        <span className="hidden sm:inline">{isDark ? '浅色' : '深色'}</span>
      </motion.button>
    </>
  );
}
