import { useRef, useCallback, type MouseEvent, type ReactNode } from 'react';
import { runParticleTransition, type TransitionType } from '../effects/ParticleTransitionManager';

interface Props {
  to: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  transitionType?: TransitionType;
  navigate: (path: string) => void;
  onBeforeTransition?: () => void;
}

/**
 * TransitionLink — wraps a button/element with particle burst transition.
 * On click: captures origin from the DOM element, plays the particle
 * transition, executes the navigation/action at the midpoint.
 */
export default function TransitionLink({
  to, children, className, style, transitionType = 'navigation',
  navigate, onBeforeTransition,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    onBeforeTransition?.();

    const el = ref.current;
    const origin = el
      ? { x: (el.getBoundingClientRect().left + el.offsetWidth / 2), y: (el.getBoundingClientRect().top + el.offsetHeight / 2) }
      : { x: e.clientX, y: e.clientY };

    runParticleTransition({
      origin,
      type: transitionType,
      action: () => navigate(to),
    });
  }, [to, transitionType, navigate, onBeforeTransition]);

  return (
    <button ref={ref} onClick={handleClick} className={className} style={style}>
      {children}
    </button>
  );
}
