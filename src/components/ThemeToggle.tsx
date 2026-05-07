import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isLight = theme === 'light';

  return (
    <motion.button
      onClick={toggleTheme}
      className="glass-chip inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium cursor-pointer select-none"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      aria-label={isLight ? t('themeSwitchDark') : t('themeSwitchLight')}
      title={isLight ? t('themeSwitchDark') : t('themeSwitchLight')}
    >
      {isLight ? <Moon size={13} /> : <Sun size={13} />}
      <span className="hidden sm:inline">{isLight ? t('themeDark') : t('themeLight')}</span>
    </motion.button>
  );
}
