import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, Plus, Trash2, Pencil, Check, Search, X } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useNetSalaryColumns, useNetSalaryValues, useCreateNetSalaryColumn, useDeleteNetSalaryColumn, useUpdateNetSalaryColumn, useUpsertNetSalaryValue } from '@/hooks/useFinancial';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const DEFAULT_COLUMNS = [
  { column_id: 'earn1', name: 'Salário Base', type: 'earning' },
  { column_id: 'earn2', name: 'Horas Extras', type: 'earning' },
  { column_id: 'ded1', name: 'INSS', type: 'deduction' },
  { column_id: 'ded2', name: 'IRRF', type: 'deduction' },
  { column_id: 'ded3', name: 'Vale Transporte', type: 'deduction' },
  { column_id: 'ded4', name: 'Vale Refeição', type: 'deduction' },
  { column_id: 'ded5', name: 'Plano de Saúde', type: 'deduction' },
];

let colCounter = 100;

// ─── Célula isolada com estado local ───────────────────────────────────────
// Cada célula gerencia seu próprio valor localmente.
// O Supabase só é chamado quando o usuário sai do campo (onBlur),
// eliminando 1 requisição por tecla digitada.
interface SalaryCellProps {
  initialValue: number;
  onCommit: (val: number) => void;
}

function SalaryCell({ initialValue, onCommit }: SalaryCellProps) {
  const [localValue, setLocalValue] = useState<string>(initialValue === 0 ? '' : String(initialValue));

  // Sincroniza se o valor externo mudar (ex: mudança de mês)
  useEffect(() => {
    setLocalValue(initialValue === 0 ? '' : String(initialValue));
  }, [initialValue]);

  const handleBlur = () => {
    const num = Number(localValue) || 0;
    onCommit(num);
  };

  return (
    <Input
      type="number"
      className="h-7 text-xs text-right w-24"
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="0"
    />
  );
}
// ───────────────────────────────────────────────────────────────────────────

