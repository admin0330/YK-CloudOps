import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Premium glass shards — irregular polygons with depth, edge highlights, parallax
const SHARDS = [
  // Hero zone — large central pieces
  { d: 'M80,20 L220,0 L310,60 L260,160 L140,140 L40,100 Z',         x: '45%', y: '3%',  w: 0.34, h: 0.22, blur: 2, op: 0.06, rot: -3, scale: 1.1, delay: 0 },
  { d: 'M0,30 L100,10 L140,80 L80,160 L10,120 Z',                   x: '8%',  y: '6%',  w: 0.17, h: 0.20, blur: 3, op: 0.08, rot: 5,  scale: 0.95, delay: 0.2 },
  { d: 'M160,40 L280,15 L340,90 L270,170 L150,140 L100,70 Z',       x: '65%', y: '1%',  w: 0.26, h: 0.21, blur: 2, op: 0.05, rot: -6, scale: 1.05, delay: 0.4 },
  // Mid zone — medium accent pieces
  { d: 'M40,5 L130,0 L180,50 L120,110 L30,90 Z',                    x: '22%', y: '14%', w: 0.19, h: 0.15, blur: 4, op: 0.07, rot: 2,  scale: 0.9, delay: 0.15 },
  { d: 'M0,60 L80,40 L130,90 L80,150 L10,130 Z',                    x: '55%', y: '18%', w: 0.16, h: 0.17, blur: 3, op: 0.06, rot: -4, scale: 1.0, delay: 0.5 },
  { d: 'M180,60 L260,40 L310,100 L240,170 L150,140 Z',              x: '75%', y: '12%', w: 0.2,  h: 0.18, blur: 2, op: 0.07, rot: 8,  scale: 0.98, delay: 0.35 },
  // Lower zone — structural pieces
  { d: 'M120,80 L200,60 L260,120 L200,190 L100,160 L60,110 Z',     x: '38%', y: '28%', w: 0.24, h: 0.19, blur: 3, op: 0.05, rot: -2, scale: 1.0, delay: 0.6 },
  { d: 'M0,100 L90,70 L140,130 L80,200 L10,170 Z',                  x: '10%', y: '32%', w: 0.18, h: 0.18, blur: 4, op: 0.07, rot: 6,  scale: 0.92, delay: 0.25 },
  { d: 'M200,100 L280,80 L340,140 L260,210 L170,180 Z',             x: '68%', y: '25%', w: 0.21, h: 0.17, blur: 2, op: 0.06, rot: -5, scale: 1.02, delay: 0.7 },
  { d: 'M60,140 L150,110 L200,170 L130,240 L40,210 Z',              x: '30%', y: '40%', w: 0.2,  h: 0.18, blur: 3, op: 0.06, rot: 3,  scale: 0.95, delay: 0.45 },
  // Accent — small floating pieces
  { d: 'M0,20 L70,10 L90,60 L50,100 L5,80 Z',                       x: '85%', y: '35%', w: 0.12, h: 0.13, blur: 5, op: 0.08, rot: -7, scale: 0.85, delay: 0.8 },
  { d: 'M10,0 L80,5 L100,50 L50,90 L5,70 Z',                        x: '48%', y: '8%',  w: 0.11, h: 0.12, blur: 4, op: 0.09, rot: 9,  scale: 0.88, delay: 0.3 },
  { d: 'M0,0 L60,5 L80,50 L40,80 L5,60 Z',                          x: '18%', y: '45%', w: 0.1,  h: 0.11, blur: 5, op: 0.08, rot: -3, scale: 0.82, delay: 0.55 },
  // Bottom zone
  { d: 'M100,180 L190,150 L240,200 L180,260 L90,230 Z',             x: '42%', y: '52%', w: 0.2,  h: 0.16, blur: 3, op: 0.05, rot: 4,  scale: 0.95, delay: 0.65 },
  { d: 'M0,170 L80,140 L120,200 L70,260 L5,230 Z',                  x: '5%',  y: '55%', w: 0.15, h: 0.15, blur: 4, op: 0.06, rot: -5, scale: 0.9, delay: 0.75 },
  { d: 'M210,170 L290,150 L340,210 L270,270 L180,240 Z',            x: '70%', y: '50%', w: 0.2,  h: 0.16, blur: 2, op: 0.05, rot: 6,  scale: 0.93, delay: 0.5 },
  { d: 'M130,220 L210,200 L250,260 L190,310 L110,280 Z',            x: '35%', y: '62%', w: 0.18, h: 0.14, blur: 3, op: 0.06, rot: -2, scale: 0.9, delay: 0.85 },
  { d: 'M50,230 L130,210 L160,270 L100,320 L30,290 Z',              x: '15%', y: '68%', w: 0.16, h: 0.13, blur: 4, op: 0.05, rot: 5,  scale: 0.88, delay: 0.4 },
];

const MOBILE_SHARDS = SHARDS.filter((_, i) => i < 8);

export default function LiquidGlassBackground() {
  const scrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shards = isMobile ? MOBILE_SHARDS : SHARDS;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Deep vignette layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, var(--overlay-bg) 65%, var(--bg) 100%)',
        }}
      />

      {/* Ambient light pools */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-[130px]" style={{ left: '-5%', top: '10%', background: 'radial-gradient(circle, rgba(120,90,255,0.07) 0%, transparent 70%)', opacity: 0.8 }} />
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[110px]" style={{ right: '-3%', bottom: '20%', background: 'radial-gradient(circle, rgba(80,255,190,0.05) 0%, transparent 70%)', opacity: 0.7 }} />
      <div className="absolute w-[350px] h-[350px] rounded-full blur-[100px]" style={{ left: '55%', top: '40%', background: 'radial-gradient(circle, rgba(80,130,255,0.04) 0%, transparent 70%)', opacity: 0.6 }} />

      {/* Glass shards with parallax */}
      {shards.map((shard, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 360 320"
          className="absolute will-change-transform"
          style={{
            left: shard.x,
            top: shard.y,
            width: `${shard.w * 100}%`,
            height: `${shard.h * 100}%`,
            filter: `blur(${shard.blur}px)`,
          }}
          initial={{ opacity: 0, rotate: shard.rot + (i % 3 - 1) * 5, scale: shard.scale - 0.1, y: 20 }}
          animate={{
            opacity: shard.op,
            rotate: shard.rot,
            scale: shard.scale,
            y: 0,
          }}
          transition={{ duration: 1.8, delay: shard.delay + 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <defs>
            <linearGradient id={`gs-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.03)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
            </linearGradient>
            {/* Edge highlight filter */}
            <filter id={`gs-edge-${i}`}>
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
              <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.3" specularExponent="20" result="spec">
                <fePointLight x="150" y="100" z="200" />
              </feSpecularLighting>
              <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="specOut" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={shard.d}
            fill={`url(#gs-${i})`}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.6"
          />
        </motion.svg>
      ))}
    </div>
  );
}
