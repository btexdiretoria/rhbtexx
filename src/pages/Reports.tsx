import { FileSpreadsheet, FileText, Cake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const reports = [
  { title: 'Quadro Atual de Funcionários', description: 'Lista completa de todos os funcionários ativos com dados pessoais e profissionais.', icon: FileSpreadsheet, formats: ['PDF', 'Excel'] },
  { title: 'Relatório de Desligamentos', description: 'Histórico de desligamentos com motivos, datas e análise comparativa por período.', icon: FileText, formats: ['PDF', 'Excel'] },
  { title: 'Relatório de Aniversariantes', description: 'Lista de funcionários com aniversário no mês atual e próximos meses.', icon: Cake, formats: ['PDF'] },
];

export default function Reports() {
  const handleExport = (title: string, format: string) => {
    toast({ title: 'Exportação iniciada', description: `${title} em formato ${format} está sendo gerado.` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="font-heading text-xl font-bold text-foreground">Relatórios</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => (
          <div key={r.title} className="kpi-card flex flex-col">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <r.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-heading font-semibold text-foreground mb-1">{r.title}</h3>
            <p className="text-sm text-muted-foreground flex-1 mb-4">{r.description}</p>
            <div className="flex gap-2">
              {r.formats.map(f => (
                <Button key={f} variant="outline" size="sm" onClick={() => handleExport(r.title, f)}>{f}</Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
