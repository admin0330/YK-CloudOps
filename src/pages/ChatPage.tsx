import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatSidebar from '../components/ChatSidebar';
import ChatArea from '../components/ChatArea';
import Navbar from '../components/Navbar';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function ChatPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [model, setModel] = useState(() => localStorage.getItem('chat-model') || 'pro');

  useEffect(() => {
    api.getMe().then((d) => setUser(d.user)).catch(() => navigate('/login')).finally(() => setAuthChecked(true));
  }, [navigate]);

  useEffect(() => {
    if (user) api.getConversations().then((d) => setConversations(d.conversations)).catch(() => {});
  }, [user]);

  const handleModelChange = useCallback((m) => { setModel(m); localStorage.setItem('chat-model', m); }, []);

  const handleNew = useCallback(() => { setActiveConv(null); setMessages([]); setError(''); setSidebarOpen(false); }, []);
  const handleSelect = useCallback(async (conv) => {
    setActiveConv(conv); setError(''); setSidebarOpen(false);
    try { const data = await api.getConversation(conv.id); setMessages(data.messages || []); } catch { setMessages([]); }
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConv?.id === id) { setActiveConv(null); setMessages([]); }
    } catch { /* ignore */ }
  }, [activeConv]);

  const handleSend = useCallback(async (message, attachmentIds = []) => {
    setError('');
    setLoading(true);

    let displayContent = message || '';

    const tempId = Date.now();
    const userMsg = {
      id: tempId,
      conversationId: activeConv?.id,
      role: 'user',
      content: displayContent,
      attachments: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const data = await api.chat(activeConv?.id || null, message, model, attachmentIds);

      // Reload from server to get messages with proper attachments
      const convData = await api.getConversation(data.conversationId);
      setMessages(convData.messages || []);

      const list = await api.getConversations();
      setConversations(list.conversations || []);
      if (!activeConv) setActiveConv(list.conversations?.[0] || null);
    } catch (err) {
      setError(err.message || 'Chat failed');
    } finally {
      setLoading(false);
    }
  }, [activeConv, model]);

  const [personaOpen, setPersonaOpen] = useState(false);
  const [personaEnabled, setPersonaEnabled] = useState(false);
  const [personaContent, setPersonaContent] = useState('');
  const [personaLoaded, setPersonaLoaded] = useState(false);
  const [personaSaving, setPersonaSaving] = useState(false);
  const [personaMsg, setPersonaMsg] = useState('');
  const [personaMsgType, setPersonaMsgType] = useState<'ok' | 'err'>('ok');

  const loadPersona = useCallback(() => {
    api.getMyPersona().then((d) => {
      setPersonaEnabled(d.enabled);
      setPersonaContent(d.content || '');
    }).catch(() => {}).finally(() => setPersonaLoaded(true));
  }, []);

  const showPersonaMsg = (text: string, type: 'ok' | 'err') => {
    setPersonaMsg(text); setPersonaMsgType(type);
    setTimeout(() => setPersonaMsg(''), 2400);
  };

  const handlePersonaOpen = useCallback(() => {
    setPersonaOpen(true);
    setPersonaLoaded(false);
    api.getMyPersona().then((d) => {
      setPersonaEnabled(d.enabled);
      setPersonaContent(d.content || '');
    }).catch(() => {}).finally(() => setPersonaLoaded(true));
  }, []);

  const handlePersonaSave = useCallback(async () => {
    setPersonaSaving(true);
    try {
      const data = await api.updateMyPersona(personaEnabled, personaContent);
      setPersonaEnabled(data.enabled);
      setPersonaContent(data.content);
      showPersonaMsg('personaSaved', 'ok');
    } catch {
      showPersonaMsg('personaSaveFailed', 'err');
    } finally {
      setPersonaSaving(false);
    }
  }, [personaEnabled, personaContent]);

  const handleLogout = useCallback(async () => { await api.logout().catch(() => {}); navigate('/login'); }, [navigate]);

  if (!authChecked) {
    return <div className="h-full flex items-center justify-center bg-apple-bg"><div className="text-apple-muted text-sm animate-pulse">Loading...</div></div>;
  }
  if (!user) return null;

  return (
    <div className="h-full flex" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="lg:hidden fixed top-12 inset-x-0 z-30 glass border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 -ml-1.5"><Menu size={20} /></button>
        <span className="text-sm font-semibold truncate mx-2">{activeConv?.title || 'ym1r'}</span>
        <div className="w-8" />
      </div>

      <div className={`fixed inset-y-0 left-0 z-50 w-[85vw] sm:w-72 lg:w-64 transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ transitionDuration: '320ms', transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}>
        <ChatSidebar conversations={conversations} activeId={activeConv?.id} onSelect={handleSelect} onNew={handleNew} onDelete={handleDelete} user={user} onLogout={handleLogout} onToggle={() => setSidebarOpen(false)} onPersona={handlePersonaOpen} />
      </div>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-[var(--overlay-bg)] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 relative pt-14 lg:pt-12">
        <ChatArea conversation={activeConv} messages={messages} onSend={handleSend} loading={loading} error={error} model={model} onModelChange={handleModelChange} />
      </div>

      <AnimatePresence>
        {personaOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-[var(--overlay-bg)]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={() => setPersonaOpen(false)}
            />
            <motion.div
              className="fixed inset-x-4 top-[10%] z-50 max-w-md mx-auto glass rounded-2xl p-5 border border-[var(--border)] shadow-2xl"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.44, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold">{t('personalPersona')}</h2>
                  <p className="text-apple-muted text-xs mt-0.5">{t('personalPersonaDesc')}</p>
                </div>
                <motion.button
                  onClick={() => setPersonaOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--active-bg)] text-apple-muted"
                  whileTap={{ scale: 0.85 }}
                  style={{ transitionDuration: '240ms' }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {!personaLoaded ? (
                <div className="text-apple-muted text-sm py-4 text-center">{t('loading')}</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm">{t('enablePersonalPersona')}</span>
                    <motion.button
                      onClick={() => setPersonaEnabled(!personaEnabled)}
                      className={`w-10 h-5 rounded-full flex items-center px-0.5 ${personaEnabled ? 'bg-apple-blue2' : 'bg-[var(--active-bg)]'}`}
                      whileTap={{ scale: 0.95 }}
                      style={{ transition: 'background-color 300ms linear' }}
                    >
                      <motion.div
                        className="w-4 h-4 rounded-full bg-white/90 shadow-sm"
                        initial={false}
                        animate={{ x: personaEnabled ? 18 : 1 }}
                        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                      />
                    </motion.button>
                  </div>

                  <motion.div
                    initial={false}
                    animate={{ opacity: personaEnabled ? 1 : 0.4, height: personaEnabled ? 'auto' : 0 }}
                    transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <textarea
                      value={personaContent}
                      onChange={(e) => setPersonaContent(e.target.value)}
                      placeholder={t('personalPersonaPlaceholder')}
                      rows={4}
                      maxLength={4000}
                      disabled={!personaEnabled}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2.5 text-sm text-apple-text placeholder:text-apple-muted/50 resize-none focus:outline-none focus:border-[var(--accent)] disabled:opacity-30 mb-1"
                      style={{ transition: 'border-color 320ms linear' }}
                    />
                    <div className="text-right text-apple-muted text-xs mb-3">{personaContent.length} / 4000 {t('personaCharCount')}</div>
                  </motion.div>

                  <p className="text-apple-muted text-xs mb-3">{t('personalPersonaHint')}</p>

                  <AnimatePresence>
                    {personaMsg && (
                      <motion.div
                        className={`text-sm py-2 px-3 rounded-xl border text-center mb-3 ${personaMsgType === 'ok' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        {t(personaMsg)}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2 justify-end">
                    <motion.button
                      onClick={() => { setPersonaEnabled(false); setPersonaContent(''); setPersonaOpen(false); api.updateMyPersona(false, '').catch(() => {}); }}
                      className="btn-secondary btn-sm"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ transitionDuration: '240ms' }}
                    >
                      {t('reset')}
                    </motion.button>
                    <motion.button
                      onClick={handlePersonaSave}
                      disabled={personaSaving}
                      className="btn-primary btn-sm"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ transitionDuration: '240ms' }}
                    >
                      {personaSaving ? t('loading') : t('save')}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
