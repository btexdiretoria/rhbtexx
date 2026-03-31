import { useState, useMemo } from 'react';
import { funcionariosMock } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Building2, ArrowUpDown, X } from 'lucide-react';

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type SortKey = 'nome' | 'departamento' | 'cargo' | 'salario' | 'status';
type SortDir = 'asc' | 'desc';

export default function Salaries() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nome');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const departments = useMemo(() =>
    [...new Set(funcionariosMock.map(f => f.departamento))].sort(), []);

  const filtered = useMemo(() => {
    let list = [...funcionariosMock];

    if (search) list = list.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));
    if (deptFilter !== 'all') list = list.filter(f => f.departamento === deptFilter);
    if (statusFilter !== 'all') list = list.filter(f => f.status === statusFilter);
    if (minSalary) list = list.filter(f => f.salario >= Number(minSalary));
    if (maxSalary) list = list.filter(f => f.salario <= Number(maxSalary));

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'salario') cmp = a.salario - b.salario;
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [search, deptFilter, statusFilter, minSalary, maxSalary, sortKey, sortDir]);

  const totalPayroll = useMemo(() =>
    funcionariosMock.filter(f => f.status === 'Ativo').reduce((s, f) => s + f.salario, 0), []);

  const byDept = useMemo(() => {
    const map: Record<string, number> = {};
    funcionariosMock.filter(f => f.status === 'Ativo').forEach(f => {
      map[f.departamento] = (map[f.departamento] || 0) + f.salario;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const clearFilters = () => {
    setSearch(''); setDeptFilter('all'); setStatusFilter('all');
    setMinSalary(''); setMaxSalary('');
  };

  const hasFilters = search || deptFilter !== 'all' || statusFilter !== 'all' || minSalary || maxSalary;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Folha Total (Mês Atual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{formatCurrency(totalPayroll)}</span>
            </div>
          </CardContent>
        </Card>

        {byDept.map(([dept, total]) => (
          <Card key={dept}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {dept}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-lg font-semibold text-foreground">{formatCurrency(total)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar por nome</label>
              <Input placeholder="Nome do funcionário..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="w-[180px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Departamento</label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                  <SelectItem value="Desligado">Desligado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[130px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Salário mín.</label>
              <Input type="number" placeholder="0" value={minSalary} onChange={e => setMinSalary(e.target.value)} />
            </div>
            <div className="w-[130px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Salário máx.</label>
              <Input type="number" placeholder="∞" value={maxSalary} onChange={e => setMaxSalary(e.target.value)} />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6 p-0 sm:p-6 sm:pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {([['nome', 'Nome'], ['departamento', 'Departamento'], ['cargo', 'Cargo'], ['salario', 'Salário'], ['status', 'Status']] as [SortKey, string][]).map(([key, label]) => (
                    <TableHead key={key} className="cursor-pointer select-none" onClick={() => toggleSort(key)}>
                      <div className="flex items-center gap-1">
                        {label}
                        <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === key ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum funcionário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell>{f.departamento}</TableCell>
                      <TableCell>{f.cargo}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(f.salario)}</TableCell>
                      <TableCell>
                        <Badge variant={f.status === 'Ativo' ? 'default' : f.status === 'Desligado' ? 'destructive' : 'secondary'}>
                          {f.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
