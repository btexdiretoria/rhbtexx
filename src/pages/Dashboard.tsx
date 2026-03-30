import { useMemo } from 'react';
import { Users, UserCheck, UserX, UserMinus, Cake, Monitor, DollarSign, Target, UserCog, Package, Scale, BarChart3, AlertTriangle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { funcionariosMock, chartDataCrescimento, chartDataStatus, statusDisplayLabel, StatusFuncionario } from '@/data/mockData';
import { Link } from 'react-router-dom';

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
  return (
    <div className={`${cls} rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0`}>
      {initials}
    </div>
  );
}

const statusDot: Record<string, string> = {
  'Ativo': 'bg-emerald-500',
  'Inativo': 'bg-destructive',
  'Afastado': 'bg-warning',
  'Desligado': 'bg-muted-foreground',
};

function getStatusLabel(status: string) {
  return statusDisplayLabel[status as StatusFuncionario] || status;
}

export default function Dashboard() {
  const stats = useMemo(() => {
    const total = funcionariosMock.length;
    const ativos = funcionariosMock.filter(f => f.status === 'Ativo').length;
    const inativos = funcionariosMock.filter(f => f.status === 'Inativo').length;
    const desligadosMes = funcionariosMock.filter(f => f.status === 'Desligado' && f.dataDesligamento?.startsWith('2026-03')).length;
    return { total, ativos, inativos, desligadosMes };
  }, []);

  const ultimosAdicionados = useMemo(() =>
    [...funcionariosMock].sort((a, b) => b.dataAdmissao.localeCompare(a.dataAdmissao)).slice(0, 5),
  []);

  const aniversariantes = useMemo(() => {
    const mesAtual = 3;
    return funcionariosMock.filter(f => {
      const mes = parseInt(f.dataNascimento.split('-')[1]);
      return mes === mesAtual && f.status !== 'Desligado';
    });
  }, []);

  const setores = useMemo(() => {
    const deptMap = new Map<string, typeof funcionariosMock>();
    funcionariosMock.forEach(f => {
      if (!deptMap.has(f.departamento)) deptMap.set(f.departamento, []);
      deptMap.get(f.departamento)!.push(f);
    });

    return Array.from(deptMap.entries()).map(([dept, members]) => {
      const leader = members.find(m => /gerente|coordenador|diretor|líder/i.test(m.cargo)) || null;
      const ativos = members.filter(m => m.status === 'Ativo').length;
      const inativos = members.filter(m => m.status !== 'Ativo').length;
      return { dept, members, leader, ativos, inativos, total: members.length };
    });
  }, []);

  const kpis = [
    { label: 'Total de Funcionários', value: stats.total, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Ativos', value: stats.ativos, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Em Licença', value: stats.inativos, icon: UserX, color: 'bg-red-50 text-red-600' },
    { label: 'Desligados no Mês', value: stats.desligadosMes, icon: UserMinus, color: 'bg-muted text-muted-foreground' },
  ];

  const experienciaAlerts = useMemo(() => {
    const hoje = new Date('2026-03-30');
    const em30dias = new Date(hoje);
    em30dias.setDate(em30dias.getDate() + 30);
    return funcionariosMock
      .filter(f => f.dataFimExperiencia && f.status !== 'Desligado')
      .map(f => {
        const dataFim = new Date(f.dataFimExperiencia!);
        const diffDays = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return { ...f, dataFim, diffDays };
      })
      .filter(f => f.diffDays <= 30)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{kpi.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Quadro de Setores */}
      <div>
        <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Quadro de Setores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {setores.map(setor => (
            <div key={setor.dept} className="kpi-card flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    {deptIcons[setor.dept] || <Users className="w-5 h-5" />}
                  </div>
                  <h4 className="font-heading font-bold text-foreground">{setor.dept}</h4>
                </div>
                <span className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                  {setor.total} funcionário{setor.total !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Leader */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Líder do Setor</p>
                {setor.leader ? (
                  <div className="flex items-center gap-3">
                    <AvatarInitials name={setor.leader.nome} size="md" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{setor.leader.nome}</p>
                      <p className="text-xs text-muted-foreground">{setor.leader.cargo}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserX className="w-4 h-4" />
                    <span className="text-sm">Sem líder definido</span>
                  </div>
                )}
              </div>

              {/* Vertical Employee List */}
              <div className="mb-4">
                <div className="border-t border-border pt-3 mb-2">
                  <p className="text-xs text-muted-foreground mb-2">Funcionários do Setor</p>
                </div>
                <div className="space-y-1 max-h-[320px] overflow-y-auto">
                  {setor.members.slice(0, 8).map(m => (
                    <Link
                      to={`/funcionarios/${m.id}`}
                      key={m.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                        {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground break-words leading-tight">{m.nome}</p>
                        <p className="text-xs text-muted-foreground">{m.cargo}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[m.status] || 'bg-muted-foreground'}`} />
                    </Link>
                  ))}
                </div>
                {setor.members.length > 8 && (
                  <Link to="/funcionarios" className="text-xs text-primary hover:underline mt-2 inline-block">
                    Ver todos ({setor.members.length})
                  </Link>
                )}
              </div>

              {/* Footer stats */}
              <div className="flex items-center gap-4 pt-3 border-t border-border mt-auto">
                <div className="flex items-center gap-1.5 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">Ativos:</span>
                  <span className="font-semibold text-foreground">{setor.ativos}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <UserX className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-muted-foreground">Em Licença:</span>
                  <span className="font-semibold text-foreground">{setor.inativos}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="kpi-card">
          <h3 className="font-heading font-semibold text-foreground mb-4">Crescimento do Quadro (6 meses)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartDataCrescimento}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ fill: 'hsl(217 91% 60%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="kpi-card">
          <h3 className="font-heading font-semibold text-foreground mb-4">Últimos Adicionados</h3>
          <div className="space-y-3">
            {ultimosAdicionados.map((f) => (
              <Link to={`/funcionarios/${f.id}`} key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <AvatarInitials name={f.nome} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.nome}</p>
                  <p className="text-xs text-muted-foreground">{f.cargo}</p>
                </div>
                <span className={`status-badge status-${f.status.toLowerCase()}`}>{getStatusLabel(f.status)}</span>
              </Link>
            ))}
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
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-xs font-semibold text-warning">
                    {f.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{new Date(f.dataNascimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
