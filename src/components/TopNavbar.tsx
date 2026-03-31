import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, BarChart3, LogOut, DollarSign, ChevronDown } from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const rhItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Funcionários', icon: Users, path: '/funcionarios' },
  { label: 'Novo Funcionário', icon: UserPlus, path: '/novo-funcionario' },
  { label: 'Avaliações', icon: BarChart3, path: '/avaliacoes' },
  { label: 'Desligamentos', icon: LogOut, path: '/desligamentos' },
];

const financeiroItems: MenuItem[] = [
  { label: 'Salários', icon: DollarSign, path: '/salarios' },
];

function DropdownNav({ label, items, isActive }: { label: string; items: MenuItem[]; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        }`}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`absolute top-full left-0 mt-1 w-52 rounded-lg border border-border bg-popover shadow-lg overflow-hidden transition-all duration-200 origin-top ${
          open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'
        }`}
      >
        <div className="py-1">
          {items.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TopNavbar() {
  const location = useLocation();
  const rhPaths = rhItems.map(i => i.path);
  const finPaths = financeiroItems.map(i => i.path);

  const isRhActive = rhPaths.some(p => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p));
  const isFinActive = finPaths.some(p => location.pathname.startsWith(p));

  return (
    <div className="flex items-center gap-1">
      <DropdownNav label="Recursos Humanos" items={rhItems} isActive={isRhActive} />
      <DropdownNav label="Financeiro" items={financeiroItems} isActive={isFinActive} />
    </div>
  );
}
