import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DespesaItem { id: string; descricao: string; gasto: string; orcado: string; }
export interface AlteracaoItem { id: string; texto: string; valor?: string; }
export interface ReceitaItem { id: string; texto: string; valor?: string; }
export interface AvisoItem { id: string; texto: string; }
export interface AssinaturaItem { id: string; nome: string; }
export interface ChecklistItem { id: string; texto: string; done: boolean; }
export interface SemanaItem { id: string; nome: string; periodo: string; objetivo: string; done: boolean; }

export const DEFAULT_SEMANAS = (): SemanaItem[] =>
  [1, 2, 3, 4, 5].map((n) => ({ id: `semana-${n}`, nome: `Semana ${n}`, periodo: '', objetivo: '', done: false }));

export interface DailySummary {
  id?: string;
  summary_date: string;
  dias_uteis_restante: string;
  faturamento_necessario: string;
  objetivo_faturamento: string;
  saldo_inicial_dia: string;
  saldo_final_dia: string;
  controle_semanal: SemanaItem[];
  despesas: DespesaItem[];
  resultado_inicio: string;
  resultado_ontem: string;
  resultado_hoje: string;
  alteracoes: AlteracaoItem[];
  receitas_dia: string;
  despesas_dia: string;
  receitas_receber: ReceitaItem[];
  receitas_esperadas: string;
  despesas_programadas: string;
  /* Resultado esperado — Competência */
  resultado_comp_inicio: string;
  resultado_comp_ontem: string;
  resultado_comp_hoje: string;
  receitas_esperadas_comp: string;
  despesas_programadas_comp: string;
  alteracoes_comp: AlteracaoItem[];
  avisos: AvisoItem[];
  anotacoes: string;
  checklist: ChecklistItem[];
  assinaturas: AssinaturaItem[];
  card_order: string[];
}

export const DEFAULT_CARD_ORDER = ['controle_semanal', 'despesas', 'receitas', 'resultado', 'resultado_comp', 'avisos', 'anotacoes', 'checklist'];


export function emptySummary(date: string): DailySummary {
  return {
    summary_date: date,
    dias_uteis_restante: '',
    faturamento_necessario: '',
    objetivo_faturamento: '',
    saldo_inicial_dia: '',
    saldo_final_dia: '',
    controle_semanal: DEFAULT_SEMANAS(),
    despesas: [],
    resultado_inicio: '',
    resultado_ontem: '',
    resultado_hoje: '',
    alteracoes: [],
    receitas_dia: '',
    despesas_dia: '',
    receitas_receber: [],
    receitas_esperadas: '',
    despesas_programadas: '',
    resultado_comp_inicio: '',
    resultado_comp_ontem: '',
    resultado_comp_hoje: '',
    receitas_esperadas_comp: '',
    despesas_programadas_comp: '',
    alteracoes_comp: [],

    avisos: [],
    anotacoes: '',
    checklist: [],
    assinaturas: [],
    card_order: [...DEFAULT_CARD_ORDER],
  };
}

const normalizeOrder = (order?: string[]) => {
  const cleaned = (order || []).filter((k) => DEFAULT_CARD_ORDER.includes(k));
  if (!cleaned.length) return [...DEFAULT_CARD_ORDER];
  // reinsere chaves novas na posição padrão
  const result = [...cleaned];
  DEFAULT_CARD_ORDER.forEach((k, idx) => {
    if (!result.includes(k)) result.splice(Math.min(idx, result.length), 0, k);
  });
  return result;
};


export function useDailySummary(date: string) {
  return useQuery({
    queryKey: ['daily_summary', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_summary' as any)
        .select('*')
        .eq('summary_date', date)
        .maybeSingle();
      if (error) throw error;
      if (!data) return emptySummary(date);
      const d = data as any;
      return {
        ...emptySummary(date),
        ...d,
        despesas: d.despesas || [],
        objetivo_faturamento: d.objetivo_faturamento || '',
        saldo_inicial_dia: d.saldo_inicial_dia || '',
        saldo_final_dia: d.saldo_final_dia || '',
        controle_semanal: (d.controle_semanal?.length ? d.controle_semanal : DEFAULT_SEMANAS()),
        alteracoes: d.alteracoes || [],
        receitas_receber: d.receitas_receber || [],
        receitas_esperadas: d.receitas_esperadas || '',
        despesas_programadas: d.despesas_programadas || '',
        alteracoes_comp: d.alteracoes_comp || [],
        receitas_esperadas_comp: d.receitas_esperadas_comp || '',
        despesas_programadas_comp: d.despesas_programadas_comp || '',

        avisos: d.avisos || [],
        checklist: d.checklist || [],
        assinaturas: d.assinaturas || [],
        card_order: normalizeOrder(d.card_order),
      } as DailySummary;

    },
  });
}

export function useSaveDailySummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (summary: DailySummary) => {
      const payload = { ...summary };
      delete (payload as any).id;
      const { error } = await (supabase
        .from('daily_summary' as any)
        .upsert(payload, { onConflict: 'summary_date' }) as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['daily_summary', v.summary_date] }),
  });
}
