import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon, Plus, Trash2, Printer, GripVertical, Save, Wallet, TrendingUp,
  AlertTriangle, PenLine, Building2, User, Layers,
  CalendarDays, Banknote, ListChecks, UserX, ArrowRight, Download,
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addDays, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar as DateRangeCalendar } from '@/components/ui/calendar';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import type { AlteracaoItem } from '@/components/AlteracoesPanel';
import { useToast } from '@/hooks/use-toast';
import { useCompanySettings } from '@/hooks/useFinancial';
import { DEFAULT_ASSINATURAS, DEFAULT_CARD_ORDER, DailySummary, emptySummary, useDailySummary, useLastDailySummary, useSaveDailySummary } from '@/hooks/useDailySummary';
import { exportResumoDiarioPDF } from '@/utils/resumoDiarioPdf';
import { monthWeekPeriods, remainingBusinessDays, remainingHolidayLabels, todaySaoPaulo, ymd } from '@/lib/holidays';

const uid = () => Math.random().toString(36).slice(2, 10);

export const parseMoney = (v?: string) => {
  if (!v) return 0;
  const clean = String(v).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
};

export const fmtMoney = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function InlineText({
  value, onChange, className = '', placeholder, align = 'left',
}: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string; align?: 'left' | 'right' }) {
  const filled = !!value && value.trim() !== '';
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ textAlign: align }}
      className={`rounded-md border px-2 py-1 text-sm outline-none transition-colors
        focus:border-primary focus:ring-2 focus:ring-primary/20
        ${filled
          ? 'border-border bg-card font-medium text-foreground'
          : 'border-dashed border-border/70 bg-muted/40 text-muted-foreground'} ${className}`}
    />
  );
}

