import { useMemo, useCallback, useEffect, useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { useReducedMotion } from '../../lib/motion';

export interface CapsuleOption {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tone?: string;
  href?: string;
  onClick?: () => void;
}

interface LiquidCapsuleSwitchProps {
  options: CapsuleOption[];
  value: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  ariaLabel?: string;
}

const sizeMap = {
  sm:  { px: 'px-0.5', py: 'py-0.5', itemPx: 'px-2.5', itemPy: 'py-1',   text: 'text-xs',  icon: 12, gap: 'gap-0.5' },
  md:  { px: 'px-1',   py: 'py-1',   itemPx: 'px-3.5', itemPy: 'py-1.5', text: 'text-sm',  icon: 14, gap: 'gap-1' },
  lg:  { px: 'px-1.5', py: 'py-1.5', itemPx: 'px-5',   itemPy: 'py-2',   text: 'text-base', icon: 16, gap: 'gap-1' },
};

// Bumped for mobile touch targets
const mobileSizeMap = {
  sm:  { px: 'px-0.5', py: 'py-0.5', itemPx: 'px-3',   itemPy: 'py-1.5', text: 'text-xs',  icon: 13, gap: 'gap-0.5' },
  md:  { px: 'px-1',   py: 'py-1',   itemPx: 'px-4',   itemPy: 'py-2',   text: 'text-sm',  icon: 15, gap: 'gap-1' },
  lg:  { px: 'px-1.5', py: 'py-1.5', itemPx: 'px-5',   itemPy: 'py-2.5', text: 'text-base', icon: 16, gap: 'gap-1' },
};

function useIsMobile() {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mobile;
}

export default function LiquidCapsuleSwitch({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
  ariaLabel,
}: LiquidCapsuleSwitchProps) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const s = isMobile ? mobileSizeMap[size] : sizeMap[size];

  const spring = useMemo(() =>
    reducedMotion
      ? { type: 'spring' as const, stiffness: 420, damping: 40, mass: 0.8, duration: 0.1 }
      : { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.8 },
    [reducedMotion],
  );

  const handleKey = useCallback((option: CapsuleOption, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (option.href) {
        window.location.href = option.href;
      } else if (option.onClick) {
        option.onClick();
      } else {
        onChange(option.id);
      }
    }
  }, [onChange]);

  const manyOptions = options.length >= 3;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel || 'Options'}
      className={`inline-flex ${fullWidth ? 'w-full' : ''} ${s.px} ${s.py} ${s.gap} rounded-full select-none ${manyOptions ? 'max-w-full overflow-x-auto' : ''} ${className}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'relative',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      <LayoutGroup>
        {options.map((option) => {
          const isActive = value === option.id;
          const Icon = option.icon;
          const Tag = option.href ? 'a' : 'button';

          const inner = (
            <motion.div
              className={`relative flex items-center justify-center ${s.itemPx} ${s.itemPy} ${s.text} rounded-full font-medium whitespace-nowrap ${fullWidth ? 'flex-1' : ''}`}
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                zIndex: 1,
                transition: 'color 0.35s ease',
                minHeight: isMobile ? '44px' : undefined,
              }}
              whileHover={!reducedMotion && !isActive ? { color: 'rgba(255,255,255,0.8)' } : {}}
            >
              {Icon && <Icon size={s.icon} className={`shrink-0 ${option.label ? (size === 'sm' && !isMobile ? 'mr-1' : 'mr-1.5') : ''}`} />}
              <span className={manyOptions ? 'truncate max-w-[4em] sm:max-w-none' : ''}>{option.label}</span>
            </motion.div>
          );

          const sharedProps: any = {
            key: option.id,
            role: 'radio',
            'aria-checked': isActive,
            'aria-pressed': isActive,
            tabIndex: isActive ? 0 : -1,
            onKeyDown: (e: React.KeyboardEvent) => handleKey(option, e),
            className: `relative flex items-center justify-center rounded-full focus-visible:outline-none ${fullWidth ? 'flex-1' : ''}`,
            style: {
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              position: 'relative',
              flex: fullWidth ? 1 : undefined,
              WebkitTapHighlightColor: 'transparent',
            },
          };

          if (Tag === 'a') {
            sharedProps.href = option.href;
            sharedProps.as = 'a';
          } else {
            sharedProps.onClick = option.onClick || (() => onChange(option.id));
          }

          return (
            <motion.div
              key={option.id}
              className={`relative shrink-0 ${fullWidth ? 'flex-1' : ''}`}
              style={{ position: 'relative' }}
            >
              {isActive && (
                <motion.div
                  layoutId="capsule-active-pill"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: option.tone
                      ? `${option.tone}20`
                      : 'rgba(255,255,255,0.1)',
                    border: `0.5px solid ${option.tone ? `${option.tone}40` : 'rgba(255,255,255,0.18)'}`,
                    boxShadow: option.tone
                      ? `0 0 12px ${option.tone}15`
                      : '0 0 8px rgba(255,255,255,0.04)',
                  }}
                  transition={spring}
                />
              )}
              <Tag {...sharedProps}>
                {inner}
              </Tag>
            </motion.div>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
