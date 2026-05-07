import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';
import { useReducedMotion } from '../../lib/motion';

interface HoldToDeleteButtonProps {
  label?: string;
  confirmLabel?: string;
  completedLabel?: string;
  duration?: number;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'danger' | 'warning';
  className?: string;
  ariaLabel?: string;
}

const sizeMap = {
  sm:  { height: 'h-8 sm:h-8', minH: 'min-h-[32px] sm:min-h-[32px]', px: 'px-2 sm:px-2.5', text: 'text-xs', icon: 13, rounding: 'rounded-lg' },
  md:  { height: 'h-9 sm:h-9', minH: 'min-h-[36px] sm:min-h-[36px]', px: 'px-3 sm:px-3.5', text: 'text-sm', icon: 14, rounding: 'rounded-lg' },
  lg:  { height: 'h-11',      minH: 'min-h-[44px]',                     px: 'px-5',               text: 'text-base', icon: 16, rounding: 'rounded-xl' },
};

export default function HoldToDeleteButton({
  label = 'Delete',
  confirmLabel,
  completedLabel = 'Deleted',
  duration = 1000,
  onConfirm,
  disabled = false,
  size = 'md',
  variant = 'danger',
  className = '',
  ariaLabel,
}: HoldToDeleteButtonProps) {
  const reducedMotion = useReducedMotion();
  const s = sizeMap[size];

  const [state, setState] = useState<'idle' | 'holding' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);

  const holdingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const firedRef = useRef(false);
  const controls = useAnimation();
  const btnRef = useRef<HTMLButtonElement>(null);

  const isDanger = variant === 'danger';

  // Icon-only mode detection
  const hasLabel = !!(label || confirmLabel || completedLabel);
  const showLabel = hasLabel || state !== 'idle';

  const clearHold = useCallback(() => {
    holdingRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetToIdle = useCallback(() => {
    clearHold();
    setProgress(0);
    setState('idle');
    firedRef.current = false;
    controls.start({ scale: 1 });
  }, [clearHold, controls]);

  const startHold = useCallback(() => {
    if (disabled || state === 'completed') return;
    holdingRef.current = true;
    firedRef.current = false;
    startTimeRef.current = Date.now();
    setState('holding');
    setProgress(0);
    controls.start({ scale: 0.97 });

    timerRef.current = setInterval(() => {
      if (!holdingRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p >= 1 && !firedRef.current) {
        firedRef.current = true;
        clearHold();
        setState('completed');
        setProgress(1);

        Promise.resolve(onConfirm()).finally(() => {
          setTimeout(() => {
            resetToIdle();
          }, 1200);
        });
      }
    }, 16);
  }, [disabled, state, duration, onConfirm, clearHold, controls, resetToIdle]);

  const cancelHold = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    clearHold();
    setState('idle');
    setProgress(0);
    controls.start({ scale: 1 });
  }, [clearHold, controls]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearHold();
  }, [clearHold]);

  // Touch cancel listener (e.g. system gesture, notification)
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const onTouchCancel = () => cancelHold();
    el.addEventListener('touchcancel', onTouchCancel);
    return () => el.removeEventListener('touchcancel', onTouchCancel);
  }, [cancelHold]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    // Release pointer capture so parent scroll doesn't get blocked
    if (btnRef.current) {
      try { btnRef.current.setPointerCapture(e.pointerId); } catch { /* */ }
    }
    startHold();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    cancelHold();
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (holdingRef.current) {
      cancelHold();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!holdingRef.current && state !== 'completed') {
        startHold();
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cancelHold();
    }
  };

  const isHolding = state === 'holding' || (progress > 0 && state !== 'completed');
  const isCompleted = state === 'completed';

  const displayLabel = isCompleted
    ? completedLabel
    : isHolding
      ? (confirmLabel || `Hold to ${label.toLowerCase()}`)
      : label;

  return (
    <motion.button
      ref={btnRef}
      animate={controls}
      disabled={disabled && !isCompleted}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={cancelHold}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      aria-label={ariaLabel || displayLabel}
      role="button"
      className={`relative overflow-hidden ${s.height} ${s.px} ${s.text} ${s.rounding} font-medium inline-flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 cursor-pointer ${className}`}
      style={{
        background: isCompleted
          ? 'rgba(34,197,94,0.12)'
          : isDanger
            ? 'rgba(239,68,68,0.08)'
            : 'rgba(234,179,8,0.08)',
        border: isCompleted
          ? '0.5px solid rgba(34,197,94,0.25)'
          : '0.5px solid rgba(255,255,255,0.1)',
        color: isCompleted
          ? 'rgb(34,197,94)'
          : isDanger
            ? 'rgb(248,113,113)'
            : 'rgb(250,204,21)',
        transition: 'background 0.35s ease, border-color 0.35s ease, color 0.35s ease',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: disabled ? 0.4 : 1,
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        minWidth: !hasLabel ? '44px' : undefined,
        minHeight: '44px',
      }}
    >
      {/* Progress fill */}
      {isHolding && (
        <motion.div
          className="absolute inset-0 origin-left rounded-inherit"
          style={{
            background: isDanger
              ? 'rgba(239,68,68,0.18)'
              : 'rgba(234,179,8,0.18)',
            borderRadius: 'inherit',
            scaleX: progress,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={reducedMotion ? { duration: 0.01 } : { duration: 0.05 }}
        />
      )}

      {/* Icon */}
      <span className="relative z-[1] flex items-center justify-center">
        {isCompleted ? (
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Check size={s.icon} />
          </motion.span>
        ) : (
          <motion.span
            animate={isHolding ? { rotate: [0, -3, 3, -3, 0] } : {}}
            transition={{ duration: 0.4, repeat: isHolding ? Infinity : 0, repeatDelay: 0.3 }}
          >
            <Trash2 size={s.icon} />
          </motion.span>
        )}
      </span>

      {/* Label — hidden when icon-only and idle, shown during hold */}
      {showLabel && (
        <span className="relative z-[1] whitespace-nowrap">{displayLabel}</span>
      )}
    </motion.button>
  );
}
