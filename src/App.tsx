import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// 1. 核心大页面全部改为 lazy 懒加载，瞬间干掉 500kB 大 Chunk 警告
const HomePage = lazy(() => import('./pages/HomePage'));
const PortalPage = lazy(() => import('./pages/PortalPage'));
const CloudOpsPage = lazy(() => import('./pages/CloudOpsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const JSStudyPage = lazy(() => import('./pages/JSStudyPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// 2. 统一的黑色电影感页面模糊平滑转场组件
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, filter: "blur(8px)", y: 5 }}
    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
    exit={{ opacity: 0, filter: "blur(8px)", y: -5 }}
    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }} // 电影感慢速缓动
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

// 3. 优雅的奶油色低干扰加载骨架屏
const CinematicLoader = () => (
  <div className="fixed inset-0 bg-[#0B0B0B] flex flex-col items-center justify-center z-50">
    <div className="text-[#DEDBC8] font-serif italic text-lg tracking-widest animate-pulse">
      Ym1r's CloudOps System
    </div>
    <div className="mt-4 w-12 h-[1px] bg-[#DEDBC8]/20 relative overflow-hidden">
      <motion.div 
        className="absolute top-0 left-0 h-full bg-[#DEDBC8]"
        initial={{ left: "-100%" }}
        animate={{ left: "100%" }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      />
    </div>
  </div>
);

export default function App() {
  const location = useLocation();

  return (
    // mode="wait" 确保旧页面完美淡出后，新页面才进场，绝不出现瞬间错位跳变
    <AnimatePresence mode="wait">
      <Suspense fallback={<CinematicLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/portal" element={<PageTransition><PortalPage /></PageTransition>} />
          <Route path="/cloudops" element={<PageTransition><CloudOpsPage /></PageTransition>} />
          <Route path="/chat" element={<PageTransition><ChatPage /></PageTransition>} />
          <Route path="/js-study" element={<PageTransition><JSStudyPage /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminPage /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
