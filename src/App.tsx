import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import HomePage from './pages/HomePage';
import MePage from './pages/MePage';
import ProjectsPage from './pages/ProjectsPage';
import ChatPage from './pages/ChatPage';
import AskMePage from './pages/AskMePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import CloudOpsPage from './pages/CloudOpsPage';
import DashboardPage from './pages/DashboardPage';
import ServerDetailPage from './pages/ServerDetailPage';
import { pageTransition } from './lib/motion';
import ParticleTransitionProvider from './effects/ParticleTransitionProvider';
import { TransitionProvider } from './effects/TransitionContext';

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/me" element={<PageWrapper><MePage /></PageWrapper>} />
        <Route path="/projects" element={<PageWrapper><ProjectsPage /></PageWrapper>} />
        <Route path="/chat" element={<PageWrapper><ChatPage /></PageWrapper>} />
        <Route path="/ask-me" element={<PageWrapper><AskMePage /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
        <Route path="/admin-login" element={<PageWrapper><AdminLoginPage /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminPage /></PageWrapper>} />
        <Route path="/cloudops" element={<PageWrapper><CloudOpsPage /></PageWrapper>} />
        <Route path="/servers/:id" element={<PageWrapper><ServerDetailPage /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <TransitionProvider>
      <ParticleTransitionProvider>
        <AppRoutes />
      </ParticleTransitionProvider>
    </TransitionProvider>
  );
}
