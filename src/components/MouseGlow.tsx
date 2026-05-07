import { useEffect, useRef } from 'react';

// Smooth lerp-based mouse glow using CSS variables
// Desktop only — disabled on mobile for performance

export default function MouseGlow() {
  const pos = useRef({ x: 50, y: 50 });
  const target = useRef({ x: 50, y: 50 });

  useEffect(() => {
    if (window.innerWidth < 768) {
      document.documentElement.style.setProperty('--mouse-x', '50%');
      document.documentElement.style.setProperty('--mouse-y', '50%');
      return;
    }

    let raf: number;

    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 100;
      target.current.y = (e.clientY / window.innerHeight) * 100;
    };

    const animate = () => {
      // Lerp toward target
      const f = 0.06;
      pos.current.x += (target.current.x - pos.current.x) * f;
      pos.current.y += (target.current.y - pos.current.y) * f;

      document.documentElement.style.setProperty('--mouse-x', pos.current.x.toFixed(2) + '%');
      document.documentElement.style.setProperty('--mouse-y', pos.current.y.toFixed(2) + '%');

      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Mouse glow element that follows --mouse-x / --mouse-y
  return (
    <div
      className="fixed pointer-events-none z-0"
      aria-hidden="true"
      style={{
        inset: 0,
        background: 'radial-gradient(ellipse 600px 400px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(138,180,255,0.07) 0%, rgba(183,156,255,0.04) 30%, transparent 60%)',
        transition: 'none',
      }}
    />
  );
}
