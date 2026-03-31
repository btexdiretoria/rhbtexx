import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, DollarSign, TrendingDown, Wallet, Clock } from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ExpenseCategory {
  id: string;
  name: string;
  forecast: number;
  spent: number;
}

interface MonthExpenseData {
  categories: ExpenseCategory[];
  lastUpdated: string | null;
}

function getStorageKey(year: number, month: number) {
  return `expense-control-${year}-${month}`;
}

function loadData(year: number, month: number): MonthExpenseData {
  try {
    const raw = localStorage.getItem(getStorageKey(year, month));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { categories: [], lastUpdated: null };
}

function saveData(year: number, month: number, data: MonthExpenseData) {
  localStorage.setItem(getStorageKey(year, month), JSON.stringify(data));
}

function getProgressColor(pct: number) {
  if (pct >= 100) return 'bg-destructive';
  if (pct >= 75) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getProgressTextColor(pct: number) {
  if (pct >= 100) return 'text-destructive';
  if (pct >= 75) return 'text-amber-600';
  return 'text-emerald-600';
}

export default function ExpenseControl() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [data, setData] = useState<MonthExpenseData>(() => loadData(now.getFullYear(), now.getMonth()));
  const [editingField, setEditingField] = useState<{ id: string; field: 'name' | 'forecast' | 'spent' } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setData(loadData(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const persist = useCallback((newData: MonthExpenseData) => {
    const updated = { ...newData, lastUpdated: new Date().toISOString() };
    setData(updated);
    saveData(selectedYear, selectedMonth, updated);
  }, [selectedYear, selectedMonth]);

  const addCategory = () => {
    const newCat: ExpenseCategory = {
      id: crypto.randomUUID(),
      name: 'Nova Categoria',
      forecast: 0,
      spent: 0,
    };
    persist({ ...data, categories: [...data.categories, newCat] });
  };

  const removeCategory = (id: string) => {
    persist({ ...data, categories: data.categories.filter(c => c.id !== id) });
  };

  const updateCategory = (id: string, field: keyof ExpenseCategory, value: string | number) => {
    persist({
      ...data,
      categories: data.categories.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  const startEdit = (id: string, field: 'name' | 'forecast' | 'spent', currentValue: string | number) => {
    setEditingField({ id, field });
    setEditValue(String(currentValue));
  };

  const commitEdit = () => {
    if (!editingField) return;
    const { id, field } = editingField;
    const val = field === 'name' ? editValue : Number(editValue) || 0;
    updateCategory(id, field, val);
    setEditingField(null);
    setEditValue('');
  };

  const totalForecast = useMemo(() => data.categories.reduce((s, c) => s + c.forecast, 0), [data.categories]);
  const totalSpent = useMemo(() => data.categories.reduce((s, c) => s + c.spent, 0), [data.categories]);
  const totalRemaining = totalForecast - totalSpent;
  const globalPct = totalForecast > 0 ? Math.round((totalSpent / totalForecast) * 100) : 0;

  const formatLastUpdated = (iso: string | null) => {
    if (!iso) return 'Nunca';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Month picker + last updated */}
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
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          Última atualização: {formatLastUpdated(data.lastUpdated)}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Previsão Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(totalForecast)}</span>
            <p className="text-xs text-muted-foreground mt-1">{data.categories.length} categoria(s)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Total Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(totalSpent)}</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Saldo Restante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${totalRemaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
              {formatCurrency(totalRemaining)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Global progress bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progresso Geral</span>
            <span className={`text-sm font-bold ${getProgressTextColor(globalPct)}`}>{globalPct}%</span>
          </div>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getProgressColor(globalPct)}`}
              style={{ width: `${Math.min(globalPct, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add category button */}
      <div className="flex justify-end">
        <Button onClick={addCategory} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Categoria
        </Button>
      </div>

      {/* Category list */}
      <div className="space-y-3">
        {data.categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma categoria de despesa cadastrada para este mês.
            </CardContent>
          </Card>
        ) : (
          data.categories.map(cat => {
            const pct = cat.forecast > 0 ? Math.round((cat.spent / cat.forecast) * 100) : 0;
            const remaining = cat.forecast - cat.spent;
            const isEditing = (field: string) => editingField?.id === cat.id && editingField?.field === field;

            return (
              <Card key={cat.id} className="overflow-hidden">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Category name */}
                    <div className="flex-1 min-w-0">
                      {isEditing('name') ? (
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => e.key === 'Enter' && commitEdit()}
                          className="h-8 text-sm font-semibold"
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(cat.id, 'name', cat.name)}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left"
                        >
                          {cat.name}
                        </button>
                      )}
                    </div>

                    {/* Forecast */}
                    <div className="text-center min-w-[120px]">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Previsão</p>
                      {isEditing('forecast') ? (
                        <Input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => e.key === 'Enter' && commitEdit()}
                          className="h-7 text-sm text-right w-28"
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(cat.id, 'forecast', cat.forecast)}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {formatCurrency(cat.forecast)}
                        </button>
                      )}
                    </div>

                    {/* Spent */}
                    <div className="text-center min-w-[120px]">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Gasto</p>
                      {isEditing('spent') ? (
                        <Input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => e.key === 'Enter' && commitEdit()}
                          className="h-7 text-sm text-right w-28"
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(cat.id, 'spent', cat.spent)}
                          className={`text-sm font-medium hover:text-primary transition-colors ${getProgressTextColor(pct)}`}
                        >
                          {formatCurrency(cat.spent)}
                        </button>
                      )}
                    </div>

                    {/* Remaining */}
                    <div className="text-center min-w-[120px]">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Restante</p>
                      <span className={`text-sm font-medium ${remaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {formatCurrency(remaining)}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="min-w-[140px] flex items-center gap-2">
                      <div className="flex-1 relative h-2.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${getProgressColor(pct)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold min-w-[36px] text-right ${getProgressTextColor(pct)}`}>
                        {pct}%
                      </span>
                    </div>

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCategory(cat.id)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
