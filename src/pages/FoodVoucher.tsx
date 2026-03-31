import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { funcionariosMock } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Search, UtensilsCrossed, Plus, CreditCard, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type DeliveryMethod = 'Alelo' | 'Cesta Básica';

interface FoodVoucherEntry {
  employeeId: string;
  value: number;
  deliveryMethod: DeliveryMethod;
}

interface MonthFoodData {
  entries: FoodVoucherEntry[];
}

function getStorageKey(year: number, month: number) {
  return `food-voucher-${year}-${month}`;
}

function loadData(year: number, month: number): MonthFoodData {
  try {
    const raw = localStorage.getItem(getStorageKey(year, month));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { entries: [] };
}

function saveData(year: number, month: number, data: MonthFoodData) {
  localStorage.setItem(getStorageKey(year, month), JSON.stringify(data));
}

export default function FoodVoucher() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [data, setData] = useState<MonthFoodData>(() => loadData(now.getFullYear(), now.getMonth()));
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setData(loadData(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const persist = useCallback((newData: MonthFoodData) => {
    setData(newData);
    saveData(selectedYear, selectedMonth, newData);
  }, [selectedYear, selectedMonth]);

  const activeEmployees = useMemo(() =>
    funcionariosMock.filter(f => f.status === 'Ativo'), []);

  const availableEmployees = useMemo(() =>
    activeEmployees
      .filter(e => !data.entries.some(en => en.employeeId === e.id))
      .filter(e => e.nome.toLowerCase().includes(search.toLowerCase())),
    [activeEmployees, data.entries, search]);

  const toggleSelect = (id: string) => {
    setSelectedToAdd(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addSelectedEmployees = () => {
    const newEntries: FoodVoucherEntry[] = selectedToAdd
      .filter(id => !data.entries.some(e => e.employeeId === id))
      .map(id => ({ employeeId: id, value: 0, deliveryMethod: 'Alelo' as DeliveryMethod }));
    persist({ entries: [...data.entries, ...newEntries] });
    setSelectedToAdd([]);
    setDropdownOpen(false);
    setSearch('');
  };

  const removeEmployee = (empId: string) => {
    persist({ entries: data.entries.filter(e => e.employeeId !== empId) });
  };

  const updateEntry = (empId: string, field: keyof FoodVoucherEntry, value: string | number) => {
    persist({
      entries: data.entries.map(e =>
        e.employeeId === empId ? { ...e, [field]: value } : e
      ),
    });
  };

  const total = useMemo(() => data.entries.reduce((s, e) => s + e.value, 0), [data.entries]);
  const totalAlelo = useMemo(() => data.entries.filter(e => e.deliveryMethod === 'Alelo').reduce((s, e) => s + e.value, 0), [data.entries]);
  const totalCesta = useMemo(() => data.entries.filter(e => e.deliveryMethod === 'Cesta Básica').reduce((s, e) => s + e.value, 0), [data.entries]);

  const getEmployee = (id: string) => funcionariosMock.find(f => f.id === id);

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

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_1fr] gap-4 items-stretch">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Total Alelo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <span className="text-base font-bold text-foreground">{formatCurrency(totalAlelo)}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {data.entries.filter(e => e.deliveryMethod === 'Alelo').length} funcionário(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" /> Total Vale Alimentação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
            <p className="text-xs text-muted-foreground mt-1">{data.entries.length} funcionário(s)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Total Cesta Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <span className="text-base font-bold text-foreground">{formatCurrency(totalCesta)}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {data.entries.filter(e => e.deliveryMethod === 'Cesta Básica').length} funcionário(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add employees */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end" ref={dropdownRef}>
            <div className="flex-1 min-w-[250px] relative">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Selecionar funcionários</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar funcionários..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                  onFocus={() => setDropdownOpen(true)}
                />
              </div>
              {dropdownOpen && availableEmployees.length > 0 && (
                <div className="mt-1 border border-border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto z-50 absolute w-full">
                  {availableEmployees.map(e => (
                    <button
                      key={e.id}
                      className={cn(
                        "w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex items-center gap-2",
                        selectedToAdd.includes(e.id) && "bg-primary/10"
                      )}
                      onClick={() => toggleSelect(e.id)}
                    >
                      <Checkbox checked={selectedToAdd.includes(e.id)} className="pointer-events-none" />
                      <span className="flex-1">{e.nome}</span>
                      <span className="text-xs text-muted-foreground">{e.departamento}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={addSelectedEmployees}
              disabled={selectedToAdd.length === 0}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Selecionados ({selectedToAdd.length})
            </Button>
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
                  <TableHead className="text-center">Valor do Benefício (R$)</TableHead>
                  <TableHead className="text-center">Método de Entrega</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
                        <TableCell>
                          <Input
                            type="number"
                            className="w-32 text-right mx-auto"
                            value={entry.value || ''}
                            onChange={e => updateEntry(entry.employeeId, 'value', Number(e.target.value))}
                            placeholder="0,00"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.deliveryMethod}
                            onValueChange={v => updateEntry(entry.employeeId, 'deliveryMethod', v)}
                          >
                            <SelectTrigger className="w-[150px] mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Alelo">Alelo</SelectItem>
                              <SelectItem value="Cesta Básica">Cesta Básica</SelectItem>
                            </SelectContent>
                          </Select>
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
