/**
 * ParticleTransitionManager ? fullscreen transition engine.
 *
 * Navigation now uses a liquid orb inspired by the reference video,
 * while the other transition types keep the faster particle burst.
 */

import * as THREE from 'three';

type TransitionType = 'theme' | 'language' | 'project' | 'navigation' | 'custom';

export interface ParticleTransitionOptions {
  originElement?: HTMLElement;
  origin?: { x: number; y: number };
  type?: TransitionType;
  action: () => void | Promise<void>;
}

interface ParticleData {
  angle: number;
  phi: number;
  size: number;
  speed: number;
  phase: number;
  color: THREE.Color;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

const PALETTES: Record<TransitionType, string[]> = {
  theme: ['#8ab4ff', '#b79cff', '#9fffd1', '#c8d2f0', '#94b8e8'],
  language: ['#8ab4ff', '#b79cff', '#9fffd1', '#c8d2f0', '#e0c8ff'],
  project: ['#5b9cf5', '#7b6ff0', '#48e0b8', '#a08cf0', '#60c0ff'],
  navigation: ['#ffffff', '#f5f7fb', '#d7dee9', '#aeb8c8', '#f0f4fa'],
  custom: ['#8ab4ff', '#b79cff', '#9fffd1', '#c8d2f0', '#94b8e8'],
};

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  attribute float aSpeed;
  attribute float aPhi;

  uniform float uTime;
  uniform float uProgress;
  uniform float uOrbMode;
  uniform vec2 uOrigin;
  uniform vec2 uResolution;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vDist;

  float easeCurve(float t, float phase) {
    float delayed = clamp((t - phase * 0.15) / (1.0 - phase * 0.15), 0.0, 1.0);
    return delayed < 0.5
      ? 4.0 * delayed * delayed * delayed
      : 1.0 - pow(-2.0 * delayed + 2.0, 3.0) / 2.0;
  }

