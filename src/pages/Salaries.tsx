import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Building2, ArrowUpDown, X, TrendingUp, Gift } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
type SortKey = 'nome' | 'departamento' | 'cargo' | 'salario' | 'status';
type SortDir = 'asc' | 'desc';
type StatusOption = 'Ativo' | 'Afastado' | 'Desligado' | 'Teste' | 'Prestador de Serviço' | 'Aviso Prévio';
const STATUS_OPTIONS: { value: StatusOption; label: string }[] = [
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Teste', label: 'Teste' },
  { value: 'Prestador de Serviço', label: 'Prestador de Serviço' },
  { value: 'Afastado', label: 'Afastado' },
  { value: 'Aviso Prévio', label: 'Aviso Prévio' },
  { value: 'Desligado', label: 'Desligado' },
];

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === 'Ativo' ? 'bg-emerald-100 text-emerald-700'
    : status === 'Afastado' ? 'bg-amber-100 text-amber-700'
    : status === 'Teste' ? 'bg-sky-100 text-sky-700'
    : status === 'Prestador de Serviço' ? 'bg-violet-100 text-violet-700'
    : status === 'Aviso Prévio' ? 'bg-orange-100 text-orange-700'
    : 'bg-red-100 text-red-700';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>{status}</span>;
}

export default function Salaries() {
  const { data: employees = [], isLoading } = useEmployees();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState<StatusOption[]>(['Ativo', 'Afastado']);
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nome');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const departments = useMemo(() => [...new Set(employees.map(f => f.departamento))].sort(), [employees]);
  const toggleStatus = (status: StatusOption) => setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);

  // Considera apenas funcionários ativos no mês/ano selecionado:
  // admitidos até o último dia do mês E ainda não desligados antes do primeiro dia do mês.
  const periodEmployees = useMemo(() => {
    const periodStart = new Date(selectedYear, selectedMonth, 1);
    const periodEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    return employees.filter(f => {
      const adm = f.data_admissao ? new Date(f.data_admissao) : null;
      if (!adm || adm > periodEnd) return false;
      const des = (f as any).data_desligamento ? new Date((f as any).data_desligamento) : null;
      if (des && des < periodStart) return false;
      return true;
    });
  }, [employees, selectedMonth, selectedYear]);

  const filtered = useMemo(() => {
    let list = [...periodEmployees];
    if (search) list = list.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));
    if (deptFilter !== 'all') list = list.filter(f => f.departamento === deptFilter);
    if (selectedStatuses.length > 0) list = list.filter(f => selectedStatuses.includes(f.status as StatusOption));
    if (minSalary) list = list.filter(f => f.salario >= Number(minSalary));
    if (maxSalary) list = list.filter(f => f.salario <= Number(maxSalary));
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'salario') cmp = a.salario - b.salario;
      else cmp = String((a as any)[sortKey]).localeCompare(String((b as any)[sortKey]));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [periodEmployees, search, deptFilter, selectedStatuses, minSalary, maxSalary, sortKey, sortDir]);

  const totalPayroll = useMemo(() => periodEmployees.filter(f => selectedStatuses.includes(f.status as StatusOption)).reduce((s, f) => s + f.salario, 0), [periodEmployees, selectedStatuses]);
  const byDept = useMemo(() => {
    const map: Record<string, number> = {};
    periodEmployees.filter(f => selectedStatuses.includes(f.status as StatusOption)).forEach(f => { map[f.departamento] = (map[f.departamento] || 0) + f.salario; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [periodEmployees, selectedStatuses]);

  const fgts = totalPayroll * 0.08;
  const decimoTerceiro = totalPayroll / 12;
  const toggleSort = (key: SortKey) => { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc'); } };
  const clearFilters = () => { setSearch(''); setDeptFilter('all'); setSelectedStatuses(['Ativo', 'Afastado']); setMinSalary(''); setMaxSalary(''); };
  const hasFilters = search || deptFilter !== 'all' || minSalary || maxSalary || !(selectedStatuses.length === 2 && selectedStatuses.includes('Ativo') && selectedStatuses.includes('Afastado'));

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">{MONTHS[selectedMonth]} {selectedYear}</h2>
        <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{[2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_1fr] gap-4 items-stretch">
        <Card className="border-dashed"><CardContent className="pt-4 pb-3 flex flex-col justify-center h-full"><div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">FGTS Estimado (8%)</span></div><span className="text-base font-semibold text-foreground">{formatCurrency(fgts)}</span></CardContent></Card>
        <Card className="border-l-4 border-l-primary"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Folha Total (Mês Atual)</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /><span className="text-2xl font-bold text-foreground">{formatCurrency(totalPayroll)}</span></div></CardContent></Card>
        <Card className="border-dashed"><CardContent className="pt-4 pb-3 flex flex-col justify-center h-full"><div className="flex items-center gap-2 mb-1"><Gift className="w-4 h-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">13º Estimado (÷12)</span></div><span className="text-base font-semibold text-foreground">{formatCurrency(decimoTerceiro)}</span></CardContent></Card>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {byDept.map(([dept, total]) => (
          <Card key={dept} className="w-full sm:w-[220px]"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{dept}</CardTitle></CardHeader><CardContent><span className="text-lg font-semibold text-foreground">{formatCurrency(total)}</span></CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="pt-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]"><label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar por nome</label><Input placeholder="Nome do funcionário..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="w-[180px]"><label className="text-xs font-medium text-muted-foreground mb-1 block">Departamento</label><Select value={deptFilter} onValueChange={setDeptFilter}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
          <div className="min-w-[200px] flex-1"><label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label><div className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-border rounded-md px-3 py-2">{STATUS_OPTIONS.map(opt => (<label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer"><Checkbox checked={selectedStatuses.includes(opt.value)} onCheckedChange={() => toggleStatus(opt.value)} /><span>{opt.label}</span></label>))}</div></div>
          <div className="w-[130px]"><label className="text-xs font-medium text-muted-foreground mb-1 block">Salário mín.</label><Input type="number" placeholder="0" value={minSalary} onChange={e => setMinSalary(e.target.value)} /></div>
          <div className="w-[130px]"><label className="text-xs font-medium text-muted-foreground mb-1 block">Salário máx.</label><Input type="number" placeholder="∞" value={maxSalary} onChange={e => setMaxSalary(e.target.value)} /></div>
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground"><X className="w-4 h-4 mr-1" /> Limpar</Button>}
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-6 p-0 sm:p-6 sm:pt-6"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          {([['nome','Nome'],['departamento','Departamento'],['cargo','Cargo'],['salario','Salário'],['status','Status']] as [SortKey,string][]).map(([key,label]) => (
            <TableHead key={key} className="cursor-pointer select-none" onClick={() => toggleSort(key)}><div className="flex items-center gap-1">{label}<ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === key ? 'text-primary' : 'text-muted-foreground/40'}`} /></div></TableHead>
          ))}
        </TableRow></TableHeader>
        <TableBody>
          {filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum funcionário encontrado.</TableCell></TableRow>
          : filtered.map(f => (
            <TableRow key={f.id}><TableCell className="font-medium">{f.nome}</TableCell><TableCell>{f.departamento}</TableCell><TableCell>{f.cargo}</TableCell><TableCell className="font-semibold">{formatCurrency(f.salario)}</TableCell><TableCell><StatusBadge status={f.status} /></TableCell></TableRow>
          ))}
        </TableBody></Table>
      </div></CardContent></Card>
    </div>
  );
}
