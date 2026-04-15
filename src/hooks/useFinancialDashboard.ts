import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialDashboardData {
  id: string;
  year: number;
  month: number;
  average_price: number;
  daily_production_avg: number;
  total_pieces: number;
  working_days: number;
  revenue_goal: number;
  revenue_billed: number;
  working_days_passed: number;
}

export function useFinancialDashboardData() {
  return useQuery({
    queryKey: ['financial_dashboard_data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_dashboard_data' as any)
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });
      if (error) throw error;
      return (data as unknown) as FinancialDashboardData[];
    },
  });
}

export function useUpsertFinancialDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<FinancialDashboardData, 'id'> & { id?: string }) => {
      const { data: existing } = await (supabase
        .from('financial_dashboard_data' as any)
        .select('id')
        .eq('year', entry.year)
        .eq('month', entry.month)
        .maybeSingle() as any);

      if (existing) {
        const { data, error } = await (supabase
          .from('financial_dashboard_data' as any)
          .update({
            average_price: entry.average_price,
            daily_production_avg: entry.daily_production_avg,
            total_pieces: entry.total_pieces,
            working_days: entry.working_days,
            revenue_goal: entry.revenue_goal,
            revenue_billed: entry.revenue_billed,
            working_days_passed: entry.working_days_passed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single() as any);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await (supabase
          .from('financial_dashboard_data' as any)
          .insert(entry)
          .select()
          .single() as any);
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['financial_dashboard_data'] }),
  });
}
