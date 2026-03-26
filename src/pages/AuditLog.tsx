import { useState, useMemo } from 'react';
import { Search, Filter, Download, X, Eye, Clock, Activity, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp, type AuditLogEntry, type TipoAcao } from '@/contexts/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const actionBadge: Record<TipoAcao, string> = {
  Cadastro: 'bg-emerald-100 text-emerald-700',
  Edição: 'bg-blue-100 text-blue-700',
  Exclusão: 'bg-red-100 text-red-700',
  Desligamento: 'bg-red-100 text-red-700',
  Avaliação: 'bg-yellow-100 text-yellow-700',
  Documento: 'bg-purple-100 text-purple-700',
  Usuário: 'bg-gray-100 text-gray-700',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

export default function AuditLog() {
  const { auditLog, usuarios } = useApp();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('Todos');
  const [actionFilter, setActionFilter] = useState('Todos');
  const [searchTarget, setSearchTarget] = useState('');
  const [page, setPage] = useState(1);
  const [detailEntry, setDetailEntry] = useState<AuditLogEntry | null>(null);

  const filtered = useMemo(() => {
    return auditLog.filter(e => {
      if (dateFrom && e.timestamp < dateFrom) return false;
      if (dateTo && e.timestamp > dateTo + 'T23:59:59') return false;
      if (userFilter !== 'Todos' && e.userId !== userFilter) return false;
      if (actionFilter !== 'Todos' && e.action !== actionFilter) return false;
      if (searchTarget && !e.target.toLowerCase().includes(searchTarget.toLowerCase())) return false;
      return true;
    });
  }, [auditLog, dateFrom, dateTo, userFilter, actionFilter, searchTarget]);

  const clearFilters = () => { setDateFrom(''); setDateTo(''); setUserFilter('Todos'); setActionFilter('Todos'); setSearchTarget(''); setPage(1); };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const today = new Date().toISOString().split('T')[0];
  const alteracoesHoje = auditLog.filter(e => e.timestamp.startsWith(today)).length;
  const userCounts = auditLog.reduce<Record<string, number>>((acc, e) => { acc[e.userName] = (acc[e.userName] || 0) + 1; return acc; }, {});
  const mostActive = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];

  const handleExport = () => {
    const csv = ['Data/Hora,Usuário,Tipo,Funcionário,Descrição',
      ...filtered.map(e => `"${new Date(e.timestamp).toLocaleString('pt-BR')}","${e.userName}","${e.action}","${e.target}","${e.description}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'historico-alteracoes.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="font-heading text-xl font-bold text-foreground">Histórico de Alterações</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Activity className="w-4 h-4" /><span className="text-xs">Total de Alterações</span></div>
          <p className="text-2xl font-heading font-bold text-foreground">{auditLog.length}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="w-4 h-4" /><span className="text-xs">Alterações Hoje</span></div>
          <p className="text-2xl font-heading font-bold text-foreground">{alteracoesHoje}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><User className="w-4 h-4" /><span className="text-xs">Usuário Mais Ativo</span></div>
          <p className="text-lg font-heading font-bold text-foreground">{mostActive?.[0] || '—'}</p>
          <p className="text-xs text-muted-foreground">{mostActive ? `${mostActive[1]} ações` : ''}</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="w-4 h-4" /><span className="text-xs">Última Alteração</span></div>
          <p className="text-lg font-heading font-bold text-foreground">{auditLog[0] ? timeAgo(auditLog[0].timestamp) : '—'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="kpi-card">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          <div>
            <label className="text-xs text-muted-foreground">De:</label>
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Até:</label>
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Usuário:</label>
            <Select value={userFilter} onValueChange={v => { setUserFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {usuarios.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Tipo:</label>
            <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Todos', 'Cadastro', 'Edição', 'Exclusão', 'Desligamento', 'Avaliação', 'Documento', 'Usuário'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Funcionário:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-9 w-44" value={searchTarget} onChange={e => { setSearchTarget(e.target.value); setPage(1); }} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1"><X className="w-3 h-3" />Limpar</Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1"><Download className="w-3 h-3" />Exportar</Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="kpi-card overflow-hidden p-0 hidden md:block">
        <table className="data-table">
          <thead>
            <tr><th>Data/Hora</th><th>Usuário</th><th>Tipo</th><th>Funcionário</th><th>Descrição</th><th></th></tr>
          </thead>
          <tbody>
            {paginated.map(e => (
              <tr key={e.id}>
                <td className="text-muted-foreground whitespace-nowrap text-sm">{new Date(e.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                      {e.userName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.userName}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${e.userRole === 'Administrador' ? 'bg-red-100 text-red-600' : e.userRole === 'Gestor' ? 'bg-yellow-100 text-yellow-600' : 'bg-emerald-100 text-emerald-600'}`}>{e.userRole}</span>
                    </div>
                  </div>
                </td>
                <td><span className={`status-badge ${actionBadge[e.action]}`}>{e.action}</span></td>
                <td className="text-foreground text-sm">{e.target}{e.targetId && <span className="text-muted-foreground text-xs ml-1">#{e.targetId}</span>}</td>
                <td className="text-muted-foreground text-sm max-w-xs truncate">{e.description}</td>
                <td>
                  {(e.fieldChanged || e.oldValue) && (
                    <Button variant="ghost" size="sm" onClick={() => setDetailEntry(e)}><Eye className="w-4 h-4" /></Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {paginated.map(e => (
          <div key={e.id} className="kpi-card" onClick={() => (e.fieldChanged || e.oldValue) && setDetailEntry(e)}>
            <div className="flex items-center justify-between mb-1">
              <span className={`status-badge ${actionBadge[e.action]}`}>{e.action}</span>
              <span className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="text-sm font-medium text-foreground">{e.target}</p>
            <p className="text-xs text-muted-foreground mt-1">{e.description}</p>
            <p className="text-xs text-muted-foreground mt-1">por {e.userName}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!detailEntry} onOpenChange={() => setDetailEntry(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Detalhes da Alteração</DialogTitle></DialogHeader>
          {detailEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Data/Hora:</span><p className="font-medium text-foreground">{new Date(detailEntry.timestamp).toLocaleString('pt-BR')}</p></div>
                <div><span className="text-muted-foreground">Usuário:</span><p className="font-medium text-foreground">{detailEntry.userName} ({detailEntry.userRole})</p></div>
                <div><span className="text-muted-foreground">Ação:</span><p><span className={`status-badge ${actionBadge[detailEntry.action]}`}>{detailEntry.action}</span></p></div>
                <div><span className="text-muted-foreground">Funcionário:</span><p className="font-medium text-foreground">{detailEntry.target}</p></div>
              </div>
              {detailEntry.fieldChanged && (
                <div className="border border-border rounded-lg p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Campo Alterado: <span className="text-foreground">{detailEntry.fieldChanged}</span></p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs text-red-500 mb-1">Valor Anterior</p>
                      <p className="text-sm font-medium text-red-700">{detailEntry.oldValue || '—'}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs text-emerald-500 mb-1">Valor Novo</p>
                      <p className="text-sm font-medium text-emerald-700">{detailEntry.newValue || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{detailEntry.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
