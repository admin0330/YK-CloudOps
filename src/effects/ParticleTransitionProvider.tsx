import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { runParticleTransition, type TransitionType } from '../effects/ParticleTransitionManager';

interface Props {
  children: ReactNode;
  navigate: (path: string) => void;
}

/**
 * ParticleTransitionProvider scans the DOM for elements marked with
 * `data-particle-transition` and binds click handlers to trigger
 * the particle burst transition automatically. It also intercepts
 * internal navigation to add transition effects.
 */
export default function ParticleTransitionProvider({ children }: Props) {
  const location = useLocation();
  const observerRef = useRef<MutationObserver | null>(null);
  const handlersRef = useRef<Map<Element, () => void>>(new Map());

  // Scan for [data-particle-transition] elements
  useEffect(() => {
    const bindElement = (el: Element) => {
      if (handlersRef.current.has(el)) return;
      const target = el.getAttribute('data-particle-transition') || '';
      const type = (el.getAttribute('data-transition-type') || 'navigation') as TransitionType;

      let handler: () => void;

      if (target && target !== 'true') {
        // Navigate to target path
        const to = target;
        handler = (e: MouseEvent) => {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          const rect = el.getBoundingClientRect();
          const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          runParticleTransition({
            origin,
            type,
            action: async () => {
              // Use global navigate if available
              const nav = () => {
                window.history.pushState({}, '', to);
                window.dispatchEvent(new PopStateEvent('popstate'));
              };
              nav();
            },
          });
        };
      } else {
        // Just run the transition with a custom action
        handler = () => {
          const rect = el.getBoundingClientRect();
          const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          runParticleTransition({
            origin,
            type: 'custom',
            action: async () => {},
          });
        };
      }

      el.addEventListener('click', handler as any);
      handlersRef.current.set(el, handler);
    };

    const scan = () => {
      document.querySelectorAll('[data-particle-transition]').forEach(bindElement);
    };

    // Initial scan
    scan();

    // Watch for dynamically added elements
    observerRef.current = new MutationObserver(() => scan());
    observerRef.current.observe(document.body, { childList: true, subtree: true });

    return () => {
      observerRef.current?.disconnect();
      handlersRef.current.forEach((handler, el) => {
        el.removeEventListener('click', handler as any);
      });
      handlersRef.current.clear();
    };
  }, [location.pathname]); // re-scan on navigation

  return <>{children}</>;
}
