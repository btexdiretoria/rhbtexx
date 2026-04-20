import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';
import { useFinancialDashboardData, useUpsertFinancialDashboard } from '@/hooks/useFinancialDashboard';
import { toast } from '@/hooks/use-toast';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Plus, Pencil, ChevronDown, ChevronUp } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CombinedTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md text-sm space-y-1">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {entry.dataKey === 'avgPrice' || entry.dataKey === 'dailyBilling'
              ? fmt(entry.value)
              : entry.value.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function FinanceDashboard() {
  const { currentUser } = useApp();
  const isAdmin = currentUser.nivelAcesso === 'Administrador';
  const { data: allData = [], isLoading } = useFinancialDashboardData();
  const upsert = useUpsertFinancialDashboard();

  const [open, setOpen] = useState(false);
  const [showTable, setShowTable] = useState(true);
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

  const resetForm = () => {
    setFormYear(now.getFullYear());
    setFormMonth(now.getMonth() + 1);
    setFormData({
      average_price: 0, daily_production_avg: 0, total_pieces: 0,
      working_days: 22, revenue_goal: 0, revenue_billed: 0, working_days_passed: 0,
    });
  };

  const handleOpenNew = () => {
    resetForm();
    setOpen(true);
  };

  const handleEditRow = (d: typeof allData[0]) => {
    setFormYear(d.year);
    setFormMonth(d.month);
    setFormData({
      average_price: d.average_price,
      daily_production_avg: d.daily_production_avg,
      total_pieces: d.total_pieces,
      working_days: d.working_days,
      revenue_goal: d.revenue_goal,
      revenue_billed: d.revenue_billed,
      working_days_passed: d.working_days_passed,
    });
    setOpen(true);
  };

  const handleSave = () => {
    upsert.mutate(
      { year: formYear, month: formMonth, ...formData },
      {
        onSuccess: () => { toast({ title: 'Dados salvos com sucesso!' }); setOpen(false); },
        onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
      }
    );
  };

  // Chart data sorted chronologically
  const chartData = [...allData]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .map(d => ({
      label: `${MONTH_NAMES[d.month - 1]}/${String(d.year).slice(2)}`,
      avgPrice: Number(d.average_price),
      dailyProd: Number(d.daily_production_avg),
      dailyBilling: d.working_days_passed > 0 ? Number(d.revenue_billed) / d.working_days_passed : 0,
    }));

  // Sorted table data
  const sortedData = [...allData].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);

  // Current month
  const currentMonthData = allData.find(d => d.year === now.getFullYear() && d.month === now.getMonth() + 1);
  const goal = currentMonthData ? Number(currentMonthData.revenue_goal) : 0;
  const billed = currentMonthData ? Number(currentMonthData.revenue_billed) : 0;
  const workingDaysTotal = currentMonthData ? currentMonthData.working_days : 22;
  const workingDaysPassed = currentMonthData ? currentMonthData.working_days_passed : 0;
  const workingDaysLeft = Math.max(0, workingDaysTotal - workingDaysPassed);
  const remaining = Math.max(0, goal - billed);
  const dailyTarget = workingDaysLeft > 0 ? remaining / workingDaysLeft : 0;
  const progressPct = goal > 0 ? Math.min(100, (billed / goal) * 100) : 0;
  const dailyBillingAvg = workingDaysPassed > 0 ? billed / workingDaysPassed : 0;

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Dashboard Finanças</h2>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Inserir Dados
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {formYear && formMonth ? `Dados — ${MONTH_FULL[formMonth - 1]} ${formYear}` : 'Inserir Dados do Mês'}
                </DialogTitle>
              </DialogHeader>
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
                <div>
                  <Label>Média de Preços (R$)</Label>
                  <Input type="number" step="0.01" value={formData.average_price} onChange={e => setFormData(p => ({ ...p, average_price: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Média Diária Produção</Label>
                  <Input type="number" step="0.01" value={formData.daily_production_avg} onChange={e => setFormData(p => ({ ...p, daily_production_avg: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Total Peças Produzidas</Label>
                  <Input type="number" value={formData.total_pieces} onChange={e => setFormData(p => ({ ...p, total_pieces: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Dias Úteis (mês)</Label>
                  <Input type="number" value={formData.working_days} onChange={e => setFormData(p => ({ ...p, working_days: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Meta de Faturamento (R$)</Label>
                  <Input type="number" step="0.01" value={formData.revenue_goal} onChange={e => setFormData(p => ({ ...p, revenue_goal: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Faturamento Atual (R$)</Label>
                  <Input type="number" step="0.01" value={formData.revenue_billed} onChange={e => setFormData(p => ({ ...p, revenue_billed: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Dias Úteis Passados</Label>
                  <Input type="number" value={formData.working_days_passed} onChange={e => setFormData(p => ({ ...p, working_days_passed: Number(e.target.value) }))} />
                </div>
              </div>
              <Button onClick={handleSave} disabled={upsert.isPending} className="w-full mt-4">
                {upsert.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Meta do Mês Atual */}
      <div className="kpi-card space-y-4">
        <h3 className="font-heading font-semibold text-foreground">
          Meta do Mês Atual ({MONTH_NAMES[now.getMonth()]}/{now.getFullYear()})
        </h3>
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
                <p className="text-xs text-muted-foreground">Meta Diária Restante</p>
                <p className="text-lg font-bold text-foreground">{fmt(dailyTarget)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Média Fat. Diário
                  <span className="block text-[10px] opacity-70">
                    ({workingDaysPassed} dia{workingDaysPassed !== 1 ? 's' : ''} passado{workingDaysPassed !== 1 ? 's' : ''})
                  </span>
                </p>
                <p className="text-lg font-bold text-foreground">{fmt(dailyBillingAvg)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhum dado inserido para o mês atual.
            {isAdmin ? ' Clique em "Inserir Dados" para começar.' : ''}
          </p>
        )}
      </div>

      {/* Gráfico Combinado */}
      <div className="kpi-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
          <h3 className="font-heading font-semibold text-foreground">
            Produção Diária &amp; Evolução de Preços
          </h3>
          <p className="text-xs text-muted-foreground">
            Barras = peças/dia · Linha sólida = preço médio · Linha tracejada = fat. diário
          </p>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 16, right: 96, left: 24, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              yAxisId="left"
              width={56}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Peças/dia', angle: -90, position: 'insideLeft', dx: -8, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))', textAnchor: 'middle' } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              width={64}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--accent-foreground))"
              tickFormatter={v => `R$${v.toLocaleString('pt-BR')}`}
            />
            <YAxis
              yAxisId="right2"
              orientation="right"
              width={56}
              tick={{ fontSize: 10 }}
              stroke="#f97316"
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CombinedTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar yAxisId="left" dataKey="dailyProd" name="Média Diária de Produção" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
            <Line yAxisId="right" type="monotone" dataKey="avgPrice" name="Preço Médio (R$)" stroke="hsl(var(--accent-foreground))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--accent-foreground))' }} activeDot={{ r: 6 }} />
            <Line yAxisId="right2" type="monotone" dataKey="dailyBilling" name="Fat. Diário Médio (R$)" stroke="#f97316" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de dados cadastrados */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-foreground">Dados Mensais Cadastrados</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTable(v => !v)}
            aria-label={showTable ? 'Ocultar lista' : 'Exibir lista'}
            aria-expanded={showTable}
            className="text-muted-foreground hover:text-foreground"
          >
            {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showTable ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês/Ano</TableHead>
                    <TableHead className="text-right">Média Preços</TableHead>
                    <TableHead className="text-right">Méd. Diária Prod.</TableHead>
                    <TableHead className="text-right">Total Peças</TableHead>
                    <TableHead className="text-right">Dias Úteis</TableHead>
                    <TableHead className="text-right">Meta Fat.</TableHead>
                    <TableHead className="text-right">Fat. Atual</TableHead>
                    <TableHead className="text-right">Dias Passados</TableHead>
                    {isAdmin && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length === 0 ? (
                    <TableRow><TableCell colSpan={isAdmin ? 9 : 8} className="text-center text-muted-foreground py-8">Nenhum dado cadastrado.</TableCell></TableRow>
                  ) : sortedData.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{MONTH_FULL[d.month - 1]} {d.year}</TableCell>
                      <TableCell className="text-right">{fmt(Number(d.average_price))}</TableCell>
                      <TableCell className="text-right">{Number(d.daily_production_avg).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-right">{Number(d.total_pieces).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-right">{d.working_days}</TableCell>
                      <TableCell className="text-right">{fmt(Number(d.revenue_goal))}</TableCell>
                      <TableCell className="text-right">{fmt(Number(d.revenue_billed))}</TableCell>
                      <TableCell className="text-right">{d.working_days_passed}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleEditRow(d)} className="text-muted-foreground hover:text-primary">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
