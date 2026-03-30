import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Briefcase, FileText, History, User, Plus, Pencil, Save, X, Trash2, Info, Copy, Check } from 'lucide-react';
import { funcionariosMock, Funcionario, Avaliacao, StatusFuncionario, TipoContrato, Genero, TipoChavePix, statusDisplayLabel } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function StatusBadge({ status }: { status: string }) {
  const label = statusDisplayLabel[status as StatusFuncionario] || status;
  return <span className={`status-badge status-${status.toLowerCase()}`}>{label}</span>;
}

function StarRating({ value, interactive, onChange }: { value: number; interactive?: boolean; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= value ? 'fill-warning text-warning' : 'text-muted'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="py-2">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  );
}

function EditableRow({ label, value, editing, onChange, type = 'text', error, options, placeholder }: {
  label: string; value: string | number | undefined; editing: boolean;
  onChange?: (v: string) => void; type?: string; error?: string;
  options?: { label: string; value: string }[]; placeholder?: string;
}) {
  if (!editing) return <InfoRow label={label} value={value} />;

  return (
    <div className="py-2">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {options ? (
        <Select value={String(value || '')} onValueChange={v => onChange?.(v)}>
          <SelectTrigger className={`h-9 ${error ? 'border-destructive' : ''}`}>
            <SelectValue placeholder={placeholder || 'Selecione'} />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : type === 'textarea' ? (
        <Textarea value={String(value || '')} onChange={e => onChange?.(e.target.value)} className={`min-h-[60px] ${error ? 'border-destructive' : ''}`} placeholder={placeholder} />
      ) : (
        <Input type={type} value={String(value || '')} onChange={e => onChange?.(e.target.value)} className={`h-9 ${error ? 'border-destructive' : ''}`} placeholder={placeholder} />
      )}
      {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
    </div>
  );
}

const timelineIcons: Record<string, string> = {
  admissao: '🟢', promocao: '⬆️', mudanca_cargo: '🔄', advertencia: '⚠️', desligamento: '🔴', afastamento: '🟡',
};

const departamentos = ['Tecnologia', 'Recursos Humanos', 'Financeiro', 'Comercial', 'Marketing', 'Operações'];
const generos: { label: string; value: string }[] = [
  { label: 'Masculino', value: 'Masculino' }, { label: 'Feminino', value: 'Feminino' },
  { label: 'Outro', value: 'Outro' }, { label: 'Prefiro não informar', value: 'Prefiro não informar' },
];
const tiposContrato: { label: string; value: string }[] = [
  { label: 'CLT', value: 'CLT' }, { label: 'PJ', value: 'PJ' },
  { label: 'Estágio', value: 'Estágio' }, { label: 'Temporário', value: 'Temporário' },
];
const statusOptions: { label: string; value: string }[] = [
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Afastado', value: 'Afastado' }, { label: 'Desligado', value: 'Desligado' },
];
const tiposChavePix: { label: string; value: string }[] = [
  { label: 'CPF', value: 'CPF' }, { label: 'CNPJ', value: 'CNPJ' },
  { label: 'E-mail', value: 'E-mail' }, { label: 'Telefone', value: 'Telefone' },
  { label: 'Chave Aleatória', value: 'Chave Aleatória' },
];

export default function EmployeeProfile() {
  const { id } = useParams();
  const { toast } = useToast();
  const { logAction } = useApp();
  const funcOriginal = funcionariosMock.find(f => f.id === id);

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Funcionario | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDesligamentoDialog, setShowDesligamentoDialog] = useState(false);
  const [editingAvId, setEditingAvId] = useState<string | null>(null);
  const [editAvData, setEditAvData] = useState<Avaliacao | null>(null);
  const [func, setFunc] = useState<Funcionario | undefined>(funcOriginal);
  const [pixCopied, setPixCopied] = useState(false);

  if (!func) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-lg text-muted-foreground">Funcionário não encontrado.</p>
      <Link to="/funcionarios"><Button variant="outline">Voltar</Button></Link>
    </div>
  );

  const startEdit = () => {
    setEditData(JSON.parse(JSON.stringify(func)));
    setErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData(null);
    setErrors({});
  };

  const updateField = (path: string, value: string | number) => {
    if (!editData) return;
    const copy = { ...editData } as any;
    const parts = path.split('.');
    if (parts.length === 2) {
      copy[parts[0]] = { ...copy[parts[0]], [parts[1]]: value };
    } else {
      copy[parts[0]] = value;
    }
    setEditData(copy as Funcionario);
  };

  const validate = (): boolean => {
    if (!editData) return false;
    const e: Record<string, string> = {};
    if (!editData.nome.trim()) e.nome = 'Nome é obrigatório';
    if (!editData.cpf.trim()) e.cpf = 'CPF é obrigatório';
    else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(editData.cpf)) e.cpf = 'Formato: 000.000.000-00';
    if (!editData.cargo.trim()) e.cargo = 'Cargo é obrigatório';
    if (!editData.departamento) e.departamento = 'Departamento é obrigatório';
    if (!editData.emailCorporativo.trim()) e.emailCorporativo = 'E-mail corporativo é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.emailCorporativo)) e.emailCorporativo = 'E-mail inválido';
    if (editData.emailPessoal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.emailPessoal)) e.emailPessoal = 'E-mail inválido';
    if (!editData.status) e.status = 'Status é obrigatório';
    if (editData.status === 'Desligado') {
      if (!editData.dataDesligamento) e.dataDesligamento = 'Data de desligamento é obrigatória';
      if (!editData.valorRescisao && editData.valorRescisao !== 0) e.valorRescisao = 'Valor da rescisão é obrigatório';
      if (!editData.dataPagamentoRescisao) e.dataPagamentoRescisao = 'Data de pagamento é obrigatória';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSave = () => {
    if (!editData || !func) return;

    const fieldLabels: Record<string, string> = {
      nome: 'Nome', cpf: 'CPF', rg: 'RG', dataNascimento: 'Data de Nascimento', genero: 'Gênero',
      telefone: 'Telefone', emailPessoal: 'E-mail Pessoal', cargo: 'Cargo', departamento: 'Departamento',
      centroCusto: 'Centro de Custo', tipoContrato: 'Tipo de Contrato', salario: 'Salário',
      cargaHoraria: 'Carga Horária', emailCorporativo: 'E-mail Corporativo', gestorDireto: 'Gestor Direto',
      status: 'Status', dataDesligamento: 'Data de Desligamento', motivoDesligamento: 'Motivo do Desligamento',
      chavePix: 'Chave PIX', tipoChavePix: 'Tipo de Chave PIX',
      valorRescisao: 'Valor da Rescisão', dataPagamentoRescisao: 'Data de Pagamento da Rescisão',
      dataFimExperiencia: 'Data Fim do Período de Experiência',
    };
    const simpleFields = Object.keys(fieldLabels);
    simpleFields.forEach(field => {
      const oldVal = String((func as any)[field] ?? '');
      const newVal = String((editData as any)[field] ?? '');
      if (oldVal !== newVal) {
        logAction('Edição', func.nome, `Alterou ${fieldLabels[field]} de '${oldVal}' para '${newVal}'`, {
          targetId: func.id, fieldChanged: fieldLabels[field], oldValue: oldVal, newValue: newVal,
        });
      }
    });

    const addrFields = ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
    addrFields.forEach(f => {
      if (func.endereco[f as keyof typeof func.endereco] !== editData.endereco[f as keyof typeof editData.endereco]) {
        const label = `Endereço (${f})`;
        logAction('Edição', func.nome, `Alterou ${label} de '${func.endereco[f as keyof typeof func.endereco]}' para '${editData.endereco[f as keyof typeof editData.endereco]}'`, {
          targetId: func.id, fieldChanged: label,
          oldValue: func.endereco[f as keyof typeof func.endereco],
          newValue: editData.endereco[f as keyof typeof editData.endereco],
        });
      }
    });

    const idx = funcionariosMock.findIndex(f => f.id === id);
    if (idx !== -1) Object.assign(funcionariosMock[idx], editData);

    setFunc({ ...editData });
    setEditing(false);
    setEditData(null);
    toast({ title: '✅ Perfil atualizado com sucesso!' });
  };

  const handleSave = () => {
    if (!validate()) return;
    if (!editData || !func) return;

    if (editData.status === 'Desligado' && func.status !== 'Desligado') {
      setShowDesligamentoDialog(true);
      return;
    }
    doSave();
  };

  const confirmDesligamento = () => {
    setShowDesligamentoDialog(false);
    doSave();
  };

  const copyPixKey = () => {
    const key = func.chavePix;
    if (!key) {
      toast({ title: '⚠️ Nenhuma chave PIX cadastrada', variant: 'destructive' });
      return;
    }
    navigator.clipboard.writeText(key);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const d = editing ? editData! : func;
  const activeEmployees = funcionariosMock.filter(f => f.status === 'Ativo' && f.id !== id);

  const mediaAvaliacao = func.avaliacoes.length > 0
    ? (func.avaliacoes.reduce((acc, a) => acc + (a.produtividade + a.comunicacao + a.trabalhoEquipe + a.proatividade + a.lideranca + a.resultados) / 6, 0) / func.avaliacoes.length).toFixed(1)
    : '—';

  const startEditAv = (av: Avaliacao) => {
    setEditingAvId(av.id);
    setEditAvData({ ...av });
  };

  const saveAv = () => {
    if (!editAvData || !func) return;
    const updated = func.avaliacoes.map(a => a.id === editAvData.id ? editAvData : a);
    const updatedFunc = { ...func, avaliacoes: updated };
    setFunc(updatedFunc);
    const idx = funcionariosMock.findIndex(f => f.id === id);
    if (idx !== -1) funcionariosMock[idx].avaliacoes = updated;
    logAction('Avaliação', func.nome, `Editou avaliação ${editAvData.periodo}`, { targetId: func.id });
    setEditingAvId(null);
    setEditAvData(null);
    toast({ title: '✅ Avaliação atualizada!' });
  };

  const deleteDoc = (docId: string) => {
    const doc = func.documentos.find(d => d.id === docId);
    const updated = func.documentos.filter(d => d.id !== docId);
    const updatedFunc = { ...func, documentos: updated };
    setFunc(updatedFunc);
    const idx = funcionariosMock.findIndex(f => f.id === id);
    if (idx !== -1) funcionariosMock[idx].documentos = updated;
    if (doc) logAction('Documento', func.nome, `Removeu documento: ${doc.nome}`, { targetId: func.id });
    toast({ title: 'Documento removido.' });
  };

  const addDoc = () => {
    const newDoc = { id: `d${Date.now()}`, nome: 'Novo Documento', tipo: 'PDF', dataUpload: new Date().toISOString().split('T')[0], tamanho: '0 KB' };
    const updated = [...func.documentos, newDoc];
    const updatedFunc = { ...func, documentos: updated };
    setFunc(updatedFunc);
    const idx = funcionariosMock.findIndex(f => f.id === id);
    if (idx !== -1) funcionariosMock[idx].documentos = updated;
    logAction('Documento', func.nome, `Anexou documento: ${newDoc.nome}`, { targetId: func.id });
    toast({ title: 'Documento adicionado.' });
  };

  const renameDoc = (docId: string, newName: string) => {
    const updated = func.documentos.map(d => d.id === docId ? { ...d, nome: newName } : d);
    const updatedFunc = { ...func, documentos: updated };
    setFunc(updatedFunc);
    const idx = funcionariosMock.findIndex(f => f.id === id);
    if (idx !== -1) funcionariosMock[idx].documentos = updated;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/funcionarios"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button></Link>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
            <Pencil className="w-4 h-4" />Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5">
              <X className="w-4 h-4" />Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4" />Salvar Alterações
            </Button>
          </div>
        )}
      </div>

      <div className="kpi-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {d.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold text-foreground">{d.nome}</h2>
            <p className="text-muted-foreground">{d.cargo} · {d.departamento}</p>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={d.status} />
              <span className="text-xs text-muted-foreground">Matrícula: {d.matricula}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pessoais" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-card p-1 rounded-lg border border-border">
          <TabsTrigger value="pessoais" className="gap-1.5"><User className="w-3.5 h-3.5" />Dados Pessoais</TabsTrigger>
          <TabsTrigger value="profissionais" className="gap-1.5"><Briefcase className="w-3.5 h-3.5" />Profissionais</TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Documentos</TabsTrigger>
          <TabsTrigger value="avaliacao" className="gap-1.5"><Star className="w-3.5 h-3.5" />Avaliação</TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5"><History className="w-3.5 h-3.5" />Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pessoais" className="mt-4">
          <div className="kpi-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableRow label="Nome Completo" value={d.nome} editing={editing} onChange={v => updateField('nome', v)} error={errors.nome} />
            <EditableRow label="CPF" value={d.cpf} editing={editing} onChange={v => updateField('cpf', v)} error={errors.cpf} placeholder="000.000.000-00" />
            <EditableRow label="RG" value={d.rg} editing={editing} onChange={v => updateField('rg', v)} />
            <EditableRow label="Data de Nascimento" value={editing ? d.dataNascimento : new Date(d.dataNascimento).toLocaleDateString('pt-BR')} editing={editing} onChange={v => updateField('dataNascimento', v)} type="date" />
            <EditableRow label="Gênero" value={d.genero} editing={editing} onChange={v => updateField('genero', v)} options={generos} />
            <EditableRow label="Telefone" value={d.telefone} editing={editing} onChange={v => updateField('telefone', v)} />
            
            {/* Chave PIX */}
            <div className="py-2">
              <p className="text-xs text-muted-foreground mb-0.5">Chave PIX</p>
              {editing ? (
                <div className="space-y-2">
                  <Input className="h-9" value={d.chavePix || ''} onChange={e => updateField('chavePix', e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" />
                  <Select value={d.tipoChavePix || ''} onValueChange={v => updateField('tipoChavePix', v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tipo de Chave" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposChavePix.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{d.chavePix || '—'}</p>
                  {d.chavePix && <span className="text-xs text-muted-foreground">({d.tipoChavePix})</span>}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={copyPixKey}>
                        {pixCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{pixCopied ? 'Copiado!' : 'Copiar chave PIX'}</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            <EditableRow label="E-mail Pessoal" value={d.emailPessoal} editing={editing} onChange={v => updateField('emailPessoal', v)} type="email" error={errors.emailPessoal} />
            {editing ? (
              <>
                <EditableRow label="CEP" value={d.endereco.cep} editing={editing} onChange={v => updateField('endereco.cep', v)} />
                <EditableRow label="Rua" value={d.endereco.rua} editing={editing} onChange={v => updateField('endereco.rua', v)} />
                <EditableRow label="Número" value={d.endereco.numero} editing={editing} onChange={v => updateField('endereco.numero', v)} />
                <EditableRow label="Bairro" value={d.endereco.bairro} editing={editing} onChange={v => updateField('endereco.bairro', v)} />
                <EditableRow label="Cidade" value={d.endereco.cidade} editing={editing} onChange={v => updateField('endereco.cidade', v)} />
                <EditableRow label="Estado" value={d.endereco.estado} editing={editing} onChange={v => updateField('endereco.estado', v)} />
              </>
            ) : (
              <>
                <InfoRow label="Endereço" value={`${d.endereco.rua}, ${d.endereco.numero} - ${d.endereco.bairro}`} />
                <InfoRow label="Cidade/Estado" value={`${d.endereco.cidade}/${d.endereco.estado} - CEP: ${d.endereco.cep}`} />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profissionais" className="mt-4">
          <div className="kpi-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <InfoRow label="Matrícula" value={d.matricula} />
            <EditableRow label="Cargo" value={d.cargo} editing={editing} onChange={v => updateField('cargo', v)} error={errors.cargo} />
            <EditableRow label="Departamento" value={d.departamento} editing={editing} onChange={v => updateField('departamento', v)} options={departamentos.map(dp => ({ label: dp, value: dp }))} error={errors.departamento} />
            <EditableRow label="Centro de Custo" value={d.centroCusto} editing={editing} onChange={v => updateField('centroCusto', v)} />
            <InfoRow label="Data de Admissão" value={new Date(d.dataAdmissao).toLocaleDateString('pt-BR')} />
            <EditableRow label="Tipo de Contrato" value={d.tipoContrato} editing={editing} onChange={v => updateField('tipoContrato', v)} options={tiposContrato} />
            <EditableRow label="Salário" value={editing ? d.salario : `R$ ${d.salario.toLocaleString('pt-BR')}`} editing={editing} onChange={v => updateField('salario', Number(v))} type="number" />
            <EditableRow label="Carga Horária" value={editing ? d.cargaHoraria : `${d.cargaHoraria}h/semana`} editing={editing} onChange={v => updateField('cargaHoraria', Number(v))} type="number" />
            <EditableRow label="E-mail Corporativo" value={d.emailCorporativo} editing={editing} onChange={v => updateField('emailCorporativo', v)} type="email" error={errors.emailCorporativo} />
            <EditableRow label="Gestor Direto" value={d.gestorDireto} editing={editing} onChange={v => updateField('gestorDireto', v)} options={activeEmployees.map(e => ({ label: e.nome, value: e.nome }))} />
            <EditableRow label="Status" value={editing ? d.status : (statusDisplayLabel[d.status as StatusFuncionario] || d.status)} editing={editing} onChange={v => updateField('status', v)} options={statusOptions} error={errors.status} />
            <EditableRow label="Fim do Período de Experiência" value={editing ? (d.dataFimExperiencia || '') : (d.dataFimExperiencia ? new Date(d.dataFimExperiencia).toLocaleDateString('pt-BR') : '—')} editing={editing} onChange={v => updateField('dataFimExperiencia', v)} type="date" />
            {(d.status === 'Desligado' || (editing && editData?.status === 'Desligado')) && (
              <>
                <EditableRow label="Data de Desligamento" value={editing ? (d.dataDesligamento || '') : (d.dataDesligamento ? new Date(d.dataDesligamento).toLocaleDateString('pt-BR') : '—')} editing={editing} onChange={v => updateField('dataDesligamento', v)} type="date" error={errors.dataDesligamento} />
                <EditableRow label="Motivo do Desligamento" value={d.motivoDesligamento} editing={editing} onChange={v => updateField('motivoDesligamento', v)} type="textarea" />
                <EditableRow label="Valor da Rescisão (R$)" value={editing ? (d.valorRescisao ?? '') : (d.valorRescisao != null ? `R$ ${d.valorRescisao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—')} editing={editing} onChange={v => updateField('valorRescisao', Number(v.replace(/[^\d.,]/g, '').replace(',', '.')))} type="number" error={errors.valorRescisao} placeholder="0.00" />
                <EditableRow label="Data de Pagamento da Rescisão" value={editing ? (d.dataPagamentoRescisao || '') : (d.dataPagamentoRescisao ? new Date(d.dataPagamentoRescisao).toLocaleDateString('pt-BR') : '—')} editing={editing} onChange={v => updateField('dataPagamentoRescisao', v)} type="date" error={errors.dataPagamentoRescisao} />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">Documentos</h3>
              <Button size="sm" onClick={addDoc} className="gap-1.5"><Plus className="w-4 h-4" />Adicionar Documento</Button>
            </div>
            {func.documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum documento cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {func.documentos.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <input
                          className="text-sm font-medium text-foreground bg-transparent border-none outline-none w-full focus:ring-1 focus:ring-primary/30 rounded px-1 -ml-1"
                          value={doc.nome}
                          onChange={e => renameDoc(doc.id, e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">{doc.tipo} · {doc.tamanho} · {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Download</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteDoc(doc.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="avaliacao" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="kpi-card flex-1">
              <p className="text-sm text-muted-foreground">Nota Geral Média</p>
              <p className="text-3xl font-heading font-bold text-primary mt-1">{mediaAvaliacao}<span className="text-base text-muted-foreground font-normal">/5</span></p>
            </div>
          </div>

          {func.avaliacoes.length === 0 ? (
            <div className="kpi-card text-center py-8">
              <p className="text-muted-foreground">Nenhuma avaliação registrada.</p>
            </div>
          ) : (
            func.avaliacoes.map(av => {
              const isEditingThis = editingAvId === av.id;
              const avd = isEditingThis ? editAvData! : av;
              return (
                <div key={av.id} className="kpi-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-semibold text-foreground">{avd.periodo}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(avd.data).toLocaleDateString('pt-BR')}</span>
                      {!isEditingThis ? (
                        <Button variant="ghost" size="sm" onClick={() => startEditAv(av)}><Pencil className="w-3.5 h-3.5" /></Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingAvId(null); setEditAvData(null); }}><X className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" onClick={saveAv} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"><Save className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {([
                      { label: 'Produtividade', key: 'produtividade' },
                      { label: 'Comunicação', key: 'comunicacao' },
                      { label: 'Trabalho em Equipe', key: 'trabalhoEquipe' },
                      { label: 'Proatividade', key: 'proatividade' },
                      { label: 'Liderança', key: 'lideranca' },
                      { label: 'Resultados', key: 'resultados' },
                    ] as const).map(c => (
                      <div key={c.label}>
                        <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                        <StarRating
                          value={(avd as any)[c.key]}
                          interactive={isEditingThis}
                          onChange={v => isEditingThis && setEditAvData({ ...editAvData!, [c.key]: v })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pontos Fortes</p>
                      {isEditingThis ? (
                        <Textarea value={avd.pontosFortes} onChange={e => setEditAvData({ ...editAvData!, pontosFortes: e.target.value })} className="min-h-[60px]" />
                      ) : (
                        <p className="text-sm text-foreground">{avd.pontosFortes}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pontos de Melhoria</p>
                      {isEditingThis ? (
                        <Textarea value={avd.pontosMelhoria} onChange={e => setEditAvData({ ...editAvData!, pontosMelhoria: e.target.value })} className="min-h-[60px]" />
                      ) : (
                        <p className="text-sm text-foreground">{avd.pontosMelhoria}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <Button className="gap-2"><Plus className="w-4 h-4" />Nova Avaliação</Button>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <div className="kpi-card">
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50">
              <Info className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">O histórico é gerado automaticamente e não pode ser editado.</p>
            </div>
            {func.historico.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento registrado.</p>
            ) : (
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
                {func.historico.sort((a, b) => b.data.localeCompare(a.data)).map(ev => (
                  <div key={ev.id} className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs">
                      {timelineIcons[ev.tipo] || '📌'}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{new Date(ev.data).toLocaleDateString('pt-BR')}</p>
                      <p className="text-sm font-medium text-foreground">{ev.descricao}</p>
                      <p className="text-xs text-muted-foreground">Responsável: {ev.responsavel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDesligamentoDialog} onOpenChange={setShowDesligamentoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Desligamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desligar este funcionário? Esta ação será registrada no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDesligamento} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Desligamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
