import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, LayoutList, LayoutGrid, Pencil, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useFinancial';

type StatusFuncionario = 'Ativo' | 'Afastado' | 'Desligado' | 'Prestador de Serviço' | 'Teste';
const statusDisplayLabel: Record<StatusFuncionario, string> = { Ativo: 'Ativo', Afastado: 'Afastado', Desligado: 'Desligado', 'Prestador de Serviço': 'Prestador de Serviço', Teste: 'Teste' };


const ALL_STATUSES: StatusFuncionario[] = ['Ativo', 'Teste', 'Afastado', 'Desligado', 'Prestador de Serviço'];
const pageSizeOptions = [10, 25, 50, 100];

const deptColors: Record<string, string> = {
  'Tecnologia': 'bg-primary/10 text-primary',
  'Recursos Humanos': 'bg-emerald-50 text-emerald-700',
  'Financeiro': 'bg-amber-50 text-amber-700',
  'Comercial': 'bg-violet-50 text-violet-700',
  'Marketing': 'bg-pink-50 text-pink-700',
  'Operações': 'bg-sky-50 text-sky-700',
};

const deptBorderColors: Record<string, string> = {
  'Tecnologia': 'border-t-primary',
  'Recursos Humanos': 'border-t-emerald-500',
  'Financeiro': 'border-t-amber-500',
  'Comercial': 'border-t-violet-500',
  'Marketing': 'border-t-pink-500',
  'Operações': 'border-t-sky-500',
};

export default function Employees() {
  const { data: employees = [], isLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const departamentos = ['Todos', ...departments.map(d => d.name)];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFuncionario[]>([...ALL_STATUSES]);
  const [deptFilter, setDeptFilter] = useState('Todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const toggleStatus = (s: StatusFuncionario) => {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setPage(1);
  };
  const allStatusesSelected = statusFilter.length === ALL_STATUSES.length;
  const statusLabel = allStatusesSelected
    ? 'Todos os status'
    : statusFilter.length === 0
      ? 'Nenhum status'
      : statusFilter.length === 1
        ? statusDisplayLabel[statusFilter[0]]
        : `${statusFilter.length} status`;

  const filtered = useMemo(() => {
    return employees.filter(f => {
      const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter.includes(f.status as StatusFuncionario);
      const matchDept = deptFilter === 'Todos' || f.departamento === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [employees, search, statusFilter, deptFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, filtered.length);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando funcionários...</p></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="kpi-card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-48 justify-start font-normal h-10">
                <Filter className="w-4 h-4 mr-2" />
                <span className="truncate">{statusLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => { setStatusFilter(allStatusesSelected ? [] : [...ALL_STATUSES]); setPage(1); }}
                >
                  {allStatusesSelected ? 'Limpar' : 'Todos'}
                </button>
              </div>
              <div className="space-y-0.5">
                {ALL_STATUSES.map(s => {
                  const checked = statusFilter.includes(s);
                  return (
                    <label key={s} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer">
                      <Checkbox checked={checked} onCheckedChange={() => toggleStatus(s)} />
                      <span className="text-sm text-foreground flex-1">{statusDisplayLabel[s]}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-primary" />}
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{departamentos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-full md:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{pageSizeOptions.map(n => <SelectItem key={n} value={String(n)}>{n} por página</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex border border-border rounded-md overflow-hidden">
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-none gap-1.5 h-10" onClick={() => setViewMode('list')}>
              <LayoutList className="w-4 h-4" /><span className="hidden sm:inline">Lista</span>
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="rounded-none gap-1.5 h-10" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="w-4 h-4" /><span className="hidden sm:inline">Quadro</span>
            </Button>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Exportar</Button>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Exibindo {filtered.length > 0 ? `${startItem}–${endItem}` : '0'} de {filtered.length} funcionários
        </p>
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="kpi-card overflow-hidden p-0 hidden md:block">
            <table className="data-table">
              <thead>
                <tr><th>Funcionário</th><th>Cargo</th><th>Departamento</th><th>Admissão</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {paginated.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                          {f.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium text-foreground">{f.nome}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{f.cargo}</td>
                    <td className="text-muted-foreground">{f.departamento}</td>
                    <td className="text-muted-foreground">{new Date(f.data_admissao).toLocaleDateString('pt-BR')}</td>
                    <td><span className={`status-badge status-${f.status.toLowerCase()}`}>{statusDisplayLabel[f.status as StatusFuncionario] || f.status}</span></td>
                    <td>
                      <Link to={`/funcionarios/${f.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {paginated.map(f => (
              <Link to={`/funcionarios/${f.id}`} key={f.id} className="kpi-card block">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {f.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{f.nome}</p>
                    <p className="text-sm text-muted-foreground">{f.cargo}</p>
                  </div>
                  <span className={`status-badge status-${f.status.toLowerCase()}`}>{statusDisplayLabel[f.status as StatusFuncionario] || f.status}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{f.departamento}</span>
                  <span>Adm: {new Date(f.data_admissao).toLocaleDateString('pt-BR')}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map(f => (
            <div key={f.id} className={`kpi-card border-t-4 ${deptBorderColors[f.departamento] || 'border-t-primary'} hover:shadow-lg transition-shadow duration-200 flex flex-col items-center text-center`}>
              <div className="w-[72px] h-[72px] rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary mb-3">
                {f.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <p className="font-heading font-semibold text-foreground break-words leading-tight">{f.nome}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{f.cargo}</p>
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${deptColors[f.departamento] || 'bg-muted text-muted-foreground'}`}>{f.departamento}</span>
                <span className={`status-badge status-${f.status.toLowerCase()}`}>{statusDisplayLabel[f.status as StatusFuncionario] || f.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Desde {new Date(f.data_admissao).toLocaleDateString('pt-BR')}</p>
              <div className="flex gap-2 mt-4 pt-3 border-t border-border w-full justify-center">
                <Link to={`/funcionarios/${f.id}`}><Button variant="outline" size="sm" className="gap-1.5"><Eye className="w-3.5 h-3.5" />Ver Perfil</Button></Link>
                <Link to={`/funcionarios/${f.id}`}><Button variant="ghost" size="sm" className="gap-1.5"><Pencil className="w-3.5 h-3.5" />Editar</Button></Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button key={i + 1} variant={page === i + 1 ? 'default' : 'outline'} size="sm" onClick={() => setPage(i + 1)}>{i + 1}</Button>
          ))}
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
}
