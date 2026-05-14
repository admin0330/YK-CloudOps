import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const DURATION = 1000;
const TEXT = 'ym1r';

// cubic-bezier(0.25, 0.85, 0.35, 1) — fast start, gentle deceleration
function ease(t: number): number {
  // Bezier approximation: 1 - (1-t)^3 scaled toward the desired curve
  const c1 = 1 - Math.pow(1 - t, 2.8);
  return c1;
}

export default function HomeLoader({ onComplete }: Props) {
  const [fillProgress, setFillProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const raw = Math.min((now - start) / DURATION, 1);
      const eased = ease(raw);
      setFillProgress(eased);

      if (raw < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Fill complete — fade out 0→250ms
        setFillProgress(1);
        setTimeout(() => setDone(true), 60);
        setTimeout(() => onComplete(), 250);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          style={{ background: 'var(--page-gradient)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="relative text-center px-4">
            {/* Layer 1: Outline (bottom) */}
            <h1
              className="text-4xl sm:text-6xl lg:text-8xl font-black select-none"
              style={{
                fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '1.5px var(--text-muted)',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {TEXT}
            </h1>

            {/* Layer 2: Filled (top) — clips left-to-right */}
            <h1
              className="text-4xl sm:text-6xl lg:text-8xl font-black select-none absolute top-0 left-0 overflow-hidden"
              style={{
                fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0',
                WebkitTextFillColor: 'var(--text-main)',
                color: 'var(--text-main)',
                width: `${fillProgress * 100}%`,
                maxWidth: '100%',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
              }}
            >
              {TEXT}
            </h1>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
