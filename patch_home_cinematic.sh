#!/bin/bash
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}开始重构主页 HomePage 电影感卡片与多维过渡动效...${NC}"

# 1. 备份原主页
if [ -f "src/pages/HomePage.tsx" ]; then
    cp src/pages/HomePage.tsx src/pages/HomePage.tsx.bak
fi

# 2. 完全重写 HomePage.tsx，注入全套大范围 Framer-Motion 联动动画
cat << 'HOME_EOF' > src/pages/HomePage.tsx
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Server, MessageSquare, ShieldAlert } from 'lucide-react';

// 动画变体：用于卡片流式交错入场
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { y: 30, opacity: 0, filter: 'blur(4px)' },
  visible: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 140, damping: 22 }
  }
};

export default function HomePage() {
  const navigate = useNavigate();

  // 模拟进入受保护页面的安全网关调用
  const handleEnter = async (targetPath: string) => {
    try {
      await fetch('/api/enter', { method: 'POST' });
      navigate(targetPath);
    } catch (err) {
      navigate(targetPath);
    }
  };

  const features = [
    {
      title: "CloudOps Command Center",
      desc: "Real-time server operation dashboard, Linux remote execution, and system infrastructure analytics.",
      icon: Server,
      path: "/cloudops"
    },
    {
      title: "AI Ops Assistant",
      desc: "DeepSeek-powered conversation engine for log diagnostics, error explaining, and automated scripting.",
      icon: MessageSquare,
      path: "/chat"
    },
    {
      title: "YM1R DeskPet Controller",
      desc: "Hardware desktop companion. Web Serial synchronization, active preview, and cinematic cloud OTA updates.",
      icon: Zap,
      path: "/deskpet"
    },
    {
      title: "Portal & Infrastructure",
      desc: "Personal portfolio showcase, JavaScript study records, storage file disk, and advanced administration.",
      icon: ShieldAlert,
      path: "/admin"
    }
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0B0B0B] text-[#E1E0CC] relative overflow-hidden font-sans selection:bg-[#DEDBC8]/30 selection:text-[#FFF]">
      {/* 噪点全景背景与电影感微弱呼吸渐变 */}
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none z-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0B0B]/40 to-[#0B0B0B] pointer-events-none z-10" />

      {/* Hero 区域 */}
      <header className="max-w-6xl mx-auto px-6 pt-24 pb-16 relative z-20 flex flex-col items-start">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs tracking-[0.3em] uppercase text-[#DEDBC8] mb-4 font-mono flex items-center gap-2"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#DEDBC8] animate-pulse" />
          Cinematic Control Operations
        </motion.div>

        <motion.h1
          initial={{ y: 40, opacity: 0, filter: 'blur(5px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="text-5xl md:text-7xl font-light tracking-tight text-white mb-6"
        >
          Ym1r's <span className="font-serif italic text-[#DEDBC8]">cloudOps</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-2xl text-base text-[#E1E0CC]/70 leading-relaxed mb-8"
        >
          收束分散的分支体系。在此挂载远程服务器阵列集群、AI 智能日志报错诊断、
          跨平台分布式文件网络以及全新的桌面硬件物理状态伴侣。
        </motion.p>
      </header>

      {/* 核心 Features 4 卡片多维阵列布局 */}
      <main className="max-w-6xl mx-auto px-6 pb-24 relative z-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ 
                  y: -4, 
                  borderColor: 'rgba(222, 219, 200, 0.25)',
                  boxShadow: '0 12px 30px -10px rgba(0,0,0,0.7), 0 0 20px 0px rgba(217, 119, 87, 0.03)'
                }}
                onClick={() => handleEnter(item.path)}
                className="bg-[#101010] border border-white/5 rounded-2xl p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between group h-64"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-[#212121] rounded-xl text-[#DEDBC8] group-hover:text-white group-hover:bg-[#DEDBC8]/10 transition-colors duration-300">
                      <IconComponent size={22} />
                    </div>
                    <motion.div 
                      className="text-[#DEDBC8]/40 group-hover:text-[#DEDBC8] transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      <ArrowRight size={18} />
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2 tracking-wide group-hover:text-[#DEDBC8] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#E1E0CC]/60 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
                
                <div className="w-full h-[1px] bg-white/5 group-hover:bg-[#DEDBC8]/20 transition-colors duration-500 mt-4" />
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
HOME_EOF

echo -e "${YELLOW}正在重新编译项目打包以使重构生效...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 主页全套电影感卡片阵列动画重构成功！${NC}"
else
    echo -e "${RED}编译失败，正在回滚主页文件...${NC}"
    cp src/pages/HomePage.tsx.bak src/pages/HomePage.tsx
fi
