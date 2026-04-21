import { useMemo, useState, useCallback } from 'react';
import { TrendingDown, TrendingUp, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApp } from '@/contexts/AppContext';
import { useEmployees, useUpdateEmployee, type Employee } from '@/hooks/useEmployees';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function formatCurrency(value?: number | null) { if (value == null) return '—'; return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; }
function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const [y, m, d] = String(dateStr).split('T')[0].split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}

export default function Terminations() {
  const { logAction } = useApp();
  const { data: employees = [], isLoading } = useEmployees();
  const updateEmployee = useUpdateEmployee();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const calPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const desligados = useMemo(() => employees.filter(f => f.status === 'Desligado' && f.data_desligamento?.startsWith(calPrefix)), [employees, calPrefix]);
  const mesAnterior = useMemo(() => {
    const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
    const prevYear = calMonth === 0 ? calYear - 1 : calYear;
    const prev = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
    return employees.filter(f => f.status === 'Desligado' && f.data_desligamento?.startsWith(prev)).length;
  }, [employees, calMonth, calYear]);

  const diff = desligados.length - mesAnterior;
  const pctChange = mesAnterior > 0 ? ((diff / mesAnterior) * 100).toFixed(0) : '—';

  const allDesligados = useMemo(() => employees.filter(f => f.status === 'Desligado'), [employees]);

  const calendarPayments = useMemo(() => {
    const map: Record<string, Employee[]> = {};
    allDesligados.forEach(f => {
      if (f.data_pagamento_rescisao) {
        const [yy, mm, dd] = String(f.data_pagamento_rescisao).split('T')[0].split('-').map(Number);
        if (yy === calYear && (mm - 1) === calMonth) {
          const day = dd;
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

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const handleCheckbox = useCallback((funcId: string, field: 'pagamento_confirmado' | 'contrato_assinado', checked: boolean) => {
    const f = employees.find(e => e.id === funcId);
    if (!f) return;
    const label = field === 'pagamento_confirmado' ? 'Pagamento Confirmado' : 'Contrato Assinado';
    const oldVal = f[field] ? 'Sim' : 'Não';
    updateEmployee.mutate({ id: funcId, [field]: checked });
    logAction('Edição', f.nome, `Alterou ${label} de '${oldVal}' para '${checked ? 'Sim' : 'Não'}'`, {
      targetId: f.id, fieldChanged: label, oldValue: oldVal, newValue: checked ? 'Sim' : 'Não',
    });
  }, [employees, logAction, updateEmployee]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Desligamentos</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="kpi-card"><p className="text-sm text-muted-foreground">Desligamentos no mês</p><p className="text-3xl font-heading font-bold text-foreground mt-1">{desligados.length}</p></div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Variação vs mês anterior</p>
          <div className="flex items-center gap-2 mt-1">
            {diff > 0 ? <TrendingUp className="w-5 h-5 text-destructive" /> : diff < 0 ? <TrendingDown className="w-5 h-5 text-success" /> : null}
            <p className={`text-3xl font-heading font-bold ${diff > 0 ? 'text-destructive' : diff < 0 ? 'text-success' : 'text-foreground'}`}>{pctChange !== '—' ? `${diff > 0 ? '+' : ''}${pctChange}%` : '—'}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Mês anterior: {mesAnterior}</p>
        </div>
      </div>

      <div className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
          <h3 className="font-heading font-semibold text-foreground">{monthNames[calMonth]} {calYear} — Pagamentos de Rescisão</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors"><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const payments = calendarPayments[day];
            const allConfirmed = payments?.every(f => f.pagamento_confirmado);
            const dayContent = (
              <div className={`relative flex flex-col items-center justify-center rounded-md p-1 min-h-[48px] text-sm transition-colors ${payments ? (allConfirmed ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold') : 'text-foreground hover:bg-muted/50'} ${payments ? 'cursor-pointer' : ''}`}>
                <span>{day}</span>
                {payments && <span className={`w-2 h-2 rounded-full mt-0.5 ${allConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />}
              </div>
            );
            if (!payments) return <div key={day}>{dayContent}</div>;
            return (
              <Popover key={day}>
                <PopoverTrigger asChild>{dayContent}</PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="center">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Pagamentos — {String(day).padStart(2, '0')}/{String(calMonth + 1).padStart(2, '0')}/{calYear}</p>
                  <div className="space-y-2">
                    {payments.map(f => (
                      <div key={f.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{f.nome}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{formatCurrency(f.valor_rescisao)}</span>
                          {f.pagamento_confirmado && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
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

      {desligados.length === 0 ? (
        <div className="kpi-card text-center py-8"><p className="text-muted-foreground">Nenhum desligamento neste período.</p></div>
      ) : (
        <>
          <div className="kpi-card overflow-hidden p-0 hidden md:block">
            <table className="data-table">
              <thead><tr><th>Nome</th><th>Cargo</th><th>Departamento</th><th>Data Deslig.</th><th>Motivo</th><th>Valor Rescisão</th><th>Data Pagamento</th><th className="text-center">Status</th></tr></thead>
              <tbody>
                {desligados.map(f => {
                  const complete = f.pagamento_confirmado && f.contrato_assinado;
                  return (
                    <tr key={f.id} className={complete ? 'bg-emerald-500/5' : ''}>
                      <td>
                        <div className="space-y-1.5">
                          <span className="font-medium text-foreground">{f.nome}</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <Checkbox checked={!!f.pagamento_confirmado} onCheckedChange={(c) => handleCheckbox(f.id, 'pagamento_confirmado', !!c)} />Pagamento
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <Checkbox checked={!!f.contrato_assinado} onCheckedChange={(c) => handleCheckbox(f.id, 'contrato_assinado', !!c)} />Contrato
                            </label>
                          </div>
                          {complete && <div className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Processo concluído</div>}
                        </div>
                      </td>
                      <td className="text-muted-foreground">{f.cargo}</td>
                      <td className="text-muted-foreground">{f.departamento}</td>
                      <td className="text-muted-foreground">{formatDate(f.data_desligamento)}</td>
                      <td className="text-muted-foreground">{f.motivo_desligamento || '—'}</td>
                      <td className="font-medium text-foreground">{formatCurrency(f.valor_rescisao)}</td>
                      <td className="text-muted-foreground">{formatDate(f.data_pagamento_rescisao)}</td>
                      <td className="text-center">
                        {complete ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Completo</span>
                          : <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">Pendente</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {desligados.map(f => {
              const complete = f.pagamento_confirmado && f.contrato_assinado;
              return (
                <div key={f.id} className={`kpi-card ${complete ? 'border-emerald-500/30' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div><p className="font-medium text-foreground">{f.nome}</p><p className="text-sm text-muted-foreground">{f.cargo} · {f.departamento}</p></div>
                    {complete && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                    <div><span className="block font-medium text-foreground">Desligamento</span>{formatDate(f.data_desligamento)}</div>
                    <div><span className="block font-medium text-foreground">Motivo</span>{f.motivo_desligamento || '—'}</div>
                    <div><span className="block font-medium text-foreground">Rescisão</span>{formatCurrency(f.valor_rescisao)}</div>
                    <div><span className="block font-medium text-foreground">Pagamento</span>{formatDate(f.data_pagamento_rescisao)}</div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <Checkbox checked={!!f.pagamento_confirmado} onCheckedChange={(c) => handleCheckbox(f.id, 'pagamento_confirmado', !!c)} />Pagamento confirmado
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <Checkbox checked={!!f.contrato_assinado} onCheckedChange={(c) => handleCheckbox(f.id, 'contrato_assinado', !!c)} />Contrato assinado
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
