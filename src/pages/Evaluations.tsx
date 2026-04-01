import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/hooks/useEmployees';
import { useEvaluations } from '@/hooks/useEmployees';

export default function Evaluations() {
  const { data: employees = [] } = useEmployees();
  const { data: evaluations = [], isLoading } = useEvaluations();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

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

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando avaliações...</p></div>;
  }

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
            <Link to={`/funcionarios/${item.emp.id}`} key={`${item.av.id}-${idx}`} className="kpi-card block">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
