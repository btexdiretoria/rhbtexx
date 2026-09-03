import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Trash2, CalendarIcon, Search, Bus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/hooks/useEmployees';
import { useTransportVoucherEntries, useCreateTransportVoucherEntry, useDeleteTransportVoucher, useUpsertTransportVoucher } from '@/hooks/useFinancial';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TransportationVoucher() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: allEmployees = [] } = useEmployees();
  const { data: entries = [], isLoading } = useTransportVoucherEntries(selectedYear, selectedMonth);
  const createEntry = useCreateTransportVoucherEntry();
  const deleteEntry = useDeleteTransportVoucher();
  const upsertEntry = useUpsertTransportVoucher();

  const eligibleStatuses = ['Ativo', 'Prestador de Serviço', 'Teste'];
  const activeEmployees = useMemo(() => allEmployees.filter(f => eligibleStatuses.includes(f.status)), [allEmployees]);
  const availableEmployees = useMemo(() =>
    activeEmployees.filter(e => !entries.some(en => en.employee_id === e.id)).filter(e => e.nome.toLowerCase().includes(search.toLowerCase())),
    [activeEmployees, entries, search]);

  const addEmployee = (empId: string) => {
    createEntry.mutate({ employee_id: empId, payment1_value: 0, payment1_date: '', payment2_value: 0, payment2_date: '', year: selectedYear, month: selectedMonth });
    setSearch('');
    setAddDialogOpen(false);
  };

  const removeEmployee = (id: string) => deleteEntry.mutate(id);

  const updateEntry2 = (entryId: string, field: string, value: string | number) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    upsertEntry.mutate({ ...entry, [field]: value });
  };

  const total = useMemo(() => entries.reduce((s, e) => s + e.payment1_value + e.payment2_value, 0), [entries]);
  const getEmployee = (id: string) => allEmployees.find(f => f.id === id);

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">{MONTHS[selectedMonth]} {selectedYear}</h2>
        <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{[2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card className="border-l-4 border-l-primary max-w-md">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Vale Transporte</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2"><Bus className="w-5 h-5 text-primary" /><span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span></div>
          <p className="text-xs text-muted-foreground mt-1">{entries.length} funcionário(s)</p>
        </CardContent>
      </Card>

      <Card><CardContent className="pt-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Adicionar funcionário</label>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar funcionário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" onFocus={() => setAddDialogOpen(true)} /></div>
            {addDialogOpen && availableEmployees.length > 0 && (
              <div className="mt-1 border border-border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto z-50 relative">
                {availableEmployees.map(e => (
                  <button key={e.id} className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center" onClick={() => addEmployee(e.id)}>
                    <span>{e.nome}</span><span className="text-xs text-muted-foreground">{e.departamento}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {addDialogOpen && <Button variant="ghost" size="sm" onClick={() => { setAddDialogOpen(false); setSearch(''); }}>Cancelar</Button>}
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-6 p-0 sm:p-6 sm:pt-6"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Funcionário</TableHead>
          <TableHead className="text-center bg-emerald-50 dark:bg-emerald-950/30">Pagamento 1 (R$)</TableHead>
          <TableHead className="text-center bg-emerald-50 dark:bg-emerald-950/30">Data Pgto 1</TableHead>
          <TableHead className="text-center bg-emerald-50 dark:bg-emerald-950/30">Referente a (1)</TableHead>
          <TableHead className="text-center bg-blue-50 dark:bg-blue-950/30">Pagamento 2 (R$)</TableHead>
          <TableHead className="text-center bg-blue-50 dark:bg-blue-950/30">Data Pgto 2</TableHead>
          <TableHead className="text-center bg-blue-50 dark:bg-blue-950/30">Referente a (2)</TableHead>
          <TableHead className="text-center font-bold">Total</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {entries.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum funcionário adicionado para este mês.</TableCell></TableRow>
          : entries.map(entry => {
            const emp = getEmployee(entry.employee_id);
            if (!emp) return null;
            return (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{emp.nome}</TableCell>
                <TableCell className="bg-emerald-50/50 dark:bg-emerald-950/10"><BlurNumberInput value={entry.payment1_value} onCommit={v => updateEntry2(entry.id, 'payment1_value', v)} /></TableCell>
                <TableCell className="bg-emerald-50/50 dark:bg-emerald-950/10"><DatePickerCell value={entry.payment1_date || ''} onChange={d => updateEntry2(entry.id, 'payment1_date', d)} /></TableCell>
                <TableCell className="bg-blue-50/50 dark:bg-blue-950/10"><BlurNumberInput value={entry.payment2_value} onCommit={v => updateEntry2(entry.id, 'payment2_value', v)} /></TableCell>
                <TableCell className="bg-blue-50/50 dark:bg-blue-950/10"><DatePickerCell value={entry.payment2_date || ''} onChange={d => updateEntry2(entry.id, 'payment2_date', d)} /></TableCell>
                <TableCell className="text-center font-bold">{formatCurrency(entry.payment1_value + entry.payment2_value)}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => removeEmployee(entry.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody></Table>
      </div></CardContent></Card>
    </div>
  );
}

function BlurNumberInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = useState<string>(value ? String(value) : '');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setLocal(value ? String(value) : ''); }, [value]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = () => el.blur();
    el.addEventListener('wheel', h, { passive: true });
    return () => el.removeEventListener('wheel', h);
  }, []);
  return (
    <Input
      ref={ref}
      type="number"
      className="w-28 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { const n = Number(local) || 0; if (n !== value) onCommit(n); }}
      onWheel={e => e.currentTarget.blur()}
      placeholder="0,00"
    />
  );
}

function DatePickerCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-[130px] justify-start text-left text-xs font-normal", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-1 h-3 w-3" />{date ? format(date, 'dd/MM/yyyy') : 'Selecionar'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={d => d && onChange(d.toISOString())} initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );
}
