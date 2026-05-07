import { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  active: boolean;
  originX: number;
  originY: number;
  transitionType: 'language' | 'theme';
  onMidpoint: () => void;
  onComplete: () => void;
}

const DURATION = 800;
const DESKTOP_PARTICLES = 220;
const MOBILE_PARTICLES = 100;

export default function ParticleRevealTransition({
  active, originX, originY, transitionType, onMidpoint, onComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const cbRef = useRef({ onMidpoint, onComplete });
  cbRef.current = { onMidpoint, onComplete };

  useEffect(() => {
    if (!active) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      cbRef.current.onMidpoint();
      cbRef.current.onComplete();
      return;
    }

    // Defer to next frame so canvas is in DOM with dimensions
    const frameId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        cbRef.current.onMidpoint();
        cbRef.current.onComplete();
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cbRef.current.onMidpoint();
        cbRef.current.onComplete();
        return;
      }

      const isMobile = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Ensure canvas has valid dimensions
      if (w === 0 || h === 0) {
        cbRef.current.onMidpoint();
        cbRef.current.onComplete();
        return;
      }

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const diagonal = Math.sqrt(w * w + h * h);
      const count = isMobile ? MOBILE_PARTICLES : DESKTOP_PARTICLES;
      const isDark = theme === 'dark';

      let colors: string[];
      if (transitionType === 'theme') {
        colors = isDark
          ? ['138,180,255', '183,156,255', '159,255,209', '200,210,240']
          : ['180,160,120', '210,180,130', '160,140,110', '190,170,140'];
      } else {
        colors = isDark
          ? ['138,180,255', '183,156,255', '159,255,209', '200,200,240']
          : ['180,160,120', '140,130,110', '160,150,130', '120,110,100'];
      }

      const particles: Array<{
        angle: number; delay: number; size: number; color: string;
        alpha: number; x: number; y: number;
      }> = [];

      for (let i = 0; i < count; i++) {
        particles.push({
          angle: Math.random() * Math.PI * 2,
          alpha: 0.45 + Math.random() * 0.45,
          delay: Math.random() * 0.3,
          size: 1 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          x: 0, y: 0,
        });
      }

      const start = performance.now();
      let midCalled = false;
      let animDone = false;
      let raf: number;

      const tick = (now: number) => {
        if (animDone) return;
        const elapsed = (now - start) / 1000;
        const t = Math.min(elapsed / (DURATION / 1000), 1);

        if (!midCalled && t >= 0.35) {
          midCalled = true;
          cbRef.current.onMidpoint();
        }

        ctx.clearRect(0, 0, w, h);

        const maxR = diagonal * 0.55;
        const circleR = maxR * t;

        // Soft expanding glow ring — linear fade
        if (t < 0.9) {
          const glowAlpha = 0.15 * (1 - t);
          const grad = ctx.createRadialGradient(
            originX, originY, circleR * 0.8,
            originX, originY, circleR * 1.08
          );
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(0.4, `rgba(${colors[0]},${glowAlpha})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }

        // Particles radiating from origin — linear distance, linear fade
        for (const p of particles) {
          if (t < p.delay) continue;
          const pp = (t - p.delay) / (1 - p.delay);
          const dist = circleR * (0.08 + pp * 1.05);
          const jitter = (pp - 0.5) * 40 * (Math.random() - 0.5);
          const r = dist + jitter;

          p.x = originX + Math.cos(p.angle) * r;
          p.y = originY + Math.sin(p.angle) * r;

          const alpha = p.alpha * (1 - pp);

          if (alpha > 0.03) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color},${alpha.toFixed(3)})`;
            ctx.fill();
          }
        }

        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          animDone = true;
          ctx.clearRect(0, 0, w, h);
          cbRef.current.onComplete();
        }
      };

      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(frameId);
      // NOTE: Do NOT call onMidpoint/onComplete here.
      // In StrictMode, the cleanup fires immediately on mount,
      // which would kill the animation. The safety timeout in
      // NavbarControls handles the fallback if needed.
    };
  }, [active]); // Only depend on active

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-hidden="true"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