export default function NetSalary() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState('');
  const [initialized, setInitialized] = useState(false);

  const { data: allEmployees = [] } = useEmployees();
  const { data: columns = [], isLoading: colsLoading } = useNetSalaryColumns(selectedYear, selectedMonth);
  const { data: values = [] } = useNetSalaryValues(selectedYear, selectedMonth);
  const createColumn = useCreateNetSalaryColumn();
  const deleteColumn = useDeleteNetSalaryColumn();
  const updateColumn = useUpdateNetSalaryColumn();
  const upsertValue = useUpsertNetSalaryValue();

  // Auto-create default columns if none exist for this month
  useEffect(() => {
    if (!colsLoading && columns.length === 0 && !initialized) {
      setInitialized(true);
      DEFAULT_COLUMNS.forEach((col, idx) => {
        createColumn.mutate({
          column_id: col.column_id,
          name: col.name,
          type: col.type,
          year: selectedYear,
          month: selectedMonth,
          sort_order: idx,
        });
      });
    } else if (columns.length > 0) {
      setInitialized(true);
    }
  }, [colsLoading, columns.length, selectedYear, selectedMonth]);

  const employees = useMemo(() => {
    let list = allEmployees.filter(f => {
      if (f.status === 'Desligado' && f.data_desligamento) {
        const d = new Date(f.data_desligamento);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      }
      return f.status !== 'Desligado';
    });
    if (search) list = list.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') list = list.filter(f => f.status === statusFilter);
    return list;
  }, [allEmployees, search, statusFilter, selectedYear, selectedMonth]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set(allEmployees.map(e => e.status));
    return Array.from(statuses).sort();
  }, [allEmployees]);

  const earningCols = columns.filter(c => c.type === 'earning');
  const deductionCols = columns.filter(c => c.type === 'deduction');

  const valuesMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    values.forEach(v => {
      if (!map[v.employee_id]) map[v.employee_id] = {};
      map[v.employee_id][v.column_id] = v.value;
    });
    return map;
  }, [values]);

  const getCellValue = (empId: string, colId: string) => valuesMap[empId]?.[colId] || 0;

  // Só salva no Supabase quando chamado (no onBlur da célula)
  const setCellValue = useCallback((empId: string, colId: string, val: number) => {
    upsertValue.mutate({ employee_id: empId, column_id: colId, value: val, year: selectedYear, month: selectedMonth });
  }, [upsertValue, selectedYear, selectedMonth]);

  const getEarningsTotal = (empId: string) => earningCols.reduce((s, c) => s + getCellValue(empId, c.column_id), 0);
  const getDeductionsTotal = (empId: string) => deductionCols.reduce((s, c) => s + getCellValue(empId, c.column_id), 0);
  const getNet = (empId: string) => getEarningsTotal(empId) - getDeductionsTotal(empId);

  const addColumn = (type: 'earning' | 'deduction') => {
    const id = `col_${Date.now()}_${colCounter++}`;
    createColumn.mutate({ column_id: id, name: type === 'earning' ? 'Novo Provento' : 'Novo Desconto', type, year: selectedYear, month: selectedMonth, sort_order: columns.length });
  };

  const removeColumn = (id: string) => {
    const col = columns.find(c => c.id === id);
    if (!col) return;
    const sameType = columns.filter(c => c.type === col.type);
    if (sameType.length <= 1) return;
    deleteColumn.mutate(id);
  };

  const startEditCol = (col: typeof columns[0]) => { setEditingColId(col.id); setEditingColName(col.name); };
  const confirmEditCol = () => {
    if (!editingColId || !editingColName.trim()) return;
    updateColumn.mutate({ id: editingColId, name: editingColName.trim() });
    setEditingColId(null);
  };

  const columnSums = useMemo(() => {
    const sums: Record<string, number> = {};
    columns.forEach(col => { sums[col.column_id] = employees.reduce((s, e) => s + getCellValue(e.id, col.column_id), 0); });
    sums['_net'] = employees.reduce((s, e) => s + getNet(e.id), 0);
    return sums;
  }, [columns, employees, valuesMap]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  if (colsLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-heading font-bold text-foreground">{MONTHS[selectedMonth]} {selectedYear}</h2>
        <div className="flex gap-2 ml-auto">
          <Select value={String(selectedMonth)} onValueChange={v => { setSelectedMonth(Number(v)); setInitialized(false); }}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select>
          <Select value={String(selectedYear)} onValueChange={v => { setSelectedYear(Number(v)); setInitialized(false); }}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">Proventos</p>
          <div className="flex flex-wrap gap-2">
            {earningCols.map(col => (
              <Card key={col.id} className="border-l-4 border-l-emerald-500 flex-1 min-w-[140px] max-w-[200px]"><CardContent className="px-3 py-2.5"><p className="text-[11px] font-medium text-muted-foreground truncate mb-0.5">{col.name}</p><span className="text-sm font-bold text-foreground">{formatCurrency(columnSums[col.column_id] || 0)}</span></CardContent></Card>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-destructive mb-2 uppercase tracking-wider">Descontos</p>
          <div className="flex flex-wrap gap-2 justify-end">
            {deductionCols.map(col => (
              <Card key={col.id} className="border-l-4 border-l-destructive flex-1 min-w-[140px] max-w-[200px]"><CardContent className="px-3 py-2.5"><p className="text-[11px] font-medium text-muted-foreground truncate mb-0.5">{col.name}</p><span className="text-sm font-bold text-foreground">{formatCurrency(columnSums[col.column_id] || 0)}</span></CardContent></Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Card className="border-l-4 border-l-primary w-full max-w-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-sm font-medium text-muted-foreground text-center">Líquido Total</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3"><div className="flex items-center justify-center gap-2"><DollarSign className="w-5 h-5 text-primary" /><span className="text-xl font-bold text-primary">{formatCurrency(columnSums['_net'] || 0)}</span></div></CardContent>
        </Card>
      </div>

      <Card><CardContent className="pt-4 pb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]"><label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar</label><div className="relative"><Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" /><Input className="pl-8" placeholder="Nome do funcionário..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
          <div className="w-[160px]"><label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{availableStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          {(search || statusFilter !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}><X className="w-4 h-4 mr-1" /> Limpar</Button>}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium text-muted-foreground" rowSpan={2} style={{ minWidth: 180 }}>Funcionário</th>
              <th className="bg-card px-3 py-2 text-left font-medium text-muted-foreground" rowSpan={2} style={{ minWidth: 100 }}>Status</th>
              <th colSpan={earningCols.length + 1} className="px-3 py-2 text-center font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-x border-border">Proventos</th>
              <th colSpan={deductionCols.length + 1} className="px-3 py-2 text-center font-semibold text-destructive bg-red-50 dark:bg-red-950/30 border-r border-border">Descontos</th>
              <th className="px-3 py-2 text-center font-bold text-primary bg-primary/5" rowSpan={2} style={{ minWidth: 120 }}>Líquido</th>
            </tr>
            <tr className="border-b border-border">
              {earningCols.map(col => (
                <th key={col.id} className="px-2 py-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-x border-border" style={{ minWidth: 120 }}>
                  <div className="flex items-center gap-1 group">
                    {editingColId === col.id ? (
                      <div className="flex items-center gap-1"><Input className="h-6 text-xs px-1 w-24" value={editingColName} onChange={e => setEditingColName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmEditCol()} autoFocus /><button onClick={confirmEditCol} className="text-emerald-600"><Check className="w-3 h-3" /></button></div>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-muted-foreground truncate">{col.name}</span>
                        <button onClick={() => startEditCol(col)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                        {earningCols.length > 1 && <button onClick={() => removeColumn(col.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>}
                      </>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-1 py-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-r border-border">
                <Tooltip><TooltipTrigger asChild><button onClick={() => addColumn('earning')} className="w-6 h-6 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"><Plus className="w-3.5 h-3.5" /></button></TooltipTrigger><TooltipContent>Adicionar Provento</TooltipContent></Tooltip>
              </th>
              {deductionCols.map(col => (
                <th key={col.id} className="px-2 py-1.5 bg-red-50/50 dark:bg-red-950/20 border-x border-border" style={{ minWidth: 120 }}>
                  <div className="flex items-center gap-1 group">
                    {editingColId === col.id ? (
                      <div className="flex items-center gap-1"><Input className="h-6 text-xs px-1 w-24" value={editingColName} onChange={e => setEditingColName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmEditCol()} autoFocus /><button onClick={confirmEditCol} className="text-destructive"><Check className="w-3 h-3" /></button></div>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-muted-foreground truncate">{col.name}</span>
                        <button onClick={() => startEditCol(col)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                        {deductionCols.length > 1 && <button onClick={() => removeColumn(col.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>}
                      </>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-1 py-1.5 bg-red-50/50 dark:bg-red-950/20 border-r border-border">
                <Tooltip><TooltipTrigger asChild><button onClick={() => addColumn('deduction')} className="w-6 h-6 rounded flex items-center justify-center text-destructive hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"><Plus className="w-3.5 h-3.5" /></button></TooltipTrigger><TooltipContent>Adicionar Desconto</TooltipContent></Tooltip>
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={earningCols.length + deductionCols.length + 5} className="text-center text-muted-foreground py-8">Nenhum funcionário encontrado.</td></tr>
            ) : employees.map(emp => {
              const net = getNet(emp.id);
              return (
                <tr key={emp.id} className="border-b border-border hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground">{emp.nome}</td>
                  <td className="px-3 py-2"><Badge variant={emp.status === 'Ativo' ? 'default' : 'secondary'} className="text-xs">{emp.status}</Badge></td>
                  {earningCols.map(col => (
                    <td key={col.id} className="px-2 py-1 bg-emerald-50/30 dark:bg-emerald-950/10 border-x border-border">
                      <SalaryCell
                        initialValue={getCellValue(emp.id, col.column_id)}
                        onCommit={val => setCellValue(emp.id, col.column_id, val)}
                      />
                    </td>
                  ))}
                  <td className="border-r border-border" />
                  {deductionCols.map(col => (
                    <td key={col.id} className="px-2 py-1 bg-red-50/30 dark:bg-red-950/10 border-x border-border">
                      <SalaryCell
                        initialValue={getCellValue(emp.id, col.column_id)}
                        onCommit={val => setCellValue(emp.id, col.column_id, val)}
                      />
                    </td>
                  ))}
                  <td className="border-r border-border" />
                  <td className={`px-3 py-2 text-center font-bold ${net >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(net)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div></CardContent></Card>
    </div>
  );
}
