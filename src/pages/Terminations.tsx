import { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { funcionariosMock } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Terminations() {
  const [mes, setMes] = useState('2026-03');

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

      {/* Table */}
      {desligados.length === 0 ? (
        <div className="kpi-card text-center py-8">
          <p className="text-muted-foreground">Nenhum desligamento neste período.</p>
        </div>
      ) : (
        <>
          <div className="kpi-card overflow-hidden p-0 hidden md:block">
            <table className="data-table">
              <thead><tr><th>Nome</th><th>Cargo</th><th>Departamento</th><th>Data</th><th>Motivo</th></tr></thead>
              <tbody>
                {desligados.map(f => (
                  <tr key={f.id}>
                    <td className="font-medium text-foreground">{f.nome}</td>
                    <td className="text-muted-foreground">{f.cargo}</td>
                    <td className="text-muted-foreground">{f.departamento}</td>
                    <td className="text-muted-foreground">{f.dataDesligamento ? new Date(f.dataDesligamento).toLocaleDateString('pt-BR') : '—'}</td>
                    <td className="text-muted-foreground">{f.motivoDesligamento || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {desligados.map(f => (
              <div key={f.id} className="kpi-card">
                <p className="font-medium text-foreground">{f.nome}</p>
                <p className="text-sm text-muted-foreground">{f.cargo} · {f.departamento}</p>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{f.dataDesligamento ? new Date(f.dataDesligamento).toLocaleDateString('pt-BR') : '—'}</span>
                  <span>{f.motivoDesligamento}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
