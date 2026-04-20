import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'corporate-blue' | 'emerald-hr' | 'violet-pro' | 'slate-gray';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  category: string;
  description: string;
  /** Swatch color shown in the picker (CSS color, any format). */
  swatch: string;
}

export const THEMES: ThemeDefinition[] = [
  { id: 'corporate-blue', name: 'Corporate Blue', category: 'Corporativo', description: 'Azul & cinza escuro', swatch: '#2563EB' },
  { id: 'emerald-hr',     name: 'Emerald HR',     category: 'Natural',     description: 'Verde & bege neutro', swatch: '#059669' },
  { id: 'violet-pro',     name: 'Violet Pro',     category: 'Moderno',     description: 'Roxo & lavanda',      swatch: '#7C3AED' },
  { id: 'slate-gray',     name: 'Slate Gray',     category: 'Slate Gray',  description: 'Cinza & prata neutro', swatch: '#6B7280' },
];

const STORAGE_KEY = 'hr-app-theme';
const DEFAULT_THEME: ThemeId = 'corporate-blue';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue>(null!);

function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  root.setAttribute('data-theme', id);
  // Always run in light mode — we removed the dark toggle.
  root.classList.remove('dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    return stored && THEMES.some(t => t.id === stored) ? stored : DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (id: ThemeId) => setThemeState(id);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
