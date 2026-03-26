import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <h2 className="font-heading text-xl font-bold text-foreground">Configurações</h2>

      <div className="kpi-card space-y-4">
        <h3 className="font-heading font-semibold text-foreground">Informações da Empresa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Nome da Empresa</Label><Input defaultValue="GestãoPeople LTDA" /></div>
          <div><Label>CNPJ</Label><Input defaultValue="12.345.678/0001-90" /></div>
          <div><Label>E-mail de Contato</Label><Input defaultValue="contato@gestapeople.com" /></div>
          <div><Label>Telefone</Label><Input defaultValue="(11) 3000-0000" /></div>
        </div>
        <Button>Salvar Alterações</Button>
      </div>

      <div className="kpi-card space-y-4">
        <h3 className="font-heading font-semibold text-foreground">Departamentos</h3>
        <div className="space-y-2">
          {['Tecnologia', 'Recursos Humanos', 'Financeiro', 'Comercial', 'Marketing', 'Operações'].map(d => (
            <div key={d} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium text-foreground">{d}</span>
              <Button variant="ghost" size="sm" className="text-destructive">Remover</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
