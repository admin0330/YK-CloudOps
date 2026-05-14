import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type FaultyTerminalProps = {
  scale?: number;
  digitSize?: number;
  scanlineIntensity?: number;
  glitchAmount?: number;
  flickerAmount?: number;
  noiseAmp?: number;
  chromaticAberration?: number;
  dither?: number;
  curvature?: number;
  tint?: string;
  mouseReact?: boolean;
  mouseStrength?: number;
  brightness?: number;
};

const GHOST_ROWS = [
  { top: '12%', left: '6%', width: '24%', text: '010011  A7EF9E  0010', delay: 0.08 },
  { top: '22%', left: '64%', width: '22%', text: 'SYS//ERR  0011  1110', delay: 0.34 },
  { top: '38%', left: '10%', width: '28%', text: 'TERM>  /usr/bin/boot', delay: 0.58 },
  { top: '54%', left: '58%', width: '24%', text: 'NOISE  1111  0011', delay: 0.2 },
  { top: '72%', left: '18%', width: '30%', text: 'SCANLINE  CRT  1100', delay: 0.46 },
  { top: '84%', left: '52%', width: '20%', text: 'READY>  0001  1010', delay: 0.72 },
];

const GHOST_BARS = [
  { top: '16%', left: '-6%', width: '46%', opacity: 0.07, skew: -6, delay: 0.18 },
  { top: '31%', left: '16%', width: '58%', opacity: 0.06, skew: 4, delay: 0.42 },
  { top: '49%', left: '-2%', width: '36%', opacity: 0.08, skew: -3, delay: 0.68 },
  { top: '69%', left: '44%', width: '44%', opacity: 0.05, skew: 5, delay: 0.28 },
  { top: '86%', left: '12%', width: '62%', opacity: 0.045, skew: -2, delay: 0.56 },
];

const DIGIT_STREAM = [
  '0010110011 110010 010110 111010',
  'TERM>  boot  sequence  initialized',
  '0101 0011 0101 1110 1001 0110',
  'A7EF9E  A7EF9E  A7EF9E',
  'scanline::active  flicker::1',
  '000111  101010  001100  111000',
];

