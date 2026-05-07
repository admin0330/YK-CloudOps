import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import BackNav from '../components/BackNav';
import { fadeUp, fadeIn, appleEase } from '../lib/motion';

export default function RegisterPage() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPw) { setError(t('passwordsDontMatch')); return; }
    setLoading(true);
    try {
      const data = await api.register(username, password);
      setSuccess(data.message || t('registerSuccess'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-apple-bg px-4 py-8">
      <BackNav />
      <div className="fixed top-4 right-4 z-50 header-actions">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <motion.div
          className="text-center mb-8"
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.14 } } }}
        >
          <motion.div variants={fadeUp} transition={appleEase}>
            <Link to="/me" aria-label="Open personal blog" className="inline-block cursor-pointer hover:opacity-80" style={{ transition: 'opacity 280ms linear' }}>
              <img src="/apple-logo.png" alt="YK Logo" className="w-14 h-14 mx-auto mb-3 rounded-2xl logo-glow" />
            </Link>
          </motion.div>
          <motion.h1 className="text-xl font-semibold" variants={fadeUp} transition={appleEase}>
            {t('appleIntelligence')}
          </motion.h1>
          <motion.p className="text-apple-muted text-sm mt-1" variants={fadeUp} transition={appleEase}>
            {t('registerDesc')}
          </motion.p>
        </motion.div>

        {success ? (
          <motion.div className="glass rounded-2xl p-6 text-center space-y-4" variants={fadeUp} initial="hidden" animate="visible" transition={appleEase}>
            <div className="text-green-400 text-sm py-3 px-4 bg-green-500/10 rounded-xl border border-green-500/20">{success}</div>
            <Link to="/login" className="btn-primary inline-block w-full">{t('goToSignIn')}</Link>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            className={`glass rounded-2xl p-6 space-y-4 ${error ? 'animate-shake' : ''}`}
            variants={fadeUp} initial="hidden" animate="visible" transition={{ ...appleEase, delay: 0.3 }}
          >
            <div>
              <label className="text-sm text-apple-muted block mb-1.5">{t('username')}</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('chooseUsername')} autoFocus autoComplete="username" required />
            </div>
            <div>
              <label className="text-sm text-apple-muted block mb-1.5">{t('password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('passwordAtLeast')} autoComplete="new-password" required />
            </div>
            <div>
              <label className="text-sm text-apple-muted block mb-1.5">{t('confirmPassword')}</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder={t('passwordAtLeast')} autoComplete="new-password" required />
            </div>
            <motion.div initial={false} animate={error ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }} transition={{ duration: 0.28 }} style={error ? {} : { pointerEvents: 'none' }}>
              {error && <div className="text-red-400 text-sm text-center py-2 px-3 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>}
            </motion.div>

            <motion.button type="submit" className="btn-primary w-full" disabled={loading} whileTap={{ scale: 0.98 }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[var(--spinner-track)] border-t-[var(--spinner-color)] rounded-full animate-spin" />
                  {t('creatingAccount')}
                </span>
              ) : t('register')}
            </motion.button>

            <motion.p className="text-center text-sm text-apple-muted pt-1" variants={fadeIn} initial="hidden" animate="visible" transition={{ ...appleEase, delay: 0.5 }}>
              {t('alreadyHaveAccount')} <Link to="/login" className="text-apple-blue2 hover:underline">{t('login')}</Link>
            </motion.p>
          </motion.form>
        )}
      </div>
    </div>
  );
}
