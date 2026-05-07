import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

/**
 * Piecewise-linear easing:
 *   First 50% of time  → covers 4/6 (66.67%) of width at 2x speed (linear)
 *   Last 50% of time   → covers 2/6 (33.33%) of width at 1x speed (linear)
 * Both segments take equal wall-clock time; first segment is twice as fast.
 */
function ease(t: number): number {
  if (t <= 0.5) {
    // t ∈ [0, 0.5]  →  progress ∈ [0, 4/6]
    return (t / 0.5) * (4 / 6);
  }
  // t ∈ (0.5, 1]  →  progress ∈ (4/6, 1]
  return 4 / 6 + ((t - 0.5) / 0.5) * (2 / 6);
}

export default function SilencioLoader({ onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());
  const DURATION = 1500; // ms

  useEffect(() => {
    let raf: number;

    function tick() {
      const elapsed = Date.now() - startRef.current;
      const raw = Math.min(elapsed / DURATION, 1);
      const eased = ease(raw);
      const pct = Math.round(Math.min(eased, 1) * 100);

      setProgress(pct);

      if (raw >= 1) {
        setProgress(100);
        setTimeout(() => {
          setDone(true);
          setTimeout(onComplete, 400);
        }, 150);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: '#050507' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="relative" style={{ width: 280, height: 80 }}>
            {/* Outline text (always visible) */}
            <svg
              width="280"
              height="80"
              viewBox="0 0 280 80"
              className="absolute inset-0"
            >
              <text
                x="140"
                y="56"
                textAnchor="middle"
                fontFamily='"SF Pro Display", "SF Pro Text", -apple-system, "Helvetica Neue", sans-serif'
                fontWeight="700"
                fontSize="52"
                letterSpacing="6"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              >
                ym1r
              </text>
            </svg>

            {/* Filled text (clipped by progress) */}
            <svg
              width="280"
              height="80"
              viewBox="0 0 280 80"
              className="absolute inset-0"
            >
              <defs>
                <clipPath id="fillClip">
                  <rect x="0" y="0" width={`${progress}%`} height="80" />
                </clipPath>
              </defs>
              <text
                x="140"
                y="56"
                textAnchor="middle"
                fontFamily='"SF Pro Display", "SF Pro Text", -apple-system, "Helvetica Neue", sans-serif'
                fontWeight="700"
                fontSize="52"
                letterSpacing="6"
                fill="white"
                clipPath="url(#fillClip)"
              >
                ym1r
              </text>
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
