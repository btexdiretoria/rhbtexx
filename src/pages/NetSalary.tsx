import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, Plus, Trash2, Pencil, Check, Search, X, Rocket } from 'lucide-react';
import DynamicLaunchOverlay from '@/components/DynamicLaunchOverlay';
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

interface SalaryCellProps {
  initialValue: number;
  onCommit: (val: number) => void;
}

interface FloatingScrollbarState {
  left: number;
  width: number;
  scrollWidth: number;
  visible: boolean;
}

function SalaryCell({ initialValue, onCommit }: SalaryCellProps) {
  const [localValue, setLocalValue] = useState<string>(initialValue === 0 ? '' : String(initialValue));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(initialValue === 0 ? '' : String(initialValue));
  }, [initialValue]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleWheel = () => {
      input.blur();
    };

    input.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      input.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleBlur = () => {
    const num = Number(localValue) || 0;
    onCommit(num);
  };

  return (
    <Input
      ref={inputRef}
      type="number"
      className="h-7 w-24 [appearance:textfield] text-right text-xs [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onWheel={e => e.currentTarget.blur()}
      placeholder="0"
    />
  );
}

export default function NetSalary() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [dynamicLaunchOpen, setDynamicLaunchOpen] = useState(false);
  const [editingColName, setEditingColName] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [topHeaderHeight, setTopHeaderHeight] = useState(40);
  const [floatingScrollbar, setFloatingScrollbar] = useState<FloatingScrollbarState>({
    left: 0,
    width: 0,
    scrollWidth: 0,
    visible: false,
  });
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const floatingScrollbarRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const topHeaderRowRef = useRef<HTMLTableRowElement>(null);
  const syncingScrollRef = useRef<'table' | 'floating' | null>(null);

  const { data: allEmployees = [] } = useEmployees();
  const { data: columns = [], isLoading: colsLoading } = useNetSalaryColumns(selectedYear, selectedMonth);
  const { data: values = [] } = useNetSalaryValues(selectedYear, selectedMonth);
  const createColumn = useCreateNetSalaryColumn();
  const deleteColumn = useDeleteNetSalaryColumn();
  const updateColumn = useUpdateNetSalaryColumn();
  const upsertValue = useUpsertNetSalaryValue();

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
        const termIndex = d.getFullYear() * 12 + d.getMonth();
        const selIndex = selectedYear * 12 + selectedMonth;
        // mostrar no mês do desligamento e também no mês seguinte
        return termIndex === selIndex || termIndex === selIndex - 1;
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

  const setCellValue = useCallback((empId: string, colId: string, val: number) => {
    upsertValue.mutate({ employee_id: empId, column_id: colId, value: val, year: selectedYear, month: selectedMonth });
  }, [upsertValue, selectedYear, selectedMonth]);

  const getEarningsTotal = (empId: string) => earningCols.reduce((sum, col) => sum + getCellValue(empId, col.column_id), 0);
  const getDeductionsTotal = (empId: string) => deductionCols.reduce((sum, col) => sum + getCellValue(empId, col.column_id), 0);
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

  const startEditCol = (col: typeof columns[0]) => {
    setEditingColId(col.id);
    setEditingColName(col.name);
  };

  const confirmEditCol = () => {
    if (!editingColId || !editingColName.trim()) return;

    updateColumn.mutate({ id: editingColId, name: editingColName.trim() });
    setEditingColId(null);
  };

  const columnSums = useMemo(() => {
    const sums: Record<string, number> = {};

    columns.forEach(col => {
      sums[col.column_id] = employees.reduce((sum, employee) => sum + getCellValue(employee.id, col.column_id), 0);
    });

    sums._net = employees.reduce((sum, employee) => sum + getNet(employee.id), 0);
    return sums;
  }, [columns, employees, valuesMap]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  useEffect(() => {
    const scrollContainer = tableScrollRef.current;
    const table = tableRef.current;
    const topRow = topHeaderRowRef.current;

    if (!scrollContainer || !table || !topRow) return;

    const updateLayout = () => {
      const rect = scrollContainer.getBoundingClientRect();
      const nextTopHeaderHeight = Math.ceil(topRow.getBoundingClientRect().height);
      const hasOverflow = scrollContainer.scrollWidth > scrollContainer.clientWidth + 1;

      setTopHeaderHeight(prev => prev === nextTopHeaderHeight ? prev : nextTopHeaderHeight);
      setFloatingScrollbar(prev => {
        const next = {
          left: rect.left,
          width: rect.width,
          scrollWidth: scrollContainer.scrollWidth,
          visible: hasOverflow && rect.width > 0,
        };

        return prev.left === next.left
          && prev.width === next.width
          && prev.scrollWidth === next.scrollWidth
          && prev.visible === next.visible
          ? prev
          : next;
      });
    };

    updateLayout();

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateLayout);
    resizeObserver?.observe(scrollContainer);
    resizeObserver?.observe(table);
    resizeObserver?.observe(topRow);
    window.addEventListener('resize', updateLayout);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, [columns.length, employees.length, values.length, editingColId]);

  useEffect(() => {
    const scrollContainer = tableScrollRef.current;
    const floatingScrollContainer = floatingScrollbarRef.current;

    if (!scrollContainer || !floatingScrollContainer) return;

    const syncFromTable = () => {
      if (syncingScrollRef.current === 'floating') {
        syncingScrollRef.current = null;
        return;
      }

      syncingScrollRef.current = 'table';
      floatingScrollContainer.scrollLeft = scrollContainer.scrollLeft;
    };

    const syncFromFloating = () => {
      if (syncingScrollRef.current === 'table') {
        syncingScrollRef.current = null;
        return;
      }

      syncingScrollRef.current = 'floating';
      scrollContainer.scrollLeft = floatingScrollContainer.scrollLeft;
    };

    floatingScrollContainer.scrollLeft = scrollContainer.scrollLeft;
    scrollContainer.addEventListener('scroll', syncFromTable, { passive: true });
    floatingScrollContainer.addEventListener('scroll', syncFromFloating, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', syncFromTable);
      floatingScrollContainer.removeEventListener('scroll', syncFromFloating);
    };
  }, [floatingScrollbar.visible, floatingScrollbar.scrollWidth]);

  if (colsLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-heading font-bold text-foreground">{MONTHS[selectedMonth]} {selectedYear}</h2>
        <div className="ml-auto flex gap-2">
          <Select value={String(selectedMonth)} onValueChange={v => { setSelectedMonth(Number(v)); setInitialized(false); }}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((month, index) => <SelectItem key={index} value={String(index)}>{month}</SelectItem>)}</SelectContent></Select>
          <Select value={String(selectedYear)} onValueChange={v => { setSelectedYear(Number(v)); setInitialized(false); }}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Proventos</p>
          <div className="flex flex-wrap gap-2">
            {earningCols.map(col => (
              <Card key={col.id} className="min-w-[140px] max-w-[200px] flex-1 border-l-4 border-l-emerald-500"><CardContent className="px-3 py-2.5"><p className="mb-0.5 truncate text-[11px] font-medium text-muted-foreground">{col.name}</p><span className="text-sm font-bold text-foreground">{formatCurrency(columnSums[col.column_id] || 0)}</span></CardContent></Card>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">Descontos</p>
          <div className="flex flex-wrap justify-end gap-2">
            {deductionCols.map(col => (
              <Card key={col.id} className="min-w-[140px] max-w-[200px] flex-1 border-l-4 border-l-destructive"><CardContent className="px-3 py-2.5"><p className="mb-0.5 truncate text-[11px] font-medium text-muted-foreground">{col.name}</p><span className="text-sm font-bold text-foreground">{formatCurrency(columnSums[col.column_id] || 0)}</span></CardContent></Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-sm border-l-4 border-l-primary">
          <CardHeader className="px-4 pb-1 pt-3"><CardTitle className="text-center text-sm font-medium text-muted-foreground">Líquido Total</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3"><div className="flex items-center justify-center gap-2"><DollarSign className="h-5 w-5 text-primary" /><span className="text-xl font-bold text-primary">{formatCurrency(columnSums._net || 0)}</span></div></CardContent>
        </Card>
      </div>

      <Card><CardContent className="pb-4 pt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1"><label className="mb-1 block text-xs font-medium text-muted-foreground">Buscar</label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Nome do funcionário..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
          <div className="w-[160px]"><label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{availableStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
          {(search || statusFilter !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}><X className="mr-1 h-4 w-4" /> Limpar</Button>}
          <Button onClick={() => setDynamicLaunchOpen(true)} className="ml-auto"><Rocket className="mr-1 h-4 w-4" /> Lançamento Dinâmico</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0"><div ref={tableScrollRef} className="overflow-x-auto" style={{ overflowX: 'scroll' }}>
        <table ref={tableRef} className="w-full border-collapse text-sm">
          <thead>
            <tr ref={topHeaderRowRef} className="border-b border-border">
              <th className="sticky left-0 top-0 z-50 bg-card px-3 py-2 text-left font-medium text-muted-foreground" rowSpan={2} style={{ minWidth: 180 }}>Funcionário</th>
              <th className="sticky top-0 z-40 bg-card px-3 py-2 text-left font-medium text-muted-foreground" rowSpan={2} style={{ minWidth: 100 }}>Status</th>
              <th colSpan={earningCols.length + 1} className="sticky top-0 z-40 border-x border-border bg-emerald-50 px-3 py-2 text-center font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Proventos</th>
              <th colSpan={deductionCols.length + 1} className="sticky top-0 z-40 border-r border-border bg-red-50 px-3 py-2 text-center font-semibold text-destructive dark:bg-red-950/30">Descontos</th>
              <th className="sticky top-0 z-40 bg-primary/5 px-3 py-2 text-center font-bold text-primary" rowSpan={2} style={{ minWidth: 120 }}>Líquido</th>
            </tr>
            <tr className="border-b border-border">
              {earningCols.map(col => (
                <th key={col.id} className="sticky z-30 border-x border-border bg-emerald-50/50 px-2 py-1.5 dark:bg-emerald-950/20" style={{ minWidth: 120, top: topHeaderHeight }}>
                  <div className="group flex items-center gap-1">
                    {editingColId === col.id ? (
                      <div className="flex items-center gap-1"><Input className="h-6 w-24 px-1 text-xs" value={editingColName} onChange={e => setEditingColName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmEditCol()} autoFocus /><button onClick={confirmEditCol} className="text-emerald-600"><Check className="h-3 w-3" /></button></div>
                    ) : (
                      <>
                        <span className="truncate text-xs font-medium text-muted-foreground">{col.name}</span>
                        <button onClick={() => startEditCol(col)} className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"><Pencil className="h-3 w-3" /></button>
                        {earningCols.length > 1 && <button onClick={() => removeColumn(col.id)} className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>}
                      </>
                    )}
                  </div>
                </th>
              ))}
              <th className="sticky z-30 border-r border-border bg-emerald-50/50 px-1 py-1.5 dark:bg-emerald-950/20" style={{ top: topHeaderHeight }}>
                <Tooltip><TooltipTrigger asChild><button onClick={() => addColumn('earning')} className="flex h-6 w-6 items-center justify-center rounded text-emerald-600 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/40"><Plus className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>Adicionar Provento</TooltipContent></Tooltip>
              </th>
              {deductionCols.map(col => (
                <th key={col.id} className="sticky z-30 border-x border-border bg-red-50/50 px-2 py-1.5 dark:bg-red-950/20" style={{ minWidth: 120, top: topHeaderHeight }}>
                  <div className="group flex items-center gap-1">
                    {editingColId === col.id ? (
                      <div className="flex items-center gap-1"><Input className="h-6 w-24 px-1 text-xs" value={editingColName} onChange={e => setEditingColName(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmEditCol()} autoFocus /><button onClick={confirmEditCol} className="text-destructive"><Check className="h-3 w-3" /></button></div>
                    ) : (
                      <>
                        <span className="truncate text-xs font-medium text-muted-foreground">{col.name}</span>
                        <button onClick={() => startEditCol(col)} className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"><Pencil className="h-3 w-3" /></button>
                        {deductionCols.length > 1 && <button onClick={() => removeColumn(col.id)} className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>}
                      </>
                    )}
                  </div>
                </th>
              ))}
              <th className="sticky z-30 border-r border-border bg-red-50/50 px-1 py-1.5 dark:bg-red-950/20" style={{ top: topHeaderHeight }}>
                <Tooltip><TooltipTrigger asChild><button onClick={() => addColumn('deduction')} className="flex h-6 w-6 items-center justify-center rounded text-destructive transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"><Plus className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>Adicionar Desconto</TooltipContent></Tooltip>
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={earningCols.length + deductionCols.length + 5} className="py-8 text-center text-muted-foreground">Nenhum funcionário encontrado.</td></tr>
            ) : employees.map(emp => {
              const net = getNet(emp.id);
              return (
                <tr key={emp.id} className="border-b border-border hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground">{emp.nome}</td>
                  <td className="px-3 py-2"><Badge variant={emp.status === 'Ativo' ? 'default' : 'secondary'} className="text-xs">{emp.status}</Badge></td>
                  {earningCols.map(col => (
                    <td key={col.id} className="border-x border-border bg-emerald-50/30 px-2 py-1 dark:bg-emerald-950/10">
                      <SalaryCell
                        initialValue={getCellValue(emp.id, col.column_id)}
                        onCommit={val => setCellValue(emp.id, col.column_id, val)}
                      />
                    </td>
                  ))}
                  <td className="border-r border-border" />
                  {deductionCols.map(col => (
                    <td key={col.id} className="border-x border-border bg-red-50/30 px-2 py-1 dark:bg-red-950/10">
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

      {floatingScrollbar.visible && (
        <div className="fixed bottom-4 z-40" style={{ left: floatingScrollbar.left, width: floatingScrollbar.width }}>
          <div className="rounded-md border border-border bg-card/95 px-1 py-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <div ref={floatingScrollbarRef} className="h-4 overflow-x-scroll overflow-y-hidden rounded-sm [scrollbar-color:hsl(var(--muted-foreground)/0.45)_hsl(var(--muted))] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar]:h-3">
              <div style={{ width: floatingScrollbar.scrollWidth, height: 1 }} />
            </div>
          </div>
        </div>
      )}

      <DynamicLaunchOverlay
        open={dynamicLaunchOpen}
        onClose={() => setDynamicLaunchOpen(false)}
        employees={employees}
        columns={columns}
        getCellValue={getCellValue}
        setCellValue={setCellValue}
      />
    </div>
  );
}
