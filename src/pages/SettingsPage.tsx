import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Check, X, Camera } from 'lucide-react';
import { useCompanySettings, useUpdateCompanySettings, useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '@/hooks/useFinancial';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function SettingsPage() {
  const { data: settings, isLoading: loadingSettings } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const { data: departments = [], isLoading: loadingDepts } = useDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();
  const { currentUser } = useApp();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [initialized, setInitialized] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [profileInitialized, setProfileInitialized] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingName, setSavingName] = useState(false);

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

  if (currentUser && !profileInitialized) {
    setDisplayName(currentUser.nome);
    setProfileInitialized(true);
  }

  const handleSaveSettings = () => {
    if (!settings) return;
    updateSettings.mutate({ id: settings.id, company_name: companyName, cnpj, email, phone }, {
      onSuccess: () => toast({ title: 'Configurações salvas com sucesso!' }),
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      // Remove old avatar if exists
      await supabase.storage.from('avatars').remove([path]);
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      // Update system_users
      await supabase.from('system_users').update({ avatar: avatarUrl }).or(`auth_user_id.eq.${user.id},email.eq.${user.email}`);
      queryClient.invalidateQueries({ queryKey: ['system_users'] });
      // Force AppContext refresh by reloading
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Erro ao enviar foto', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim() || !user) return;
    setSavingName(true);
    try {
      const { error } = await supabase.from('system_users').update({ nome: displayName.trim() }).or(`auth_user_id.eq.${user.id},email.eq.${user.email}`);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['system_users'] });
      toast({ title: 'Nome atualizado com sucesso!' });
      // Refresh to update AppContext
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar nome', description: err.message, variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
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

      {/* Profile Section */}
      <div className="kpi-card space-y-4">
        <h3 className="font-heading font-semibold text-foreground">Meu Perfil</h3>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative group">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.nome} className="w-20 h-20 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-border">
                {currentUser.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1 space-y-3 w-full">
            <div>
              <Label>Nome de Exibição</Label>
              <div className="flex gap-2">
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
                <Button onClick={handleSaveDisplayName} disabled={savingName || displayName === currentUser.nome} size="sm" className="shrink-0">
                  {savingName ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <span>{currentUser.email}</span> · <span>{currentUser.nivelAcesso}</span>
            </div>
          </div>
        </div>
      </div>

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
