import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, User } from 'lucide-react';
import { api } from '../api/client';
import Navbar from '../components/Navbar';
import ReactMarkdown from 'react-markdown';

export default function AskMePage() {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setError('');
    setLoading(true);
    setHistory((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');

    try {
      const data = await api.askMe(q);
      setHistory((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-20 pb-24 flex flex-col">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <Sparkles size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-xl font-semibold mb-1">Ask Ym1r</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
            Ask about my skills, projects, experience, and career goals. I'll answer as Ym1r's AI assistant.
          </p>
        </motion.div>

        {/* Chat area */}
        <div
          ref={listRef}
          className="flex-1 space-y-4 overflow-y-auto mb-4 min-h-[300px] max-h-[55vh]"
          style={{ scrollBehavior: 'smooth' }}
        >
          {history.length === 0 && (
            <div className="text-center py-12 text-[var(--text-weak)]">
              <User size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Ask me anything about Ym1r — tech skills, projects, or career goals.</p>
            </div>
          )}

          <AnimatePresence>
            {history.map((msg, i) => (
              <motion.div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-br-md'
                      : 'border rounded-bl-md'
                  }`}
                  style={msg.role === 'assistant' ? {
                    background: 'var(--glass-bg)',
                    borderColor: 'var(--glass-border)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  } : {}}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="px-4 py-3 rounded-2xl border rounded-bl-md"
                style={{
                  background: 'var(--glass-bg)',
                  borderColor: 'var(--glass-border)',
                }}>
                <div className="dot-typing">
                  <span /><span /><span />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              className="text-center text-red-400 text-sm py-2 px-4 bg-red-500/10 rounded-xl border border-red-500/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about Ym1r's skills, projects, or goals..."
            disabled={loading}
            className="flex-1"
            autoFocus
          />
          <motion.button
            type="submit"
            disabled={loading || !question.trim()}
            className="btn-primary btn-sm flex items-center gap-1.5 shrink-0"
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Ask
          </motion.button>
        </form>
      </div>
    </div>
  );
}
