import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Plus, Trash2, Printer, GripVertical, Save } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_CARD_ORDER, DailySummary, emptySummary, useDailySummary, useSaveDailySummary } from '@/hooks/useDailySummary';

const uid = () => Math.random().toString(36).slice(2, 10);

function InlineText({ value, onChange, className = '', placeholder }: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-transparent outline-none focus:ring-2 focus:ring-primary/40 rounded px-1 ${className}`}
    />
  );
}

function CardShell({ id, title, children, dragHandleProps }: { id: string; title: string; children: React.ReactNode; dragHandleProps?: any }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <button {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground no-print" aria-label="Mover card">
          <GripVertical className="w-4 h-4" />
        </button>
        <h3 className="font-heading font-semibold text-foreground text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SortableCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      <CardShell id={id} title={title} dragHandleProps={{ ...attributes, ...listeners }}>
        {children}
      </CardShell>
    </div>
  );
}

export default function ResumoDiario() {
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const { data: loaded, isLoading } = useDailySummary(date);
  const saveMut = useSaveDailySummary();
  const [state, setState] = useState<DailySummary>(emptySummary(date));
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loaded) setState(loaded);
  }, [loaded]);

  const dateLabel = useMemo(() => {
    try { return format(parse(date, 'yyyy-MM-dd', new Date()), "d 'de' MMMM 'de' yyyy", { locale: ptBR }); }
    catch { return date; }
  }, [date]);

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
    if (!printRef.current) return;
    document.body.classList.add('is-exporting-pdf');
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 10;
      pdf.addImage(imgData, 'PNG', 10, position, imgW, imgH);
      heightLeft -= pageH - 20;
      while (heightLeft > 0) {
        position = heightLeft - imgH + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgW, imgH);
        heightLeft -= pageH - 20;
      }
      pdf.save(`resumo-diario-${date}.pdf`);
    } finally {
      document.body.classList.remove('is-exporting-pdf');
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const order = state.card_order?.length ? state.card_order : DEFAULT_CARD_ORDER;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    update({ card_order: arrayMove(order, oldIndex, newIndex) });
  };

  const cardContent: Record<string, { title: string; node: React.ReactNode }> = {
    despesas: {
      title: 'Controle de Despesas',
      node: (
        <div className="space-y-2">
          {state.despesas.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2 flex-wrap">
              <InlineText value={item.descricao} onChange={(v) => { const arr = [...state.despesas]; arr[i] = { ...arr[i], descricao: v }; update({ despesas: arr }); }} placeholder="descrição" className="min-w-[140px] flex-1 border-b border-border" />
              <span className="text-sm text-muted-foreground">Gasto:</span>
              <InlineText value={item.gasto} onChange={(v) => { const arr = [...state.despesas]; arr[i] = { ...arr[i], gasto: v }; update({ despesas: arr }); }} className="w-24 border-b border-border" />
              <span className="text-sm text-muted-foreground">Orçado:</span>
              <InlineText value={item.orcado} onChange={(v) => { const arr = [...state.despesas]; arr[i] = { ...arr[i], orcado: v }; update({ despesas: arr }); }} className="w-24 border-b border-border" />
              <button className="text-destructive no-print" onClick={() => update({ despesas: state.despesas.filter((_, j) => j !== i) })}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="no-print" onClick={() => update({ despesas: [...state.despesas, { id: uid(), descricao: '', gasto: '', orcado: '' }] })}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar item
          </Button>
        </div>
      ),
    },
    resultado: {
      title: 'Resultado Esperado',
      node: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-foreground">Resultado Esperado Início do Mês:</span>
            <InlineText value={state.resultado_inicio} onChange={(v) => update({ resultado_inicio: v })} className="flex-1 min-w-[100px] border-b border-border" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-foreground">Resultado esperado ontem:</span>
            <InlineText value={state.resultado_ontem} onChange={(v) => update({ resultado_ontem: v })} className="flex-1 min-w-[100px] border-b border-border" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-foreground">Resultado esperado hoje:</span>
            <InlineText value={state.resultado_hoje} onChange={(v) => update({ resultado_hoje: v })} className="flex-1 min-w-[100px] border-b border-border" />
          </div>
          <div className="pt-2 mt-2 border-t border-border">
            <p className="text-sm font-semibold text-foreground mb-1">Alterações:</p>
            <div className="space-y-1">
              {state.alteracoes.map((item, i) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground">•</span>
                  <InlineText value={item.texto} onChange={(v) => { const arr = [...state.alteracoes]; arr[i] = { ...arr[i], texto: v }; update({ alteracoes: arr }); }} className="flex-1 border-b border-border" />
                  <button className="text-destructive no-print" onClick={() => update({ alteracoes: state.alteracoes.filter((_, j) => j !== i) })}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="no-print" onClick={() => update({ alteracoes: [...state.alteracoes, { id: uid(), texto: '' }] })}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    receitas_despesas: {
      title: 'Receitas e Despesas do Dia',
      node: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-3 bg-positive-row-bg/30">
            <p className="text-xs text-muted-foreground mb-1">Receitas do Dia</p>
            <InlineText value={state.receitas_dia} onChange={(v) => update({ receitas_dia: v })} className="text-lg font-semibold w-full" placeholder="R$ 0,00" />
          </div>
          <div className="rounded-lg border border-border p-3 bg-negative-row-bg/30">
            <p className="text-xs text-muted-foreground mb-1">Despesas do Dia</p>
            <InlineText value={state.despesas_dia} onChange={(v) => update({ despesas_dia: v })} className="text-lg font-semibold w-full" placeholder="R$ 0,00" />
          </div>
        </div>
      ),
    },
    avisos: {
      title: 'Avisos e Pendências',
      node: (
        <div className="space-y-1">
          {state.avisos.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-muted-foreground">•</span>
              <InlineText value={item.texto} onChange={(v) => { const arr = [...state.avisos]; arr[i] = { ...arr[i], texto: v }; update({ avisos: arr }); }} className="flex-1 border-b border-border" />
              <button className="text-destructive no-print" onClick={() => update({ avisos: state.avisos.filter((_, j) => j !== i) })}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="no-print" onClick={() => update({ avisos: [...state.avisos, { id: uid(), texto: '' }] })}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
      ),
    },
    anotacoes: {
      title: 'Anotações',
      node: (
        <Textarea
          value={state.anotacoes}
          onChange={(e) => update({ anotacoes: e.target.value })}
          rows={6}
          className="resize-y bg-transparent"
          style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, hsl(var(--border)) 27px, hsl(var(--border)) 28px)', lineHeight: '28px' }}
          placeholder="Escreva suas anotações..."
        />
      ),
    },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <h1 className="font-heading text-2xl font-bold text-foreground">Resumo Diário</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMut.isPending}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
          <Button size="sm" onClick={handleExportPDF}>
            <Printer className="w-4 h-4 mr-1" /> Imprimir / Exportar PDF
          </Button>
        </div>
      </div>

      <div ref={printRef} className="space-y-4 bg-background p-1">
        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border-2 border-primary/40 bg-primary/5 px-4 py-2">
              <Calendar className="w-4 h-4 text-primary" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent outline-none font-semibold text-foreground no-print"
              />
              <span className="hidden font-semibold text-foreground print-only">{dateLabel}</span>
            </div>
            <div className="hidden sm:block font-semibold text-foreground print-date-visible">{dateLabel}</div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">Dias Úteis Restante:</span>
              <InlineText value={state.dias_uteis_restante} onChange={(v) => update({ dias_uteis_restante: v })} className="w-16 border-b border-border" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">Faturamento Necessário:</span>
              <InlineText value={state.faturamento_necessario} onChange={(v) => update({ faturamento_necessario: v })} className="w-32 border-b border-border" />
            </div>
          </div>
        </div>

        {/* Cards */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {order.map((k) => cardContent[k] && (
                <SortableCard key={k} id={k} title={cardContent[k].title}>
                  {cardContent[k].node}
                </SortableCard>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Signatures */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {state.assinaturas.map((s, i) => (
              <div key={s.id} className="text-center">
                <div className="border-b-2 border-foreground h-8" />
                <div className="mt-2 flex items-center justify-center gap-1">
                  <InlineText value={s.nome} onChange={(v) => { const arr = [...state.assinaturas]; arr[i] = { ...arr[i], nome: v }; update({ assinaturas: arr }); }} className="text-sm text-center font-medium" placeholder="Nome" />
                  <button className="text-destructive no-print" onClick={() => update({ assinaturas: state.assinaturas.filter((_, j) => j !== i) })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center no-print">
            <Button variant="outline" size="sm" onClick={() => update({ assinaturas: [...state.assinaturas, { id: uid(), nome: '' }] })}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar assinante
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .print-date-visible { display: block; }
        .is-exporting-pdf .no-print { display: none !important; }
        .is-exporting-pdf .print-only { display: inline !important; }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
