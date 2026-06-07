import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bot, User, Sparkles, Sliders, Menu, X, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

// 动画变体：用于对话气泡交错入场
const messageContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const bubbleVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98, filter: 'blur(2px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 160, damping: 22 }
  }
};

export default function ChatPage() {
  const { t, lang } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [model, setModel] = useState(() => localStorage.getItem('chat-model') || 'pro');

  // AI 人设高级配置抽屉相关状态
  const [personaOpen, setPersonaOpen] = useState(false);
  const [personaEnabled, setPersonaEnabled] = useState(false);
  const [personaContent, setPersonaContent] = useState('');
  const [personaLoaded, setPersonaLoaded] = useState(false);
  const [personaSaving, setPersonaSaving] = useState(false);
  const [personaMsg, setPersonaMsg] = useState('');
  const [personaMsgType, setPersonaMsgType] = useState<'ok' | 'err'>('ok');

  const isZh = lang === 'zh';

  useEffect(() => {
    Promise.all([
      api.getMe().then(d => setUser(d.user)).catch(() => {}),
      api.getConversations().then(d => {
        setConversations(d.conversations || []);
        if (d.conversations?.length > 0) setActiveConv(d.conversations[0]);
      }).catch(() => {})
    ]).finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (activeConv) {
      setLoading(true);
      api.getMessages(activeConv.id)
        .then(d => setMessages(d.messages || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeConv]);

  // 加载人设配置
  useEffect(() => {
    if (personaOpen && !personaLoaded) {
      api.getPersonaSettings()
        .then(d => {
          setPersonaEnabled(d.enabled);
          setPersonaContent(d.content || '');
          setPersonaLoaded(true);
        })
        .catch(() => {});
    }
  }, [personaOpen, personaLoaded]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || loading) return;
    
    const userMsg = { id: `temp-${Date.now()}`, role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await api.sendMessage(activeConv.id, currentInput, model);
      setMessages(prev => [...prev, res.reply]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const savePersona = async () => {
    setPersonaSaving(true);
    setPersonaMsg('');
    try {
      await api.savePersonaSettings({ enabled: personaEnabled, content: personaContent });
      setPersonaMsgType('ok');
      setPersonaMsg(isZh ? '人设保存成功' : 'Persona saved successfully');
    } catch (err: any) {
      setPersonaMsgType('err');
      setPersonaMsg(err.message || 'Save failed');
    } finally {
      setPersonaSaving(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-apple-muted text-sm font-serif italic animate-pulse">Loading Ops Assistant...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#0B0B0B] text-[#E1E0CC] relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-noise opacity-[0.012] pointer-events-none z-50" />

      {/* 1. 移动端侧边栏遮罩层 */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* 2. 左侧会话侧邊栏：弹性滑动入场动画 */}
      <motion.aside 
        className={`fixed md:static inset-y-0 left-0 w-64 bg-[#101010] border-r border-white/5 z-40 flex flex-col justify-between transition-transform md:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 22 }}
      >
        <div>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="text-xs tracking-widest font-mono uppercase text-[#DEDBC8]/70 flex items-center gap-2">
              <Sparkles size={13} /> Ops Terminal
            </div>
            <button className="md:hidden text-white/40 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="p-3 space-y-1 overflow-y-auto">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => { setActiveConv(c); setSidebarOpen(false); }}
                className={`w-full text-left p-3 rounded-xl transition-all border font-light text-sm flex items-center gap-2.5 ${
                  activeConv?.id === c.id 
                    ? 'bg-[#212121] border-[#DEDBC8]/20 text-white' 
                    : 'bg-transparent border-transparent text-[#E1E0CC]/60 hover:bg-white/5'
                }`}
              >
                <MessageSquare size={14} className={activeConv?.id === c.id ? 'text-[#DEDBC8]' : 'opacity-40'} />
                <span className="truncate">{c.title || 'Untitled Session'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 text-[10px] font-mono text-[#E1E0CC]/40">
          Model: <span className="text-[#DEDBC8] uppercase">{model}</span>
        </div>
      </motion.aside>

      {/* 3. 右侧核心对话主区域 */}
      <main className="flex-1 flex flex-col justify-between relative z-10 bg-gradient-to-b from-transparent to-black/20">
        
        <header className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0B0B0B]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg bg-[#101010] border border-white/5 text-[#DEDBC8]" onClick={() => setSidebarOpen(true)}>
              <Menu size={16} />
            </button>
            <div>
              <h2 className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-sm">
                {activeConv?.title || 'Ops Agent'}
              </h2>
              <p className="text-[10px] font-mono text-[#E1E0CC]/40 uppercase tracking-wider mt-0.5">
                AI Diagnostic Stream
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={model} 
              onChange={(e) => { setModel(e.target.value); localStorage.setItem('chat-model', e.target.value); }}
              className="bg-[#101010] border border-white/5 rounded-lg px-2 py-1 text-xs text-[#DEDBC8] focus:outline-none focus:border-[#DEDBC8]/40"
            >
              <option value="pro">DeepSeek Pro</option>
              <option value="flash">DeepSeek Flash</option>
            </select>
            
            <button 
              onClick={() => setPersonaOpen(!personaOpen)}
              className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs ${
                personaOpen ? 'bg-[#DEDBC8] text-black border-white' : 'bg-[#101010] text-[#DEDBC8] border-white/5 hover:bg-white/5'
              }`}
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">{isZh ? '人设定制' : 'Persona'}</span>
            </button>
          </div>
        </header>

        {/* 核心内容区：采用两列弹性网格，使得人设面板开启时，聊天流可以丝滑平移让位（Layout Motion） */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* 聊天消息流气泡区域 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <motion.div 
              className="space-y-4 max-w-4xl mx-auto"
              variants={messageContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {messages.map(m => {
                const isBot = m.role === 'assistant' || m.role === 'system';
                return (
                  <motion.div
                    key={m.id}
                    variants={bubbleVariants}
                    layout="position"
                    className={`flex items-start gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    <div className={`p-2 rounded-xl border border-white/5 shrink-0 ${isBot ? 'bg-[#101010] text-[#DEDBC8]' : 'bg-[#212121] text-white'}`}>
                      {isBot ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed font-light ${
                      isBot ? 'bg-[#101010]/60 border border-white/5 text-white/90' : 'bg-[#DEDBC8]/10 border border-[#DEDBC8]/20 text-white'
                    }`}>
                      {m.content}
                    </div>
                  </motion.div>
                );
              })}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs text-[#DEDBC8]/50 font-mono italic max-w-fit bg-[#101010] border border-white/5 px-3 py-2 rounded-xl">
                  <Loader2 size={12} className="animate-spin text-[#DEDBC8]" />
                  Agent generating analytical response...
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* 右侧高级人设抽屉：高度与宽度自动撑开，带有阻尼弹性布局避让动效 */}
          <AnimatePresence>
            {personaOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, width: 320, filter: 'blur(0px)' }}
                exit={{ opacity: 0, width: 0, filter: 'blur(4px)' }}
                transition={{ type: 'spring', stiffness: 150, damping: 22 }}
                className="overflow-hidden border-l border-white/5 bg-[#101010] flex flex-col justify-between shrink-0"
              >
                <div className="p-5 space-y-4">
                  <div className="text-xs font-mono tracking-widest text-[#DEDBC8]/50 uppercase border-b border-white/5 pb-2">Custom AI Persona</div>
                  
                  {/* 开关组件：丝滑平移 */}
                  <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-xs font-light">启用系统级自定义人设</span>
                    <button 
                      onClick={() => setPersonaEnabled(!personaEnabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors relative duration-300 ${personaEnabled ? 'bg-[#DEDBC8]' : 'bg-[#212121]'}`}
                    >
                      <motion.div 
                        layout
                        className={`w-4 h-4 rounded-full bg-black ${personaEnabled ? 'ml-4' : 'ml-0'}`} 
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                      />
                    </button>
                  </div>

                  {/* 文本输入框动效高度联动 */}
                  <motion.div 
                    animate={{ opacity: personaEnabled ? 1 : 0.4, height: personaEnabled ? 'auto' : 60 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-[11px] font-mono text-[#E1E0CC]/50">人设 Prompt 核心注入语</label>
                    <textarea
                      value={personaContent}
                      onChange={(e) => setPersonaContent(e.target.value)}
                      disabled={!personaEnabled}
                      placeholder="例如：你是一个经验极其丰富的 Linux 运维专家，说话简短冷冽，优先给出原理解析..."
                      className="w-full h-48 bg-black/30 border border-white/5 rounded-xl p-3 text-xs text-white placeholder-white/10 focus:outline-none focus:border-[#DEDBC8]/40 resize-none font-light leading-relaxed"
                    />
                  </motion.div>
                </div>

                <div className="p-4 border-t border-white/5 space-y-3">
                  <AnimatePresence>
                    {personaMsg && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`text-[11px] p-2 rounded-lg flex items-center gap-1.5 ${
                          personaMsgType === 'ok' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/20 text-rose-400 border border-rose-900/30'
                        }`}
                      >
                        <AlertCircle size={12} /> {personaMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={savePersona}
                    disabled={personaSaving}
                    className="w-full py-2 rounded-xl bg-[#DEDBC8] text-black text-xs font-medium hover:bg-white transition-all flex items-center justify-center gap-1.5"
                  >
                    {personaSaving && <Loader2 size={12} className="animate-spin" />}
                    {isZh ? '保存人设资产' : 'Commit Settings'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 底部指令与对话输入框 */}
        <footer className="p-4 sm:p-6 border-t border-white/5 bg-[#0B0B0B]/40 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isZh ? '向运维助手描述报错信息或询问 Linux 命令...' : 'Ask AI Ops assistant about exceptions or configurations...'}
              className="w-full bg-[#101010] border border-white/5 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#DEDBC8]/40 transition-all font-light"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !activeConv}
              className="absolute right-2 p-2 rounded-lg bg-[#DEDBC8] text-black hover:bg-white disabled:bg-white/5 disabled:text-white/20 transition-all"
            >
              <Send size={15} />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}
