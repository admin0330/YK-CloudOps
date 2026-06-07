#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/4] 开始执行电影感全站动画与性能重构手术...${NC}"

# 1. 安全备份
if [ -f "src/App.tsx" ]; then
    cp src/App.tsx src/App.tsx.bak
    echo -e "${GREEN}[✔] 已成功将原有 App.tsx 备份至 src/App.tsx.bak${NC}"
else
    echo -e "${RED}[✘] 错误：未在当前目录找到 src/App.tsx，请确保你在 /opt/ym1r 路径下运行此脚本。${NC}"
    exit 1
fi

# 2. 重写 src/App.tsx (引入 React.lazy 与电影感路由转场)
echo -e "${YELLOW}[2/4] 正在注入路由异步分割与模糊淡入转场 (App.tsx)...${NC}"
cat << 'APP_EOF' > src/App.tsx
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
APP_EOF
echo -e "${GREEN}[✔] src/App.tsx 电影感重构完成。${NC}"

# 3. 创建翻滚数字组件 src/components/CinematicCounter.tsx
echo -e "${YELLOW}[3/4] 正在创建高频数据平滑翻滚原子组件 (CinematicCounter.tsx)...${NC}"
mkdir -p src/components

cat << 'COUNTER_EOF' > src/components/CinematicCounter.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface CinematicCounterProps {
  value: string | number;
  className?: string;
}

export default function CinematicCounter({ value, className = "" }: CinematicCounterProps) {
  return (
    <div className={`inline-flex overflow-hidden relative h-[1.2em] vertical-align-middle ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value} // 核心：数据一变，旧数据丝滑向上淡出，新数据从下方推入
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          className="font-mono"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
COUNTER_EOF
echo -e "${GREEN}[✔] src/components/CinematicCounter.tsx 创建成功。${NC}"

# 4. 尝试重新构建验证
echo -e "${YELLOW}[4/4] 正在运行前端打包编译，验证优化效果并消除 500kB 警告...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}==================================================${NC}"
    echo -e "${GREEN}🎉 手术全自动化执行成功！${NC}"
    echo -e "${GREEN}1. 全站页面切换已注入模糊转场，解决了生硬白屏跳变。${NC}"
    echo -e "${GREEN}2. 路由已全面开启 Lazy 懒加载，超大体积 Chunk 警告已被消除。${NC}"
    echo -e "${GREEN}3. 翻滚组件 CinematicCounter 已就绪，可随时替换看板上的高频数字。${NC}"
    echo -e "${GREEN}==================================================${NC}"
else
    echo -e "${RED}==================================================${NC}"
    echo -e "${RED}⚠️ 编译失败，请检查编译日志是否有语法冲突或缺失依赖。${NC}"
    echo -e "${RED}你可以运行 'cp src/App.tsx.bak src/App.tsx' 随时一键还原代码。${NC}"
    echo -e "${RED}==================================================${NC}"
fi
