import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DespesaItem { id: string; descricao: string; gasto: string; orcado: string; }
export interface AlteracaoItem { id: string; texto: string; }
export interface AvisoItem { id: string; texto: string; }
export interface AssinaturaItem { id: string; nome: string; }

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
  assinaturas: AssinaturaItem[];
  card_order: string[];
}

export const DEFAULT_CARD_ORDER = ['despesas', 'resultado', 'receitas_despesas', 'avisos', 'anotacoes'];

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
    assinaturas: [],
    card_order: [...DEFAULT_CARD_ORDER],
  };
}

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
        assinaturas: d.assinaturas || [],
        card_order: d.card_order && d.card_order.length ? d.card_order : DEFAULT_CARD_ORDER,
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
