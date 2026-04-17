import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Trash2, DollarSign, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Color palette - rotates per delivery
const COLOR_PALETTE = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
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

// Calculate end date by adding N working days (excluding weekends), starting at startDate (inclusive)
function calcEndDateByWorkingDays(startDate: Date, workingDays: number): Date {
  const result = new Date(startDate);
  let counted = 0;
  if (!isWeekend(result)) counted = 1;
  while (counted < workingDays) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) counted++;
  }
  return result;
}

// Generate list of working day ISO strings between start and end (inclusive)
function getDeliveryDays(startISO: string, endISO: string): string[] {
  const days: string[] = [];
  const cur = fromISO(startISO);
  const end = fromISO(endISO);
  while (cur <= end) {
    if (!isWeekend(cur)) days.push(toISO(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// Calculate receipt date: 7 calendar days after end_date, then move to next working day if it's weekend
function calcReceiptDate(endDateISO: string): string {
  const d = fromISO(endDateISO);
  d.setDate(d.getDate() + 7);
  while (isWeekend(d)) d.setDate(d.getDate() + 1);
  return toISO(d);
}

export default function FinanceCalendar() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [hideWeekends, setHideWeekends] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [workingDaysInput, setWorkingDaysInput] = useState(1);

  const [editReceiptOpen, setEditReceiptOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [receiptValueInput, setReceiptValueInput] = useState('');

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

  // Mutations
  const createDelivery = useMutation({
    mutationFn: async ({ startISO, days }: { startISO: string; days: number }) => {
      const startDate = fromISO(startISO);
      const endDate = calcEndDateByWorkingDays(startDate, days);
      const endISO = toISO(endDate);
      const colorIndex = deliveries.length % COLOR_PALETTE.length;
      const color = COLOR_PALETTE[colorIndex];

      const { data: del, error } = await (supabase
        .from('calendar_deliveries' as any)
        .insert({
          start_date: startISO,
          end_date: endISO,
          working_days: days,
          color,
          color_index: colorIndex,
        } as any)
        .select()
        .single() as any);
      if (error) throw error;

      // Auto-create receipt
      const receiptISO = calcReceiptDate(endISO);
      const { error: rErr } = await (supabase
        .from('calendar_receipts' as any)
        .insert({ delivery_id: (del as any).id, receipt_date: receiptISO, value: 0 } as any) as any);
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
      const { error } = await (supabase.from('calendar_deliveries' as any).delete().eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar_deliveries'] });
      qc.invalidateQueries({ queryKey: ['calendar_receipts'] });
      toast({ title: 'Entrega excluída', description: 'Recebimento vinculado também foi removido.' });
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

  // Build calendar grid
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells: { date: Date | null; iso: string | null }[] = [];

    // Leading blanks
    const startWeekday = firstDay.getDay();
    if (!hideWeekends) {
      for (let i = 0; i < startWeekday; i++) cells.push({ date: null, iso: null });
    } else {
      // Skip leading until Monday
      let leading = startWeekday === 0 ? 0 : startWeekday - 1;
      if (startWeekday === 0) leading = 0; // sunday hidden, no leading
      for (let i = 0; i < leading; i++) cells.push({ date: null, iso: null });
    }

    // Days of month
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
      const days = getDeliveryDays(del.start_date, del.end_date);
      days.forEach(iso => {
        const cur = map.get(iso) || {};
        cur.delivery = del;
        map.set(iso, cur);
      });
    });
    receipts.forEach(rec => {
      const cur = map.get(rec.receipt_date) || {};
      cur.receipt = rec;
      map.set(rec.receipt_date, cur);
    });
    return map;
  }, [deliveries, receipts]);

  const handleDayClick = (iso: string) => {
    setCreateDate(iso);
    setWorkingDaysInput(1);
    setCreateOpen(true);
  };

  const handleConfirmCreate = () => {
    if (!createDate || workingDaysInput < 1) return;
    createDelivery.mutate({ startISO: createDate, days: workingDaysInput });
    setCreateOpen(false);
  };

  const handleReceiptClick = (e: React.MouseEvent, receipt: Receipt) => {
    e.stopPropagation();
    setEditingReceipt(receipt);
    setReceiptValueInput(String(receipt.value));
    setEditReceiptOpen(true);
  };

  const handleSaveReceipt = () => {
    if (!editingReceipt) return;
    const v = parseFloat(receiptValueInput.replace(',', '.')) || 0;
    updateReceiptValue.mutate({ id: editingReceipt.id, value: v });
    setEditReceiptOpen(false);
  };

  const handleDeleteDelivery = (e: React.MouseEvent, deliveryId: string) => {
    e.stopPropagation();
    if (confirm('Excluir esta entrega? O recebimento vinculado também será removido.')) {
      deleteDelivery.mutate(deliveryId);
    }
  };

  const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const weekdays = hideWeekends ? WEEKDAYS_NO_WEEKEND : WEEKDAYS_FULL;

  // Find deliveries for a receipt's tooltip
  const getDeliveryById = (id: string) => deliveries.find(d => d.id === id);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Calendário</h2>
          <p className="text-sm text-muted-foreground">Cadastre entregas e visualize recebimentos automáticos.</p>
        </div>

        {/* Filter & options */}
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-4">
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
                className="w-28"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="icon" onClick={() => {
                if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
              }}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => {
                if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
              }}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Switch id="hide-weekends" checked={hideWeekends} onCheckedChange={setHideWeekends} />
              <Label htmlFor="hide-weekends" className="cursor-pointer">Ocultar sábado e domingo</Label>
            </div>
          </div>
        </Card>

        {/* Calendar */}
        <Card className="p-4">
          <div className="mb-3 text-center">
            <h3 className="text-lg font-semibold text-foreground">{MONTHS_PT[month]} de {year}</h3>
          </div>

          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${weekdays.length}, minmax(0, 1fr))` }}
          >
            {weekdays.map(w => (
              <div key={w} className="text-center text-xs font-semibold text-muted-foreground py-2">{w}</div>
            ))}

            {calendarCells.map((cell, idx) => {
              if (!cell.date || !cell.iso) {
                return <div key={`blank-${idx}`} className="aspect-square" />;
              }
              const event = eventsByDate.get(cell.iso);
              const delivery = event?.delivery;
              const receipt = event?.receipt;
              const receiptDelivery = receipt ? getDeliveryById(receipt.delivery_id) : undefined;
              const isToday = toISO(new Date()) === cell.iso;

              const cellBg = delivery ? `${delivery.color}22` : 'transparent';
              const cellBorder = delivery ? delivery.color : undefined;

              const cellContent = (
                <button
                  onClick={() => handleDayClick(cell.iso!)}
                  className={`relative w-full aspect-square rounded-md border-2 p-1 text-left transition-all hover:shadow-md hover:scale-[1.02] ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  style={{
                    backgroundColor: cellBg,
                    borderColor: cellBorder || 'hsl(var(--border))',
                    borderStyle: receipt && !delivery ? 'dashed' : 'solid',
                    ...(receipt && receiptDelivery && !delivery ? { borderColor: receiptDelivery.color, backgroundColor: `${receiptDelivery.color}11` } : {}),
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-semibold text-foreground">{cell.date.getDate()}</span>
                    {delivery && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleDeleteDelivery(e as any, delivery.id)}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-destructive cursor-pointer"
                        title="Excluir entrega"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {delivery && (
                      <div
                        className="flex items-center gap-1 text-[10px] font-medium px-1 py-0.5 rounded"
                        style={{ backgroundColor: delivery.color, color: '#fff' }}
                      >
                        <Package className="w-2.5 h-2.5" />
                        <span className="truncate">Entrega</span>
                      </div>
                    )}
                    {receipt && receiptDelivery && (
                      <div
                        onClick={(e) => handleReceiptClick(e, receipt)}
                        className="flex items-center gap-1 text-[10px] font-medium px-1 py-0.5 rounded cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: '#fff', color: receiptDelivery.color, border: `1px dashed ${receiptDelivery.color}` }}
                      >
                        <DollarSign className="w-2.5 h-2.5" />
                        <span className="truncate">{receipt.value > 0 ? formatBRL(receipt.value) : 'R$'}</span>
                      </div>
                    )}
                  </div>
                </button>
              );

              if (delivery || receipt) {
                return (
                  <Tooltip key={cell.iso} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div className="group">{cellContent}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        {delivery && (
                          <div>
                            <strong>Entrega</strong> • {delivery.working_days} dia(s) úteis<br />
                            {fromISO(delivery.start_date).toLocaleDateString('pt-BR')} → {fromISO(delivery.end_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {receipt && receiptDelivery && (
                          <div>
                            <strong>Recebimento</strong><br />
                            Data: {fromISO(receipt.receipt_date).toLocaleDateString('pt-BR')}<br />
                            Valor: {formatBRL(receipt.value)}<br />
                            <span className="text-muted-foreground">Entrega vinculada: {fromISO(receiptDelivery.start_date).toLocaleDateString('pt-BR')} a {fromISO(receiptDelivery.end_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={cell.iso} className="group">{cellContent}</div>;
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-border pt-3">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-primary" /> Entrega (clique para criar)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border-2 border-dashed border-primary" /> Recebimento (auto, +7 dias)</div>
          </div>
        </Card>

        {/* Create delivery dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Entrega</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Início: <strong className="text-foreground">{createDate ? fromISO(createDate).toLocaleDateString('pt-BR') : ''}</strong>
              </p>
              <div className="space-y-1">
                <Label htmlFor="working-days">Quantidade de dias úteis</Label>
                <Input
                  id="working-days"
                  type="number"
                  min={1}
                  value={workingDaysInput}
                  onChange={(e) => setWorkingDaysInput(Math.max(1, Number(e.target.value) || 1))}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-muted-foreground">
                  Sábados e domingos são ignorados. Recebimento será gerado 7 dias após a última data.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirmCreate}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit receipt dialog */}
        <Dialog open={editReceiptOpen} onOpenChange={setEditReceiptOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Valor do Recebimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="receipt-value">Valor (R$)</Label>
                <Input
                  id="receipt-value"
                  type="number"
                  step="0.01"
                  value={receiptValueInput}
                  onChange={(e) => setReceiptValueInput(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditReceiptOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveReceipt}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
