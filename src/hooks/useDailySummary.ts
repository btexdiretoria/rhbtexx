import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DespesaItem { id: string; descricao: string; gasto: string; orcado: string; }
export interface AlteracaoItem { id: string; texto: string; valor?: string; }
export interface AvisoItem { id: string; texto: string; }
export interface AssinaturaItem { id: string; nome: string; }
export interface ChecklistItem { id: string; texto: string; done: boolean; }

export interface DailySummary {
  id?: string;
  summary_date: string;
  dias_uteis_restante: string;
  faturamento_necessario: string;
  despesas: DespesaItem[];
  resultado_inicio: string;
  resultado_ontem: string;
  resultado_hoje: string;
  alteracoes: AlteracaoItem[];
  receitas_dia: string;
  despesas_dia: string;
  avisos: AvisoItem[];
  anotacoes: string;
  checklist: ChecklistItem[];
  assinaturas: AssinaturaItem[];
  card_order: string[];
}

export const DEFAULT_CARD_ORDER = ['despesas', 'resultado', 'avisos', 'anotacoes', 'checklist'];

export function emptySummary(date: string): DailySummary {
  return {
    summary_date: date,
    dias_uteis_restante: '',
    faturamento_necessario: '',
    despesas: [],
    resultado_inicio: '',
    resultado_ontem: '',
    resultado_hoje: '',
    alteracoes: [],
    receitas_dia: '',
    despesas_dia: '',
    avisos: [],
    anotacoes: '',
    checklist: [],
    assinaturas: [],
    card_order: [...DEFAULT_CARD_ORDER],
  };
}

const normalizeOrder = (order?: string[]) => {
  const cleaned = (order || []).filter((k) => DEFAULT_CARD_ORDER.includes(k));
  const missing = DEFAULT_CARD_ORDER.filter((k) => !cleaned.includes(k));
  return cleaned.length ? [...cleaned, ...missing] : [...DEFAULT_CARD_ORDER];
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
        alteracoes: d.alteracoes || [],
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
