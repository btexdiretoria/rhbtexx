import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// ─── Food Voucher ───
export function useFoodVoucherEntries(year: number, month: number) {
  return useQuery({
    queryKey: ['food_voucher_entries', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_voucher_entries')
        .select('*')
        .eq('year', year)
        .eq('month', month);
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertFoodVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: TablesInsert<'food_voucher_entries'>) => {
      const { data, error } = await supabase
        .from('food_voucher_entries')
        .upsert(entry, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food_voucher_entries'] }),
  });
}

export function useDeleteFoodVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('food_voucher_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food_voucher_entries'] }),
  });
}

export function useCreateFoodVoucherBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: TablesInsert<'food_voucher_entries'>[]) => {
      const { data, error } = await supabase
        .from('food_voucher_entries')
        .insert(entries)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food_voucher_entries'] }),
  });
}

// ─── Transport Voucher ───
export function useTransportVoucherEntries(year: number, month: number) {
  return useQuery({
    queryKey: ['transport_voucher_entries', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transport_voucher_entries')
        .select('*')
        .eq('year', year)
        .eq('month', month);
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertTransportVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: TablesInsert<'transport_voucher_entries'>) => {
      const { data, error } = await supabase
        .from('transport_voucher_entries')
        .upsert(entry, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transport_voucher_entries'] }),
  });
}

export function useDeleteTransportVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transport_voucher_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transport_voucher_entries'] }),
  });
}

export function useCreateTransportVoucherEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: TablesInsert<'transport_voucher_entries'>) => {
      const { data, error } = await supabase
        .from('transport_voucher_entries')
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transport_voucher_entries'] }),
  });
}

// ─── Net Salary Columns ───
export function useNetSalaryColumns(year: number, month: number) {
  return useQuery({
    queryKey: ['net_salary_columns', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('net_salary_columns')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useNetSalaryValues(year: number, month: number) {
  return useQuery({
    queryKey: ['net_salary_values', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('net_salary_values')
        .select('*')
        .eq('year', year)
        .eq('month', month);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateNetSalaryColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (col: TablesInsert<'net_salary_columns'>) => {
      const { data, error } = await supabase
        .from('net_salary_columns')
        .insert(col)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['net_salary_columns'] }),
  });
}

export function useDeleteNetSalaryColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete values for this column too
      const col = await supabase.from('net_salary_columns').select('column_id').eq('id', id).single();
      if (col.data) {
        await supabase.from('net_salary_values').delete().eq('column_id', col.data.column_id);
      }
      const { error } = await supabase.from('net_salary_columns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['net_salary_columns'] });
      qc.invalidateQueries({ queryKey: ['net_salary_values'] });
    },
  });
}

export function useUpdateNetSalaryColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'net_salary_columns'> & { id: string }) => {
      const { data, error } = await supabase
        .from('net_salary_columns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['net_salary_columns'] }),
  });
}

export function useUpsertNetSalaryValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (val: TablesInsert<'net_salary_values'>) => {
      // Check if exists
      const { data: existing } = await supabase
        .from('net_salary_values')
        .select('id')
        .eq('employee_id', val.employee_id)
        .eq('column_id', val.column_id)
        .eq('year', val.year)
        .eq('month', val.month)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('net_salary_values')
          .update({ value: val.value })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('net_salary_values')
          .insert(val)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['net_salary_values'] }),
  });
}

// ─── Expense Categories ───
export function useExpenseCategories(year: number, month: number) {
  return useQuery({
    queryKey: ['expense_categories', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: TablesInsert<'expense_categories'>) => {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert(cat)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense_categories'] }),
  });
}

export function useUpdateExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'expense_categories'> & { id: string }) => {
      const { data, error } = await supabase
        .from('expense_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense_categories'] }),
  });
}

export function useDeleteExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expense_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense_categories'] }),
  });
}

// ─── Audit Log ───
export function useAuditLog() {
  return useQuery({
    queryKey: ['audit_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAuditLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: TablesInsert<'audit_log'>) => {
      const { data, error } = await supabase
        .from('audit_log')
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit_log'] }),
  });
}

// ─── System Users ───
export function useSystemUsers() {
  return useQuery({
    queryKey: ['system_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSystemUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: { nome: string; email: string; cargo: string; departamento: string; nivel_acesso: string; status: string }) => {
      const { data, error } = await supabase
        .from('system_users')
        .insert(user)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system_users'] }),
  });
}

export function useUpdateSystemUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; email?: string; cargo?: string; departamento?: string; nivel_acesso?: string; status?: string }) => {
      const { data, error } = await supabase
        .from('system_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system_users'] }),
  });
}
