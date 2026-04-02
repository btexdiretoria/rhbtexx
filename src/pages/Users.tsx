import { useState } from 'react';
import { Search, Plus, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSystemUsers, useCreateSystemUser, useUpdateSystemUser } from '@/hooks/useFinancial';
import { useApp, type NivelAcesso } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const nivelBadge: Record<string, string> = {
  Administrador: 'bg-red-100 text-red-700',
  Gestor: 'bg-yellow-100 text-yellow-700',
  Visualizador: 'bg-emerald-100 text-emerald-700',
};

interface FormState {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  cargo: string;
  departamento: string;
  nivelAcesso: string;
  status: string;
}

const emptyForm: FormState = { nome: '', email: '', senha: '', confirmarSenha: '', cargo: '', departamento: '', nivelAcesso: 'Visualizador', status: 'Ativo' };

export default function Users() {
  const { logAction } = useApp();
  const { data: usuarios = [], isLoading } = useSystemUsers();
  const createUser = useCreateSystemUser();
  const updateUser = useUpdateSystemUser();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (u: typeof usuarios[0]) => {
    setEditingId(u.id);
    setForm({ nome: u.nome, email: u.email, senha: '', confirmarSenha: '', cargo: u.cargo, departamento: u.departamento, nivelAcesso: u.nivel_acesso, status: u.status });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nome || !form.email) { toast({ title: 'Preencha nome e e-mail', variant: 'destructive' }); return; }
    if (!editingId && (!form.senha || form.senha !== form.confirmarSenha)) { toast({ title: 'Senhas não conferem', variant: 'destructive' }); return; }

    if (editingId) {
      const original = usuarios.find(u => u.id === editingId);
      updateUser.mutate({
        id: editingId,
        nome: form.nome,
        email: form.email,
        cargo: form.cargo,
        departamento: form.departamento,
        nivel_acesso: form.nivelAcesso,
        status: form.status,
      }, {
        onSuccess: () => {
          if (original && original.nivel_acesso !== form.nivelAcesso) {
            logAction('Usuário', form.nome, `Alterou nível de acesso de ${original.nivel_acesso} para ${form.nivelAcesso}`, { fieldChanged: 'nivelAcesso', oldValue: original.nivel_acesso, newValue: form.nivelAcesso });
          }
          toast({ title: 'Usuário atualizado' });
          setDialogOpen(false);
        },
      });
    } else {
      createUser.mutate({
        nome: form.nome,
        email: form.email,
        cargo: form.cargo,
        departamento: form.departamento,
        nivel_acesso: form.nivelAcesso,
        status: form.status,
      }, {
        onSuccess: () => {
          logAction('Usuário', form.nome, `Criou novo usuário com nível ${form.nivelAcesso}`);
          toast({ title: 'Usuário criado com sucesso!' });
          setDialogOpen(false);
        },
      });
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">Usuários do Sistema</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Novo Usuário</Button>
      </div>

      <div className="kpi-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou e-mail..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Desktop table */}
      <div className="kpi-card overflow-hidden p-0 hidden md:block">
        <table className="data-table">
          <thead>
            <tr><th>Usuário</th><th>Cargo</th><th>Nível de Acesso</th><th>Status</th><th>Último Acesso</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {u.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.nome}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground">{u.cargo}</td>
                <td><span className={`status-badge ${nivelBadge[u.nivel_acesso] || ''}`}>{u.nivel_acesso}</span></td>
                <td><span className={`status-badge ${u.status === 'Ativo' ? 'status-ativo' : 'status-afastado'}`}>{u.status}</span></td>
                <td className="text-muted-foreground text-sm">{u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td><Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Edit className="w-4 h-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(u => (
          <div key={u.id} className="kpi-card" onClick={() => openEdit(u)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {u.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{u.nome}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className={`status-badge ${nivelBadge[u.nivel_acesso] || ''}`}>{u.nivel_acesso}</span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Nome Completo *</Label><Input value={form.nome} onChange={e => update('nome', e.target.value)} /></div>
              <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
              {!editingId && (
                <>
                  <div><Label>Senha *</Label><Input type="password" value={form.senha} onChange={e => update('senha', e.target.value)} /></div>
                  <div><Label>Confirmar Senha *</Label><Input type="password" value={form.confirmarSenha} onChange={e => update('confirmarSenha', e.target.value)} /></div>
                </>
              )}
              <div><Label>Cargo</Label><Input value={form.cargo} onChange={e => update('cargo', e.target.value)} /></div>
              <div>
                <Label>Departamento</Label>
                <Select value={form.departamento} onValueChange={v => update('departamento', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['Tecnologia', 'Recursos Humanos', 'Financeiro', 'Comercial', 'Marketing', 'Operações'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nível de Acesso</Label>
                <Select value={form.nivelAcesso} onValueChange={v => update('nivelAcesso', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Gestor">Gestor</SelectItem>
                    <SelectItem value="Visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => update('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createUser.isPending || updateUser.isPending}>
                {(createUser.isPending || updateUser.isPending) ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
