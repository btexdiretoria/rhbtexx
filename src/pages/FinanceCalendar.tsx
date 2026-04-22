import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ChevronLeft, ChevronRight, Trash2, DollarSign, Package, Printer, Trash, Eraser,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Color palette - rotates per delivery
const COLOR_PALETTE = [
  '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED',
  '#DB2777', '#0D9488', '#EA580C', '#4F46E5', '#65A30D',
];

interface Delivery {
  id: string;
  start_date: string;
  end_date: string;
  working_days: number;
  color: string;
  color_index: number;
}

interface Receipt {
  id: string;
  delivery_id: string;
  receipt_date: string;
  value: number;
}

interface WeekNote {
  id: string;
  week_key: string;
  note: string;
}

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS_FULL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_NO_WEEKEND = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

function isWeekend(date: Date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function calcReceiptDate(endDateISO: string): string {
  const d = fromISO(endDateISO);
  d.setDate(d.getDate() + 7);
  while (isWeekend(d)) d.setDate(d.getDate() + 1);
  return toISO(d);
}

// ISO week key (e.g. "2026-W16")
function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export default function FinanceCalendar() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [referenceDay, setReferenceDay] = useState(today.getDate());
  const [hideWeekends, setHideWeekends] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [selectedProductionDays, setSelectedProductionDays] = useState<Set<string>>(new Set());
  const [createReceiptValue, setCreateReceiptValue] = useState('');

  const [clearAllOpen, setClearAllOpen] = useState(false);

  // Local week notes draft (for autosave debouncing)
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const noteTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Queries
  const { data: deliveries = [] } = useQuery({
    queryKey: ['calendar_deliveries'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('calendar_deliveries' as any).select('*') as any);
      if (error) throw error;
      return (data as unknown) as Delivery[];
    },
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ['calendar_receipts'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('calendar_receipts' as any).select('*') as any);
      if (error) throw error;
      return (data as unknown) as Receipt[];
    },
  });

  const { data: weekNotes = [] } = useQuery({
    queryKey: ['calendar_week_notes'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('calendar_week_notes' as any).select('*') as any);
      if (error) throw error;
      return (data as unknown) as WeekNote[];
    },
  });

  // Mutations
  const createDelivery = useMutation({
    mutationFn: async ({ daysISO, deliveryISO, receiptValue }: { daysISO: string[]; deliveryISO: string; receiptValue: number }) => {
      const sorted = [...daysISO].sort();
      const startISO = sorted[0] ?? deliveryISO;
      const endISO = deliveryISO; // delivery date drives the receipt calculation
      const colorIndex = deliveries.length % COLOR_PALETTE.length;
      const color = COLOR_PALETTE[colorIndex];

      const { data: del, error } = await (supabase
        .from('calendar_deliveries' as any)
        .insert({
          start_date: startISO,
          end_date: endISO,
          working_days: sorted.length,
          color,
          color_index: colorIndex,
        } as any)
        .select()
        .single() as any);
      if (error) throw error;

      const receiptISO = calcReceiptDate(deliveryISO);
      const { error: rErr } = await (supabase
        .from('calendar_receipts' as any)
        .insert({ delivery_id: (del as any).id, receipt_date: receiptISO, value: receiptValue } as any) as any);
      if (rErr) throw rErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar_deliveries'] });
      qc.invalidateQueries({ queryKey: ['calendar_receipts'] });
      toast({ title: 'Entrega cadastrada', description: 'Recebimento gerado automaticamente.' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const deleteDelivery = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('calendar_receipts' as any).delete().eq('delivery_id', id) as any);
      const { error } = await (supabase.from('calendar_deliveries' as any).delete().eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar_deliveries'] });
      qc.invalidateQueries({ queryKey: ['calendar_receipts'] });
      toast({ title: 'Entrega excluída' });
    },
  });

  const updateReceiptValue = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const { error } = await (supabase
        .from('calendar_receipts' as any)
        .update({ value } as any)
        .eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar_receipts'] });
      toast({ title: 'Valor atualizado' });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      await (supabase.from('calendar_receipts' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000') as any);
      await (supabase.from('calendar_deliveries' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000') as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar_deliveries'] });
      qc.invalidateQueries({ queryKey: ['calendar_receipts'] });
      toast({ title: 'Movimentações apagadas' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const upsertWeekNote = useMutation({
    mutationFn: async ({ week_key, note }: { week_key: string; note: string }) => {
      const { error } = await (supabase
        .from('calendar_week_notes' as any)
        .upsert({ week_key, note } as any, { onConflict: 'week_key' } as any) as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_week_notes'] }),
  });

  // Build calendar grid
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells: { date: Date | null; iso: string | null }[] = [];

    const startWeekday = firstDay.getDay();
    if (!hideWeekends) {
      for (let i = 0; i < startWeekday; i++) cells.push({ date: null, iso: null });
    } else {
      const leading = startWeekday === 0 ? 0 : startWeekday - 1;
      for (let i = 0; i < leading; i++) cells.push({ date: null, iso: null });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dt = new Date(year, month, d);
      if (hideWeekends && isWeekend(dt)) continue;
      cells.push({ date: dt, iso: toISO(dt) });
    }

    return cells;
  }, [year, month, hideWeekends]);

  // Map iso -> { delivery?, receipt? }
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { delivery?: Delivery; receipt?: Receipt }>();
    deliveries.forEach(del => {
      // Mark only start and end as range; we mark every day between start and end (working days only)
      const cur = fromISO(del.start_date);
      const end = fromISO(del.end_date);
      while (cur <= end) {
        if (!isWeekend(cur)) {
          const iso = toISO(cur);
          const ex = map.get(iso) || {};
          ex.delivery = del;
          map.set(iso, ex);
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    receipts.forEach(rec => {
      const cur = map.get(rec.receipt_date) || {};
      cur.receipt = rec;
      map.set(rec.receipt_date, cur);
    });
    return map;
  }, [deliveries, receipts]);

  // Group cells by week row for the side notes column
  const weekRows = useMemo(() => {
    const colCount = hideWeekends ? 5 : 7;
    const rows: { weekKey: string; cells: typeof calendarCells }[] = [];
    for (let i = 0; i < calendarCells.length; i += colCount) {
      const slice = calendarCells.slice(i, i + colCount);
      const firstDate = slice.find(c => c.date)?.date;
      const weekKey = firstDate ? getWeekKey(firstDate) : `empty-${i}`;
      rows.push({ weekKey, cells: slice });
    }
    return rows;
  }, [calendarCells, hideWeekends]);

  const handleDayClick = (iso: string) => {
    setCreateDate(iso);
    setSelectedProductionDays(new Set([iso]));
    setCreateReceiptValue('');
    setCreateOpen(true);
  };

  const toggleProductionDay = (iso: string) => {
    setSelectedProductionDays(prev => {
      const n = new Set(prev);
      if (n.has(iso)) n.delete(iso); else n.add(iso);
      return n;
    });
  };

  const handleConfirmCreate = () => {
    if (!createDate) {
      toast({ title: 'Data de entrega não definida', variant: 'destructive' });
      return;
    }
    if (selectedProductionDays.size === 0) {
      toast({ title: 'Selecione ao menos um dia', variant: 'destructive' });
      return;
    }
    const receiptValue = parseFloat(createReceiptValue.replace(',', '.')) || 0;
    createDelivery.mutate({ daysISO: Array.from(selectedProductionDays), deliveryISO: createDate, receiptValue });
    setCreateOpen(false);
  };

  const handleDeleteDelivery = (e: React.MouseEvent, deliveryId: string) => {
    e.stopPropagation();
    if (confirm('Excluir esta entrega? O recebimento vinculado também será removido.')) {
      deleteDelivery.mutate(deliveryId);
    }
  };

  const handleNoteChange = (weekKey: string, value: string) => {
    setNoteDrafts(prev => ({ ...prev, [weekKey]: value }));
    if (noteTimers.current[weekKey]) clearTimeout(noteTimers.current[weekKey]);
    noteTimers.current[weekKey] = setTimeout(() => {
      upsertWeekNote.mutate({ week_key: weekKey, note: value });
    }, 800);
  };

  const getNoteValue = (weekKey: string) => {
    if (noteDrafts[weekKey] !== undefined) return noteDrafts[weekKey];
    return weekNotes.find(n => n.week_key === weekKey)?.note || '';
  };

  const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const weekdays = hideWeekends ? WEEKDAYS_NO_WEEKEND : WEEKDAYS_FULL;
  const getDeliveryById = (id: string) => deliveries.find(d => d.id === id);

  // Mini calendar (production day picker) — shows same month as main filter
  const miniCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells: { date: Date | null; iso: string | null }[] = [];
    const startWeekday = firstDay.getDay();
    if (!hideWeekends) {
      for (let i = 0; i < startWeekday; i++) cells.push({ date: null, iso: null });
    } else {
      const leading = startWeekday === 0 ? 0 : startWeekday - 1;
      for (let i = 0; i < leading; i++) cells.push({ date: null, iso: null });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dt = new Date(year, month, d);
      if (hideWeekends && isWeekend(dt)) continue;
      cells.push({ date: dt, iso: toISO(dt) });
    }
    return cells;
  }, [year, month, hideWeekends]);

  return (
    <TooltipProvider>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-week-notes { border-left: 1px solid #000 !important; }
        }
      `}</style>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap no-print">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Calendário</h2>
            <p className="text-sm text-muted-foreground">Cadastre entregas e visualize recebimentos automáticos.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setClearAllOpen(true)}>
              <Eraser className="w-4 h-4 mr-1" /> Limpar tudo
            </Button>
          </div>
        </div>

        {/* Filter & options */}
        <Card className="p-4 no-print">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Dia</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={referenceDay}
                onChange={(e) => setReferenceDay(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mês</Label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {MONTHS_PT.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ano</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => {
                if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
              }}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => {
                if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
              }}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Switch id="hide-weekends" checked={hideWeekends} onCheckedChange={setHideWeekends} />
              <Label htmlFor="hide-weekends" className="cursor-pointer text-sm">Ocultar sábado e domingo</Label>
            </div>
          </div>
        </Card>

        {/* Calendar + side notes */}
        <Card className="p-4 print-area">
          <div className="mb-3 text-center">
            <h3 className="text-lg font-semibold text-foreground">{MONTHS_PT[month]} de {year}</h3>
          </div>

          <div className="flex gap-3">
            {/* Calendar grid */}
            <div className="flex-1 min-w-0">
              <div
                className="grid gap-1 mb-1"
                style={{ gridTemplateColumns: `repeat(${weekdays.length}, minmax(0, 1fr))` }}
              >
                {weekdays.map(w => (
                  <div key={w} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{w}</div>
                ))}
              </div>

              <div className="space-y-1">
                {weekRows.map((row, ri) => (
                  <div
                    key={`row-${ri}`}
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${weekdays.length}, minmax(0, 1fr))` }}
                  >
                    {row.cells.map((cell, idx) => {
                      if (!cell.date || !cell.iso) {
                        return <div key={`blank-${ri}-${idx}`} className="h-16" />;
                      }
                      const event = eventsByDate.get(cell.iso);
                      const delivery = event?.delivery;
                      const receipt = event?.receipt;
                      const receiptDelivery = receipt ? getDeliveryById(receipt.delivery_id) : undefined;
                      const isToday = toISO(new Date()) === cell.iso;
                      const isReference = cell.date.getDate() === referenceDay;

                      // Delivery day: no background/border change — only the "Entrega" badge inside.
                      // Receipt-only day: keep colored dashed border to highlight receipts.
                      const cellBg = receipt && !delivery && receiptDelivery ? `${receiptDelivery.color}10` : 'transparent';
                      const cellBorder = receipt && !delivery && receiptDelivery ? receiptDelivery.color : 'hsl(var(--border))';

                      const cellContent = (
                        <button
                          onClick={() => handleDayClick(cell.iso!)}
                          className={`group relative w-full h-16 rounded-md border-2 p-1 text-left transition-all hover:shadow-md hover:scale-[1.02] flex flex-col ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''} ${isReference && !isToday ? 'ring-1 ring-primary/40' : ''}`}
                          style={{
                            backgroundColor: cellBg,
                            borderColor: cellBorder,
                            borderStyle: receipt && !delivery ? 'dashed' : 'solid',
                          }}
                        >
                          <div className="flex items-start justify-between leading-none">
                            <span className="text-xs font-bold text-foreground">{cell.date.getDate()}</span>
                            {delivery && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => handleDeleteDelivery(e as any, delivery.id)}
                                className="opacity-0 group-hover:opacity-100 text-destructive cursor-pointer no-print"
                                title="Excluir entrega"
                              >
                                <Trash2 className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div className="mt-auto space-y-0.5">
                            {delivery && (
                              <div
                                className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded leading-tight"
                                style={{ backgroundColor: delivery.color, color: '#fff' }}
                              >
                                <Package className="w-3 h-3 shrink-0" />
                                <span className="truncate">Entrega</span>
                              </div>
                            )}
                            {receipt && receiptDelivery && (
                              <div
                                className="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded leading-tight"
                                style={{ backgroundColor: receiptDelivery.color, color: '#fff', border: `1.5px dashed #fff`, boxShadow: `inset 0 0 0 1.5px ${receiptDelivery.color}` }}
                              >
                                <DollarSign className="w-3 h-3 shrink-0" />
                                <span className="truncate">{receipt.value > 0 ? formatBRL(receipt.value) : 'R$ 0,00'}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );

                      if (delivery || receipt) {
                        return (
                          <Tooltip key={cell.iso} delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div>{cellContent}</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                {delivery && (
                                  <div>
                                    <strong>Entrega</strong> • {delivery.working_days} dia(s)<br />
                                    {fromISO(delivery.start_date).toLocaleDateString('pt-BR')} → {fromISO(delivery.end_date).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                                {receipt && receiptDelivery && (
                                  <div>
                                    <strong>Recebimento</strong><br />
                                    Data: {fromISO(receipt.receipt_date).toLocaleDateString('pt-BR')}<br />
                                    Valor: {formatBRL(receipt.value)}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return <div key={cell.iso}>{cellContent}</div>;
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Side notes column */}
            <div className="w-56 shrink-0 print-week-notes border-l border-border pl-3">
              <div className="text-[11px] font-semibold text-muted-foreground py-1 mb-1 text-center">Considerações da semana</div>
              <div className="space-y-1">
                {weekRows.map((row, ri) => {
                  const firstDate = row.cells.find(c => c.date)?.date;
                  const lastDate = [...row.cells].reverse().find(c => c.date)?.date;
                  const label = firstDate && lastDate
                    ? `${firstDate.getDate()}/${firstDate.getMonth() + 1} – ${lastDate.getDate()}/${lastDate.getMonth() + 1}`
                    : '—';
                  return (
                    <div key={`note-${ri}`} className="h-16">
                      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
                      <Textarea
                        value={getNoteValue(row.weekKey)}
                        onChange={(e) => handleNoteChange(row.weekKey, e.target.value)}
                        placeholder="Notas..."
                        className="h-[calc(100%-14px)] min-h-0 resize-none text-xs p-1.5 leading-tight"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-border pt-3 no-print">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-primary" /> Entrega (clique para criar)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border-2 border-dashed border-primary" /> Recebimento (auto, +7 dias da entrega)</div>
          </div>
        </Card>

        {/* Create delivery dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Entrega</DialogTitle>
              <DialogDescription>
                Selecione no mini-calendário todos os dias de produção que pertencem a esta entrega.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Data da entrega: <strong className="text-foreground">{createDate ? fromISO(createDate).toLocaleDateString('pt-BR') : ''}</strong>
              </p>

              <div>
                <Label className="text-xs text-muted-foreground">Dias de produção ({selectedProductionDays.size} selecionado{selectedProductionDays.size !== 1 ? 's' : ''})</Label>
                <div className="mt-2 border rounded-md p-2">
                  <div
                    className="grid gap-1 mb-1"
                    style={{ gridTemplateColumns: `repeat(${weekdays.length}, minmax(0, 1fr))` }}
                  >
                    {weekdays.map(w => (
                      <div key={w} className="text-center text-[10px] font-semibold text-muted-foreground">{w}</div>
                    ))}
                  </div>
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${weekdays.length}, minmax(0, 1fr))` }}
                  >
                    {miniCells.map((cell, idx) => {
                      if (!cell.date || !cell.iso) return <div key={`mb-${idx}`} className="h-7" />;
                      const selected = selectedProductionDays.has(cell.iso);
                      return (
                        <button
                          key={cell.iso}
                          type="button"
                          onClick={() => toggleProductionDay(cell.iso!)}
                          className={`h-7 text-xs rounded border transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary font-bold' : 'bg-background hover:bg-muted border-border'}`}
                        >
                          {cell.date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recebimento será gerado 7 dias após a data de entrega selecionada.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="create-receipt-value" className="text-xs text-muted-foreground">Valor do recebimento (R$)</Label>
                <Input
                  id="create-receipt-value"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={createReceiptValue}
                  onChange={(e) => setCreateReceiptValue(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirmCreate}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clear all confirm */}
        <AlertDialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar todas as movimentações?</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja realmente apagar todas as movimentações? Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { clearAll.mutate(); setClearAllOpen(false); }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
