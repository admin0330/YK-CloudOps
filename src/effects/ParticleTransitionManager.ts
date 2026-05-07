/**
 * ParticleTransitionManager — Premium Three.js + GLSL particle transition engine.
 *
 * Exposes a global API for triggering particle burst transitions from any
 * element or coordinate origin. Integrates with language switching, theme
 * switching, page navigation, and `data-particle-transition` elements.
 *
 * Usage:
 *   window.particleTransition.run({ originElement, type, action })
 */

import * as THREE from 'three';

// ── Easing ────────────────────────────────────────────────────
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── GLSL Shaders ──────────────────────────────────────────────
const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uOrigin;
  uniform vec2 uResolution;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vDist;

  void main() {
    // Expand from origin based on progress
    float expand = ease(uProgress, aPhase);

    // Direction from origin
    vec2 dir = normalize(position.xy - uOrigin * uResolution);
    float dist = length(position.xy - uOrigin * uResolution);
    float maxDist = length(uResolution) * 1.6;

    // Particle position: starts at origin, moves outward
    float radius = expand * maxDist * (0.35 + aSpeed * 0.65);
    float noise = sin(expand * 25.0 + aPhase * 6.28) * 8.0;
    radius += noise * (1.0 - abs(expand - 0.5) * 2.0);

    vec2 pos = uOrigin * uResolution + dir * radius;
    gl_Position = vec4((pos / uResolution) * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = aSize * (1.0 - expand * 0.5) * (uResolution.y / 450.0);

    // Alpha: rise quickly, fade slowly
    float alphaRise = smoothstep(0.0, 0.08, expand);
    float alphaFall = 1.0 - smoothstep(0.55, 1.0, expand);
    vAlpha = alphaRise * alphaFall * 0.75;

    // Color brightness peaks mid-animation
    vColor = aColor * (0.7 + 0.3 * (1.0 - abs(expand - 0.35) * 2.0));
    vDist = expand;
  }

  // Custom easing — starts slow, accelerates, then eases out
  float ease(float t, float phase) {
    float delayed = clamp((t - phase * 0.15) / (1.0 - phase * 0.15), 0.0, 1.0);
    return delayed < 0.5
      ? 4.0 * delayed * delayed * delayed
      : 1.0 - pow(-2.0 * delayed + 2.0, 3.0) / 2.0;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vDist;
  uniform float uTime;

  void main() {
    // Radial falloff for soft dot
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.0, 1.0, d);
    alpha = pow(alpha, 1.6);

    // Subtle glow ring at edges
    float glow = exp(-d * 2.8) * 0.25;

    // Energy shimmer
    float shimmer = 0.75 + 0.25 * sin(d * 8.0 - uTime * 4.0 + vDist * 12.0);

    float finalAlpha = (alpha + glow) * vAlpha * shimmer;

    // Premultiply for additive blending
    gl_FragColor = vec4(vColor * finalAlpha, finalAlpha);
  }
`;

// ── Types ─────────────────────────────────────────────────────
export type TransitionType = 'theme' | 'language' | 'project' | 'navigation' | 'custom';

export interface ParticleTransitionOptions {
  originElement?: HTMLElement;
  origin?: { x: number; y: number };
  type?: TransitionType;
  action: () => void | Promise<void>;
}

interface ParticleData {
  angle: number;
  size: number;
  speed: number;
  phase: number;
  color: THREE.Color;
}

// ── Color palettes per transition type ────────────────────────
const PALETTES: Record<TransitionType, string[]> = {
  theme:    ['#8ab4ff', '#b79cff', '#9fffd1', '#c8d2f0', '#94b8e8'],
  language: ['#8ab4ff', '#b79cff', '#9fffd1', '#c8d2f0', '#e0c8ff'],
  project:  ['#5b9cf5', '#7b6ff0', '#48e0b8', '#a08cf0', '#60c0ff'],
  navigation: ['#8ab4ff', '#a0c4f8', '#b79cff', '#c8d2f0', '#94b8e8'],
  custom:   ['#8ab4ff', '#b79cff', '#9fffd1', '#c8d2f0', '#94b8e8'],
};

// ── Manager ────────────────────────────────────────────────────
class ParticleTransitionManager {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private material!: THREE.ShaderMaterial;
  private geometry!: THREE.BufferGeometry;
  private points!: THREE.Points;
  private canvas: HTMLCanvasElement | null = null;
  private animationId = 0;
  private startTime = 0;
  private duration = 1200; // ms
  private midCalled = false;
  private resolvePromise: (() => void) | null = null;
  private dpr = 1;
  private active = false;
  private disposed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.dpr = Math.min(window.devicePixelRatio, 2);
    }
  }

  private ensureRenderer(): boolean {
    if (this.disposed) return false;

    if (!this.renderer) {
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText =
        'position:fixed;inset:0;z-index:9999;pointer-events:none;width:100vw;height:100vh';
      this.canvas.setAttribute('aria-hidden', 'true');

      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        });
      } catch (e) {
        console.warn('[ParticleTransition] WebGL not available, falling back to instant transition');
        this.disposed = true;
        return false;
      }

      this.renderer.setPixelRatio(this.dpr);
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      this.scene = new THREE.Scene();

      const W = window.innerWidth * this.dpr;
      const H = window.innerHeight * this.dpr;
      this.camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 10);
      this.camera.position.z = 5;

      // Shader material
      this.material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uOrigin: { value: new THREE.Vector2(0.5, 0.5) },
          uResolution: { value: new THREE.Vector2(W, H) },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });

      document.body.appendChild(this.canvas);
    }

    return true;
  }

  private buildParticles(type: TransitionType): ParticleData[] {
    const count = window.innerWidth < 768 ? 180 : 320;
    const palette = PALETTES[type];
    const particles: ParticleData[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        size: 1.5 + Math.random() * 4.5,
        speed: 0.35 + Math.random() * 0.65,
        phase: Math.random(),
        color: new THREE.Color(palette[Math.floor(Math.random() * palette.length)]),
      });
    }

    return particles;
  }

  private buildGeometry(particles: ParticleData[]): void {
    const count = particles.length;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      positions[i * 3] = Math.cos(p.angle);
      positions[i * 3 + 1] = Math.sin(p.angle);
      positions[i * 3 + 2] = 0;
      sizes[i] = p.size;
      phases[i] = p.phase;
      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;
      speeds[i] = p.speed;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
    }
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  async run(opts: ParticleTransitionOptions): Promise<void> {
    // Guard: if already running, complete immediately
    if (this.active) {
      await Promise.resolve(opts.action?.());
      return;
    }

    // Reduced motion: skip animation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await Promise.resolve(opts.action?.());
      return;
    }

    if (!this.ensureRenderer()) {
      await Promise.resolve(opts.action?.());
      return;
    }

    this.active = true;
    this.midCalled = false;

    // Resolve origin
    let ox = 0.5;
    let oy = 0.5;
    if (opts.origin) {
      ox = opts.origin.x / window.innerWidth;
      oy = opts.origin.y / window.innerHeight;
    } else if (opts.originElement) {
      const rect = opts.originElement.getBoundingClientRect();
      ox = (rect.left + rect.width / 2) / window.innerWidth;
      oy = (rect.top + rect.height / 2) / window.innerHeight;
    }

    const type = opts.type || 'custom';

    // Build particle system
    const particles = this.buildParticles(type);
    this.buildGeometry(particles);

    // Update uniforms
    this.material.uniforms.uOrigin.value.set(ox, oy);
    const W = window.innerWidth * this.dpr;
    const H = window.innerHeight * this.dpr;
    this.material.uniforms.uResolution.value.set(W, H);

    // Show canvas
    this.canvas!.style.display = '';
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Start animation
    this.startTime = performance.now();

    return new Promise<void>((resolve) => {
      this.resolvePromise = resolve;

      const animate = (now: number) => {
        const elapsed = now - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // Midpoint callback at 45% progress
        if (!this.midCalled && progress >= 0.45) {
          this.midCalled = true;
          Promise.resolve(opts.action?.()).catch(() => {});
        }

        this.material.uniforms.uProgress.value = progress;
        this.material.uniforms.uTime.value = elapsed * 0.001;

        this.renderer.render(this.scene, this.camera);

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.finish();
          resolve();
        }
      };

      this.animationId = requestAnimationFrame(animate);
    });
  }

  private finish(): void {
    this.active = false;
    if (this.canvas) this.canvas.style.display = 'none';
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
    }
    this.resolvePromise?.();
    this.resolvePromise = null;
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.disposed = true;
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null!;
    }
    if (this.material) this.material.dispose();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.active = false;
  }
}

// ── Singleton ──────────────────────────────────────────────────
let instance: ParticleTransitionManager | null = null;

function getManager(): ParticleTransitionManager {
  if (!instance) instance = new ParticleTransitionManager();
  return instance;
}

// ── Exported API ──────────────────────────────────────────────
export async function runParticleTransition(opts: ParticleTransitionOptions): Promise<void> {
  await getManager().run(opts);
}

// Attach to window for imperative use
if (typeof window !== 'undefined') {
  (window as any).particleTransition = {
    run: runParticleTransition,
  };
}

export function disposeParticleTransition(): void {
  if (instance) {
    instance.dispose();
    instance = null;
  }
}
