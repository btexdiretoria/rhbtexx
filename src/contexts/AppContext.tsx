import React, { createContext, useContext, useState, useCallback } from 'react';

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

export const mockUsuarios: Usuario[] = [
  { id: 'u1', nome: 'Ana Souza', email: 'ana.souza@gestapeople.com', cargo: 'Diretora de RH', departamento: 'Recursos Humanos', nivelAcesso: 'Administrador', status: 'Ativo', ultimoAcesso: '2026-03-26T09:30:00' },
  { id: 'u2', nome: 'Carlos Lima', email: 'carlos.lima@gestapeople.com', cargo: 'Gerente de Tecnologia', departamento: 'Tecnologia', nivelAcesso: 'Gestor', status: 'Ativo', ultimoAcesso: '2026-03-25T16:45:00' },
  { id: 'u3', nome: 'Fernanda Costa', email: 'fernanda.costa@gestapeople.com', cargo: 'Assistente de RH', departamento: 'Recursos Humanos', nivelAcesso: 'Visualizador', status: 'Ativo', ultimoAcesso: '2026-03-24T11:20:00' },
];

const now = () => new Date().toISOString();
let logIdCounter = 100;

const generateMockLogs = (): AuditLogEntry[] => {
  const entries: AuditLogEntry[] = [
    { id: '1', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Cadastro', target: 'Gabriela Nascimento Dias', targetId: '7', description: 'Cadastrou nova funcionária Gabriela Nascimento Dias como Estagiária de TI', timestamp: '2026-03-25T14:30:00' },
    { id: '2', userId: 'u2', userName: 'Carlos Lima', userRole: 'Gestor', action: 'Edição', target: 'Ana Carolina Silva', targetId: '1', description: 'Alterou o cargo de Desenvolvedora Pleno para Desenvolvedora Senior', fieldChanged: 'cargo', oldValue: 'Desenvolvedora Pleno', newValue: 'Desenvolvedora Senior', timestamp: '2026-03-25T10:15:00' },
    { id: '3', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Desligamento', target: 'Felipe Henrique Souza', targetId: '6', description: 'Realizou o desligamento por pedido de demissão', timestamp: '2026-03-24T16:00:00' },
    { id: '4', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Avaliação', target: 'Bruno Oliveira Santos', targetId: '2', description: 'Registrou avaliação de desempenho Q4 2025 — nota geral 4.3', timestamp: '2026-03-23T11:45:00' },
    { id: '5', userId: 'u3', userName: 'Fernanda Costa', userRole: 'Visualizador', action: 'Documento', target: 'Ana Carolina Silva', targetId: '1', description: 'Anexou documento: Contrato de Trabalho', timestamp: '2026-03-22T09:20:00' },
    { id: '6', userId: 'u2', userName: 'Carlos Lima', userRole: 'Gestor', action: 'Edição', target: 'Larissa Mendes Barbosa', targetId: '11', description: 'Alterou o salário de R$ 8.500 para R$ 9.500', fieldChanged: 'salario', oldValue: 'R$ 8.500', newValue: 'R$ 9.500', timestamp: '2026-03-21T15:30:00' },
    { id: '7', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Usuário', target: 'Fernanda Costa', description: 'Criou novo usuário com nível Visualizador', timestamp: '2026-03-20T10:00:00' },
    { id: '8', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Desligamento', target: 'Isabela Cristina Rocha', targetId: '9', description: 'Realizou o desligamento por fim de contrato PJ', timestamp: '2026-03-19T14:20:00' },
    { id: '9', userId: 'u2', userName: 'Carlos Lima', userRole: 'Gestor', action: 'Edição', target: 'Hugo Rafael Pereira', targetId: '8', description: 'Alterou o departamento de Operações para Tecnologia', fieldChanged: 'departamento', oldValue: 'Operações', newValue: 'Tecnologia', timestamp: '2026-03-18T09:45:00' },
    { id: '10', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Cadastro', target: 'Pedro Lucas Araújo', targetId: '14', description: 'Cadastrou novo funcionário Pedro Lucas Araújo como Analista de Marketing Digital', timestamp: '2026-03-17T11:30:00' },
    { id: '11', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Avaliação', target: 'João Pedro Machado', targetId: '10', description: 'Registrou avaliação de desempenho Q4 2025 — nota geral 4.7', timestamp: '2026-03-15T14:00:00' },
    { id: '12', userId: 'u2', userName: 'Carlos Lima', userRole: 'Gestor', action: 'Edição', target: 'Daniel Rodrigues Costa', targetId: '4', description: 'Alterou o status de Ativo para Afastado', fieldChanged: 'status', oldValue: 'Ativo', newValue: 'Afastado', timestamp: '2026-03-14T10:30:00' },
    { id: '13', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Usuário', target: 'Carlos Lima', description: 'Alterou nível de acesso de Visualizador para Gestor', fieldChanged: 'nivelAcesso', oldValue: 'Visualizador', newValue: 'Gestor', timestamp: '2026-03-12T09:00:00' },
    { id: '14', userId: 'u3', userName: 'Fernanda Costa', userRole: 'Visualizador', action: 'Documento', target: 'Carla Fernanda Lima', targetId: '3', description: 'Anexou documento: Exame Admissional', timestamp: '2026-03-10T16:15:00' },
    { id: '15', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Desligamento', target: 'Natália Freitas Gomes', targetId: '13', description: 'Realizou o desligamento por término de contrato temporário', timestamp: '2026-03-08T11:00:00' },
    { id: '16', userId: 'u2', userName: 'Carlos Lima', userRole: 'Gestor', action: 'Edição', target: 'Elisa Martins Almeida', targetId: '5', description: 'Alterou o cargo de Analista de Marketing para Coordenadora de Marketing', fieldChanged: 'cargo', oldValue: 'Analista de Marketing', newValue: 'Coordenadora de Marketing', timestamp: '2026-03-05T13:45:00' },
    { id: '17', userId: 'u1', userName: 'Ana Souza', userRole: 'Administrador', action: 'Cadastro', target: 'Natália Freitas Gomes', targetId: '13', description: 'Cadastrou nova funcionária Natália Freitas Gomes como Assistente Administrativo', timestamp: '2026-02-28T10:00:00' },
  ];
  return entries;
};

interface AppContextType {
  currentUser: Usuario;
  setCurrentUser: (user: Usuario) => void;
  usuarios: Usuario[];
  setUsuarios: React.Dispatch<React.SetStateAction<Usuario[]>>;
  auditLog: AuditLogEntry[];
  logAction: (action: TipoAcao, target: string, description: string, options?: { targetId?: string; fieldChanged?: string; oldValue?: string; newValue?: string }) => void;
}

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Usuario>(mockUsuarios[0]);
  const [usuarios, setUsuarios] = useState<Usuario[]>(mockUsuarios);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(generateMockLogs());

  const logAction = useCallback((
    action: TipoAcao,
    target: string,
    description: string,
    options?: { targetId?: string; fieldChanged?: string; oldValue?: string; newValue?: string }
  ) => {
    const entry: AuditLogEntry = {
      id: String(++logIdCounter),
      userId: currentUser.id,
      userName: currentUser.nome,
      userRole: currentUser.nivelAcesso,
      action,
      target,
      description,
      timestamp: now(),
      ...options,
    };
    setAuditLog(prev => [entry, ...prev]);
  }, [currentUser]);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, usuarios, setUsuarios, auditLog, logAction }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
