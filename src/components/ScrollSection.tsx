import { useRef } from 'react';
import { motion } from 'framer-motion';

interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function ScrollSection({ children, className = '', id }: ScrollSectionProps) {
  return (
    <motion.section
      id={id}
      className={`relative z-10 ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.section>
  );
}

export function SectionHeading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.h2
      className={`text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-4 ${className}`}
      style={{ color: 'var(--text-primary)' }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.h2>
  );
}

export function SectionSub({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.p
      className={`text-sm sm:text-base leading-relaxed max-w-xl ${className}`}
      style={{ color: 'var(--text-secondary)' }}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.p>
  );
}