function hexToRgb(input: string) {
  const normalized = input.replace('#', '').trim();
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized.padEnd(6, normalized[0] ?? '0');
  const value = Number.parseInt(expanded.slice(0, 6), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function FaultyTerminal({
  scale = 1.5,
  digitSize = 1.2,
  scanlineIntensity = 0.5,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 1,
  chromaticAberration = 0,
  dither = 0,
  curvature = 0.1,
  tint = '#A7EF9E',
  mouseReact = true,
  mouseStrength = 0.5,
  brightness = 0.6,
}: FaultyTerminalProps) {
  const reduceMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 50, y: 42 });
  const [flicker, setFlicker] = useState(1);

  const tintRgb = useMemo(() => hexToRgb(tint), [tint]);
  const tintColor = `rgb(${tintRgb.r} ${tintRgb.g} ${tintRgb.b})`;
  const tintAlpha = (alpha: number) => `rgba(${tintRgb.r}, ${tintRgb.g}, ${tintRgb.b}, ${alpha})`;

  useEffect(() => {
    if (!mouseReact || reduceMotion) return;

    let frame = 0;
    const updatePointer = (x: number, y: number) => {
      setPointer({ x, y });
    };

    const handleMove = (event: PointerEvent) => {
      const x = Math.max(0, Math.min(100, (event.clientX / window.innerWidth) * 100));
      const y = Math.max(0, Math.min(100, (event.clientY / window.innerHeight) * 100));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => updatePointer(x, y));
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      cancelAnimationFrame(frame);
    };
  }, [mouseReact, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || flickerAmount <= 0) return;

    const interval = window.setInterval(() => {
      const base = 0.92 + Math.random() * 0.16;
      const amount = 0.5 + Math.max(0, flickerAmount) * 0.5;
      setFlicker(base * amount);
    }, 110);

    return () => window.clearInterval(interval);
  }, [reduceMotion, flickerAmount]);

  const scanlineAlpha = Math.max(0, Math.min(0.85, scanlineIntensity * 0.55));
  const noiseAlpha = Math.max(0.015, Math.min(0.16, noiseAmp * 0.08));
  const glitchAlpha = Math.max(0.02, Math.min(0.12, glitchAmount * 0.08));
  const ditherAlpha = Math.max(0, Math.min(0.08, dither * 0.06));
  const textSize = 10.5 * digitSize;
  const glowX = mouseReact ? pointer.x : 50;
  const glowY = mouseReact ? pointer.y : 40;
  const glowStrength = mouseReact ? mouseStrength : 0;
  const brightnessScale = Math.max(0.18, brightness);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{
        zIndex: 0,
        background: 'linear-gradient(180deg, #040506 0%, #05070a 42%, #020304 100%)',
      }}
    >
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{
          width: '100vw',
          height: '100dvh',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          filter: `brightness(${brightnessScale}) saturate(1.08)`,
          opacity: 0.985,
        }}
        animate={reduceMotion ? undefined : { opacity: [0.975, 1, 0.985] }}
        transition={reduceMotion ? undefined : { duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `perspective(1200px) rotateX(${curvature * 12}deg) scale(1.03)`,
            transformOrigin: 'center center',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 36%, ${tintAlpha(0.16)} 0%, ${tintAlpha(0.09)} 14%, rgba(8, 10, 12, 0.16) 30%, rgba(3, 4, 5, 0.76) 68%, rgba(1, 1, 2, 0.98) 100%)`,
              boxShadow: 'inset 0 0 180px rgba(0, 0, 0, 0.68)',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${tintAlpha(0.18 * glowStrength)} 0%, ${tintAlpha(0.08 * glowStrength)} 15%, transparent 42%)`,
              mixBlendMode: 'screen',
            }}
          />

          <motion.div
            className="absolute rounded-full blur-[120px]"
            style={{
              left: `${glowX}%`,
              top: `${glowY}%`,
              width: '36rem',
              height: '36rem',
              background: `radial-gradient(circle, ${tintAlpha(0.16)} 0%, ${tintAlpha(0.07)} 28%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              mixBlendMode: 'screen',
            }}
            animate={reduceMotion ? undefined : { opacity: [0.28, 0.56, 0.3] }}
            transition={reduceMotion ? undefined : { duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(180deg, ${tintAlpha(scanlineAlpha)} 0px, ${tintAlpha(scanlineAlpha)} 1px, transparent 1px, transparent 3px)`,
              mixBlendMode: 'screen',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, ${tintAlpha(0.045)} 0px, ${tintAlpha(0.045)} 1px, transparent 1px, transparent 84px)`,
              opacity: 0.45,
              mixBlendMode: 'screen',
            }}
          />

          <div
            className="absolute inset-[1.5%]"
            style={{
              borderRadius: '11% / 8%',
              boxShadow: `inset 0 0 0 1px ${tintAlpha(0.12)}, inset 0 0 140px rgba(0, 0, 0, 0.72)`,
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 16%, transparent 84%, rgba(255,255,255,0.018) 100%)',
              opacity: flicker,
            }}
          />

          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.025) 48%, transparent 56%)',
              mixBlendMode: 'screen',
            }}
            animate={reduceMotion ? undefined : { y: ['-10%', '110%'] }}
            transition={reduceMotion ? undefined : { duration: 6.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
          />

          <div
            className="absolute inset-0"
            style={{
              opacity: noiseAlpha,
              backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.78\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E')",
              backgroundRepeat: 'repeat',
              backgroundSize: '200px 200px',
              mixBlendMode: 'screen',
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              opacity: ditherAlpha,
              backgroundImage: `radial-gradient(${tintAlpha(0.2)} 0.9px, transparent 1px)`,
              backgroundSize: '4px 4px',
              mixBlendMode: 'screen',
            }}
          />

          {GHOST_BARS.map((bar, index) => (
            <motion.div
              key={`bar-${index}`}
              className="absolute h-[2px] rounded-full"
              style={{
                top: bar.top,
                left: bar.left,
                width: bar.width,
                opacity: bar.opacity,
                background: `linear-gradient(90deg, transparent 0%, ${tintAlpha(0.35)} 22%, ${tintAlpha(0.95)} 50%, ${tintAlpha(0.38)} 78%, transparent 100%)`,
                boxShadow: `0 0 16px ${tintAlpha(0.18)}`,
              }}
              animate={reduceMotion ? undefined : {
                x: [0, 10, -8, 0],
                skewX: [0, bar.skew, -bar.skew / 2, 0],
                opacity: [bar.opacity, Math.min(0.18, bar.opacity + 0.08), bar.opacity],
              }}
              transition={reduceMotion ? undefined : {
                duration: 6.5,
                delay: bar.delay,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
            />
          ))}

          {GHOST_ROWS.map((row, index) => (
            <motion.div
              key={`row-${index}`}
              className="absolute font-mono whitespace-nowrap select-none"
              style={{
                top: row.top,
                left: row.left,
                width: row.width,
                color: tintColor,
                fontSize: `${textSize}px`,
                letterSpacing: `${0.22 * digitSize}em`,
                textShadow: `0 0 12px ${tintAlpha(0.25)}`,
                filter: 'blur(0.08px)',
                opacity: 0.34,
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : {
                opacity: [0.2, 0.42, 0.24],
                y: [0, -2, 0],
                x: [0, 4, -3, 0],
              }}
              transition={reduceMotion ? undefined : {
                duration: 8 + index,
                delay: row.delay,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
              }}
            >
              {row.text}
            </motion.div>
          ))}

          <div
            className="absolute inset-0"
            style={{
              maskImage: 'radial-gradient(ellipse 78% 58% at 50% 40%, black 24%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 78% 58% at 50% 40%, black 24%, transparent 100%)',
              background: `radial-gradient(circle at 50% 40%, transparent 26%, rgba(0, 0, 0, 0.16) 66%, rgba(0, 0, 0, 0.46) 100%)`,
            }}
          />

          <div className="absolute inset-x-0 bottom-0 h-[18%]" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 32%, rgba(0, 0, 0, 0.52) 100%)' }} />

          <div className="absolute inset-0 px-[9%] py-[8%] flex flex-col justify-center gap-[3.2%]" style={{ mixBlendMode: 'screen' }}>
            {DIGIT_STREAM.map((line, index) => (
              <motion.div
                key={`stream-${index}`}
                className="font-mono uppercase"
                style={{
                  fontSize: `${Math.max(11, 12 * digitSize)}px`,
                  letterSpacing: `${0.16 * digitSize}em`,
                  color: tintAlpha(0.28),
                  textShadow: `0 0 10px ${tintAlpha(0.16)}`,
                }}
                animate={reduceMotion ? undefined : { x: [0, 2, -1, 0], opacity: [0.18, 0.3, 0.2] }}
                transition={reduceMotion ? undefined : { duration: 5.5 + index * 0.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }}
              >
                {line}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LiquidGlassBackground() {
  return (
    <FaultyTerminal
      scale={1.5}
      digitSize={1.2}
      scanlineIntensity={0.5}
      glitchAmount={1}
      flickerAmount={1}
      noiseAmp={1}
      chromaticAberration={0}
      dither={0}
      curvature={0.1}
      tint="#A7EF9E"
      mouseReact
      mouseStrength={0.5}
      brightness={0.6}
    />
  );
}
