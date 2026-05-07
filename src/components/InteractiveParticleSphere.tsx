import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

/* ═══════════════════════════════════════════════════════════════
   InteractiveParticleSphere — Cosmic AI Neural Cloud
   Advanced physics: spring / repulse / attract / curl / noise /
   ripple / inertia / damping / hotspot glow.
   Theme-aware: dark/light color palettes.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  height?: number;
  mobileHeight?: number;
  particleCount?: number;
  mobileParticleCount?: number;
  sphereRadius?: number;
  interactionRadius?: number; // kept for API compat; physics uses internal radii
}

// ── Physics constants (relative to sphere radius ≈220) ────────
const SPRING_K = 0.10;         // fast return (~0.4s)
const REPULSE_RADIUS = 35;
const REPULSE_STRENGTH = 2800;
const ATTRACT_RADIUS = 56;       // 1.6× repulse radius
const ATTRACT_STRENGTH = 2.2;
const CURL_STRENGTH = 1.2;
const NOISE_STRENGTH = 0.25;
const NOISE_SCALE = 0.012;
const NOISE_SPEED = 0.35;
const IDLE_AMP = 10;
const DAMP_ACTIVE = 0.90;      // fast settle during interaction
const DAMP_IDLE = 0.93;        // fast return when idle
const RIPPLE_DECAY = 0.6;
const RIPPLE_RADIUS = 45;
const RIPPLE_STRENGTH = 6;
const HOT_SIZE_MULT = 3.0;
const AUTO_ROTATE_SPEED = 0.002;

// ── Color palettes ─────────────────────────────────────────────
const DARK_COLORS = [
  new THREE.Color('#e8f0ff'), new THREE.Color('#b8d4ff'),
  new THREE.Color('#88b8ff'), new THREE.Color('#c8e0ff'),
  new THREE.Color('#a0d0f8'), new THREE.Color('#dce8f8'),
  new THREE.Color('#f0f4ff'), new THREE.Color('#90c0f0'),
];
const LIGHT_COLORS = [
  new THREE.Color('#7b8ea3'), new THREE.Color('#8a9bb5'),
  new THREE.Color('#9aaec4'), new THREE.Color('#a0b0c0'),
  new THREE.Color('#8898a8'), new THREE.Color('#b0bcc8'),
  new THREE.Color('#94a4b4'), new THREE.Color('#7c90a8'),
];

// ── Helpers ────────────────────────────────────────────────────
function fibonacciSphere(n: number, radius: number): Float32Array {
  const pos = new Float32Array(n * 3);
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pos[i * 3] = Math.cos(theta) * rAtY * radius;
    pos[i * 3 + 1] = y * radius;
    pos[i * 3 + 2] = Math.sin(theta) * rAtY * radius;
  }
  return pos;
}

function createGlowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.08, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  g.addColorStop(0.65, 'rgba(255,255,255,0.08)');
  g.addColorStop(0.85, 'rgba(255,255,255,0.01)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function noise3D(x: number, y: number, z: number, t: number): number {
  return (
    Math.sin(x * 1.7 + t) * Math.cos(y * 2.1 - t * 0.6) +
    Math.cos(z * 1.3 + t * 0.4) * Math.sin(x * 0.9 - t * 0.3) +
    Math.sin(y * 1.5 - t * 0.5) * Math.cos(z * 1.1 + t * 0.7)
  ) / 3;
}

// ═══════════════════════════════════════════════════════════════
export default function InteractiveParticleSphere({
  height = 560,
  mobileHeight = 360,
  particleCount = 3500,
  mobileParticleCount = 1700,
  sphereRadius = 220,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? mobileParticleCount : particleCount;
    const displayH = isMobile ? mobileHeight : height;
    const palette = isDark ? DARK_COLORS : LIGHT_COLORS;

    // ── Scene / Camera / Renderer ──────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, container.clientWidth / displayH, 10, 1200);
    camera.position.z = 560;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, displayH);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    const glowTex = createGlowTexture();

    // ── Geometry ───────────────────────────────────────────
    const basePositions = fibonacciSphere(count, sphereRadius);
    const posArr = new Float32Array(basePositions);
    const velArr = new Float32Array(count * 3);      // velocities
    const origArr = new Float32Array(basePositions);  // rest positions

    const colorsArr = new Float32Array(count * 3);
    const sizeArr = new Float32Array(count);
    const baseSizeArr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const base = palette[Math.floor(Math.random() * palette.length)];
      const j = 0.06;
      colorsArr[i * 3] = Math.max(0, Math.min(1, base.r + (Math.random() - 0.5) * j));
      colorsArr[i * 3 + 1] = Math.max(0, Math.min(1, base.g + (Math.random() - 0.5) * j));
      colorsArr[i * 3 + 2] = Math.max(0, Math.min(1, base.b + (Math.random() - 0.5) * j));
      const sz = 0.8 + Math.random() * 3.2;
      sizeArr[i] = sz;
      baseSizeArr[i] = sz;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorsArr, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1));

    // ── Material ───────────────────────────────────────────
    const ptSize = isMobile ? 5.0 : 7.0;
    const material = new THREE.PointsMaterial({
      size: ptSize,
      map: glowTex,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      transparent: true,
      opacity: isDark ? 0.88 : 0.58,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Inner ring (depth layer) ───────────────────────────
    const ringCount = Math.floor(count * 0.25);
    const ringPositions = fibonacciSphere(ringCount, sphereRadius * 0.72);
    const ringGeom = new THREE.BufferGeometry();
    ringGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ringPositions), 3));
    const ringColors = new Float32Array(ringCount * 3);
    const ringBase = isDark ? new THREE.Color('#d0e4ff') : new THREE.Color('#9aaec4');
    for (let i = 0; i < ringCount; i++) {
      ringColors[i * 3] = Math.max(0, Math.min(1, ringBase.r + (Math.random() - 0.5) * 0.05));
      ringColors[i * 3 + 1] = Math.max(0, Math.min(1, ringBase.g + (Math.random() - 0.5) * 0.05));
      ringColors[i * 3 + 2] = Math.max(0, Math.min(1, ringBase.b + (Math.random() - 0.5) * 0.05));
    }
    ringGeom.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));
    const ringMat = new THREE.PointsMaterial({
      size: ptSize * 0.55, map: glowTex, vertexColors: true,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true, transparent: true,
      opacity: isDark ? 0.45 : 0.3,
    });
    const innerRing = new THREE.Points(ringGeom, ringMat);
    points.add(innerRing);

    // ── Mouse tracking (world-space projection) ────────────
    const mouseNDC = new THREE.Vector2();
    const mouseWorld = new THREE.Vector3();
    const prevMouse = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let mouseOnScreen = false;
    let rippleEnergy = 0;

    const updateMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseOnScreen = true;
    };

    if (!isMobile) {
      container.addEventListener('mousemove', updateMouse, { passive: true });
      container.addEventListener('mouseleave', () => { mouseOnScreen = false; });
      container.addEventListener('mouseenter', (e) => { updateMouse(e as unknown as MouseEvent); });
    }

    const onResize = () => {
      const w = container.clientWidth;
      const h = isMobile ? mobileHeight : height;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ─────────────────────────────────────
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;
    const targetArr = new Float32Array(count * 3);
    let angle = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const t = now * 0.001;

      angle += AUTO_ROTATE_SPEED;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Project mouse to 3D
      if (mouseOnScreen) {
        raycaster.setFromCamera(mouseNDC, camera);
        const hit = raycaster.ray.intersectPlane(plane, mouseWorld);
        if (hit) {
          const mdx = mouseWorld.x - prevMouse.x;
          const mdy = mouseWorld.y - prevMouse.y;
          const ms = Math.sqrt(mdx * mdx + mdy * mdy);
          if (ms > 5) rippleEnergy = Math.min(1, rippleEnergy + ms * 0.01);
          prevMouse.copy(mouseWorld);
        } else {
          mouseWorld.set(9999, 9999, 9999);
        }
      }
      rippleEnergy = Math.max(0, rippleEnergy - RIPPLE_DECAY * dt);

      // ── Per-particle physics ──────────────────────────
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const ox = origArr[i3], oy = origArr[i3 + 1], oz = origArr[i3 + 2];

        // Rotated rest + idle float
        const rx = ox * cosA + oz * sinA;
        const ry = oy;
        const rz = -ox * sinA + oz * cosA;
        const phase = i * 0.137;
        const idleX = Math.sin(t * 0.7 + phase) * IDLE_AMP;
        const idleY = Math.cos(t * 0.6 + phase * 1.3) * IDLE_AMP;
        const idleZ = Math.sin(t * 0.5 + phase * 0.7) * IDLE_AMP;
        const tx = rx + idleX, ty = ry + idleY, tz = rz + idleZ;

        // Current state
        let px = posArr[i3], py = posArr[i3 + 1], pz = posArr[i3 + 2];
        let vx = velArr[i3], vy = velArr[i3 + 1], vz = velArr[i3 + 2];

        // Spring force
        const sx = (tx - px) * SPRING_K;
        const sy = (ty - py) * SPRING_K;
        const sz = (tz - pz) * SPRING_K;

        // Mouse forces
        let fx = 0, fy = 0, fz = 0, hotness = 0;
        if (mouseOnScreen) {
          const dx = px - mouseWorld.x, dy = py - mouseWorld.y, dz = pz - mouseWorld.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
          const invD = 1 / dist;

          if (dist < REPULSE_RADIUS) {
            const str = REPULSE_STRENGTH / (dist * dist + 1);
            fx += dx * invD * str; fy += dy * invD * str; fz += dz * invD * str;
            hotness = 1.0;
          } else if (dist < ATTRACT_RADIUS) {
            const ringT = (dist - REPULSE_RADIUS) / (ATTRACT_RADIUS - REPULSE_RADIUS);
            const falloff = 1 - ringT;
            const af = ATTRACT_STRENGTH * falloff;
            fx -= dx * invD * af; fy -= dy * invD * af; fz -= dz * invD * af;
            const curlT = falloff * falloff;
            fx += -dz * CURL_STRENGTH * curlT;
            fz += dx * CURL_STRENGTH * curlT;
            fy += (dx - dz) * CURL_STRENGTH * 0.5 * curlT;
            hotness = falloff;
          }

          if (rippleEnergy > 0.001) {
            const rd = Math.abs(dist - RIPPLE_RADIUS);
            const ri = Math.exp(-rd * rd * 0.0003) * rippleEnergy;
            if (ri > 0.001) { fx += dx * invD * ri * RIPPLE_STRENGTH; fy += dy * invD * ri * RIPPLE_STRENGTH; }
          }
        }

        // Noise turbulence
        const ns = NOISE_SCALE, nt = t * NOISE_SPEED;
        fx += noise3D(px * ns, py * ns, pz * ns, nt) * NOISE_STRENGTH;
        fy += noise3D(py * ns, pz * ns, px * ns, nt + 1.7) * NOISE_STRENGTH;
        fz += noise3D(pz * ns, px * ns, py * ns, nt + 3.4) * NOISE_STRENGTH;

        // Velocity + damping
        const damp = hotness > 0.05 ? DAMP_ACTIVE : DAMP_IDLE;
        vx = (vx + sx + fx) * damp;
        vy = (vy + sy + fy) * damp;
        vz = (vz + sz + fz) * damp;
        px += vx; py += vy; pz += vz;

        // Size hotspot
        let ts = baseSizeArr[i];
        if (hotness > 0.05) ts *= 1 + hotness * HOT_SIZE_MULT;
        sizeArr[i] += (ts - sizeArr[i]) * 0.15;

        posArr[i3] = px; posArr[i3 + 1] = py; posArr[i3 + 2] = pz;
        velArr[i3] = vx; velArr[i3 + 1] = vy; velArr[i3 + 2] = vz;
        targetArr[i3] = tx; targetArr[i3 + 1] = ty; targetArr[i3 + 2] = tz;
      }

      posAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
      innerRing.rotation.y -= 0.0008;
      innerRing.rotation.x -= 0.0003;

      // Mouse-driven rotation (only affects nearby areas via velocity,
      // far particles stay on sphere)
      if (mouseOnScreen) {
        points.rotation.y += mouseNDC.x * 0.006;
        points.rotation.x += mouseNDC.y * 0.003;
      }

      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', onResize);
      if (!isMobile) {
        container.removeEventListener('mousemove', updateMouse);
        container.removeEventListener('mouseleave', () => {});
        container.removeEventListener('mouseenter', () => {});
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      glowTex.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [isDark, height, mobileHeight, particleCount, mobileParticleCount, sphereRadius]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const displayH = isMobile ? mobileHeight : height;

  return (
    <div
      ref={containerRef}
      className="w-full select-none"
      style={{ height: `${displayH}px`, cursor: isMobile ? 'default' : 'crosshair', overflow: 'hidden', WebkitTapHighlightColor: 'transparent' }}
    />
  );
}
