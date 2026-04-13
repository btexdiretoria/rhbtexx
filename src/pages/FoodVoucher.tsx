import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Search, UtensilsCrossed, Plus, CreditCard, Package, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/hooks/useEmployees';
import { useFoodVoucherEntries, useCreateFoodVoucherBatch, useDeleteFoodVoucher, useUpsertFoodVoucher } from '@/hooks/useFinancial';
import { toast } from 'sonner';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FoodVoucher() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bulkValue, setBulkValue] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: allEmployees = [] } = useEmployees();
  const { data: entries = [], isLoading } = useFoodVoucherEntries(selectedYear, selectedMonth);
  const createBatch = useCreateFoodVoucherBatch();
  const deleteFV = useDeleteFoodVoucher();
  const upsertFV = useUpsertFoodVoucher();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeEmployees = useMemo(() => allEmployees.filter(f => f.status !== 'Desligado'), [allEmployees]);
  const availableEmployees = useMemo(() =>
    activeEmployees.filter(e => !entries.some(en => en.employee_id === e.id)).filter(e => e.nome.toLowerCase().includes(search.toLowerCase())),
    [activeEmployees, entries, search]);

  const toggleSelect = (id: string) => setSelectedToAdd(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const addSelectedEmployees = () => {
    const newEntries = selectedToAdd
      .filter(id => !entries.some(e => e.employee_id === id))
      .map(id => ({ employee_id: id, value: 0, delivery_method: 'Alelo', year: selectedYear, month: selectedMonth }));
    if (newEntries.length > 0) createBatch.mutate(newEntries);
    setSelectedToAdd([]);
    setDropdownOpen(false);
    setSearch('');
  };

  const removeEmployee = (id: string) => deleteFV.mutate(id);

  const updateEntry = (entryId: string, field: string, value: string | number) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    upsertFV.mutate({ ...entry, [field]: value });
  };

  const total = useMemo(() => entries.reduce((s, e) => s + e.value, 0), [entries]);
  const totalAlelo = useMemo(() => entries.filter(e => e.delivery_method === 'Alelo').reduce((s, e) => s + e.value, 0), [entries]);
  const totalCesta = useMemo(() => entries.filter(e => e.delivery_method === 'Cesta Básica').reduce((s, e) => s + e.value, 0), [entries]);

  const getEmployee = (id: string) => allEmployees.find(f => f.id === id);

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">{MONTHS[selectedMonth]} {selectedYear}</h2>
        <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{[2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_1fr] gap-4 items-stretch">
        <Card className="border-l-4 border-l-amber-500"><CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Total Alelo</CardTitle></CardHeader><CardContent className="px-4 pb-3"><span className="text-base font-bold text-foreground">{formatCurrency(totalAlelo)}</span><p className="text-[10px] text-muted-foreground mt-0.5">{entries.filter(e => e.delivery_method === 'Alelo').length} funcionário(s)</p></CardContent></Card>
        <Card className="border-l-4 border-l-primary"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> Total Vale Alimentação</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span><p className="text-xs text-muted-foreground mt-1">{entries.length} funcionário(s)</p></CardContent></Card>
        <Card className="border-l-4 border-l-orange-500"><CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Total Cesta Básica</CardTitle></CardHeader><CardContent className="px-4 pb-3"><span className="text-base font-bold text-foreground">{formatCurrency(totalCesta)}</span><p className="text-[10px] text-muted-foreground mt-0.5">{entries.filter(e => e.delivery_method === 'Cesta Básica').length} funcionário(s)</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-6">
        <div className="flex flex-wrap gap-3 items-end" ref={dropdownRef}>
          <div className="flex-1 min-w-[250px] relative">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Selecionar funcionários</label>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar funcionários..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" onFocus={() => setDropdownOpen(true)} /></div>
            {dropdownOpen && availableEmployees.length > 0 && (
              <div className="mt-1 border border-border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto z-50 absolute w-full">
                {availableEmployees.map(e => (
                  <button key={e.id} className={cn("w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex items-center gap-2", selectedToAdd.includes(e.id) && "bg-primary/10")} onClick={() => toggleSelect(e.id)}>
                    <Checkbox checked={selectedToAdd.includes(e.id)} className="pointer-events-none" />
                    <span className="flex-1">{e.nome}</span>
                    <span className="text-xs text-muted-foreground">{e.departamento}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={addSelectedEmployees} disabled={selectedToAdd.length === 0} className="gap-2"><Plus className="w-4 h-4" />Adicionar Selecionados ({selectedToAdd.length})</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-6 p-0 sm:p-6 sm:pt-6"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Funcionário</TableHead>
          <TableHead className="text-center">Valor do Benefício (R$)</TableHead>
          <TableHead className="text-center">Método de Entrega</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {entries.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum funcionário adicionado para este mês.</TableCell></TableRow>
          : entries.map(entry => {
            const emp = getEmployee(entry.employee_id);
            if (!emp) return null;
            return (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{emp.nome}</TableCell>
                <TableCell><Input type="number" className="w-32 text-right mx-auto" value={entry.value || ''} onChange={e => updateEntry(entry.id, 'value', Number(e.target.value))} placeholder="0,00" /></TableCell>
                <TableCell><Select value={entry.delivery_method} onValueChange={v => updateEntry(entry.id, 'delivery_method', v)}><SelectTrigger className="w-[150px] mx-auto"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Alelo">Alelo</SelectItem><SelectItem value="Cesta Básica">Cesta Básica</SelectItem></SelectContent></Select></TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => removeEmployee(entry.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody></Table>
      </div></CardContent></Card>
    </div>
  );
}
