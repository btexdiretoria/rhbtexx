import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useFinancialDashboardData, useUpsertFinancialDashboard } from '@/hooks/useFinancialDashboard';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function FinanceDashboard() {
  const { currentUser } = useApp();
  const isAdmin = currentUser.nivelAcesso === 'Administrador';
  const { data: allData = [], isLoading } = useFinancialDashboardData();
  const upsert = useUpsertFinancialDashboard();

  const [open, setOpen] = useState(false);
  const now = new Date();
  const [formYear, setFormYear] = useState(now.getFullYear());
  const [formMonth, setFormMonth] = useState(now.getMonth() + 1);
  const [formData, setFormData] = useState({
    average_price: 0,
    daily_production_avg: 0,
    total_pieces: 0,
    working_days: 22,
    revenue_goal: 0,
    revenue_billed: 0,
    working_days_passed: 0,
  });

  const handleOpenForm = () => {
    const existing = allData.find(d => d.year === formYear && d.month === formMonth);
    if (existing) {
      setFormData({
        average_price: existing.average_price,
        daily_production_avg: existing.daily_production_avg,
        total_pieces: existing.total_pieces,
        working_days: existing.working_days,
        revenue_goal: existing.revenue_goal,
        revenue_billed: existing.revenue_billed,
        working_days_passed: existing.working_days_passed,
      });
    } else {
      setFormData({ average_price: 0, daily_production_avg: 0, total_pieces: 0, working_days: 22, revenue_goal: 0, revenue_billed: 0, working_days_passed: 0 });
    }
    setOpen(true);
  };

  const handleSave = () => {
    upsert.mutate({ year: formYear, month: formMonth, ...formData }, {
      onSuccess: () => { toast({ title: 'Dados salvos com sucesso!' }); setOpen(false); },
      onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
    });
  };

  // Chart data
  const chartData = allData.map(d => ({
    label: `${MONTH_NAMES[d.month - 1]}/${d.year}`,
    avgPrice: Number(d.average_price),
    dailyProd: Number(d.daily_production_avg),
    piecesPerDay: d.working_days > 0 ? Number(d.total_pieces) / d.working_days : 0,
  }));

  // Current month goal data
  const currentMonthData = allData.find(d => d.year === now.getFullYear() && d.month === now.getMonth() + 1);
  const goal = currentMonthData ? Number(currentMonthData.revenue_goal) : 0;
  const billed = currentMonthData ? Number(currentMonthData.revenue_billed) : 0;
  const workingDaysTotal = currentMonthData ? currentMonthData.working_days : 22;
  const workingDaysPassed = currentMonthData ? currentMonthData.working_days_passed : 0;
  const workingDaysLeft = Math.max(0, workingDaysTotal - workingDaysPassed);
  const remaining = Math.max(0, goal - billed);
  const dailyTarget = workingDaysLeft > 0 ? remaining / workingDaysLeft : 0;
  const progressPct = goal > 0 ? Math.min(100, (billed / goal) * 100) : 0;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Dashboard Finanças</h2>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenForm} className="gap-1.5"><Plus className="w-4 h-4" />Inserir Dados</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Inserir Dados do Mês</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ano</Label>
                  <Input type="number" value={formYear} onChange={e => setFormYear(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Mês</Label>
                  <Select value={String(formMonth)} onValueChange={v => setFormMonth(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Média de Preços (R$)</Label><Input type="number" step="0.01" value={formData.average_price} onChange={e => setFormData(p => ({ ...p, average_price: Number(e.target.value) }))} /></div>
                <div><Label>Média Diária Produção</Label><Input type="number" step="0.01" value={formData.daily_production_avg} onChange={e => setFormData(p => ({ ...p, daily_production_avg: Number(e.target.value) }))} /></div>
                <div><Label>Total Peças Produzidas</Label><Input type="number" value={formData.total_pieces} onChange={e => setFormData(p => ({ ...p, total_pieces: Number(e.target.value) }))} /></div>
                <div><Label>Dias Úteis (mês)</Label><Input type="number" value={formData.working_days} onChange={e => setFormData(p => ({ ...p, working_days: Number(e.target.value) }))} /></div>
                <div><Label>Meta de Faturamento (R$)</Label><Input type="number" step="0.01" value={formData.revenue_goal} onChange={e => setFormData(p => ({ ...p, revenue_goal: Number(e.target.value) }))} /></div>
                <div><Label>Faturamento Atual (R$)</Label><Input type="number" step="0.01" value={formData.revenue_billed} onChange={e => setFormData(p => ({ ...p, revenue_billed: Number(e.target.value) }))} /></div>
                <div><Label>Dias Úteis Passados</Label><Input type="number" value={formData.working_days_passed} onChange={e => setFormData(p => ({ ...p, working_days_passed: Number(e.target.value) }))} /></div>
              </div>
              <Button onClick={handleSave} disabled={upsert.isPending} className="w-full mt-4">{upsert.isPending ? 'Salvando...' : 'Salvar'}</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kpi-card">
          <h3 className="font-heading font-semibold text-foreground mb-4">Evolução Média de Preços</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="avgPrice" stroke="hsl(var(--primary))" strokeWidth={2} name="Preço Médio" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="kpi-card">
          <h3 className="font-heading font-semibold text-foreground mb-4">Média Diária de Produção</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="dailyProd" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Peças/dia" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="kpi-card lg:col-span-2">
          <h3 className="font-heading font-semibold text-foreground mb-4">Peças Produzidas / Dias Úteis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => v.toFixed(1)} />
              <Bar dataKey="piecesPerDay" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Peças/Dia Útil" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goal Tracker */}
      <div className="kpi-card space-y-4">
        <h3 className="font-heading font-semibold text-foreground">Meta do Mês Atual ({MONTH_NAMES[now.getMonth()]}/{now.getFullYear()})</h3>
        {currentMonthData ? (
          <>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold text-foreground">{progressPct.toFixed(1)}%</span>
              </div>
              <Progress value={progressPct} className="h-3" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Meta</p>
                <p className="text-lg font-bold text-foreground">{fmt(goal)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Faturado</p>
                <p className="text-lg font-bold text-primary">{fmt(billed)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Falta</p>
                <p className="text-lg font-bold text-destructive">{fmt(remaining)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Dias Úteis Restantes</p>
                <p className="text-lg font-bold text-foreground">{workingDaysLeft}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Meta Diária</p>
                <p className="text-lg font-bold text-foreground">{fmt(dailyTarget)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Nenhum dado inserido para o mês atual.{isAdmin ? ' Clique em "Inserir Dados" para começar.' : ''}</p>
        )}
      </div>
    </div>
  );
}
