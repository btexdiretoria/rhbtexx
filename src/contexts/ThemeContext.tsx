import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'corporate-blue' | 'navy-pro' | 'violet-pro' | 'cosmic';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  category: string;
  description: string;
  /** Swatch color shown in the picker (CSS color, any format). */
  swatch: string;
}

export const THEMES: ThemeDefinition[] = [
  { id: 'corporate-blue', name: 'Corporate Blue', category: 'Corporativo', description: 'Azul & sidebar escuro', swatch: '#2563EB' },
  { id: 'navy-pro',       name: 'Navy Pro',       category: 'Profissional', description: 'Azul marinho suave',   swatch: '#2B5FA0' },
  { id: 'violet-pro',     name: 'Violet Pro',     category: 'Moderno',     description: 'Roxo & lavanda',       swatch: '#7C3AED' },
  { id: 'cosmic',         name: 'Cosmic',         category: 'Criativo',    description: 'Índigo & violeta',     swatch: '#6C63FF' },
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
