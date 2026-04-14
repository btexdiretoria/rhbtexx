import { useMemo, useState, useEffect } from 'react';
import { Users, UserCheck, UserMinus, Cake, Monitor, DollarSign, Target, UserCog, Package, Scale, BarChart3, Clock, X, Wrench, Pencil } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useEmployees, type Employee } from '@/hooks/useEmployees';
import { useDepartmentManagers, useUpsertDepartmentManager } from '@/hooks/useFinancial';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

type StatusFuncionario = 'Ativo' | 'Afastado' | 'Desligado' | 'Prestador de Serviço' | 'Aviso Prévio';
const statusDisplayLabel: Record<StatusFuncionario, string> = { Ativo: 'Ativo', Afastado: 'Afastado', Desligado: 'Desligado', 'Prestador de Serviço': 'Prestador de Serviço', 'Aviso Prévio': 'Aviso Prévio' };

const deptIcons: Record<string, React.ReactNode> = {
  'Tecnologia': <Monitor className="w-5 h-5" />,
  'Financeiro': <DollarSign className="w-5 h-5" />,
  'Comercial': <Target className="w-5 h-5" />,
  'Recursos Humanos': <UserCog className="w-5 h-5" />,
  'Marketing': <BarChart3 className="w-5 h-5" />,
  'Operações': <Package className="w-5 h-5" />,
  'Jurídico': <Scale className="w-5 h-5" />,
};

