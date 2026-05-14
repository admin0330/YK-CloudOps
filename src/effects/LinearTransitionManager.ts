interface LinearTransitionOptions {
  action: () => void | Promise<void>;
  background: string;
  duration?: number;
}

let active = false;

export async function runTopDownWipeTransition({
  action,
  background,
  duration = 720,
}: LinearTransitionOptions) {
  if (typeof document === 'undefined') {
    await action();
    return;
  }

  if (active) return;
  active = true;

  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:9999',
    'pointer-events:none',
    'overflow:hidden',
    `background:${background}`,
    'clip-path:inset(0 0 100% 0)',
    `transition:clip-path ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${Math.max(160, Math.round(duration * 0.35))}ms linear`,
    'will-change:clip-path,opacity',
  ].join(';');

  document.body.appendChild(overlay);
  document.documentElement.setAttribute('data-transitioning-mode', 'true');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.clipPath = 'inset(0 0 0 0)';
    });
  });

  const actionTimer = window.setTimeout(() => {
    Promise.resolve(action()).catch((err) => console.error('[LinearTransition]', err));
  }, Math.round(duration * 0.38));

  await new Promise((resolve) => window.setTimeout(resolve, duration + 40));
  overlay.style.opacity = '0';
  await new Promise((resolve) => window.setTimeout(resolve, 180));

  window.clearTimeout(actionTimer);
  document.documentElement.removeAttribute('data-transitioning-mode');
  if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
  active = false;
}
