import { useState, useMemo, useCallback, useEffect } from 'react';
import { funcionariosMock } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DollarSign, Plus, Trash2, CalendarIcon, Search, Bus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface VoucherEntry {
  employeeId: string;
  payment1Value: number;
  payment1Date: string;
  payment2Value: number;
  payment2Date: string;
}

interface MonthVoucherData {
  entries: VoucherEntry[];
}

function getStorageKey(year: number, month: number) {
  return `transport-voucher-${year}-${month}`;
}

function loadData(year: number, month: number): MonthVoucherData {
  try {
    const raw = localStorage.getItem(getStorageKey(year, month));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { entries: [] };
}

function saveData(year: number, month: number, data: MonthVoucherData) {
  localStorage.setItem(getStorageKey(year, month), JSON.stringify(data));
}

export default function TransportationVoucher() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [data, setData] = useState<MonthVoucherData>(() => loadData(now.getFullYear(), now.getMonth()));

  useEffect(() => {
    setData(loadData(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const persist = useCallback((newData: MonthVoucherData) => {
    setData(newData);
    saveData(selectedYear, selectedMonth, newData);
  }, [selectedYear, selectedMonth]);

  const activeEmployees = useMemo(() =>
    funcionariosMock.filter(f => f.status === 'Ativo'), []);

  const availableEmployees = useMemo(() =>
    activeEmployees.filter(e => !data.entries.some(en => en.employeeId === e.id))
      .filter(e => e.nome.toLowerCase().includes(search.toLowerCase())),
    [activeEmployees, data.entries, search]);

  const addEmployee = (empId: string) => {
    persist({
      entries: [...data.entries, {
        employeeId: empId,
        payment1Value: 0, payment1Date: '',
        payment2Value: 0, payment2Date: '',
      }],
    });
  };

  const removeEmployee = (empId: string) => {
    persist({ entries: data.entries.filter(e => e.employeeId !== empId) });
  };

  const updateEntry = (empId: string, field: keyof VoucherEntry, value: string | number) => {
    persist({
      entries: data.entries.map(e =>
        e.employeeId === empId ? { ...e, [field]: value } : e
      ),
    });
  };

  const total = useMemo(() =>
    data.entries.reduce((s, e) => s + e.payment1Value + e.payment2Value, 0),
    [data.entries]);

  const getEmployee = (id: string) => funcionariosMock.find(f => f.id === id);

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Month picker */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">
          {MONTHS[selectedMonth]} {selectedYear}
        </h2>
        <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <Card className="border-l-4 border-l-primary max-w-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Vale Transporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{data.entries.length} funcionário(s)</p>
        </CardContent>
      </Card>

      {/* Add employee */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Adicionar funcionário</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar funcionário..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                  onFocus={() => setAddDialogOpen(true)}
                />
              </div>
              {addDialogOpen && availableEmployees.length > 0 && (
                <div className="mt-1 border border-border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto z-50 relative">
                  {availableEmployees.map(e => (
                    <button
                      key={e.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center"
                      onClick={() => { addEmployee(e.id); setSearch(''); setAddDialogOpen(false); }}
                    >
                      <span>{e.nome}</span>
                      <span className="text-xs text-muted-foreground">{e.departamento}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {addDialogOpen && (
              <Button variant="ghost" size="sm" onClick={() => { setAddDialogOpen(false); setSearch(''); }}>
                Cancelar
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
                  <TableHead>Funcionário</TableHead>
                  <TableHead className="text-center bg-emerald-50 dark:bg-emerald-950/30">Pagamento 1 (R$)</TableHead>
                  <TableHead className="text-center bg-emerald-50 dark:bg-emerald-950/30">Data Pgto 1</TableHead>
                  <TableHead className="text-center bg-blue-50 dark:bg-blue-950/30">Pagamento 2 (R$)</TableHead>
                  <TableHead className="text-center bg-blue-50 dark:bg-blue-950/30">Data Pgto 2</TableHead>
                  <TableHead className="text-center font-bold">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum funcionário adicionado para este mês.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.entries.map(entry => {
                    const emp = getEmployee(entry.employeeId);
                    if (!emp) return null;
                    return (
                      <TableRow key={entry.employeeId}>
                        <TableCell className="font-medium">{emp.nome}</TableCell>
                        <TableCell className="bg-emerald-50/50 dark:bg-emerald-950/10">
                          <Input
                            type="number"
                            className="w-28 text-right"
                            value={entry.payment1Value || ''}
                            onChange={e => updateEntry(entry.employeeId, 'payment1Value', Number(e.target.value))}
                            placeholder="0,00"
                          />
                        </TableCell>
                        <TableCell className="bg-emerald-50/50 dark:bg-emerald-950/10">
                          <DatePickerCell
                            value={entry.payment1Date}
                            onChange={d => updateEntry(entry.employeeId, 'payment1Date', d)}
                          />
                        </TableCell>
                        <TableCell className="bg-blue-50/50 dark:bg-blue-950/10">
                          <Input
                            type="number"
                            className="w-28 text-right"
                            value={entry.payment2Value || ''}
                            onChange={e => updateEntry(entry.employeeId, 'payment2Value', Number(e.target.value))}
                            placeholder="0,00"
                          />
                        </TableCell>
                        <TableCell className="bg-blue-50/50 dark:bg-blue-950/10">
                          <DatePickerCell
                            value={entry.payment2Date}
                            onChange={d => updateEntry(entry.employeeId, 'payment2Date', d)}
                          />
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {formatCurrency(entry.payment1Value + entry.payment2Value)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeEmployee(entry.employeeId)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DatePickerCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-[130px] justify-start text-left text-xs font-normal", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-1 h-3 w-3" />
          {date ? format(date, 'dd/MM/yyyy') : 'Selecionar'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={d => d && onChange(d.toISOString())}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
