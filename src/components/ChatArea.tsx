import { useState, useRef, useEffect } from 'react';
import { Send, ArrowDown, Paperclip, X, FileText, Zap, Image, Loader2, CloudSun, Sparkles, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import LiquidCapsuleSwitch from './ui/LiquidCapsuleSwitch';

const MODELS = [
  { key: 'flash', label: 'Flash' },
  { key: 'pro', label: 'Pro' },
];

export default function ChatArea({ conversation, messages, onSend, loading, error, model, onModelChange, onOpenSidebar }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    setUploadError('');

    try {
      const att = await api.uploadChatAttachment(file);
      setPendingAttachments(prev => [...prev, att]);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
      setTimeout(() => setUploadError(''), 4000);
    } finally {
      setUploading(false);
    }
  };

  const removePending = (id) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || loading) return;
    onSend(input.trim(), pendingAttachments.map(a => a.id));
    setInput('');
    setPendingAttachments([]);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const currentModel = MODELS.find(m => m.key === model) || MODELS[1];

  const canSend = (input.trim() || pendingAttachments.length > 0) && !loading;

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[var(--border)] glass shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="sm:hidden p-2 -ml-1.5 rounded-xl hover:bg-[var(--hover-bg)] text-apple-muted shrink-0"
              aria-label="Open conversations"
            >
              <Menu size={18} />
            </button>
          )}
          <h2 className="text-xs sm:text-sm font-medium truncate text-apple-text">
            {conversation?.title || t('newChat')}
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <LiquidCapsuleSwitch
            options={[
              { id: 'flash', label: t('fastMode'), icon: Zap, tone: 'var(--accent-green)' },
              { id: 'pro', label: t('proMode'), icon: Sparkles, tone: 'var(--accent-blue)' },
            ]}
            value={model}
            onChange={onModelChange}
            size="sm"
            ariaLabel={t('askAppleIntelligence') + ' model'}
          />
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5">
        {(!messages || messages.length === 0) && (
          <motion.div
            className="flex flex-col items-center justify-center h-full text-apple-muted px-4 max-w-xl mx-auto min-h-[20rem]"
            initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.14 } } }}
          >
            <motion.h1
              className="text-lg sm:text-2xl font-semibold mb-2 text-apple-text text-center tracking-tight"
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.52, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {t('appleIntelligence')}
            </motion.h1>
            <motion.p
              className="text-sm text-center mb-4 max-w-sm"
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.52, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {t('askMeAnything')}
            </motion.p>
          </motion.div>
        )}
        {messages?.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="flex gap-2 sm:gap-3 px-1"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              </div>
              <div className="glass-light rounded-2xl px-4 py-3">
                <div className="text-xs text-apple-muted mb-1">{currentModel.label} · {t('thinking')}</div>
                <div className="dot-typing"><span /><span /><span /></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && (
            <motion.div
              className="text-center text-red-400 text-sm py-2 px-4 bg-red-500/10 rounded-xl border border-red-500/20 mx-1"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Upload error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            className="px-4 pb-1 shrink-0"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <div className="text-red-400 text-xs py-1.5 px-3 bg-red-500/10 rounded-lg border border-red-500/20">{uploadError}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending attachments — shown above input */}
      <AnimatePresence>
        {pendingAttachments.length > 0 && (
          <motion.div
            className="px-3 pb-1 shrink-0 flex gap-2 overflow-x-auto"
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
          >
            {pendingAttachments.map((att) => {
              const isImage = (att.mimeType || '').startsWith('image/');
              return (
                <div
                  key={att.id}
                  className="glass-light rounded-xl px-2.5 py-2 flex items-center gap-2 text-sm shrink-0 max-w-[220px]"
                >
                  {isImage ? (
                    <img
                      src={att.previewUrl}
                      alt={att.originalName}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[var(--active-bg)] flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-apple-blue2" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate text-apple-text font-medium">{att.originalName}</div>
                    <div className="text-[10px] text-apple-muted">
                      {formatSize(att.size)}
                      {isImage && att.canUseVision && (
                        <span className="ml-1.5 text-apple-blue2"> · {t('imageWillBeRead')}</span>
                      )}
                      {isImage && !att.canUseVision && (
                        <span className="ml-1.5 text-apple-muted"> · {t('imageCannotBeRead')}</span>
                      )}
                      {!isImage && att.canReadText && (
                        <span className="ml-1.5 text-green-500/70"> · AI 可读</span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    onClick={() => removePending(att.id)}
                    className="p-1 rounded-md hover:bg-[var(--active-bg)] shrink-0 text-apple-muted"
                    whileTap={{ scale: 0.85 }}
                  >
                    <X size={13} />
                  </motion.button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploading indicator */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            className="px-4 pb-1 shrink-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 text-xs text-apple-muted">
              <Loader2 size={12} className="animate-spin" />
              {t('uploading')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 p-2 rounded-full glass border border-[var(--border-strong)] text-apple-muted hover:text-[var(--text)] z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Weather quick button */}
      <div className="hidden sm:block px-4 sm:px-5 pb-1 shrink-0">
        <button
          type="button"
          onClick={() => {
            onSend('我这里今天天气怎么样？', []);
          }}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: 'var(--glass-bg)',
            borderColor: 'var(--glass-border)',
            color: 'var(--text-muted)',
            backdropFilter: 'blur(8px)',
            transition: 'all 280ms ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <CloudSun size={12} /> 天气
        </button>
      </div>

      {/* Input bar */}
      <div className="p-2.5 sm:p-4 border-t border-[var(--border)] shrink-0 chat-input-area" style={{ paddingBottom: 'calc(0.35rem + env(safe-area-inset-bottom, 0px))' }}>
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="*/*" />
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 sm:p-3 rounded-2xl bg-[var(--hover-bg)] hover:bg-[var(--active-bg)] text-apple-muted hover:text-[var(--text)] shrink-0 disabled:opacity-40"
            title={t('attachFile')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            <Paperclip size={15} />
          </motion.button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={pendingAttachments.length > 0 ? t('askAboutFile') : t('typeMessage')}
            className="flex-1 min-w-0 input-glow rounded-2xl"
            disabled={loading}
          />
          <motion.button
            type="submit"
            disabled={!canSend}
            className="p-2 sm:p-3 rounded-2xl bg-[var(--active-bg)] hover:bg-[var(--active-bg)] disabled:opacity-30 disabled:cursor-not-allowed text-apple-text shrink-0"
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.92 } : {}}
          >
            <Send size={15} />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
