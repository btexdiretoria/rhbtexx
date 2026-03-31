import { useState, useMemo, useCallback, useEffect } from 'react';
import { funcionariosMock } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, Plus, Trash2, Pencil, Check, Search, X } from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ColumnDef {
  id: string;
  name: string;
  type: 'earning' | 'deduction';
}

interface MonthData {
  columns: ColumnDef[];
  values: Record<string, Record<string, number>>; // employeeId -> columnId -> value
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'earn1', name: 'Salário Base', type: 'earning' },
  { id: 'earn2', name: 'Horas Extras', type: 'earning' },
  { id: 'ded1', name: 'INSS', type: 'deduction' },
  { id: 'ded2', name: 'IRRF', type: 'deduction' },
  { id: 'ded3', name: 'Vale Transporte', type: 'deduction' },
  { id: 'ded4', name: 'Vale Refeição', type: 'deduction' },
  { id: 'ded5', name: 'Plano de Saúde', type: 'deduction' },
];

function getStorageKey(year: number, month: number) {
  return `net-salary-${year}-${month}`;
}

function loadMonthData(year: number, month: number): MonthData {
  try {
    const raw = localStorage.getItem(getStorageKey(year, month));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { columns: [...DEFAULT_COLUMNS], values: {} };
}

function saveMonthData(year: number, month: number, data: MonthData) {
  localStorage.setItem(getStorageKey(year, month), JSON.stringify(data));
}

let colCounter = 100;

export default function NetSalary() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthData, setMonthData] = useState<MonthData>(() => loadMonthData(selectedYear, selectedMonth));
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState('');

  // Reload data when month changes
  useEffect(() => {
    setMonthData(loadMonthData(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  // Persist on every change
  useEffect(() => {
    saveMonthData(selectedYear, selectedMonth, monthData);
  }, [monthData, selectedYear, selectedMonth]);

  const employees = useMemo(() => {
    let list = funcionariosMock.filter(f => {
      if (f.status === 'Ativo' || f.status === 'Afastado') return true;
      if (f.status === 'Desligado' && f.dataDesligamento) {
        const d = new Date(f.dataDesligamento);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      }
      return false;
    });
    if (search) list = list.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') list = list.filter(f => f.status === statusFilter);
    return list;
  }, [search, statusFilter, selectedYear, selectedMonth]);

  const earningCols = monthData.columns.filter(c => c.type === 'earning');
  const deductionCols = monthData.columns.filter(c => c.type === 'deduction');

  const getCellValue = (empId: string, colId: string) =>
    monthData.values[empId]?.[colId] || 0;

  const setCellValue = useCallback((empId: string, colId: string, val: number) => {
    setMonthData(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [empId]: { ...prev.values[empId], [colId]: val },
      },
    }));
  }, []);

  const getEarningsTotal = (empId: string) =>
    earningCols.reduce((s, c) => s + getCellValue(empId, c.id), 0);

  const getDeductionsTotal = (empId: string) =>
    deductionCols.reduce((s, c) => s + getCellValue(empId, c.id), 0);

  const getNet = (empId: string) => getEarningsTotal(empId) - getDeductionsTotal(empId);

  const addColumn = (type: 'earning' | 'deduction') => {
    const id = `col_${Date.now()}_${colCounter++}`;
    const name = type === 'earning' ? 'Novo Provento' : 'Novo Desconto';
    setMonthData(prev => ({
      ...prev,
      columns: [...prev.columns, { id, name, type }],
    }));
  };

  const removeColumn = (id: string) => {
    const col = monthData.columns.find(c => c.id === id);
    if (!col) return;
    const sameType = monthData.columns.filter(c => c.type === col.type);
    if (sameType.length <= 1) return;
    setMonthData(prev => ({
      ...prev,
      columns: prev.columns.filter(c => c.id !== id),
    }));
  };

  const startEditCol = (col: ColumnDef) => {
    setEditingColId(col.id);
    setEditingColName(col.name);
  };

  const confirmEditCol = () => {
    if (!editingColId || !editingColName.trim()) return;
    setMonthData(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === editingColId ? { ...c, name: editingColName.trim() } : c),
    }));
    setEditingColId(null);
  };

  // Summary calculations
  const columnSums = useMemo(() => {
    const sums: Record<string, number> = {};
    monthData.columns.forEach(col => {
      sums[col.id] = employees.reduce((s, e) => s + getCellValue(e.id, col.id), 0);
    });
    sums['_net'] = employees.reduce((s, e) => s + getNet(e.id), 0);
    return sums;
  }, [monthData, employees]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      {/* Month Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-heading font-bold text-foreground">
          {MONTHS[selectedMonth]} {selectedYear}
        </h2>
        <div className="flex gap-2 ml-auto">
          <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {earningCols.map(col => (
          <Card key={col.id} className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground truncate">{col.name}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <span className="text-lg font-bold text-foreground">{formatCurrency(columnSums[col.id] || 0)}</span>
            </CardContent>
          </Card>
        ))}
        {deductionCols.map(col => (
          <Card key={col.id} className="border-l-4 border-l-destructive">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground truncate">{col.name}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <span className="text-lg font-bold text-foreground">{formatCurrency(columnSums[col.id] || 0)}</span>
            </CardContent>
          </Card>
        ))}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Líquido Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <span className="text-lg font-bold text-primary">{formatCurrency(columnSums['_net'] || 0)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Nome do funcionário..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                  <SelectItem value="Desligado">Desligado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(search || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                <X className="w-4 h-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              {/* Group Headers */}
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium text-muted-foreground" rowSpan={2} style={{ minWidth: 180 }}>
                    Funcionário
                  </th>
                  <th className="bg-card px-3 py-2 text-left font-medium text-muted-foreground" rowSpan={2} style={{ minWidth: 100 }}>
                    Status
                  </th>
                  <th
                    colSpan={earningCols.length + 1}
                    className="px-3 py-2 text-center font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-x border-border"
                  >
                    Proventos
                  </th>
                  <th
                    colSpan={deductionCols.length + 1}
                    className="px-3 py-2 text-center font-semibold text-destructive bg-red-50 dark:bg-red-950/30 border-r border-border"
                  >
                    Descontos
                  </th>
                  <th className="px-3 py-2 text-center font-bold text-primary bg-primary/5" rowSpan={2} style={{ minWidth: 120 }}>
                    Líquido
                  </th>
                </tr>
                {/* Sub-headers */}
                <tr className="border-b border-border">
                  {earningCols.map(col => (
                    <th key={col.id} className="px-2 py-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-x border-border" style={{ minWidth: 120 }}>
                      <div className="flex items-center gap-1 group">
                        {editingColId === col.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-6 text-xs px-1 w-24"
                              value={editingColName}
                              onChange={e => setEditingColName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && confirmEditCol()}
                              autoFocus
                            />
                            <button onClick={confirmEditCol} className="text-emerald-600"><Check className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-medium text-muted-foreground truncate">{col.name}</span>
                            <button onClick={() => startEditCol(col)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                              <Pencil className="w-3 h-3" />
                            </button>
                            {earningCols.length > 1 && (
                              <button onClick={() => removeColumn(col.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-1 py-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-r border-border">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => addColumn('earning')} className="w-6 h-6 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Adicionar Provento</TooltipContent>
                    </Tooltip>
                  </th>

                  {deductionCols.map(col => (
                    <th key={col.id} className="px-2 py-1.5 bg-red-50/50 dark:bg-red-950/20 border-x border-border" style={{ minWidth: 120 }}>
                      <div className="flex items-center gap-1 group">
                        {editingColId === col.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-6 text-xs px-1 w-24"
                              value={editingColName}
                              onChange={e => setEditingColName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && confirmEditCol()}
                              autoFocus
                            />
                            <button onClick={confirmEditCol} className="text-destructive"><Check className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-medium text-muted-foreground truncate">{col.name}</span>
                            <button onClick={() => startEditCol(col)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                              <Pencil className="w-3 h-3" />
                            </button>
                            {deductionCols.length > 1 && (
                              <button onClick={() => removeColumn(col.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-1 py-1.5 bg-red-50/50 dark:bg-red-950/20 border-r border-border">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => addColumn('deduction')} className="w-6 h-6 rounded flex items-center justify-center text-destructive hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Adicionar Desconto</TooltipContent>
                    </Tooltip>
                  </th>
                </tr>
              </thead>

              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={earningCols.length + deductionCols.length + 5} className="text-center text-muted-foreground py-8">
                      Nenhum funcionário encontrado.
                    </td>
                  </tr>
                ) : (
                  employees.map(emp => {
                    const net = getNet(emp.id);
                    return (
                      <tr key={emp.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground whitespace-nowrap">
                          {emp.nome}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            emp.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            emp.status === 'Afastado' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                            'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                          }`}>{emp.status}</span>
                        </td>
                        {earningCols.map(col => (
                          <td key={col.id} className="px-1 py-1 bg-emerald-50/20 dark:bg-emerald-950/10 border-x border-border/50">
                            <Input
                              type="number"
                              className="h-7 text-xs text-right px-1.5 border-transparent hover:border-border focus:border-primary bg-transparent"
                              value={getCellValue(emp.id, col.id) || ''}
                              onChange={e => setCellValue(emp.id, col.id, Number(e.target.value) || 0)}
                              placeholder="0,00"
                            />
                          </td>
                        ))}
                        <td className="bg-emerald-50/20 dark:bg-emerald-950/10 border-r border-border/50" />
                        {deductionCols.map(col => (
                          <td key={col.id} className="px-1 py-1 bg-red-50/20 dark:bg-red-950/10 border-x border-border/50">
                            <Input
                              type="number"
                              className="h-7 text-xs text-right px-1.5 border-transparent hover:border-border focus:border-primary bg-transparent"
                              value={getCellValue(emp.id, col.id) || ''}
                              onChange={e => setCellValue(emp.id, col.id, Number(e.target.value) || 0)}
                              placeholder="0,00"
                            />
                          </td>
                        ))}
                        <td className="bg-red-50/20 dark:bg-red-950/10 border-r border-border/50" />
                        <td className="px-3 py-2 text-right font-bold text-primary bg-primary/5 whitespace-nowrap">
                          {formatCurrency(net)}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Totals Row */}
                {employees.length > 0 && (
                  <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                    <td className="sticky left-0 z-10 bg-muted/30 px-3 py-2 text-foreground">Totais</td>
                    <td />
                    {earningCols.map(col => (
                      <td key={col.id} className="px-2 py-2 text-right text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 border-x border-border/50">
                        {formatCurrency(columnSums[col.id] || 0)}
                      </td>
                    ))}
                    <td className="bg-emerald-50/30 dark:bg-emerald-950/20 border-r border-border/50" />
                    {deductionCols.map(col => (
                      <td key={col.id} className="px-2 py-2 text-right text-xs text-destructive bg-red-50/30 dark:bg-red-950/20 border-x border-border/50">
                        {formatCurrency(columnSums[col.id] || 0)}
                      </td>
                    ))}
                    <td className="bg-red-50/30 dark:bg-red-950/20 border-r border-border/50" />
                    <td className="px-3 py-2 text-right font-bold text-primary bg-primary/10">
                      {formatCurrency(columnSums['_net'] || 0)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
