import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Employee = Tables<'employees'>;
export type EmployeeInsert = TablesInsert<'employees'>;
export type EmployeeUpdate = TablesUpdate<'employees'>;

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Employee;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employee: EmployeeInsert) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useEmployeeDocuments(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['employee_documents', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useEmployeeHistory(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['employee_history', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('employee_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: TablesInsert<'employee_documents'>) => {
      const { data, error } = await supabase
        .from('employee_documents')
        .insert(doc)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['employee_documents', vars.employee_id] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employee_id }: { id: string; employee_id: string }) => {
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['employee_documents', vars.employee_id] }),
  });
}

export function useEvaluations(employeeId?: string) {
  return useQuery({
    queryKey: employeeId ? ['evaluations', employeeId] : ['evaluations'],
    queryFn: async () => {
      let query = supabase.from('evaluations').select('*');
      if (employeeId) query = query.eq('employee_id', employeeId);
      const { data, error } = await query.order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ev: TablesInsert<'evaluations'>) => {
      const { data, error } = await supabase
        .from('evaluations')
        .insert(ev)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluations'] }),
  });
}

export function useUpdateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'evaluations'> & { id: string }) => {
      const { data, error } = await supabase
        .from('evaluations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluations'] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDeleteEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('evaluations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluations'] }),
  });
}
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('evaluations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evaluations'] }),
  });
}
