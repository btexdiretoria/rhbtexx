import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SectionPermission {
  id: string;
  user_id: string;
  section_key: string;
  has_access: boolean;
}

export const ALL_SECTIONS = [
  { key: 'rh', label: 'Recursos Humanos' },
  { key: 'financeiro', label: 'Pagamentos' },
  { key: 'financas', label: 'Finanças' },
  { key: 'configuracoes', label: 'Configurações' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'historico', label: 'Histórico' },
] as const;

// Map routes to section keys
export function getSectionKeyForPath(path: string): string | null {
  if (path === '/' || path.startsWith('/funcionarios') || path.startsWith('/novo-funcionario') || path.startsWith('/avaliacoes') || path.startsWith('/desligamentos')) return 'rh';
  if (path.startsWith('/salarios') || path.startsWith('/salario-liquido') || path.startsWith('/vale-alimentacao') || path.startsWith('/vale-transporte')) return 'financeiro';
  if (path.startsWith('/controle-despesas') || path.startsWith('/fluxo') || path.startsWith('/dashboard-financas') || path.startsWith('/calendario-financas')) return 'financas';
  if (path.startsWith('/usuarios') || path.startsWith('/configuracoes')) return 'configuracoes';
  if (path.startsWith('/relatorios')) return 'relatorios';
  if (path.startsWith('/historico')) return 'historico';
  return null;
}

export function useUserPermissions() {
  return useQuery({
    queryKey: ['user_section_permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_section_permissions' as any)
        .select('*');
      if (error) throw error;
      return (data as unknown) as SectionPermission[];
    },
  });
}

export function useUpsertPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, section_key, has_access }: { user_id: string; section_key: string; has_access: boolean }) => {
      const { data: existing } = await (supabase
        .from('user_section_permissions' as any)
        .select('id')
        .eq('user_id', user_id)
        .eq('section_key', section_key)
        .maybeSingle() as any);

      if (existing) {
        const { error } = await (supabase
          .from('user_section_permissions' as any)
          .update({ has_access, updated_at: new Date().toISOString() })
          .eq('id', existing.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from('user_section_permissions' as any)
          .insert({ user_id, section_key, has_access }) as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_section_permissions'] }),
  });
}

export function useCheckAccess(userId: string | undefined, sectionKey: string | null) {
  const { data: permissions } = useUserPermissions();
  if (!userId || !sectionKey || !permissions) return true; // default allow
  const perm = permissions.find(p => p.user_id === userId && p.section_key === sectionKey);
  if (!perm) return true; // no explicit denial = allowed
  return perm.has_access;
}
