import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
  setThemeDirect: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'dark',
  toggleTheme: () => {},
});

const STORAGE_KEY = 'yk-intelligence-theme';
const THEME_TRANSITION_MS = 420;

let themeTransitionTimer: number | undefined;

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === 'dark' || v === 'light') return v;
  return 'dark';
}

function syncTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name=\'theme-color\']');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1220' : '#f5f7fb');
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

function triggerThemeTransition() {
  document.documentElement.setAttribute('data-theme-transitioning', 'true');
  window.clearTimeout(themeTransitionTimer);
  themeTransitionTimer = window.setTimeout(() => {
    document.documentElement.removeAttribute('data-theme-transitioning');
  }, THEME_TRANSITION_MS);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const mountedRef = useRef(false);

  // Sync theme to DOM on mount + changes
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      syncTheme(theme);
      return;
    }
    triggerThemeTransition();
    syncTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setThemeDirect = useCallback((t: Theme) => {
    setTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeDirect }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
