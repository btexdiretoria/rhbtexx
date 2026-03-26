import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { funcionariosMock } from '@/data/mockData';

export default function Evaluations() {
  const comAvaliacoes = useMemo(() =>
    funcionariosMock.filter(f => f.avaliacoes.length > 0).map(f => {
      const latest = f.avaliacoes[0];
      const avg = (latest.produtividade + latest.comunicacao + latest.trabalhoEquipe + latest.proatividade + latest.lideranca + latest.resultados) / 6;
      return { ...f, latestAvaliacao: latest, media: avg };
    }),
  []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="font-heading text-xl font-bold text-foreground">Avaliações de Desempenho</h2>

      {comAvaliacoes.length === 0 ? (
        <div className="kpi-card text-center py-8">
          <p className="text-muted-foreground">Nenhuma avaliação registrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comAvaliacoes.map(f => (
            <Link to={`/funcionarios/${f.id}`} key={f.id} className="kpi-card block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {f.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{f.nome}</p>
                  <p className="text-xs text-muted-foreground">{f.cargo}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{f.latestAvaliacao.periodo}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="text-sm font-semibold text-foreground">{f.media.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
