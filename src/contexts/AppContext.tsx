import React, { createContext, useContext, useState, useCallback } from 'react';
import { useCreateAuditLog } from '@/hooks/useFinancial';
import { useAuth } from '@/contexts/AuthContext';

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

  const logAction = useCallback((
    action: TipoAcao,
    target: string,
    description: string,
    options?: { targetId?: string; fieldChanged?: string; oldValue?: string; newValue?: string }
  ) => {
    // Write to Supabase audit_log
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
    <AppContext.Provider value={{ currentUser, setCurrentUser, usuarios, setUsuarios, logAction }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
