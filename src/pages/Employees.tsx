import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { funcionariosMock, type StatusFuncionario } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ITEMS_PER_PAGE = 8;
const departamentos = ['Todos', 'Tecnologia', 'Recursos Humanos', 'Financeiro', 'Comercial', 'Marketing', 'Operações'];
const statusOptions: ('Todos' | StatusFuncionario)[] = ['Todos', 'Ativo', 'Inativo', 'Afastado', 'Desligado'];

export default function Employees() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [deptFilter, setDeptFilter] = useState('Todos');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return funcionariosMock.filter(f => {
      const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Todos' || f.status === statusFilter;
      const matchDept = deptFilter === 'Todos' || f.departamento === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [search, statusFilter, deptFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="kpi-card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{departamentos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Exportar</Button>
        </div>
        <p className="text-sm text-muted-foreground mt-3">Exibindo {paginated.length} de {filtered.length} funcionários</p>
      </div>

      {/* Desktop Table */}
      <div className="kpi-card overflow-hidden p-0 hidden md:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Admissão</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
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
                <td className="text-muted-foreground">{new Date(f.dataAdmissao).toLocaleDateString('pt-BR')}</td>
                <td><span className={`status-badge status-${f.status.toLowerCase()}`}>{f.status}</span></td>
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

      {/* Mobile Cards */}
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
              <span className={`status-badge status-${f.status.toLowerCase()}`}>{f.status}</span>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{f.departamento}</span>
              <span>Adm: {new Date(f.dataAdmissao).toLocaleDateString('pt-BR')}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button key={i + 1} variant={page === i + 1 ? 'default' : 'outline'} size="sm" onClick={() => setPage(i + 1)}>
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
