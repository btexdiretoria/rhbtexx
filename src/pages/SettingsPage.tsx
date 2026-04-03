import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useCompanySettings, useUpdateCompanySettings, useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useFinancial';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { data: settings, isLoading: loadingSettings } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const { data: departments = [], isLoading: loadingDepts } = useDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [initialized, setInitialized] = useState(false);

  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState('');

  if (settings && !initialized) {
    setCompanyName(settings.company_name);
    setCnpj(settings.cnpj);
    setEmail(settings.email);
    setPhone(settings.phone);
    setInitialized(true);
  }

  const handleSaveSettings = () => {
    if (!settings) return;
    updateSettings.mutate({ id: settings.id, company_name: companyName, cnpj, email, phone }, {
      onSuccess: () => toast({ title: 'Configurações salvas com sucesso!' }),
    });
  };

  const handleAddDept = () => {
    if (!newDeptName.trim()) return;
    createDept.mutate(newDeptName.trim(), {
      onSuccess: () => { setNewDeptName(''); toast({ title: 'Departamento criado!' }); },
      onError: () => toast({ title: 'Erro ao criar departamento', variant: 'destructive' }),
    });
  };

  const handleSaveDept = (id: string) => {
    if (!editDeptName.trim()) return;
    updateDept.mutate({ id, name: editDeptName.trim() }, {
      onSuccess: () => { setEditingDept(null); toast({ title: 'Departamento atualizado!' }); },
    });
  };

  const handleDeleteDept = (id: string) => {
    deleteDept.mutate(id, { onSuccess: () => toast({ title: 'Departamento removido!' }) });
  };

  if (loadingSettings || loadingDepts) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <h2 className="font-heading text-xl font-bold text-foreground">Configurações</h2>

      <div className="kpi-card space-y-4">
        <h3 className="font-heading font-semibold text-foreground">Informações da Empresa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Nome da Empresa</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
          <div><Label>CNPJ</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} /></div>
          <div><Label>E-mail de Contato</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>
        <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="kpi-card space-y-4">
        <h3 className="font-heading font-semibold text-foreground">Departamentos</h3>
        <div className="flex gap-2">
          <Input placeholder="Novo departamento..." value={newDeptName} onChange={e => setNewDeptName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddDept()} />
          <Button onClick={handleAddDept} size="sm" className="gap-1.5 shrink-0"><Plus className="w-4 h-4" />Adicionar</Button>
        </div>
        <div className="space-y-2">
          {departments.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              {editingDept === d.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input value={editDeptName} onChange={e => setEditDeptName(e.target.value)} className="h-8" onKeyDown={e => e.key === 'Enter' && handleSaveDept(d.id)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveDept(d.id)}><Check className="w-4 h-4 text-emerald-600" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingDept(null)}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-foreground">{d.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingDept(d.id); setEditDeptName(d.name); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDept(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
