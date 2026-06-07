import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function AdminLoginPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await api.adminLogin(username, password);
      if (data.user) navigate('/admin');
    } catch (err: any) {
      setError(err.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #ecfeff 100%)' }}>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 -mt-14">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50 mb-3">
                <Shield size={22} className="text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-800">{t('adminLogin')}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'zh' ? '管理员身份验证' : 'Admin Authentication'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('username')}</label>
                <input
                  className="saas-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={lang === 'zh' ? '输入管理员用户名' : 'Enter admin username'}
                  autoFocus
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">{t('password')}</label>
                <div className="relative">
                  <input
                    className="saas-input !pr-10"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !username.trim() || !password.trim()}
                className="saas-btn saas-btn-primary w-full justify-center h-11 text-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {t('loading')}
                  </span>
                ) : (
                  t('login')
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="/login" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                {lang === 'zh' ? '返回用户登录' : 'Back to user login'}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
