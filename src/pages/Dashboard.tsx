import { useMemo } from 'react';
import { Users, UserCheck, UserX, UserMinus, Cake } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { funcionariosMock, chartDataHeadcount, chartDataCrescimento, chartDataStatus } from '@/data/mockData';
import { Link } from 'react-router-dom';

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
    const mesAtual = 3; // March
    return funcionariosMock.filter(f => {
      const mes = parseInt(f.dataNascimento.split('-')[1]);
      return mes === mesAtual && f.status !== 'Desligado';
    });
  }, []);

  const kpis = [
    { label: 'Total de Funcionários', value: stats.total, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Ativos', value: stats.ativos, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Inativos', value: stats.inativos, icon: UserX, color: 'bg-red-50 text-red-600' },
    { label: 'Desligados no Mês', value: stats.desligadosMes, icon: UserMinus, color: 'bg-gray-100 text-gray-600' },
  ];

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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="kpi-card">
          <h3 className="font-heading font-semibold text-foreground mb-4">Headcount por Departamento</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartDataHeadcount}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="departamento" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Chart */}
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

        {/* Últimos Funcionários */}
        <div className="kpi-card">
          <h3 className="font-heading font-semibold text-foreground mb-4">Últimos Adicionados</h3>
          <div className="space-y-3">
            {ultimosAdicionados.map((f) => (
              <Link to={`/funcionarios/${f.id}`} key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {f.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.nome}</p>
                  <p className="text-xs text-muted-foreground">{f.cargo}</p>
                </div>
                <span className={`status-badge status-${f.status.toLowerCase()}`}>{f.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Aniversariantes */}
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
