import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, BarChart3, LogOut, FileText, Settings, Menu, X, UserCog, ClipboardList, ChevronDown, ChevronRight, DollarSign, Briefcase, Landmark, Receipt, Power } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useSystemUsers } from '@/hooks/useFinancial';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

interface SidebarGroup {
  label: string;
  icon: React.ElementType;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: 'Recursos Humanos',
    icon: Briefcase,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { label: 'Funcionários', icon: Users, path: '/funcionarios' },
      { label: 'Novo Funcionário', icon: UserPlus, path: '/novo-funcionario' },
      { label: 'Avaliações', icon: BarChart3, path: '/avaliacoes' },
      { label: 'Desligamentos', icon: LogOut, path: '/desligamentos' },
    ],
  },
  {
    label: 'Financeiro',
    icon: Landmark,
    items: [
      { label: 'Salário (Bruto)', icon: DollarSign, path: '/salarios' },
      { label: 'Salário (Líquido)', icon: DollarSign, path: '/salario-liquido' },
      { label: 'Vale Alimentação', icon: DollarSign, path: '/vale-alimentacao' },
      { label: 'Vale Transporte', icon: DollarSign, path: '/vale-transporte' },
    ],
  },
  {
    label: 'Despesas',
    icon: Receipt,
    items: [
      { label: 'Controle de Despesas', icon: Receipt, path: '/controle-despesas' },
    ],
  },
  {
    label: 'Configurações',
    icon: Settings,
    items: [
      { label: 'Usuários', icon: UserCog, path: '/usuarios' },
      { label: 'Configurações', icon: Settings, path: '/configuracoes' },
    ],
  },
];

const standaloneItems: SidebarItem[] = [
  { label: 'Relatórios', icon: FileText, path: '/relatorios' },
  { label: 'Histórico', icon: ClipboardList, path: '/historico' },
];

const allItems = [...sidebarGroups.flatMap(g => g.items), ...standaloneItems];

function isPathActive(pathname: string, path: string) {
  return pathname === path || (path !== '/' && pathname.startsWith(path));
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, setCurrentUser } = useApp();
  const { data: usuarios = [] } = useSystemUsers();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Accordion: find which group contains the active route and default-open it
  const activeGroupIndex = sidebarGroups.findIndex(g =>
    g.items.some(i => isPathActive(location.pathname, i.path))
  );
  const [openGroup, setOpenGroup] = useState<number | null>(activeGroupIndex >= 0 ? activeGroupIndex : 0);

  const toggleGroup = (idx: number) => {
    setOpenGroup(prev => (prev === idx ? null : idx));
  };

  return (
    <div className="flex min-h-screen w-full">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col bg-sidebar transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold text-sidebar-primary-foreground">GestãoPeople</span>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Collapsible groups */}
          {sidebarGroups.map((group, idx) => {
            const isOpen = openGroup === idx;
            const groupActive = group.items.some(i => isPathActive(location.pathname, i.path));

            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(idx)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    groupActive ? 'text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <group.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="ml-3 pl-3 border-l border-sidebar-border space-y-0.5 py-1">
                    {group.items.map(item => {
                      const isActive = isPathActive(location.pathname, item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`sidebar-item ${isActive ? 'active' : ''}`}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Standalone items */}
          <div className="pt-2 border-t border-sidebar-border mt-2 space-y-0.5">
            {standaloneItems.map(item => {
              const isActive = isPathActive(location.pathname, item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="pt-2 border-t border-sidebar-border mt-2">
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-left hover:!bg-destructive/20 hover:!text-destructive"
            >
              <Power className="w-5 h-5 flex-shrink-0" />
              <span>Sair</span>
            </button>
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-foreground">
              {currentUser.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser.nome}</p>
              <p className="text-xs text-sidebar-muted truncate">{currentUser.nivelAcesso}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center gap-4">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-heading text-lg font-semibold text-foreground truncate flex-1">
            {allItems.find(i => isPathActive(location.pathname, i.path))?.label || 'GestãoPeople'}
          </h1>

          {/* User switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                {currentUser.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:inline">{currentUser.nome}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {usuarios.filter(u => u.status === 'Ativo').map(u => (
                <DropdownMenuItem key={u.id} onClick={() => setCurrentUser(u)} className={currentUser.id === u.id ? 'bg-muted' : ''}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                      {u.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.nome}</p>
                      <p className="text-xs text-muted-foreground">{u.nivelAcesso}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
