import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Lang } from '../lib/i18n';
import { getInitialLang, saveLang, t as translate } from '../lib/i18n';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LangCtx>({
  lang: 'zh',
  setLang: () => {},
  t: (k: string) => k,
});

function syncLanguage(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  useEffect(() => {
    syncLanguage(lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    saveLang(l);
    syncLanguage(l);
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
