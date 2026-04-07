import { useMemo, useState } from 'react';
import { Star, CalendarIcon, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEmployees, useEvaluations, useDeleteEvaluation } from '@/hooks/useEmployees';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export default function Evaluations() {
  const { data: employees = [] } = useEmployees();
  const { data: evaluations = [], isLoading } = useEvaluations();
  const deleteEvaluation = useDeleteEvaluation();
  const { currentUser } = useApp();
  const isAdmin = currentUser.nivelAcesso === 'Administrador';

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedEval, setSelectedEval] = useState<typeof comAvaliacoes[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const empMap = useMemo(() => {
    const map = new Map<string, typeof employees[0]>();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  const comAvaliacoes = useMemo(() => {
    return evaluations
      .map(av => {
        const emp = empMap.get(av.employee_id);
        if (!emp) return null;
        const avg = (av.produtividade + av.comunicacao + av.trabalho_equipe + av.proatividade + av.lideranca + av.resultados) / 6;
        const avaliacaoData = new Date(av.data);
        return { emp, av, media: avg, avaliacaoData };
      })
      .filter(item => {
        if (!item) return false;
        if (startDate && item.avaliacaoData < startDate) return false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (item.avaliacaoData > endOfDay) return false;
        }
        return true;
      }) as { emp: typeof employees[0]; av: typeof evaluations[0]; media: number; avaliacaoData: Date }[];
  }, [evaluations, empMap, startDate, endDate]);

  const clearFilters = () => { setStartDate(undefined); setEndDate(undefined); };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteEvaluation.mutate(deleteId, {
      onSuccess: () => { toast.success('Avaliação excluída com sucesso'); setDeleteId(null); },
      onError: () => toast.error('Erro ao excluir avaliação'),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando avaliações...</p></div>;
  }

  const criteria = [
    { label: 'Produtividade', key: 'produtividade' },
    { label: 'Comunicação', key: 'comunicacao' },
    { label: 'Trabalho em Equipe', key: 'trabalho_equipe' },
    { label: 'Proatividade', key: 'proatividade' },
    { label: 'Liderança', key: 'lideranca' },
    { label: 'Resultados', key: 'resultados' },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Avaliações de Desempenho</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="w-4 h-4 mr-1.5" />{startDate ? format(startDate, 'dd/MM/yyyy') : 'Data início'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="w-4 h-4 mr-1.5" />{endDate ? format(endDate, 'dd/MM/yyyy') : 'Data fim'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {(startDate || endDate) && <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar</Button>}
        </div>
      </div>

      {comAvaliacoes.length === 0 ? (
        <div className="kpi-card text-center py-8"><p className="text-muted-foreground">Nenhuma avaliação encontrada para o período selecionado.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comAvaliacoes.map((item, idx) => (
            <div key={`${item.av.id}-${idx}`} className="kpi-card block cursor-pointer relative group" onClick={() => setSelectedEval(item)}>
              {isAdmin && (
                <button
                  className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => { e.stopPropagation(); setDeleteId(item.av.id); }}
                  title="Excluir avaliação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {item.emp.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.emp.nome}</p>
                  <p className="text-xs text-muted-foreground">{item.emp.cargo}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.av.periodo}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="text-sm font-semibold text-foreground">{item.media.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evaluation detail modal */}
      <Dialog open={!!selectedEval} onOpenChange={(open) => { if (!open) setSelectedEval(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Avaliação</DialogTitle>
            <DialogDescription>
              {selectedEval?.emp.nome} — {selectedEval?.av.periodo}
            </DialogDescription>
          </DialogHeader>
          {selectedEval && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {selectedEval.emp.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedEval.emp.nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedEval.emp.cargo} — {selectedEval.emp.departamento}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data</span>
                <span className="text-foreground">{format(selectedEval.avaliacaoData, 'dd/MM/yyyy')}</span>
              </div>

              <div className="space-y-2">
                {criteria.map(c => (
                  <div key={c.key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.label}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                      <span className="font-medium text-foreground">{Number(selectedEval.av[c.key]).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-semibold border-t pt-2">
                  <span>Média Geral</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span>{selectedEval.media.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {selectedEval.av.pontos_fortes && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Pontos Fortes</p>
                  <p className="text-sm text-muted-foreground">{selectedEval.av.pontos_fortes}</p>
                </div>
              )}
              {selectedEval.av.pontos_melhoria && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Pontos de Melhoria</p>
                  <p className="text-sm text-muted-foreground">{selectedEval.av.pontos_melhoria}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Avaliação</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta avaliação?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
