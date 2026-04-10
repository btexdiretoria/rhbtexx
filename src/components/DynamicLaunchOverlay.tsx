import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Employee } from '@/hooks/useEmployees';

interface Column {
  id: string;
  column_id: string;
  name: string;
  type: string;
}

interface DynamicLaunchOverlayProps {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  columns: Column[];
  getCellValue: (empId: string, colId: string) => number;
  setCellValue: (empId: string, colId: string, val: number) => void;
}

function LaunchInput({ initialValue, onCommit }: { initialValue: number; onCommit: (v: number) => void }) {
  const [val, setVal] = useState(initialValue === 0 ? '' : String(initialValue));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVal(initialValue === 0 ? '' : String(initialValue));
  }, [initialValue]);

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
      className="h-9 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => onCommit(Number(val) || 0)}
      onWheel={e => e.currentTarget.blur()}
      placeholder="0"
    />
  );
}

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DynamicLaunchOverlay({ open, onClose, employees, columns, getCellValue, setCellValue }: DynamicLaunchOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({});

  const currentEmployee = employees[currentIndex];
  const earningCols = useMemo(() => columns.filter(c => c.type === 'earning'), [columns]);
  const deductionCols = useMemo(() => columns.filter(c => c.type === 'deduction'), [columns]);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setPendingChanges({});
    }
  }, [open]);

  const getVal = useCallback((colId: string) => {
    if (!currentEmployee) return 0;
    const key = `${currentEmployee.id}_${colId}`;
    return key in pendingChanges ? pendingChanges[key] : getCellValue(currentEmployee.id, colId);
  }, [currentEmployee, pendingChanges, getCellValue]);

  const setVal = useCallback((colId: string, val: number) => {
    if (!currentEmployee) return;
    setPendingChanges(prev => ({ ...prev, [`${currentEmployee.id}_${colId}`]: val }));
  }, [currentEmployee]);

  const saveCurrentEmployee = useCallback(() => {
    if (!currentEmployee) return;
    const prefix = `${currentEmployee.id}_`;
    Object.entries(pendingChanges).forEach(([key, val]) => {
      if (key.startsWith(prefix)) {
        const colId = key.slice(prefix.length);
        setCellValue(currentEmployee.id, colId, val);
      }
    });
    // Remove saved entries
    setPendingChanges(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (k.startsWith(prefix)) delete next[k]; });
      return next;
    });
  }, [currentEmployee, pendingChanges, setCellValue]);

  const goTo = useCallback((idx: number) => {
    saveCurrentEmployee();
    setCurrentIndex(idx);
  }, [saveCurrentEmployee]);

  const prev = () => { if (currentIndex > 0) goTo(currentIndex - 1); };
  const next = () => { if (currentIndex < employees.length - 1) goTo(currentIndex + 1); };

  const earningsTotal = earningCols.reduce((s, c) => s + getVal(c.column_id), 0);
  const deductionsTotal = deductionCols.reduce((s, c) => s + getVal(c.column_id), 0);
  const net = earningsTotal - deductionsTotal;

  const handleClose = () => {
    saveCurrentEmployee();
    onClose();
  };

  if (!currentEmployee) return null;

  const initials = currentEmployee.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading">Lançamento Dinâmico</DialogTitle>
        </DialogHeader>

        {/* Employee selector */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Button variant="outline" size="icon" onClick={prev} disabled={currentIndex === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Avatar className="h-12 w-12">
            {currentEmployee.foto && <AvatarImage src={currentEmployee.foto} alt={currentEmployee.nome} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <Select value={currentEmployee.id} onValueChange={id => {
              const idx = employees.findIndex(e => e.id === id);
              if (idx >= 0) goTo(idx);
            }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{currentEmployee.cargo} · {currentEmployee.departamento}</p>
          </div>

          <Button variant="outline" size="icon" onClick={next} disabled={currentIndex === employees.length - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">{currentIndex + 1} de {employees.length}</p>

        {/* Earnings */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Proventos</p>
          <div className="grid grid-cols-2 gap-3">
            {earningCols.map(col => (
              <div key={col.id}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{col.name}</label>
                <LaunchInput initialValue={getVal(col.column_id)} onCommit={v => setVal(col.column_id, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Deductions */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-2">Descontos</p>
          <div className="grid grid-cols-2 gap-3">
            {deductionCols.map(col => (
              <div key={col.id}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{col.name}</label>
                <LaunchInput initialValue={getVal(col.column_id)} onCommit={v => setVal(col.column_id, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Proventos</p>
            <p className="text-sm font-bold text-emerald-600">{formatCurrency(earningsTotal)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Descontos</p>
            <p className="text-sm font-bold text-destructive">{formatCurrency(deductionsTotal)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Líquido</p>
            <p className={`text-sm font-bold ${net >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(net)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" /> Fechar
          </Button>
          <Button onClick={saveCurrentEmployee}>
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