  void main() {
    float t = easeCurve(uProgress, aPhase);
    vec2 origin = uOrigin * uResolution;
    vec2 pos = origin;
    float alpha = 1.0;

    if (uOrbMode > 0.5) {
      float theta = aPhase * 6.2831853 + uTime * (0.42 + aSpeed * 0.32);
      float phi = aPhi;

      vec3 sphere = vec3(
        cos(theta) * sin(phi),
        sin(theta) * sin(phi),
        cos(phi)
      );

      float reveal = smoothstep(0.02, 0.22, t);
      float dissolve = 1.0 - smoothstep(0.72, 1.0, t);
      float pulse = 0.38 + 0.14 * sin(uTime * 2.0 + aPhase * 8.0);
      float scale = mix(0.08, 1.0, smoothstep(0.0, 0.46, t));
      float radius = min(uResolution.x, uResolution.y) * (0.16 + pulse * 0.42) * scale;

      vec2 drift = vec2(
        sin(aPhase * 17.0 + uTime * 1.8),
        cos(aPhase * 13.0 + uTime * 1.5)
      ) * (uResolution * 0.012 * reveal);

      pos = origin + sphere.xy * radius + drift;
      alpha = reveal * dissolve * (0.45 + 0.55 * (1.0 - abs(sphere.z)));
      vColor = aColor * (0.84 + 0.28 * (1.0 - abs(sphere.z)));
      gl_PointSize = aSize * (0.75 + 0.55 * (1.0 - abs(sphere.z))) * (uResolution.y / 450.0) * (0.75 + 0.35 * reveal);
      vDist = 1.0 - abs(sphere.z);
    } else {
      vec2 delta = position.xy - origin;
      vec2 dir = length(delta) > 0.001 ? normalize(delta) : vec2(cos(aPhase * 6.2831853), sin(aPhase * 6.2831853));
      float maxDist = length(uResolution) * 1.55;
      float radius = t * maxDist * (0.35 + aSpeed * 0.65);
      float noise = sin(t * 25.0 + aPhase * 6.2831853) * 8.0;
      radius += noise * (1.0 - abs(t - 0.5) * 2.0);
      pos = origin + dir * radius;
      gl_PointSize = aSize * (1.0 - t * 0.5) * (uResolution.y / 450.0);
      float alphaRise = smoothstep(0.0, 0.08, t);
      float alphaFall = 1.0 - smoothstep(0.55, 1.0, t);
      alpha = alphaRise * alphaFall * 0.78;
      vColor = aColor * (0.7 + 0.3 * (1.0 - abs(t - 0.35) * 2.0));
      vDist = t;
    }

    vAlpha = clamp01(alpha);
    gl_Position = vec4((pos / uResolution) * 2.0 - 1.0, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vDist;
  uniform float uTime;
  uniform float uOrbMode;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.0, 1.0, d);
    alpha = pow(alpha, 1.55);

    float glow = exp(-d * (uOrbMode > 0.5 ? 2.0 : 2.8)) * (uOrbMode > 0.5 ? 0.42 : 0.25);
    float shimmer = 0.75 + 0.25 * sin(d * 8.0 - uTime * 4.0 + vDist * 12.0);
    float orbVignette = uOrbMode > 0.5 ? (0.82 + 0.18 * sin(vDist * 8.0 + uTime * 1.3)) : 1.0;

    float finalAlpha = (alpha + glow) * vAlpha * shimmer * orbVignette;
    gl_FragColor = vec4(vColor * finalAlpha, finalAlpha);
  }
`;

class ParticleTransitionManager {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private points: THREE.Points | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private animationId = 0;
  private startTime = 0;
  private duration = 1200;
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
      this.canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;width:100%;height:100%';
      this.canvas.setAttribute('aria-hidden', 'true');

      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        });
      } catch {
        console.warn('[ParticleTransition] WebGL not available, falling back to instant transition');
        this.disposed = true;
        return false;
      }

      this.renderer.setPixelRatio(this.dpr);
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      this.scene = new THREE.Scene();

      const w = window.innerWidth * this.dpr;
      const h = window.innerHeight * this.dpr;
      this.camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 10);
      this.camera.position.z = 5;

      this.material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uOrbMode: { value: 0 },
          uOrigin: { value: new THREE.Vector2(0.5, 0.5) },
          uResolution: { value: new THREE.Vector2(w, h) },
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
    const orbMode = type === 'navigation';
    const count = window.innerWidth < 768
      ? (orbMode ? 240 : 180)
      : (orbMode ? 520 : 320);
    const palette = PALETTES[type];
    const particles: ParticleData[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        size: orbMode ? 1.2 + Math.random() * 3.2 : 1.5 + Math.random() * 4.5,
        speed: orbMode ? 0.18 + Math.random() * 0.42 : 0.35 + Math.random() * 0.65,
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
    const phis = new Float32Array(count);

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
      phis[i] = p.phi;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aPhi', new THREE.BufferAttribute(phis, 1));

    if (this.points && this.scene) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
    }

    this.geometry = geometry;
    this.points = new THREE.Points(geometry, this.material!);
    this.scene!.add(this.points);
  }

  async run(opts: ParticleTransitionOptions): Promise<void> {
    if (this.active) {
      await Promise.resolve(opts.action?.());
      return;
    }

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
    const orbMode = type === 'navigation';
    this.duration = orbMode ? 1320 : 1200;

    const particles = this.buildParticles(type);
    this.buildGeometry(particles);

    this.material!.uniforms.uOrigin.value.set(ox, oy);
    this.material!.uniforms.uOrbMode.value = orbMode ? 1 : 0;
    const w = window.innerWidth * this.dpr;
    const h = window.innerHeight * this.dpr;
    this.material!.uniforms.uResolution.value.set(w, h);

    this.canvas!.style.display = '';
    this.renderer!.setSize(window.innerWidth, window.innerHeight);
    this.startTime = performance.now();

    return new Promise<void>((resolve) => {
      this.resolvePromise = resolve;

      const animate = (now: number) => {
        const elapsed = now - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        if (!this.midCalled && progress >= (orbMode ? 0.38 : 0.45)) {
          this.midCalled = true;
          Promise.resolve(opts.action?.()).catch(() => {});
        }

        this.material!.uniforms.uProgress.value = progress;
        this.material!.uniforms.uTime.value = elapsed * 0.001;
        this.renderer!.render(this.scene!, this.camera!);

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
    if (this.points && this.scene) {
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
      this.renderer = null;
    }
    if (this.material) this.material.dispose();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.active = false;
  }
}

let instance: ParticleTransitionManager | null = null;

function getManager(): ParticleTransitionManager {
  if (!instance) instance = new ParticleTransitionManager();
  return instance;
}

export async function runParticleTransition(opts: ParticleTransitionOptions): Promise<void> {
  await getManager().run(opts);
}

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
