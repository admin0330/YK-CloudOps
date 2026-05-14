import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { runTopDownWipeTransition } from '../effects/LinearTransitionManager';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  const toggle = () => {
    void runTopDownWipeTransition({
      background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
      action: () => setLang(lang === 'zh' ? 'en' : 'zh'),
    });
  };

  return (
    <motion.button
      onClick={toggle}
      className="ct-control"
      whileTap={{ scale: 0.97 }}
      style={{ transitionDuration: '280ms' }}
    >
      {lang === 'zh' ? 'English' : '中文'}
    </motion.button>
  );
}
