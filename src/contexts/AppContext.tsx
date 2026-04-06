import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useCreateAuditLog } from '@/hooks/useFinancial';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type NivelAcesso = 'Administrador' | 'Gestor' | 'Visualizador';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  nivelAcesso: NivelAcesso;
  status: 'Ativo' | 'Inativo';
  ultimoAcesso: string;
  avatar?: string;
}

export type TipoAcao = 'Cadastro' | 'Edição' | 'Exclusão' | 'Desligamento' | 'Avaliação' | 'Documento' | 'Usuário';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: NivelAcesso;
  action: TipoAcao;
  target: string;
  targetId?: string;
  description: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

const defaultUser: Usuario = {
  id: 'default', nome: 'Usuário', email: '', cargo: '', departamento: '', nivelAcesso: 'Administrador', status: 'Ativo', ultimoAcesso: new Date().toISOString()
};

interface AppContextType {
  currentUser: Usuario;
  setCurrentUser: (user: Usuario) => void;
  logAction: (action: TipoAcao, target: string, description: string, options?: { targetId?: string; fieldChanged?: string; oldValue?: string; newValue?: string }) => void;
}

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Usuario>(defaultUser);
  const createAuditLog = useCreateAuditLog();
  const { user } = useAuth();

  // Fetch system_user matching the authenticated user and keep currentUser in sync
  useEffect(() => {
    if (!user) {
      setCurrentUser(defaultUser);
      return;
    }

    const fetchSystemUser = async () => {
      // Try to find a system_user linked by auth_user_id first, then by email
      const { data } = await supabase
        .from('system_users')
        .select('*')
        .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        // Link auth_user_id if not set yet
        if (!data.auth_user_id) {
          await supabase.from('system_users').update({ auth_user_id: user.id }).eq('id', data.id);
        }
        setCurrentUser({
          id: data.id,
          nome: data.nome,
          email: data.email,
          cargo: data.cargo,
          departamento: data.departamento,
          nivelAcesso: data.nivel_acesso as NivelAcesso,
          status: data.status as 'Ativo' | 'Inativo',
          ultimoAcesso: data.ultimo_acesso || new Date().toISOString(),
          avatar: data.avatar || undefined,
        });
        // Update last access
        supabase.from('system_users').update({ ultimo_acesso: new Date().toISOString() }).eq('id', data.id).then(() => {});
      } else {
        // No system_user found — use auth data as fallback
        setCurrentUser({
          id: user.id,
          nome: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          cargo: '',
          departamento: '',
          nivelAcesso: 'Visualizador',
          status: 'Ativo',
          ultimoAcesso: new Date().toISOString(),
        });
      }
    };

    fetchSystemUser();
  }, [user]);

  const logAction = useCallback((
    action: TipoAcao,
    target: string,
    description: string,
    options?: { targetId?: string; fieldChanged?: string; oldValue?: string; newValue?: string }
  ) => {
    createAuditLog.mutate({
      action,
      target,
      description,
      user_id: user?.id || currentUser.id,
      user_name: currentUser.nome,
      user_role: currentUser.nivelAcesso,
      target_id: options?.targetId || null,
      field_changed: options?.fieldChanged || null,
      old_value: options?.oldValue || null,
      new_value: options?.newValue || null,
    });
  }, [currentUser, user, createAuditLog]);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, logAction }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