function MoneyInput({
  value, onChange, className = '', inputClass = '', placeholder = '0,00',
}: { value: string; onChange: (v: string) => void; className?: string; inputClass?: string; placeholder?: string }) {
  const filled = !!value && value.trim() !== '';
  return (
    <div className={`flex items-center gap-1 rounded-md border px-2 py-1 transition-colors
      focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20
      ${filled ? 'border-border bg-card' : 'border-dashed border-border/70 bg-muted/40'} ${className}`}>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">R$</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full min-w-0 bg-transparent text-right text-sm outline-none
          ${filled ? 'font-medium text-foreground' : 'text-muted-foreground'} ${inputClass}`}
      />
    </div>
  );
}

const signClass = (n: number) => (n < 0 ? 'text-destructive' : n > 0 ? 'text-success' : 'text-foreground');

const CARD_META: Record<string, { title: string; icon: React.ElementType }> = {
  controle_semanal: { title: 'Controle Semanal', icon: CalendarDays },
  despesas: { title: 'Controle de Despesas', icon: Wallet },
  receitas: { title: 'Receitas a Receber', icon: Banknote },
  resultado: { title: 'Resultado Esperado · Caixa', icon: TrendingUp },
  resultado_comp: { title: 'Resultado Esperado · Competência', icon: TrendingUp },

  ausencias: { title: 'Controle de Ausências', icon: UserX },
  avisos: { title: 'Avisos e Pendências', icon: AlertTriangle },
  checklist: { title: 'Anexos', icon: ListChecks },
};


function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const meta = CARD_META[id];
  const Icon = meta?.icon || Layers;
  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.05),0_8px_24px_-12px_rgba(16,24,40,0.15)]">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="font-heading text-[0.78rem] font-bold uppercase tracking-[0.08em] text-foreground">
            {meta?.title}
          </h3>
          <span className="flex-1" />
          <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground/60 transition-colors hover:text-foreground active:cursor-grabbing" aria-label="Mover card">
            <GripVertical className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 resize-y overflow-auto p-5" style={{ minHeight: 120 }}>
          {children}
        </div>
      </section>
    </div>
  );
}

export default function ResumoDiario() {
  const { toast } = useToast();
  const today = ymd(todaySaoPaulo());
  const [date, setDate] = useState(today);
  const { data: loaded } = useDailySummary(date);
  const prevDate = useMemo(() => {
    try { return format(addDays(parse(date, 'yyyy-MM-dd', new Date()), -1), 'yyyy-MM-dd'); }
    catch { return date; }
  }, [date]);
  const { data: prevSummary } = useDailySummary(prevDate);
  const { data: lastSummary } = useLastDailySummary(date);
  const { data: company } = useCompanySettings();
  const saveMut = useSaveDailySummary();
  const [state, setState] = useState<DailySummary>(emptySummary(date));
  const [responsavel, setResponsavel] = useState('');
  const [exportChecklist, setExportChecklist] = useState({
    caixaAnual: false,
    caixaDia: false,
    dreAnual: false,
    dreDia: false,
  });
  const allExportChecked = Object.values(exportChecklist).every(Boolean);

  useEffect(() => {
    if (loaded?.id) {
      setState(loaded);
    } else if (loaded && lastSummary) {
      // nenhum resumo salvo nesta data: mantém as informações do último resumo salvo
      setState({ ...lastSummary, summary_date: date });
    } else if (loaded) {
      setState(loaded);
    }
  }, [loaded, lastSummary, date]);

  const dateLabel = useMemo(() => {
    try { return format(parse(date, 'yyyy-MM-dd', new Date()), "d 'de' MMMM 'de' yyyy", { locale: ptBR }); }
    catch { return date; }
  }, [date]);

  const empresa = (company as any)?.company_name || 'BTEX INDUSTRIA TEXTIL';

  const update = (patch: Partial<DailySummary>) => setState((s) => ({ ...s, ...patch }));

  const handleSave = async () => {
    try {
      await saveMut.mutateAsync(state);
      toast({ title: 'Resumo salvo com sucesso' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportResumoDiarioPDF(state, {
        empresa, responsavel, relatorio: 'Resumo Diário',
        despesasAnteriores: (prevSummary?.despesas || []).map((d) => ({ descricao: d.descricao, gasto: d.gasto })),
      });
    } catch (e: any) {
      toast({ title: 'Erro ao gerar PDF', description: e.message, variant: 'destructive' });
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const order = state.card_order?.length ? state.card_order : DEFAULT_CARD_ORDER;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    update({ card_order: arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id))) });
  };

  const saldoAlteracoes = state.alteracoes.reduce((acc, a) => acc + parseMoney(a.valor), 0);
  const totalReceitasReceber = state.receitas_receber.reduce((acc, r) => acc + parseMoney(r.valor), 0);



  // ─── Puxar eventualidades do Fluxo ───
  const [pullVariant, setPullVariant] = useState<'caixa' | 'competencia' | null>(null);
  const [pullRange, setPullRange] = useState<DateRange | undefined>();
  const [pulling, setPulling] = useState(false);

  const pullRangeLabel = useMemo(() => {
    if (!pullRange?.from) return 'Selecionar dia ou período';
    const fromLabel = format(pullRange.from, 'dd/MM/yyyy');
    const to = pullRange.to ?? pullRange.from;
    const toLabel = format(to, 'dd/MM/yyyy');
    return fromLabel === toLabel ? fromLabel : `${fromLabel} até ${toLabel}`;
  }, [pullRange]);

  const selectPullToday = () => {
    const current = new Date();
    setPullRange({ from: current, to: current });
  };

  const handlePull = async () => {
    if (!pullVariant) return;
    const from = pullRange?.from;
    const to = pullRange?.to ?? pullRange?.from;
    if (!from || !to) {
      toast({ title: 'Informe o período', description: 'Selecione um dia ou intervalo.', variant: 'destructive' });
      return;
    }
    const pullStart = format(from, 'yyyy-MM-dd');
    const pullEnd = format(to, 'yyyy-MM-dd');
    setPulling(true);
    try {
      const { data, error } = await supabase
        .from('cashflow_state')
        .select('alteracoes')
        .eq('state_key', 'default')
        .maybeSingle();
      if (error) throw error;
      const all = (((data as any)?.alteracoes as AlteracaoItem[]) || []).filter((it) => {
        if (!it?.date) return false;
        if (it.date < pullStart || it.date > pullEnd) return false;
        const impact = it.impact ?? 'ambos';
        return impact === 'ambos' || (pullVariant === 'competencia' ? impact === 'dre' : impact === 'caixa');
      });
      if (!all.length) {
        toast({ title: 'Nenhuma eventualidade encontrada para o período' });
        setPulling(false);
        return;
      }
      const novos = all.map((it) => ({ id: uid(), texto: it.description, valor: String(it.value ?? '') }));
      const isComp = pullVariant === 'competencia';
      const atual = isComp ? state.alteracoes_comp : state.alteracoes;
      update(isComp ? { alteracoes_comp: [...atual, ...novos] } : { alteracoes: [...atual, ...novos] });
      toast({ title: `${novos.length} eventualidade(s) importada(s)` });
      setPullVariant(null);
    } catch (e: any) {
      toast({ title: 'Erro ao puxar eventualidades', description: e.message, variant: 'destructive' });
    } finally {
      setPulling(false);
    }
  };

  const saldoAlteracoesComp = state.alteracoes_comp.reduce((acc, a) => acc + parseMoney(a.valor), 0);

  const renderResultado = (variant: 'caixa' | 'competencia') => {
    const isComp = variant === 'competencia';
    const alt = isComp ? state.alteracoes_comp : state.alteracoes;
    const setAlt = (arr: typeof alt) => update(isComp ? { alteracoes_comp: arr } : { alteracoes: arr });
    const saldo = isComp ? saldoAlteracoesComp : saldoAlteracoes;
    const rec = isComp ? state.receitas_esperadas_comp : state.receitas_esperadas;
    const desp = isComp ? state.despesas_programadas_comp : state.despesas_programadas;
    const res = isComp
      ? [state.resultado_comp_inicio, state.resultado_comp_ontem, state.resultado_comp_hoje]
      : [state.resultado_inicio, state.resultado_ontem, state.resultado_hoje];
    const setRes = (i: number, v: string) => {
      if (isComp) update(i === 0 ? { resultado_comp_inicio: v } : i === 1 ? { resultado_comp_ontem: v } : { resultado_comp_hoje: v });
      else update(i === 0 ? { resultado_inicio: v } : i === 1 ? { resultado_ontem: v } : { resultado_hoje: v });
    };
    const labels = ['Início do mês', 'Última Reunião', 'Hoje'];
    return (
      <div className="space-y-4">
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isComp ? 'border-primary/30 bg-primary/5' : 'border-warning/30 bg-warning/5'}`}>
          <span className={`text-[0.66rem] font-bold uppercase tracking-[0.12em] ${isComp ? 'text-primary' : 'text-warning'}`}>
            Referente a {isComp ? 'Competência' : 'Caixa'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2">
            <p className="mb-1 text-[0.64rem] font-semibold uppercase tracking-wider text-success">Receitas esperadas para o mês</p>
            <MoneyInput value={rec} onChange={(v) => update(isComp ? { receitas_esperadas_comp: v } : { receitas_esperadas: v })} inputClass="!font-bold text-success" />
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="mb-1 text-[0.64rem] font-semibold uppercase tracking-wider text-destructive">Despesas programadas para o mês</p>
            <MoneyInput value={desp} onChange={(v) => update(isComp ? { despesas_programadas_comp: v } : { despesas_programadas: v })} inputClass="!font-bold text-destructive" />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4 rounded-lg bg-muted/50 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Resultado esperado</span>
          <span className="flex-1" />
          {res.map((v, i) => (
            <div key={labels[i]} className="flex items-end gap-3">
              {i === 2 && <ArrowRight className="mb-2 h-4 w-4 shrink-0 text-muted-foreground" />}
              <div className="min-w-[92px] opacity-60">
                <p className="mb-1 text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">{labels[i]}</p>
                <MoneyInput value={v} onChange={(nv) => setRes(i, nv)} inputClass="!text-xs font-semibold" />
              </div>
            </div>
          ))}
          {!isComp && (
            <div className="min-w-[140px] rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 shadow-sm">
              <p className="mb-1 text-[0.64rem] font-bold uppercase tracking-wider text-primary">Acumulado</p>
              <MoneyInput value={state.resultado_acumulado} onChange={(nv) => update({ resultado_acumulado: nv })}
                inputClass={`!text-base font-bold ${signClass(parseMoney(state.resultado_acumulado))}`} />
            </div>
          )}
        </div>
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">Alterações</p>
          <div className="space-y-2">
            {alt.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <InlineText value={item.texto} placeholder="Descritivo" className="flex-1"
                  onChange={(v) => { const arr = [...alt]; arr[i] = { ...arr[i], texto: v }; setAlt(arr); }} />
                <MoneyInput value={item.valor || ''} className="w-32" inputClass={signClass(parseMoney(item.valor))}
                  onChange={(v) => { const arr = [...alt]; arr[i] = { ...arr[i], valor: v }; setAlt(arr); }} />
                <button className="text-muted-foreground transition-colors hover:text-destructive" onClick={() => setAlt(alt.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">Saldo total</span>
              <span className={`text-sm font-bold ${signClass(saldo)}`}>R$ {fmtMoney(saldo)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setAlt([...alt, { id: uid(), texto: '', valor: '' }])}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setPullVariant(variant); setPullRange(undefined); }}>
                <Download className="mr-1 h-4 w-4" /> Puxar eventualidades
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const cardContent: Record<string, React.ReactNode> = {
    controle_semanal: (
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-secondary-foreground">
              <th className="px-3 py-2 text-left text-[0.68rem] font-semibold uppercase tracking-wider">Semana</th>
              <th className="px-3 py-2 text-left text-[0.68rem] font-semibold uppercase tracking-wider">Período</th>
              <th className="px-3 py-2 text-right text-[0.68rem] font-semibold uppercase tracking-wider">Objetivo</th>
              <th className="px-3 py-2 text-right text-[0.68rem] font-semibold uppercase tracking-wider">Projeção</th>
              <th className="px-3 py-2 text-center text-[0.68rem] font-semibold uppercase tracking-wider">Concluída</th>
            </tr>
          </thead>
          <tbody>
            {(state.controle_semanal || []).map((sem, i) => {
              const setSem = (patch: Partial<typeof sem>) => {
                const arr = [...state.controle_semanal];
                arr[i] = { ...arr[i], ...patch };
                update({ controle_semanal: arr });
              };
              return (
                <tr key={sem.id} className={`border-t border-border even:bg-muted/40 transition-opacity ${sem.done ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-1.5 text-sm font-semibold text-foreground">{sem.nome}</td>
                  <td className="p-1.5">
                    <InlineText value={sem.periodo} placeholder="01/08 a 07/08" className="w-full"
                      onChange={(v) => setSem({ periodo: v })} />
                  </td>
                  <td className="p-1.5">
                    <MoneyInput value={sem.objetivo} className="w-32 ml-auto" inputClass="!font-semibold"
                      onChange={(v) => setSem({ objetivo: v })} />
                  </td>
                  <td className="p-1.5">
                    {sem.done ? (
                      <div className="w-32 ml-auto text-right text-sm font-semibold text-muted-foreground">
                        R$ {fmtMoney(parseMoney(sem.objetivo))}
                      </div>
                    ) : (
                      <MoneyInput value={sem.projecao || ''} className="w-32 ml-auto" inputClass="!font-semibold"
                        onChange={(v) => setSem({ projecao: v })} />
                    )}
                  </td>
                  <td className="p-1.5 text-center">
                    <Checkbox checked={sem.done} onCheckedChange={(c) => setSem({ done: !!c })} aria-label={`${sem.nome} concluída`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/60">
              <td className="px-3 py-2 text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground" colSpan={3}>
                Saldo total da projeção
              </td>
              <td className="px-3 py-2 text-right text-sm font-bold text-primary">
                R$ {fmtMoney((state.controle_semanal || []).reduce((s, sem) => s + parseMoney(sem.done ? sem.objetivo : (sem.projecao || '')), 0))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    ),


    despesas: (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary-foreground">
                <th className="px-3 py-2 text-left text-[0.68rem] font-semibold uppercase tracking-wider">Descrição</th>
                <th className="px-3 py-2 text-right text-[0.68rem] font-bold uppercase tracking-wider">Previsão</th>
                <th className="px-3 py-2 text-right text-[0.7rem] font-semibold uppercase tracking-wider">Gasto</th>
                <th className="px-3 py-2 text-right text-[0.68rem] font-semibold uppercase tracking-wider">% Consumida</th>
                <th className="px-2 py-2 text-center text-[0.68rem] font-semibold uppercase tracking-wider">= / +</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {state.despesas.map((item, i) => {
                const prev = parseMoney(item.orcado);
                const gasto = parseMoney(item.gasto);
                const pct = prev > 0 ? (gasto / prev) * 100 : 0;
                const pctColor = pct >= 100 ? 'text-destructive' : pct >= 75 ? 'text-warning' : 'text-success';
                return (
                  <tr key={item.id} className="border-t border-border even:bg-muted/40">
                    <td className="p-1.5">
                      <InlineText value={item.descricao} placeholder="Descrição" className="w-full"
                        onChange={(v) => { const arr = [...state.despesas]; arr[i] = { ...arr[i], descricao: v }; update({ despesas: arr }); }} />
                    </td>
                    <td className="p-1.5">
                      <MoneyInput value={item.orcado} inputClass="font-bold"
                        onChange={(v) => { const arr = [...state.despesas]; arr[i] = { ...arr[i], orcado: v }; update({ despesas: arr }); }} />
                    </td>
                    <td className="p-1.5">
                      <MoneyInput value={item.gasto} inputClass="!text-base"
                        onChange={(v) => { const arr = [...state.despesas]; arr[i] = { ...arr[i], gasto: v }; update({ despesas: arr }); }} />
                    </td>
                    <td className={`p-1.5 text-right text-sm font-semibold ${pctColor}`}>
                      {prev > 0 ? `${pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-center text-sm font-bold">
                      {(() => {
                        const tr = item.trend === '+' ? '+' : '=';
                        return (
                          <button
                            type="button"
                            title="Clique para alternar entre = e +"
                            className={`h-6 w-6 rounded border border-border transition-colors hover:bg-muted ${tr === '+' ? 'text-destructive' : 'text-muted-foreground'}`}
                            onClick={() => { const arr = [...state.despesas]; arr[i] = { ...arr[i], trend: tr === '+' ? '=' : '+' }; update({ despesas: arr }); }}
                          >
                            {tr}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="p-1.5 text-center">
                      <button className="text-muted-foreground transition-colors hover:text-destructive" onClick={() => update({ despesas: state.despesas.filter((_, j) => j !== i) })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {state.despesas.length > 0 && (
                <tr className="border-t-2 border-border bg-muted/60 font-bold">
                  <td className="px-3 py-2 text-sm text-foreground">Total</td>
                  <td className="px-3 py-2 text-right text-sm text-foreground">
                    R$ {fmtMoney(state.despesas.reduce((acc, d) => acc + parseMoney(d.orcado), 0))}
                  </td>
                  <td className="px-3 py-2 text-right text-sm text-foreground">
                    R$ {fmtMoney(state.despesas.reduce((acc, d) => acc + parseMoney(d.gasto), 0))}
                  </td>
                  <td colSpan={3} />
                </tr>
              )}
              {!state.despesas.length && (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-xs text-muted-foreground">Nenhum item lançado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" onClick={() => update({ despesas: [...state.despesas, { id: uid(), descricao: '', gasto: '', orcado: '' }] })}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar item
        </Button>
      </div>
    ),
    receitas: (
      <div className="space-y-2">
        {state.receitas_receber.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            <InlineText value={item.texto} placeholder="Descritivo" className="flex-1"
              onChange={(v) => { const arr = [...state.receitas_receber]; arr[i] = { ...arr[i], texto: v }; update({ receitas_receber: arr }); }} />
            <MoneyInput value={item.valor || ''} className="w-32" inputClass="!font-semibold text-success"
              onChange={(v) => { const arr = [...state.receitas_receber]; arr[i] = { ...arr[i], valor: v }; update({ receitas_receber: arr }); }} />
            <button className="text-muted-foreground transition-colors hover:text-destructive" onClick={() => update({ receitas_receber: state.receitas_receber.filter((_, j) => j !== i) })}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {!state.receitas_receber.length && <p className="text-xs text-muted-foreground">Nenhuma receita lançada</p>}
        {state.receitas_receber.length > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
            <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">Total</span>
            <span className="text-sm font-bold text-success">R$ {fmtMoney(totalReceitasReceber)}</span>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => update({ receitas_receber: [...state.receitas_receber, { id: uid(), texto: '', valor: '' }] })}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar receita
        </Button>
      </div>
    ),
    resultado: renderResultado('caixa'),
    resultado_comp: renderResultado('competencia'),

    avisos: (
      <div className="space-y-2">
        {state.avisos.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
            <InlineText value={item.texto} placeholder="Aviso ou pendência" className="flex-1"
              onChange={(v) => { const arr = [...state.avisos]; arr[i] = { ...arr[i], texto: v }; update({ avisos: arr }); }} />
            <button className="text-muted-foreground transition-colors hover:text-destructive" onClick={() => update({ avisos: state.avisos.filter((_, j) => j !== i) })}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {!state.avisos.length && <p className="text-xs text-muted-foreground">Nenhum aviso registrado</p>}
        <Button variant="outline" size="sm" onClick={() => update({ avisos: [...state.avisos, { id: uid(), texto: '' }] })}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>
    ),
    ausencias: (
      <div className="space-y-2">
        {(state.controle_ausencias || []).map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <InlineText value={item.nome} placeholder="Nome" className="w-40"
              onChange={(v) => { const arr = [...state.controle_ausencias]; arr[i] = { ...arr[i], nome: v }; update({ controle_ausencias: arr }); }} />
            <InlineText value={item.justificativa} placeholder="Justificativa" className="flex-1"
              onChange={(v) => { const arr = [...state.controle_ausencias]; arr[i] = { ...arr[i], justificativa: v }; update({ controle_ausencias: arr }); }} />
            <button className="text-muted-foreground transition-colors hover:text-destructive" onClick={() => update({ controle_ausencias: state.controle_ausencias.filter((_, j) => j !== i) })}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {!(state.controle_ausencias || []).length && <p className="text-xs text-muted-foreground">Nenhuma ausência registrada</p>}
        <Button variant="outline" size="sm" onClick={() => update({ controle_ausencias: [...(state.controle_ausencias || []), { id: uid(), nome: '', justificativa: '' }] })}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar ausência
        </Button>
      </div>
    ),
    checklist: (
      <div className="space-y-2">
        {state.checklist.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <Checkbox
              checked={item.done}
              onCheckedChange={(c) => { const arr = [...state.checklist]; arr[i] = { ...arr[i], done: !!c }; update({ checklist: arr }); }}
            />
            <InlineText value={item.texto} placeholder="Descritivo" className="flex-1"
              onChange={(v) => { const arr = [...state.checklist]; arr[i] = { ...arr[i], texto: v }; update({ checklist: arr }); }} />
            <button className="text-muted-foreground transition-colors hover:text-destructive" onClick={() => update({ checklist: state.checklist.filter((_, j) => j !== i) })}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {!state.checklist.length && <p className="text-xs text-muted-foreground">Nenhum item na lista</p>}
        <Button variant="outline" size="sm" onClick={() => update({ checklist: [...state.checklist, { id: uid(), texto: '', done: false }] })}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar anexo
        </Button>
      </div>
    ),
  };

  const kpis = [
    { label: 'Dias Úteis Restantes', icon: CalendarDays, value: state.dias_uteis_restante, onChange: (v: string) => update({ dias_uteis_restante: v }), accent: 'text-primary', money: false },
    { label: 'Faturamento Atual', icon: Banknote, value: state.faturamento_necessario, onChange: (v: string) => update({ faturamento_necessario: v }), accent: 'text-primary', money: true },
    { label: 'Objetivo de Faturamento', icon: TrendingUp, value: state.objetivo_faturamento, onChange: (v: string) => update({ objetivo_faturamento: v }), accent: 'text-primary', money: true },
    { label: 'Receitas do Dia', icon: TrendingUp, value: state.receitas_dia, onChange: (v: string) => update({ receitas_dia: v }), accent: 'text-success', money: true },
    { label: 'Despesas do Dia', icon: Wallet, value: state.despesas_dia, onChange: (v: string) => update({ despesas_dia: v }), accent: 'text-destructive', money: true },
  ];

  return (
    <div className="mx-auto max-w-6xl animate-fade-in space-y-6 pb-10">
      {/* Barra de ações */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Resumo Diário</h1>
          <p className="text-sm text-muted-foreground">Relatório executivo de acompanhamento operacional</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Exportar</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { key: 'caixaAnual', label: 'Caixa Anual' },
                { key: 'caixaDia', label: 'Caixa do Dia' },
                { key: 'dreAnual', label: 'DRE Anual' },
                { key: 'dreDia', label: 'DRE do Dia' },
              ].map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground">
                  <Checkbox
                    checked={exportChecklist[item.key as keyof typeof exportChecklist]}
                    onCheckedChange={(c) => setExportChecklist((s) => ({ ...s, [item.key]: !!c }))}
                    aria-label={item.label}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMut.isPending}>
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
          <Button size="sm" onClick={handleExportPDF} disabled={!allExportChecked}>
            <Printer className="mr-1 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cabeçalho institucional */}
      <header className="overflow-hidden rounded-2xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-4 bg-secondary px-6 py-5 text-secondary-foreground">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="min-w-[200px] flex-1">
            <p className="font-heading text-lg font-bold leading-tight">Resumo Diário</p>
            <p className="text-sm opacity-80">{empresa}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2">
            <CalendarIcon className="h-4 w-4" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none [color-scheme:dark]"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-border bg-card px-6 py-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Data por extenso
            </p>
            <p className="text-sm font-semibold text-foreground">{dateLabel}</p>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="h-3.5 w-3.5" /> Responsável
            </p>
            <InlineText value={responsavel} onChange={setResponsavel} placeholder="Nome do responsável" className="w-full" />
          </div>
        </div>
      </header>

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-start gap-2">
              <k.icon className={`mt-0.5 h-4 w-4 shrink-0 ${k.accent}`} />
              <p className="min-w-0 break-words text-[0.62rem] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">{k.label}</p>
            </div>
            {k.money ? (
              <MoneyInput value={k.value} onChange={k.onChange} inputClass={`!text-xl !font-bold ${k.accent}`} />
            ) : (
              <InlineText value={k.value} onChange={k.onChange} className={`w-full !text-xl !font-bold ${k.accent}`} placeholder="—" />
            )}
            {k.label === 'Objetivo de Faturamento' && (
              <div className="mt-2 space-y-1 border-t border-border pt-2">
                <p className="text-[0.58rem] font-semibold uppercase tracking-wide text-muted-foreground">Possíveis perdas</p>
                <MoneyInput value={state.possiveis_perdas} onChange={(v) => update({ possiveis_perdas: v })} inputClass="!text-sm font-semibold text-destructive" />
                {parseMoney(state.possiveis_perdas) !== 0 && (
                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <span className="text-[0.58rem] font-semibold uppercase tracking-wide text-muted-foreground">Novo objetivo</span>
                    <span className="text-sm font-bold text-primary">R$ {fmtMoney(parseMoney(state.objetivo_faturamento) - parseMoney(state.possiveis_perdas))}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Saldos do dia */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="mb-1 text-[0.64rem] font-semibold uppercase tracking-wider text-primary">Saldo inicial do dia</p>
          <MoneyInput value={state.saldo_inicial_dia} onChange={(v) => update({ saldo_inicial_dia: v })} inputClass="!font-bold !text-lg text-primary" />
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="mb-1 text-[0.64rem] font-semibold uppercase tracking-wider text-primary">Saldo final do dia</p>
          <MoneyInput value={state.saldo_final_dia} onChange={(v) => update({ saldo_final_dia: v })} inputClass="!font-bold !text-lg text-primary" />
        </div>
      </div>


      {/* Cards */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            {order.map((k) => cardContent[k] && (
              <SortableCard key={k} id={k}>{cardContent[k]}</SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Assinaturas */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PenLine className="h-4 w-4" />
          </span>
          <h3 className="font-heading text-[0.78rem] font-bold uppercase tracking-[0.08em] text-foreground">Assinaturas</h3>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {state.assinaturas.map((s, i) => (
            <div key={s.id} className="text-center">
              <div className="h-8 border-b-2 border-foreground/70" />
              <div className="mt-2 flex items-center justify-center gap-1">
                <InlineText value={s.nome} placeholder="Nome" className="w-full text-center"
                  onChange={(v) => { const arr = [...state.assinaturas]; arr[i] = { ...arr[i], nome: v }; update({ assinaturas: arr }); }} />
                <button className="text-muted-foreground transition-colors hover:text-destructive" onClick={() => update({ assinaturas: state.assinaturas.filter((_, j) => j !== i) })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => update({ assinaturas: [...state.assinaturas, { id: uid(), nome: '' }] })}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar assinante
          </Button>
        </div>
      </section>

      <Dialog open={pullVariant !== null} onOpenChange={(o) => { if (!o) setPullVariant(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Puxar eventualidades · {pullVariant === 'competencia' ? 'Competência' : 'Caixa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Selecione o período. Serão importadas as eventualidades marcadas como{' '}
              {pullVariant === 'competencia' ? '"DRE"' : '"Caixa"'} ou "DRE/Caixa".
            </p>
            <div className="space-y-2">
              <Label>Data ou período</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {pullRangeLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DateRangeCalendar
                      mode="range"
                      selected={pullRange}
                      onSelect={setPullRange}
                      numberOfMonths={1}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="secondary" size="sm" className="sm:self-stretch" onClick={selectPullToday}>
                  Hoje
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPullVariant(null)}>Cancelar</Button>
            <Button onClick={handlePull} disabled={pulling}>{pulling ? 'Buscando...' : 'Puxar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
