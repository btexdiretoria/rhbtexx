import { Check, Palette } from 'lucide-react';
import { useTheme, THEMES } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeSwitcherProps {
  variant?: 'icon' | 'sidebar';
}

export default function ThemeSwitcher({ variant = 'icon' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const active = THEMES.find(t => t.id === theme) ?? THEMES[0];

  const Trigger =
    variant === 'sidebar' ? (
      <button className="sidebar-item w-full text-left">
        <Palette className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">Tema</span>
        <span
          className="w-4 h-4 rounded-full border border-sidebar-border"
          style={{ background: active.swatch }}
          aria-hidden
        />
      </button>
    ) : (
      <button
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors"
        title={`Tema: ${active.name}`}
        aria-label="Alterar tema"
      >
        <Palette className="w-4 h-4 text-foreground" />
        <span
          className="w-4 h-4 rounded-full border border-border"
          style={{ background: active.swatch }}
          aria-hidden
        />
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{Trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-3">
        <DropdownMenuLabel className="px-1">Selecionar tema</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid grid-cols-2 gap-2 pt-2">
          {THEMES.map(t => {
            const isActive = t.id === theme;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`group flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                  isActive ? 'border-primary bg-accent' : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
              >
                <span className="relative">
                  <span
                    className={`block w-9 h-9 rounded-full ring-offset-2 ring-offset-popover transition-all ${
                      isActive ? 'ring-2 ring-primary' : ''
                    }`}
                    style={{ background: t.swatch }}
                  />
                  {isActive && (
                    <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" strokeWidth={3} />
                  )}
                </span>
                <span className="text-xs font-semibold text-foreground leading-tight text-center">{t.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">{t.description}</span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