function AvatarInitials({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('');
  const cls = size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return <div className={`${cls} rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0`}>{initials}</div>;
}

const statusDot: Record<string, string> = { 'Ativo': 'bg-emerald-500', 'Afastado': 'bg-warning', 'Desligado': 'bg-muted-foreground', 'Prestador de Serviço': 'bg-blue-500', 'Aviso Prévio': 'bg-amber-500' };
function getStatusLabel(status: string) { return statusDisplayLabel[status as StatusFuncionario] || status; }

export default function Dashboard() {
  const { data: employees = [], isLoading } = useEmployees();
  const { data: deptManagers = [] } = useDepartmentManagers();
  const upsertManager = useUpsertDepartmentManager();
  const { currentUser } = useApp();
  const isAdmin = currentUser.nivelAcesso === 'Administrador';

  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('probation_acknowledged') || '[]'); } catch { return []; }
  });
  const [acknowledgedAvisoIds, setAcknowledgedAvisoIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('aviso_previo_acknowledged') || '[]'); } catch { return []; }
  });
  const [kpiModal, setKpiModal] = useState<{ label: string; employees: Employee[] } | null>(null);
  const [managerModal, setManagerModal] = useState<{ dept: string; members: Employee[] } | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');

  useEffect(() => { localStorage.setItem('probation_acknowledged', JSON.stringify(acknowledgedIds)); }, [acknowledgedIds]);
  useEffect(() => { localStorage.setItem('aviso_previo_acknowledged', JSON.stringify(acknowledgedAvisoIds)); }, [acknowledgedAvisoIds]);

  const managerMap = useMemo(() => {
    const map = new Map<string, string>();
    deptManagers.forEach(dm => map.set(dm.department_name, dm.employee_id));
    return map;
  }, [deptManagers]);

  const empMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  const stats = useMemo(() => {
    const total = employees.length;
    const ativos = employees.filter(f => f.status === 'Ativo').length;
    const afastados = employees.filter(f => f.status === 'Afastado').length;
    const prestadores = employees.filter(f => f.status === 'Prestador de Serviço').length;
    const avisoPrevio = employees.filter(f => f.status === 'Aviso Prévio').length;
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const desligadosMes = employees.filter(f => f.status === 'Desligado' && f.data_desligamento?.startsWith(mesAtual)).length;
    return { total, ativos, afastados, desligadosMes, prestadores, avisoPrevio };
  }, [employees]);

  const kpiEmployees = useMemo(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return {
      'Total de Funcionários': employees,
      'Ativos': employees.filter(f => f.status === 'Ativo'),
      'Prestadores de Serviço': employees.filter(f => f.status === 'Prestador de Serviço'),
      'Afastados': employees.filter(f => f.status === 'Afastado'),
      'Aviso Prévio': employees.filter(f => f.status === 'Aviso Prévio'),
      'Desligados no Mês': employees.filter(f => f.status === 'Desligado' && f.data_desligamento?.startsWith(mesAtual)),
    };
  }, [employees]);

  const ultimosAdicionados = useMemo(() =>
    [...employees].sort((a, b) => b.data_admissao.localeCompare(a.data_admissao)).slice(0, 5), [employees]);

  const aniversariantes = useMemo(() => {
    const mesAtual = new Date().getMonth() + 1;
    return employees.filter(f => {
      if (!f.data_nascimento || f.status === 'Desligado') return false;
      const mes = parseInt(f.data_nascimento.split('-')[1]);
      return mes === mesAtual;
    });
  }, [employees]);

  const chartDataStatus = useMemo(() => {
    const ativos = employees.filter(f => f.status === 'Ativo').length;
    const afastados = employees.filter(f => f.status === 'Afastado').length;
    const desligados = employees.filter(f => f.status === 'Desligado').length;
    const prestadores = employees.filter(f => f.status === 'Prestador de Serviço').length;
    const avisoPrevio = employees.filter(f => f.status === 'Aviso Prévio').length;
    return [
      { name: 'Ativo', value: ativos, color: '#10B981' },
      { name: 'Afastado', value: afastados, color: '#F97316' },
      { name: 'Aviso Prévio', value: avisoPrevio, color: '#D97706' },
      { name: 'Desligado', value: desligados, color: '#9CA3AF' },
      { name: 'Prestador de Serviço', value: prestadores, color: '#3B82F6' },
    ];
  }, [employees]);

  const setores = useMemo(() => {
    const deptMap = new Map<string, Employee[]>();
    employees.forEach(f => {
      if (!deptMap.has(f.departamento)) deptMap.set(f.departamento, []);
      deptMap.get(f.departamento)!.push(f);
    });
    return Array.from(deptMap.entries()).map(([dept, members]) => {
      const managerId = managerMap.get(dept);
      const leader = managerId ? empMap.get(managerId) || null : null;
      const ativos = members.filter(m => m.status === 'Ativo').length;
      const outros = members.filter(m => m.status !== 'Ativo').length;
      return { dept, members, leader, ativos, outros, total: members.length };
    });
  }, [employees, managerMap, empMap]);

  const avisoPrevioAlerts = useMemo(() => {
    const hoje = new Date();
    return employees
      .filter(f => f.status === 'Aviso Prévio' && (f as any).data_inicio_aviso_previo)
      .map(f => {
        const inicio = new Date((f as any).data_inicio_aviso_previo);
        const fim = new Date(inicio); fim.setDate(fim.getDate() + 30);
        const diffDays = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return { ...f, dataFimAviso: fim, diffDays };
      })
      .filter(f => !acknowledgedAvisoIds.includes(f.id))
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [employees, acknowledgedAvisoIds]);

  const handleAcknowledgeAviso = (id: string, checked: boolean) => {
    if (checked) setAcknowledgedAvisoIds(prev => [...prev, id]);
    else setAcknowledgedAvisoIds(prev => prev.filter(i => i !== id));
  };

  const kpis = [
    { label: 'Total de Funcionários', value: stats.total, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Ativos', value: stats.ativos, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Prestadores de Serviço', value: stats.prestadores, icon: Wrench, color: 'bg-blue-50 text-blue-600' },
    { label: 'Afastados', value: stats.afastados, icon: UserMinus, color: 'bg-orange-50 text-orange-600' },
    { label: 'Aviso Prévio', value: stats.avisoPrevio, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Desligados no Mês', value: stats.desligadosMes, icon: UserMinus, color: 'bg-muted text-muted-foreground' },
  ];

  const experienciaAlerts = useMemo(() => {
    const hoje = new Date();
    return employees
      .filter(f => f.data_fim_experiencia && f.status !== 'Desligado')
      .map(f => {
        const dataFim = new Date(f.data_fim_experiencia!);
        const diffDays = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return { ...f, dataFim, diffDays };
      })
      .filter(f => f.diffDays <= 30 && !acknowledgedIds.includes(f.id))
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [employees, acknowledgedIds]);

  const handleAcknowledge = (id: string, checked: boolean) => {
    if (checked) setAcknowledgedIds(prev => [...prev, id]);
    else setAcknowledgedIds(prev => prev.filter(i => i !== id));
  };

  const openManagerModal = (dept: string, members: Employee[]) => {
    const currentManagerId = managerMap.get(dept) || '';
    setSelectedManagerId(currentManagerId);
    setManagerModal({ dept, members: members.filter(m => m.status !== 'Desligado') });
  };

  const saveManager = () => {
    if (!managerModal || !selectedManagerId) return;
    upsertManager.mutate({ department_name: managerModal.dept, employee_id: selectedManagerId }, {
      onSuccess: () => { toast.success('Gestor do setor atualizado!'); setManagerModal(null); },
      onError: () => toast.error('Erro ao atualizar gestor'),
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando dashboard...</p></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card cursor-pointer" onClick={() => setKpiModal({ label: kpi.label, employees: kpiEmployees[kpi.label as keyof typeof kpiEmployees] || [] })}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}><kpi.icon className="w-5 h-5" /></div>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{kpi.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <Dialog open={!!kpiModal} onOpenChange={() => setKpiModal(null)}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle className="font-heading">{kpiModal?.label}</DialogTitle></DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-1">
            {kpiModal?.employees.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum funcionário nesta categoria.</p>
            ) : kpiModal?.employees.map(f => (
              <Link to={`/funcionarios/${f.id}`} key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors" onClick={() => setKpiModal(null)}>
                <AvatarInitials name={f.nome} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{f.nome}</p>
                  <p className="text-xs text-muted-foreground">{f.cargo}</p>
                </div>
                <span className={`status-badge status-${f.status.toLowerCase().replace(/\s+/g, '-')}`}>{getStatusLabel(f.status)}</span>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {avisoPrevioAlerts.length > 0 && (
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-heading font-semibold text-foreground">Aviso Prévio</h3>
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{avisoPrevioAlerts.length}</span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {avisoPrevioAlerts.map(f => (
              <div key={f.id} className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${f.diffDays <= 0 ? 'bg-destructive/10' : 'bg-amber-50'} hover:bg-muted/50`}>
                <Link to={`/funcionarios/${f.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${f.diffDays <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-700'}`}>
                    {f.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.cargo} · {f.departamento}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${f.diffDays <= 0 ? 'text-destructive' : 'text-amber-600'}`}>{f.diffDays <= 0 ? 'Expirado' : `${f.diffDays} dia${f.diffDays !== 1 ? 's' : ''}`}</p>
                    <p className="text-xs text-muted-foreground">{f.dataFimAviso.toLocaleDateString('pt-BR')}</p>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={false} onCheckedChange={(c) => handleAcknowledgeAviso(f.id, !!c)} />Ciente
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {experienciaAlerts.length > 0 && (
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-warning" />
            <h3 className="font-heading font-semibold text-foreground">Períodos de Experiência Expirando</h3>
            <span className="text-xs font-medium bg-warning/10 text-warning px-2 py-0.5 rounded-full">{experienciaAlerts.length}</span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {experienciaAlerts.map(f => (
              <div key={f.id} className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${f.diffDays <= 0 ? 'bg-destructive/10' : 'bg-warning/5'} hover:bg-muted/50`}>
                <Link to={`/funcionarios/${f.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${f.diffDays <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    {f.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.cargo} · {f.departamento}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${f.diffDays <= 0 ? 'text-destructive' : 'text-warning'}`}>{f.diffDays <= 0 ? 'Expirado' : `${f.diffDays} dia${f.diffDays !== 1 ? 's' : ''}`}</p>
                    <p className="text-xs text-muted-foreground">{f.dataFim.toLocaleDateString('pt-BR')}</p>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={acknowledgedIds.includes(f.id)} onCheckedChange={(c) => handleAcknowledge(f.id, !!c)} />Ciente
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Quadro de Setores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...setores].sort((a, b) => {
            if (a.dept === 'Traseiro') return -1;
            if (b.dept === 'Traseiro') return 1;
            if (a.dept === 'PCP') return 1;
            if (b.dept === 'PCP') return -1;
            return 0;
          }).map(setor => (
            <div key={setor.dept} className="kpi-card flex flex-col min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{deptIcons[setor.dept] || <Users className="w-5 h-5" />}</div>
                  <h4 className="font-heading font-bold text-foreground">{setor.dept}</h4>
                </div>
                <span className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{setor.total} funcionário{setor.total !== 1 ? 's' : ''}</span>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Líder do Setor</p>
                  {isAdmin && (
                    <button
                      onClick={() => openManagerModal(setor.dept, setor.members)}
                      className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Definir Gestor"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {setor.leader ? (
                  <div className="flex items-center gap-3">
                    <AvatarInitials name={setor.leader.nome} size="md" />
                    <div><p className="text-sm font-medium text-foreground">{setor.leader.nome}</p><p className="text-xs text-muted-foreground">{setor.leader.cargo}</p></div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /><span className="text-sm">Sem líder definido</span></div>
                )}
              </div>
              <div className="mb-4">
                <div className="border-t border-border pt-3 mb-2"><p className="text-xs text-muted-foreground mb-2">Funcionários do Setor</p></div>
                <div className="space-y-1 max-h-[320px] overflow-y-auto">
                  {setor.members.slice(0, 8).map(m => (
                    <Link to={`/funcionarios/${m.id}`} key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">{m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground break-words leading-tight">{m.nome}</p><p className="text-xs text-muted-foreground">{m.cargo}</p></div>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[m.status] || 'bg-muted-foreground'}`} />
                    </Link>
                  ))}
                </div>
                {setor.members.length > 8 && <Link to="/funcionarios" className="text-xs text-primary hover:underline mt-2 inline-block">Ver todos ({setor.members.length})</Link>}
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-border mt-auto">
                <div className="flex items-center gap-1.5 text-xs"><UserCheck className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Ativos:</span><span className="font-semibold text-foreground">{setor.ativos}</span></div>
                <div className="flex items-center gap-1.5 text-xs"><UserMinus className="w-3.5 h-3.5 text-amber-500" /><span className="text-muted-foreground">Outros:</span><span className="font-semibold text-foreground">{setor.outros}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {experienciaAlerts.length > 0 && (
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-warning" />
            <h3 className="font-heading font-semibold text-foreground">Períodos de Experiência Expirando</h3>
            <span className="text-xs font-medium bg-warning/10 text-warning px-2 py-0.5 rounded-full">{experienciaAlerts.length}</span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {experienciaAlerts.map(f => (
              <div key={f.id} className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${f.diffDays <= 0 ? 'bg-destructive/10' : 'bg-warning/5'} hover:bg-muted/50`}>
                <Link to={`/funcionarios/${f.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${f.diffDays <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    {f.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.cargo} · {f.departamento}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${f.diffDays <= 0 ? 'text-destructive' : 'text-warning'}`}>{f.diffDays <= 0 ? 'Expirado' : `${f.diffDays} dia${f.diffDays !== 1 ? 's' : ''}`}</p>
                    <p className="text-xs text-muted-foreground">{f.dataFim.toLocaleDateString('pt-BR')}</p>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={acknowledgedIds.includes(f.id)} onCheckedChange={(c) => handleAcknowledge(f.id, !!c)} />Ciente
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manager assignment modal */}
      <Dialog open={!!managerModal} onOpenChange={(open) => { if (!open) setManagerModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Definir Gestor</DialogTitle>
            <DialogDescription>Selecione o líder do setor {managerModal?.dept}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
              <SelectTrigger><SelectValue placeholder="Selecione um funcionário" /></SelectTrigger>
              <SelectContent>
                {managerModal?.members.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nome} — {m.cargo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setManagerModal(null)}>Cancelar</Button>
              <Button size="sm" onClick={saveManager} disabled={!selectedManagerId || upsertManager.isPending}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="kpi-card">
          <h3 className="font-heading font-semibold text-foreground mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartDataStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                {chartDataStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {chartDataStatus.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="kpi-card">
          <h3 className="font-heading font-semibold text-foreground mb-4">Últimos Adicionados</h3>
          <div className="space-y-3">
            {ultimosAdicionados.map((f) => (
              <Link to={`/funcionarios/${f.id}`} key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <AvatarInitials name={f.nome} />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{f.nome}</p><p className="text-xs text-muted-foreground">{f.cargo}</p></div>
                <span className={`status-badge status-${f.status.toLowerCase().replace(/\s+/g, '-')}`}>{getStatusLabel(f.status)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="flex items-center gap-2 mb-4">
          <Cake className="w-5 h-5 text-warning" />
          <h3 className="font-heading font-semibold text-foreground">Aniversariantes do Mês</h3>
        </div>
        {aniversariantes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum aniversariante este mês.</p>
        ) : (
          <div className="space-y-3">
            {aniversariantes.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg bg-warning/5">
                <AvatarInitials name={f.nome} />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{f.nome}</p><p className="text-xs text-muted-foreground">{f.cargo} · {f.departamento}</p></div>
                <p className="text-xs text-muted-foreground">{f.data_nascimento ? new Date(f.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
