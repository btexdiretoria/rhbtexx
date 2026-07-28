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
      // Delete values only for this column in the SAME month/year (not across all months)
      const col = await supabase
        .from('net_salary_columns')
        .select('column_id, year, month')
        .eq('id', id)
        .single();
      if (col.data) {
        await supabase
          .from('net_salary_values')
          .delete()
          .eq('column_id', col.data.column_id)
          .eq('year', col.data.year)
          .eq('month', col.data.month);
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

export function useDeleteSystemUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_users').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system_users'] }),
  });
}

// ─── Departments ───
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('departments')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('departments')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

// ─── Company Settings ───
export function useCompanySettings() {
  return useQuery({
    queryKey: ['company_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; company_name?: string; cnpj?: string; email?: string; phone?: string }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase
        .from('company_settings')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company_settings'] }),
  });
}

// ─── Department Managers ───
export function useDepartmentManagers() {
  return useQuery({
    queryKey: ['department_managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_managers' as any)
        .select('*');
      if (error) throw error;
      return (data as unknown) as { id: string; department_name: string; employee_id: string }[];
    },
  });
}

export function useUpsertDepartmentManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ department_name, employee_id }: { department_name: string; employee_id: string }) => {
      // Try update first, then insert
      const { data: existing } = await supabase
        .from('department_managers' as any)
        .select('id')
        .eq('department_name', department_name)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('department_managers' as any)
          .update({ employee_id, updated_at: new Date().toISOString() })
          .eq('id', (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('department_managers' as any)
          .insert({ department_name, employee_id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['department_managers'] }),
  });
}

export function useDeleteDepartmentManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (department_name: string) => {
      const { error } = await supabase
        .from('department_managers' as any)
        .delete()
        .eq('department_name', department_name);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['department_managers'] }),
  });
}



// ─── Food Voucher Settings (benefit day) ───
export function useFoodVoucherSettings(year: number, month: number) {
  return useQuery({
    queryKey: ['food_voucher_settings', year, month],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('food_voucher_settings' as any)
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle() as any);
      if (error) throw error;
      return (data as unknown) as { id: string; year: number; month: number; benefit_day: number } | null;
    },
  });
}

export function useUpsertFoodVoucherSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, month, benefit_day }: { year: number; month: number; benefit_day: number }) => {
      const { data: existing } = await (supabase
        .from('food_voucher_settings' as any)
        .select('id')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle() as any);

      if (existing) {
        const { error } = await (supabase
          .from('food_voucher_settings' as any)
          .update({ benefit_day, updated_at: new Date().toISOString() })
          .eq('id', existing.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from('food_voucher_settings' as any)
          .insert({ year, month, benefit_day }) as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['food_voucher_settings', vars.year, vars.month] }),
  });
}
