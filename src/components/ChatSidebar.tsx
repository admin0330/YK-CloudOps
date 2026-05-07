import { Link } from 'react-router-dom';
import { Plus, MessageSquare, LogOut, User, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from './ThemeToggle';
import HoldToDeleteButton from './ui/HoldToDeleteButton';

export default function ChatSidebar({ conversations, activeId, onSelect, onNew, onDelete, user, onLogout, onToggle, onPersona }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full glass border-r border-[var(--border)]">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Link to="/me" aria-label="Open personal blog" className="cursor-pointer hover:opacity-75 shrink-0" style={{ transition: 'opacity 280ms linear' }}>
              <img src="/apple-logo.png" alt="YK Logo" className="w-6 h-6 rounded-md" />
            </Link>
            Intelligence
          </span>
          <motion.button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors lg:hidden text-apple-muted"
            whileTap={{ scale: 0.85 }}
          >
            <X size={18} />
          </motion.button>
        </div>
        <motion.button
          onClick={onNew}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-[var(--hover-bg)] hover:bg-[var(--hover-bg)] text-sm font-medium"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          style={{ transitionDuration: '280ms' }}
        >
          <Plus size={16} />
          {t('newChat')}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5" style={{ WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence>
          {conversations.map((c, i) => (
            <motion.div
              key={c.id}
              onClick={() => onSelect(c)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm ${
                activeId === c.id ? 'bg-[var(--active-bg)] text-[var(--text)] font-medium' : 'text-apple-muted hover:bg-[var(--hover-bg)] hover:text-[var(--text)]'
              }`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <MessageSquare size={14} className="shrink-0" />
              <span className="flex-1 truncate">{c.title}</span>
              <div
                className="shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                style={{ transitionDuration: '280ms' }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <HoldToDeleteButton
                  size="sm"
                  label=""
                  confirmLabel=""
                  completedLabel=""
                  duration={900}
                  onConfirm={() => onDelete(c.id)}
                  ariaLabel={t('holdToDelete')}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {conversations.length === 0 && (
          <motion.div
            className="text-center text-apple-muted text-sm mt-8 px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            {t('noConversations')}
          </motion.div>
        )}
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[var(--active-bg)] flex items-center justify-center shrink-0"><User size={14} /></div>
            <span className="text-sm truncate text-apple-muted">{user?.username}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <motion.button
              onClick={onPersona}
              className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-apple-muted shrink-0"
              title={t('personaSettings')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              style={{ transitionDuration: '240ms' }}
            >
              <Sparkles size={14} />
            </motion.button>
            <motion.button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-apple-muted shrink-0"
              title={t('logout')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              style={{ transitionDuration: '240ms' }}
            >
              <LogOut size={14} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
