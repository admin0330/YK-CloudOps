import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

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

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === 'dark' || v === 'light') return v;
  return 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#050507' : '#f7f4ef');
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  // Sync theme to DOM on mount + changes
  useEffect(() => {
    applyTheme(theme);
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
