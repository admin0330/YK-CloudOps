import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Cpu, HardDrive, MemoryStick, Clock, ArrowRight, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import CinematicCounter from '../components/CinematicCounter';

// Stagger 容器变体：用于大区块柔和依次推入
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

const blockVariants = {
  hidden: { y: 20, opacity: 0, filter: 'blur(4px)' },
  visible: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 120, damping: 20 }
  }
};

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [sysStatus, setSysStatus] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 并行获取，并在最后统一触发加载完毕状态，防止多次重绘卡顿
    Promise.all([
      api.getMe().then(d => setUser(d.user)).catch(() => {}),
      api.getServers().then(d => setServers(d.servers || [])).catch(() => {}),
      api.getSystemStatus().then(d => setSysStatus(d)).catch(() => {})
    ]).finally(() => {
      setLoaded(true);
    });

    // 预留高频轮询定时器（200ms），如果后续开启高频刷新，可配合 CinematicCounter 丝滑翻滚
    const timer = setInterval(() => {
      api.getSystemStatus().then(d => setSysStatus(d)).catch(() => {});
    }, 2000); // 默认两秒，可随时根据 README 规范调大至 200ms
    
    return () => clearInterval(timer);
  }, []);

  const isAdmin = user?.role === 'admin';

  // 电影感低干扰骨架屏入场
  if (!loaded) {
    return (
      <div className="h-screen bg-[#0B0B0B] flex flex-col items-center justify-center z-50">
        <div className="text-[#DEDBC8] font-serif italic text-sm tracking-widest animate-pulse">
          {t('loading')}...
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-[#0B0B0B] text-[#E1E0CC] selection:bg-[#DEDBC8]/20 selection:text-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 噪点覆盖层，强化老胶片电影颗粒感 */}
      <div className="absolute inset-0 bg-noise opacity-[0.012] pointer-events-none z-40" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 relative z-10">
        
        {/* Header 区域：高级冷冽极简 */}
        <motion.div 
          className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-6"
          variants={blockVariants}
        >
          <div>
            <h1 className="text-2xl font-light tracking-wide text-white">
              {t('cloudOps')} <span className="font-serif italic text-[#DEDBC8]">system</span>
            </h1>
            <p className="text-xs tracking-wider text-[#E1E0CC]/50 uppercase font-mono mt-1">
              {lang === 'zh' ? '云端基础设施管理大盘' : 'Infrastructure Dashboard'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="px-3 py-1.5 rounded-lg bg-[#212121] text-xs text-[#DEDBC8] hover:bg-[#DEDBC8]/10 hover:text-white transition-all border border-white/5 no-underline">
                {t('adminPanel')}
              </Link>
            )}
            {user ? (
              <button 
                onClick={() => api.logout().then(() => navigate('/login'))} 
                className="px-3 py-1.5 rounded-lg bg-[#212121] text-xs text-[#E1E0CC]/70 hover:bg-rose-950/20 hover:text-rose-400 transition-all border border-white/5"
              >
                {t('logout')}
              </button>
            ) : (
              <Link to="/login" className="px-4 py-1.5 rounded-lg bg-[#DEDBC8] text-xs text-black font-medium hover:bg-white transition-all no-underline">
                {t('login')}
              </Link>
            )}
          </div>
        </motion.div>

        {/* 1. 全局系统状态：挂载数字翻滚过渡 */}
        {sysStatus && (
          <motion.div 
            className="bg-[#101010] border border-white/5 rounded-2xl p-5 sm:p-6"
            variants={blockVariants}
          >
            <h2 className="text-xs font-mono tracking-widest uppercase text-[#DEDBC8]/60 mb-5 flex items-center gap-2">
              <Cpu size={14} className="text-[#DEDBC8]" />
              {t('systemStatus')} · <span className="text-white font-sans font-normal lowercase">{sysStatus.hostname}</span>
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBadge 
                icon={Cpu} 
                label={t('cpu')} 
                value={sysStatus.cpu.loadAvg1?.toFixed(1) || '-'} 
                sub={`${sysStatus.cpu.cores} ${t('cores')}`} 
                isMetric={true}
              />
              <StatBadge 
                icon={MemoryStick} 
                label={t('memory')} 
                value={`${sysStatus.memory.usagePercent}%`} 
                sub={`${formatBytes(sysStatus.memory.used)} / ${formatBytes(sysStatus.memory.total)}`} 
                isMetric={false} // 百分比字符串，通过布局或整体联动
              />
              <StatBadge 
                icon={HardDrive} 
                label={t('disk')} 
                value={sysStatus.disk.usagePercent || 'N/A'} 
                sub={`${sysStatus.disk.used || '-'} / ${sysStatus.disk.total || '-'}`} 
                isMetric={false}
              />
              <StatBadge 
                icon={Clock} 
                label={t('uptime')} 
                value={sysStatus.uptimeFormatted} 
                sub="System heartbeat live"
                isMetric={true} // 包含高频时间跳变
              />
            </div>
          </motion.div>
        )}

        {/* 2. 服务器物理阵列列表 */}
        <motion.div 
          className="bg-[#101010] border border-white/5 rounded-2xl p-5 sm:p-6"
          variants={blockVariants}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-mono tracking-widest uppercase text-[#DEDBC8]/60 flex items-center gap-2">
              <Server size={14} className="text-[#DEDBC8]" />
              {t('servers')}
            </h2>
            {isAdmin && (
              <Link to="/admin" className="px-3 py-1.5 rounded-lg bg-[#DEDBC8] text-xs font-medium text-black hover:bg-white transition-all flex items-center gap-1.5 no-underline">
                <Plus size={13} /> {t('addServer')}
              </Link>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {servers.length === 0 ? (
              <motion.div 
                className="text-center py-12 text-[#E1E0CC]/40 border border-dashed border-white/5 rounded-xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Server size={28} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs font-light">{t('noServers')}</p>
                {isAdmin && (
                  <Link to="/admin" className="px-3 py-1.5 rounded-lg bg-[#212121] text-xs text-[#DEDBC8] mt-4 inline-flex border border-white/5 hover:bg-white hover:text-black transition-all no-underline">
                    {t('addServer')}
                  </Link>
                )}
              </motion.div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {servers.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 22, delay: i * 0.04 }}
                  >
                    <Link
                      to={`/servers/${s.id}`}
                      className="block bg-[#212121]/30 border border-white/5 p-5 rounded-xl hover:border-[#DEDBC8]/30 hover:bg-[#212121]/60 cursor-pointer no-underline group"
                      style={{ transition: 'all 300ms cubic-bezier(0.25, 1, 0.5, 1)', color: 'inherit' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white group-hover:text-[#DEDBC8] transition-colors duration-300 truncate">{s.name}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#212121] border border-white/5 text-[#E1E0CC]/50">
                          {s.username}@{s.ip}
                        </span>
                      </div>
                      
                      {s.authNote ? (
                        <p className="text-xs text-[#E1E0CC]/50 truncate font-light mt-1">{s.authNote}</p>
                      ) : (
                        <p className="text-xs text-white/5 truncate font-light mt-1">No note provided</p>
                      )}
                      
                      <div className="flex items-center gap-1 text-[#DEDBC8]/70 text-xs mt-4 font-medium">
                        {lang === 'zh' ? '建立安全连接' : 'Establish Link'} 
                        <motion.div
                          className="inline-block"
                          variants={{
                            hover: { x: 3 }
                          }}
                          whileHover="hover"
                        >
                          <ArrowRight size={12} className="text-[#DEDBC8] ml-0.5 group-hover:translate-x-1 transition-transform duration-300" />
                        </motion.div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

// 指标微章：动态判断是否挂载原子翻滚动画
function StatBadge({ icon: Icon, label, value, sub, isMetric }: { icon: any; label: string; value: string; sub?: string; isMetric: boolean }) {
  return (
    <div className="bg-[#212121]/40 border border-white/5 rounded-xl p-4 transition-all duration-300 hover:border-white/10">
      <div className="flex items-center gap-1.5 text-[#E1E0CC]/40 text-[10px] tracking-wider uppercase font-mono mb-2">
        <Icon size={12} className="text-[#DEDBC8]" /> {label}
      </div>
      <div className="text-xl font-light text-white tracking-tight">
        {isMetric ? (
          <CinematicCounter value={value} />
        ) : (
          <span>{value}</span>
        )}
      </div>
      {sub && <div className="text-[10px] text-[#E1E0CC]/40 font-mono mt-1.5 truncate border-t border-white/5 pt-1.5">{sub}</div>}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}
