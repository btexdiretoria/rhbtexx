import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Clock, FileDown } from 'lucide-react';
import { useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory, useDeleteExpenseCategory, useCompanySettings } from '@/hooks/useFinancial';
import { exportExpenseControlPDF, type ExpenseCategoryRow } from '@/utils/expenseControlPdf';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function getProgressColor(pct: number) { if (pct >= 100) return 'bg-destructive'; if (pct >= 75) return 'bg-amber-500'; return 'bg-emerald-500'; }
function getProgressTextColor(pct: number) { if (pct >= 100) return 'text-destructive'; if (pct >= 75) return 'text-amber-600'; return 'text-emerald-600'; }

export default function ExpenseControl() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [editingField, setEditingField] = useState<{ id: string; field: 'name' | 'forecast' | 'spent' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: categories = [], isLoading } = useExpenseCategories(selectedYear, selectedMonth);
  const { data: company } = useCompanySettings();
  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();

  const handleExportPDF = () => {
    exportExpenseControlPDF(
      categories as ExpenseCategoryRow[],
      MONTHS[selectedMonth],
      selectedYear,
      company?.company_name
    );
  };

  const addCategory = () => {
    createCategory.mutate({ name: 'Nova Categoria', forecast: 0, spent: 0, year: selectedYear, month: selectedMonth, sort_order: categories.length });
  };

  const removeCategory = (id: string) => deleteCategory.mutate(id);

  const startEdit = (id: string, field: 'name' | 'forecast' | 'spent', currentValue: string | number) => {
    setEditingField({ id, field });
    setEditValue(String(currentValue));
  };

  const commitEdit = () => {
    if (!editingField) return;
    const { id, field } = editingField;
    const val = field === 'name' ? editValue : Number(editValue) || 0;
    updateCategory.mutate({ id, [field]: val });
    setEditingField(null);
    setEditValue('');
  };

  const lastUpdated = categories.length > 0
    ? categories.reduce((latest, cat) => cat.updated_at > latest ? cat.updated_at : latest, categories[0].updated_at)
    : null;

  const formatLastUpdated = (iso: string | null) => {
    if (!iso) return 'Nunca';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">{MONTHS[selectedMonth]} {selectedYear}</h2>
        <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent>{[2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" />Última atualização: {formatLastUpdated(lastUpdated)}</div>
      </div>

      <div className="flex justify-end"><Button onClick={addCategory} className="gap-2"><Plus className="w-4 h-4" />Adicionar Categoria</Button></div>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma categoria de despesa cadastrada para este mês.</CardContent></Card>
        ) : categories.map(cat => {
          const pct = cat.forecast > 0 ? Math.round((cat.spent / cat.forecast) * 100) : 0;
          const remaining = cat.forecast - cat.spent;
          const isEditing = (field: string) => editingField?.id === cat.id && editingField?.field === field;

          return (
            <Card key={cat.id} className="overflow-hidden"><CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="min-w-0 w-[120px] shrink-0">
                  {isEditing('name') ? <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={e => e.key === 'Enter' && commitEdit()} className="h-9 text-sm font-semibold" />
                  : <button onClick={() => startEdit(cat.id, 'name', cat.name)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left truncate block w-full">{cat.name}</button>}
                </div>
                <div className="text-center min-w-[100px] shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Previsão</p>
                  {isEditing('forecast') ? <Input autoFocus type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={e => e.key === 'Enter' && commitEdit()} className="h-9 text-sm text-right w-24" />
                  : <button onClick={() => startEdit(cat.id, 'forecast', cat.forecast)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{formatCurrency(cat.forecast)}</button>}
                </div>
                <div className="text-center min-w-[100px] shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Gasto</p>
                  {isEditing('spent') ? <Input autoFocus type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={e => e.key === 'Enter' && commitEdit()} className="h-9 text-sm text-right w-24" />
                  : <button onClick={() => startEdit(cat.id, 'spent', cat.spent)} className={`text-sm font-medium hover:text-primary transition-colors ${getProgressTextColor(pct)}`}>{formatCurrency(cat.spent)}</button>}
                </div>
                <div className="text-center min-w-[90px] shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Restante</p>
                  <span className={`text-sm font-medium ${remaining < 0 ? 'text-destructive' : 'text-foreground'}`}>{formatCurrency(remaining)}</span>
                </div>
                <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                  <div className="flex-1 relative h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full transition-all duration-300 rounded-full ${getProgressColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                  <span className={`text-xs font-bold min-w-[36px] text-right ${getProgressTextColor(pct)}`}>{pct}%</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeCategory(cat.id)} className="text-destructive hover:text-destructive shrink-0"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
