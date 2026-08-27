import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type HrProcessTipo = 'admissao' | 'demissao';
export type HrTemplate = Tables<'hr_process_templates'>;
export type HrCase = Tables<'hr_process_cases'>;
export type HrCaseStep = Tables<'hr_process_case_steps'>;

export function useHrTemplates() {
  return useQuery({
    queryKey: ['hr_process_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_process_templates')
        .select('*')
        .order('tipo')
        .order('sort_order');
      if (error) throw error;
      return data as HrTemplate[];
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { tipo: HrProcessTipo; nome: string; sort_order: number }) => {
      const { error } = await supabase.from('hr_process_templates').insert(t);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr_process_templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; sort_order?: number }) => {
      const { error } = await supabase.from('hr_process_templates').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr_process_templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hr_process_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr_process_templates'] }),
  });
}

export function useHrCases() {
  return useQuery({
    queryKey: ['hr_process_cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_process_cases')
        .select('*, hr_process_case_steps(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as (HrCase & { hr_process_case_steps: HrCaseStep[] })[];
    },
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tipo,
      employee_id,
      data_referencia,
      observacoes,
      steps,
    }: {
      tipo: HrProcessTipo;
      employee_id: string;
      data_referencia: string | null;
      observacoes: string | null;
      steps: { nome: string; sort_order: number }[];
    }) => {
      const { data, error } = await supabase
        .from('hr_process_cases')
        .insert({ tipo, employee_id, data_referencia, observacoes })
        .select()
        .single();
      if (error) throw error;
      if (steps.length) {
        const { error: e2 } = await supabase
          .from('hr_process_case_steps')
          .insert(steps.map(s => ({ ...s, case_id: data.id })));
        if (e2) throw e2;
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr_process_cases'] }),
  });
}

export function useToggleStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { error } = await supabase
        .from('hr_process_case_steps')
        .update({ concluido, concluido_em: concluido ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr_process_cases'] }),
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hr_process_cases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr_process_cases'] }),
  });
}
