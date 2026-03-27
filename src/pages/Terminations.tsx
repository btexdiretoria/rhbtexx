import { useMemo, useState, useCallback } from 'react';
import { TrendingDown, TrendingUp, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { funcionariosMock, Funcionario } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApp } from '@/contexts/AppContext';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatCurrency(value?: number) {
  if (value == null) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function Terminations() {
  const { logAction } = useApp();
  const [mes, setMes] = useState('2026-03');
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(2); // 0-indexed, March = 2

  const desligados = useMemo(() =>
    funcionariosMock.filter(f => f.status === 'Desligado' && f.dataDesligamento?.startsWith(mes)),
  [mes]);

  const mesAnterior = useMemo(() => {
    const [y, m] = mes.split('-').map(Number);
    const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
    return funcionariosMock.filter(f => f.status === 'Desligado' && f.dataDesligamento?.startsWith(prev)).length;
  }, [mes]);

  const diff = desligados.length - mesAnterior;
  const pctChange = mesAnterior > 0 ? ((diff / mesAnterior) * 100).toFixed(0) : '—';

  // All terminated employees for calendar
  const allDesligados = useMemo(() =>
    funcionariosMock.filter(f => f.status === 'Desligado'),
  []);

  // Payment calendar data
  const calendarPayments = useMemo(() => {
    const map: Record<string, Funcionario[]> = {};
    allDesligados.forEach(f => {
      if (f.dataPagamentoRescisao) {
        const d = new Date(f.dataPagamentoRescisao);
        if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          map[day].push(f);
        }
      }
    });
    return map;
  }, [allDesligados, calYear, calMonth]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [daysInMonth, firstDay]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const [, forceUpdate] = useState(0);

  const handleCheckbox = useCallback((funcId: string, field: 'pagamentoConfirmado' | 'contratoAssinado', checked: boolean) => {
    const f = funcionariosMock.find(f => f.id === funcId);
    if (!f) return;
    const oldVal = f[field] ? 'Sim' : 'Não';
    (f as any)[field] = checked;
    const label = field === 'pagamentoConfirmado' ? 'Pagamento Confirmado' : 'Contrato Assinado';
    logAction('Edição', f.nome, `Alterou ${label} de '${oldVal}' para '${checked ? 'Sim' : 'Não'}'`, {
      targetId: f.id, fieldChanged: label, oldValue: oldVal, newValue: checked ? 'Sim' : 'Não',
    });
    forceUpdate(n => n + 1);
  }, [logAction]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Desligamentos</h2>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-03">Março 2026</SelectItem>
            <SelectItem value="2026-02">Fevereiro 2026</SelectItem>
            <SelectItem value="2026-01">Janeiro 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Desligamentos no mês</p>
          <p className="text-3xl font-heading font-bold text-foreground mt-1">{desligados.length}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Variação vs mês anterior</p>
          <div className="flex items-center gap-2 mt-1">
            {diff > 0 ? <TrendingUp className="w-5 h-5 text-destructive" /> : diff < 0 ? <TrendingDown className="w-5 h-5 text-success" /> : null}
            <p className={`text-3xl font-heading font-bold ${diff > 0 ? 'text-destructive' : diff < 0 ? 'text-success' : 'text-foreground'}`}>
              {pctChange !== '—' ? `${diff > 0 ? '+' : ''}${pctChange}%` : '—'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Mês anterior: {mesAnterior}</p>
        </div>
      </div>

      {/* Payment Calendar */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h3 className="font-heading font-semibold text-foreground">
            {monthNames[calMonth]} {calYear} — Pagamentos de Rescisão
          </h3>
          <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const payments = calendarPayments[day];
            const allConfirmed = payments?.every(f => f.pagamentoConfirmado);
            const hasPending = payments?.some(f => !f.pagamentoConfirmado);

            const dayContent = (
              <div
                className={`relative flex flex-col items-center justify-center rounded-md p-1 min-h-[48px] text-sm transition-colors
                  ${payments ? (allConfirmed ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold') : 'text-foreground hover:bg-muted/50'}
                  ${payments ? 'cursor-pointer' : ''}`}
              >
                <span>{day}</span>
                {payments && (
                  <span className={`w-2 h-2 rounded-full mt-0.5 ${allConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                )}
              </div>
            );

            if (!payments) return <div key={day}>{dayContent}</div>;

            return (
              <Popover key={day}>
                <PopoverTrigger asChild>{dayContent}</PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="center">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Pagamentos — {String(day).padStart(2, '0')}/{String(calMonth + 1).padStart(2, '0')}/{calYear}
                  </p>
                  <div className="space-y-2">
                    {payments.map(f => (
                      <div key={f.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{f.nome}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{formatCurrency(f.valorRescisao)}</span>
                          {f.pagamentoConfirmado && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pago</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pendente</div>
        </div>
      </div>

      {/* Table */}
      {desligados.length === 0 ? (
        <div className="kpi-card text-center py-8">
          <p className="text-muted-foreground">Nenhum desligamento neste período.</p>
        </div>
      ) : (
        <>
          <div className="kpi-card overflow-hidden p-0 hidden md:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Departamento</th>
                  <th>Data Deslig.</th>
                  <th>Motivo</th>
                  <th>Valor Rescisão</th>
                  <th>Data Pagamento</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {desligados.map(f => {
                  const complete = f.pagamentoConfirmado && f.contratoAssinado;
                  return (
                    <tr key={f.id} className={complete ? 'bg-emerald-500/5' : ''}>
                      <td>
                        <div className="space-y-1.5">
                          <span className="font-medium text-foreground">{f.nome}</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <Checkbox
                                checked={!!f.pagamentoConfirmado}
                                onCheckedChange={(c) => handleCheckbox(f.id, 'pagamentoConfirmado', !!c)}
                              />
                              Pagamento
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <Checkbox
                                checked={!!f.contratoAssinado}
                                onCheckedChange={(c) => handleCheckbox(f.id, 'contratoAssinado', !!c)}
                              />
                              Contrato
                            </label>
                          </div>
                          {complete && (
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Processo concluído
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-muted-foreground">{f.cargo}</td>
                      <td className="text-muted-foreground">{f.departamento}</td>
                      <td className="text-muted-foreground">{formatDate(f.dataDesligamento)}</td>
                      <td className="text-muted-foreground">{f.motivoDesligamento || '—'}</td>
                      <td className="font-medium text-foreground">{formatCurrency(f.valorRescisao)}</td>
                      <td className="text-muted-foreground">{formatDate(f.dataPagamentoRescisao)}</td>
                      <td className="text-center">
                        {complete ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Completo
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">
                            Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {desligados.map(f => {
              const complete = f.pagamentoConfirmado && f.contratoAssinado;
              return (
                <div key={f.id} className={`kpi-card ${complete ? 'border-emerald-500/30' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{f.nome}</p>
                      <p className="text-sm text-muted-foreground">{f.cargo} · {f.departamento}</p>
                    </div>
                    {complete && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                    <div><span className="block font-medium text-foreground">Desligamento</span>{formatDate(f.dataDesligamento)}</div>
                    <div><span className="block font-medium text-foreground">Motivo</span>{f.motivoDesligamento || '—'}</div>
                    <div><span className="block font-medium text-foreground">Rescisão</span>{formatCurrency(f.valorRescisao)}</div>
                    <div><span className="block font-medium text-foreground">Pagamento</span>{formatDate(f.dataPagamentoRescisao)}</div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <Checkbox
                        checked={!!f.pagamentoConfirmado}
                        onCheckedChange={(c) => handleCheckbox(f.id, 'pagamentoConfirmado', !!c)}
                      />
                      Pagamento confirmado
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <Checkbox
                        checked={!!f.contratoAssinado}
                        onCheckedChange={(c) => handleCheckbox(f.id, 'contratoAssinado', !!c)}
                      />
                      Contrato assinado
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
