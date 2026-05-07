import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import type { Lang } from '../lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  const toggle = () => setLang(lang === 'zh' ? 'en' : 'zh');

  return (
    <motion.button
      onClick={toggle}
      className="glass-chip inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 whitespace-nowrap"
      whileTap={{ scale: 0.95 }}
      style={{ transitionDuration: '280ms' }}
    >
      {lang === 'zh' ? 'English' : '中文'}
    </motion.button>
  );
}
