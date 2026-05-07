import { useRef } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  asLink?: boolean;
  hoverIntensity?: 'subtle' | 'medium';
}

export default function GlassCard({ children, className = '', onClick, hoverIntensity = 'medium' }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const yOffset = hoverIntensity === 'medium' ? -4 : -2;

  return (
    <motion.div
      ref={ref}
      className={`glass-card-v2 ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: yOffset }}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </motion.div>
  );
}
