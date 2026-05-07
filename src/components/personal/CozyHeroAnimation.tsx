import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ease = [0.25, 0.1, 0.25, 1];

// Floating speed — slow and gentle
const floatTransition = (delay: number) => ({
  y: {
    repeat: Infinity,
    repeatType: 'mirror' as const,
    duration: 7 + delay * 1.2,
    ease: 'linear' as const,
    delay,
  },
});

// A small floating element (star, dot, bracket, etc.)
function Floater({ children, className, delay, x, y, size }: {
  children: React.ReactNode;
  className?: string;
  delay: number;
  x: number;
  y: number;
  size: number;
}) {
  return (
    <motion.div
      className={`absolute select-none pointer-events-none ${className || ''}`}
      style={{ width: size, height: size, left: x, top: y }}
      animate={{ y: [0, -8, 0, 4, 0], x: [0, 3, -2, 1, 0] }}
      transition={{ repeat: Infinity, duration: 6 + delay * 0.8, ease: 'linear', delay }}
    >
      {children}
    </motion.div>
  );
}

export default function CozyHeroAnimation() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const animate = reduced ? {} : undefined;

  return (
    <motion.div
      className="relative w-56 h-56 sm:w-64 sm:h-64 shrink-0 select-none"
      initial={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, delay: 0.3, ease }}
      aria-hidden="true"
    >
      {/* Background card — cozy desk surface */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#fef9f0] via-[#fffbf5] to-[#faf5ed] border border-[#e8dfd3]/60 shadow-lg shadow-[#e0d5c5]/30 overflow-hidden"
        style={{ transform: 'rotate(2deg)' }}>

        {/* Subtle grid dots on the desk */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #8b7355 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />

        {/* Warm gradient rays from top-left */}
        <div className="absolute -top-4 -left-4 w-32 h-32 rounded-full bg-amber-100/50 blur-2xl" />
        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-orange-100/40 blur-2xl" />
      </div>

      {/* ── Desktop lamp glow ── */}
      <motion.div
        className="absolute top-3 right-6 w-10 h-10 rounded-full bg-yellow-100/50 blur-xl"
        animate={animate}
        {...(!reduced && {
          animate: { opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] },
          transition: { repeat: Infinity, duration: 5, ease: 'linear' },
        })}
      />

      {/* ── Laptop / terminal window ── */}
      <motion.div
        className="absolute left-8 top-20 w-28 h-20 rounded-xl bg-white/80 backdrop-blur-sm border border-[#e8dfd3]/70 shadow-sm overflow-hidden"
        style={{ transform: 'rotate(-2deg)' }}
        whileHover={reduced ? {} : { y: -3, scale: 1.02 }}
        transition={{ duration: 0.35, ease }}
      >
        {/* Window title bar */}
        <div className="h-4 bg-[#f5f0ea] border-b border-[#e8dfd3]/50 flex items-center gap-1 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-300/70" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-300/70" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-300/70" />
        </div>
        {/* Code-like lines */}
        <div className="p-2 space-y-1">
          <div className="h-1 rounded-full bg-[#e8dfd3]/70 w-4/5" />
          <div className="h-1 rounded-full bg-[#e0d5c5]/50 w-3/5" />
          <div className="h-1 rounded-full bg-amber-200/60 w-2/5" />
          <div className="h-1 rounded-full bg-[#e8dfd3]/50 w-1/2" />
        </div>
        {/* Blinking cursor */}
        <motion.div
          className="absolute bottom-2 right-4 w-1 h-3 bg-amber-400/80 rounded-sm"
          animate={animate}
          {...(!reduced && {
            animate: { opacity: [1, 0, 1] },
            transition: { repeat: Infinity, duration: 1.2, ease: 'linear' },
          })}
        />
      </motion.div>

      {/* ── Cute CSS dog mascot ── */}
      <motion.div
        className="absolute right-6 bottom-16"
        whileHover={reduced ? {} : { y: -4, scale: 1.03 }}
        transition={{ duration: 0.35, ease }}
      >
        <div className="relative w-12 h-12">
          {/* Body */}
          <div className="absolute bottom-0 left-1 w-10 h-8 rounded-2xl bg-[#e8d5c0] border border-[#d4bfa8]/60" />
          {/* Head */}
          <div className="absolute top-0 left-2 w-8 h-8 rounded-2xl bg-[#f0e0d0] border border-[#d4bfa8]/60">
            {/* Eyes */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#5a4a3a]" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#5a4a3a]" />
            {/* Nose */}
            <div className="absolute top-3.5 left-3 w-1.5 h-1 rounded-full bg-[#8b6f5a]" />
            {/* Mouth — tiny smile */}
            <div className="absolute top-5 left-2.5 w-3 h-1 border-b border-[#a08070] rounded-b-full" />
          </div>
          {/* Ear left */}
          <div className="absolute top-1 left-1 w-2.5 h-3.5 rounded-t-full bg-[#d4b898] border border-[#d4bfa8]/60 origin-bottom"
            style={{ transform: 'rotate(-15deg)' }} />
          {/* Ear right */}
          <div className="absolute top-1 right-1 w-2.5 h-3.5 rounded-t-full bg-[#d4b898] border border-[#d4bfa8]/60 origin-bottom"
            style={{ transform: 'rotate(15deg)' }} />
          {/* Tail */}
          <motion.div
            className="absolute -right-2 bottom-2 w-3 h-2 border-l-2 border-t-2 border-[#d4b898] rounded-tl-full"
            style={{ transform: 'rotate(45deg)' }}
            animate={animate}
            {...(!reduced && {
              animate: { rotate: [35, 55, 35] },
              transition: { repeat: Infinity, duration: 2.5, ease: 'linear' },
            })}
          />
        </div>
      </motion.div>

      {/* ── Coffee mug ── */}
      <motion.div
        className="absolute left-6 bottom-12"
        whileHover={reduced ? {} : { y: -3 }}
        transition={{ duration: 0.3, ease }}
      >
        <div className="relative w-8 h-9">
          <div className="absolute bottom-0 w-8 h-8 rounded-lg bg-[#f5ece0] border border-[#e0d5c5]/60 shadow-sm">
            {/* steam */}
            <motion.div
              className="absolute -top-2 left-2 w-4 h-3"
              animate={animate}
              {...(!reduced && {
                animate: { y: [-1, -4, -1], opacity: [0.6, 0.2, 0.6] },
                transition: { repeat: Infinity, duration: 2.8, ease: 'linear' },
              })}
            >
              <div className="w-1 h-1 rounded-full bg-[#d4c8b8]/50 mx-auto" />
              <div className="w-1.5 h-1 rounded-full bg-[#d4c8b8]/40 mx-auto mt-0.5" />
            </motion.div>
          </div>
          {/* Handle */}
          <div className="absolute right-0 top-1 w-2 h-4 border-2 border-[#e0d5c5]/60 rounded-r-full" />
        </div>
      </motion.div>

      {/* ── Floating elements ── */}
      {!reduced && (
        <>
          {/* Star */}
          <motion.div
            className="absolute text-amber-300/60 text-xs"
            style={{ left: 10, top: 6 }}
            animate={{ y: [0, -6, 0, 3, 0], opacity: [0.6, 0.9, 0.6, 0.8, 0.6] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: 'linear' }}
          >
            ✦
          </motion.div>

          {/* Tiny star */}
          <motion.div
            className="absolute text-amber-200/50 text-[8px]"
            style={{ left: 90, top: 4 }}
            animate={{ y: [0, -5, 1, -2, 0], opacity: [0.4, 0.8, 0.5, 0.7, 0.4] }}
            transition={{ repeat: Infinity, duration: 6.2, ease: 'linear', delay: 1.5 }}
          >
            ✧
          </motion.div>

          {/* Code bracket */}
          <motion.div
            className="absolute text-[#c8b898]/40 text-lg font-mono"
            style={{ left: 4, top: 50 }}
            animate={{ y: [0, -5, 2, -3, 0], opacity: [0.4, 0.7, 0.5, 0.6, 0.4] }}
            transition={{ repeat: Infinity, duration: 7, ease: 'linear', delay: 0.8 }}
          >
            {'</>'}
          </motion.div>

          {/* Small cloud */}
          <motion.div
            className="absolute"
            style={{ right: 8, top: 18 }}
            animate={{ x: [0, 4, -2, 1, 0], opacity: [0.5, 0.75, 0.5, 0.65, 0.5] }}
            transition={{ repeat: Infinity, duration: 7.5, ease: 'linear', delay: 2 }}
          >
            <div className="flex items-end gap-0.5">
              <div className="w-3 h-2 rounded-full bg-[#e8dfd3]/60" />
              <div className="w-4 h-3 rounded-full bg-[#e8dfd3]/60" />
              <div className="w-2.5 h-1.5 rounded-full bg-[#e8dfd3]/50" />
            </div>
          </motion.div>

          {/* Chat bubble */}
          <motion.div
            className="absolute"
            style={{ right: 50, top: 8 }}
            animate={{ y: [0, -4, 1, -2, 0], opacity: [0.5, 0.8, 0.5, 0.7, 0.5] }}
            transition={{ repeat: Infinity, duration: 5.8, ease: 'linear', delay: 1.2 }}
          >
            <div className="relative px-2 py-1 rounded-full bg-[#e8dfd3]/40 text-[9px] text-[#a09080]/60 font-mono">
              AI
              <div className="absolute -bottom-0.5 left-2 w-1.5 h-1.5 bg-[#e8dfd3]/40 rotate-45" />
            </div>
          </motion.div>

          {/* Small plant leaf */}
          <motion.div
            className="absolute text-green-300/40 text-xs"
            style={{ right: 60, bottom: 10 }}
            animate={{ rotate: [0, 5, -3, 0], y: [0, -2, 0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 6.5, ease: 'linear', delay: 2.5 }}
          >
            🌿
          </motion.div>

          {/* Network node dots */}
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-blue-200/40"
            style={{ left: 55, top: 14 }}
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'linear', delay: 0.5 }}
          />
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-teal-200/40"
            style={{ left: 64, top: 20 }}
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear', delay: 1.8 }}
          />
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-blue-200/30"
            style={{ left: 58, top: 26 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'linear', delay: 3 }}
          />
        </>
      )}

      {/* ── Desktop overall hover lift ── */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        whileHover={reduced ? {} : { y: -4 }}
        transition={{ duration: 0.38, ease }}
      />
    </motion.div>
  );
}
