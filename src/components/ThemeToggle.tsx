import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { runTopDownWipeTransition } from '../effects/LinearTransitionManager';

export default function ThemeToggle() {
  const { theme, setThemeDirect } = useTheme();
  const { t } = useLanguage();
  const isLight = theme === 'light';
  const nextTheme = isLight ? 'dark' : 'light';
  const overlay = nextTheme === 'dark'
    ? 'linear-gradient(180deg, rgba(5, 5, 7, 0.98) 0%, rgba(11, 13, 18, 0.98) 100%)'
    : 'linear-gradient(180deg, rgba(247, 244, 239, 0.98) 0%, rgba(236, 230, 220, 0.98) 100%)';

  return (
    <motion.button
      onClick={() => {
        void runTopDownWipeTransition({
          background: overlay,
          action: () => setThemeDirect(nextTheme),
        });
      }}
      className="ct-control"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
      aria-label={isLight ? t('themeSwitchDark') : t('themeSwitchLight')}
      title={isLight ? t('themeSwitchDark') : t('themeSwitchLight')}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isLight ? 'moon' : 'sun'}
          initial={{ opacity: 0, scale: 0.7, y: 3, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.7, y: -3, filter: 'blur(4px)' }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          {isLight ? <Moon size={13} /> : <Sun size={13} />}
        </motion.span>
      </AnimatePresence>
      <motion.span
        key={isLight ? 'light' : 'dark'}
        initial={{ opacity: 0, x: 4 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -4 }}
        transition={{ duration: 0.18 }}
        className="hidden sm:inline"
      >
        {isLight ? t('themeDark') : t('themeLight')}
      </motion.span>
    </motion.button>
  );
}
