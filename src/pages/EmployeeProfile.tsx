import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Briefcase, FileText, History, User, Plus, Pencil, Save, X, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEmployee, useUpdateEmployee, useEmployeeDocuments, useEmployeeHistory, useEvaluations, useCreateDocument, useDeleteDocument, useUpdateEvaluation, useCreateEvaluation, useDeleteEmployee, type Employee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useFinancial';
import { formatDateLocal, parseDateLocal } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
}

function StarRating({ value, interactive, onChange }: { value: number; interactive?: boolean; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= value ? 'fill-warning text-warning' : 'text-muted'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`} onClick={() => interactive && onChange?.(i)} />)}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  return <div className="py-2"><p className="text-xs text-muted-foreground mb-0.5">{label}</p><p className="text-sm font-medium text-foreground">{value || '—'}</p></div>;
}

function EditableRow({ label, value, editing, onChange, type = 'text', error, options, placeholder }: {
  label: string; value: string | number | undefined | null; editing: boolean;
  onChange?: (v: string) => void; type?: string; error?: string;
  options?: { label: string; value: string }[]; placeholder?: string;
}) {
  if (!editing) return <InfoRow label={label} value={value} />;
  return (
    <div className="py-2">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {options ? (
        <Select value={String(value || '')} onValueChange={v => onChange?.(v)}>
          <SelectTrigger className={`h-9 ${error ? 'border-destructive' : ''}`}><SelectValue placeholder={placeholder || 'Selecione'} /></SelectTrigger>
          <SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
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

const timelineIcons: Record<string, string> = { admissao: '🟢', promocao: '⬆️', mudanca_cargo: '🔄', advertencia: '⚠️', desligamento: '🔴', afastamento: '🟡' };
const statusOptions = [{ label: 'Ativo', value: 'Ativo' }, { label: 'Teste', value: 'Teste' }, { label: 'Afastado', value: 'Afastado' }, { label: 'Aviso Prévio', value: 'Aviso Prévio' }, { label: 'Desligado', value: 'Desligado' }, { label: 'Prestador de Serviço', value: 'Prestador de Serviço' }];
const tiposContrato = [{ label: 'CLT', value: 'CLT' }, { label: 'PJ', value: 'PJ' }, { label: 'Estágio', value: 'Estágio' }, { label: 'Temporário', value: 'Temporário' }];
const generos = [{ label: 'Masculino', value: 'Masculino' }, { label: 'Feminino', value: 'Feminino' }, { label: 'Outro', value: 'Outro' }];
const tiposChavePix = [{ label: 'CPF', value: 'CPF' }, { label: 'CNPJ', value: 'CNPJ' }, { label: 'E-mail', value: 'E-mail' }, { label: 'Telefone', value: 'Telefone' }, { label: 'Chave Aleatória', value: 'Chave Aleatória' }];

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAction, currentUser } = useApp();
  const isAdmin = currentUser.nivelAcesso === 'Administrador';
  const { data: employee, isLoading } = useEmployee(id);
  const { data: documents = [] } = useEmployeeDocuments(id);
  const { data: history = [] } = useEmployeeHistory(id);
  const { data: evaluations = [] } = useEvaluations(id);
  const { data: departments = [] } = useDepartments();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const createDoc = useCreateDocument();
  const deleteDoc = useDeleteDocument();
  const updateEval = useUpdateEvaluation();
  const createEval = useCreateEvaluation();

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDesligamentoDialog, setShowDesligamentoDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [evalForm, setEvalForm] = useState({
    periodo: '', data: new Date().toISOString().split('T')[0],
    produtividade: 3, comunicacao: 3, trabalho_equipe: 3, proatividade: 3, lideranca: 3, resultados: 3,
    pontos_fortes: '', pontos_melhoria: '',
  });

  const departmentOptions = departments.map(d => ({ label: d.name, value: d.name }));

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando perfil...</p></div>;
  if (!employee) return <div className="flex flex-col items-center justify-center py-20 gap-4"><p className="text-lg text-muted-foreground">Funcionário não encontrado.</p><Link to="/funcionarios"><Button variant="outline">Voltar</Button></Link></div>;

  const startEdit = () => { setEditData({ ...employee }); setErrors({}); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setEditData({}); setErrors({}); };
  const updateField = (field: string, value: string | number) => setEditData(prev => ({ ...prev, [field]: value }));

  const doSave = async () => {
    try {
      await updateEmployee.mutateAsync({ id: employee.id, ...editData });
      logAction('Edição', employee.nome, 'Editou dados do funcionário', { targetId: employee.id });
      setEditing(false); setEditData({});
      toast({ title: '✅ Perfil atualizado com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    }
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    const d = editData;
    if (!d.nome?.trim()) e.nome = 'Nome é obrigatório';
    if (!d.cpf?.trim()) e.cpf = 'CPF é obrigatório';
    if (!d.cargo?.trim()) e.cargo = 'Cargo é obrigatório';
    if (d.status === 'Desligado') {
      if (!d.valor_rescisao && d.valor_rescisao !== 0) e.valor_rescisao = 'Valor da rescisão é obrigatório';
      if (!d.data_pagamento_rescisao) e.data_pagamento_rescisao = 'Data de pagamento é obrigatória';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (d.status === 'Desligado' && employee.status !== 'Desligado') { setShowDesligamentoDialog(true); return; }
    doSave();
  };

   const d = editing ? editData : employee;

  const handleDeleteEmployee = async () => {
    try {
      await deleteEmployee.mutateAsync(employee.id);
      logAction('Exclusão', employee.nome, `Excluiu o funcionário ${employee.nome}`, { targetId: employee.id });
      toast({ title: 'Funcionário excluído com sucesso!' });
      navigate('/funcionarios');
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  };

  const mediaAvaliacao = evaluations.length > 0
    ? (evaluations.reduce((acc, a) => acc + (a.produtividade + a.comunicacao + a.trabalho_equipe + a.proatividade + a.lideranca + a.resultados) / 6, 0) / evaluations.length).toFixed(1) : '—';

  const addDocument = () => {
    createDoc.mutate({ employee_id: employee.id, nome: 'Novo Documento', tipo: 'PDF', tamanho: '0 KB' });
    toast({ title: 'Documento adicionado.' });
  };

  const removeDocument = (docId: string) => {
    deleteDoc.mutate({ id: docId, employee_id: employee.id });
    toast({ title: 'Documento removido.' });
  };

  const copyPixKey = () => {
    if (!employee.chave_pix) { toast({ title: '⚠️ Nenhuma chave PIX cadastrada', variant: 'destructive' }); return; }
    navigator.clipboard.writeText(employee.chave_pix);
    setPixCopied(true); setTimeout(() => setPixCopied(false), 2000);
  };

  const handleCreateEvaluation = () => {
    if (!evalForm.periodo) { toast({ title: 'Preencha o período', variant: 'destructive' }); return; }
    createEval.mutate({
      employee_id: employee.id, periodo: evalForm.periodo, data: evalForm.data,
      produtividade: evalForm.produtividade, comunicacao: evalForm.comunicacao,
      trabalho_equipe: evalForm.trabalho_equipe, proatividade: evalForm.proatividade,
      lideranca: evalForm.lideranca, resultados: evalForm.resultados,
      pontos_fortes: evalForm.pontos_fortes, pontos_melhoria: evalForm.pontos_melhoria,
    }, {
      onSuccess: () => {
        logAction('Avaliação', employee.nome, `Criou nova avaliação: ${evalForm.periodo}`, { targetId: employee.id });
        toast({ title: 'Avaliação criada!' }); setEvalDialogOpen(false);
        setEvalForm({ periodo: '', data: new Date().toISOString().split('T')[0], produtividade: 3, comunicacao: 3, trabalho_equipe: 3, proatividade: 3, lideranca: 3, resultados: 3, pontos_fortes: '', pontos_melhoria: '' });
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link to="/funcionarios"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button></Link>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5"><Pencil className="w-4 h-4" />Editar Perfil</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5"><X className="w-4 h-4" />Cancelar</Button>
            <Button size="sm" onClick={handleSave} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"><Save className="w-4 h-4" />Salvar</Button>
          </div>
        )}
      </div>

      <div className="kpi-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">{d.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}</div>
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold text-foreground">{d.nome}</h2>
            <p className="text-muted-foreground">{d.cargo} · {d.departamento}</p>
            <div className="flex items-center gap-3 mt-1"><StatusBadge status={d.status} /><span className="text-xs text-muted-foreground">Matrícula: {d.matricula}</span></div>
          </div>
        </div>
      </div>

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
            <EditableRow label="CPF" value={d.cpf} editing={editing} onChange={v => updateField('cpf', v)} error={errors.cpf} />
            <EditableRow label="RG" value={d.rg} editing={editing} onChange={v => updateField('rg', v)} />
            <EditableRow label="Data de Nascimento" value={editing ? d.data_nascimento : formatDateLocal(d.data_nascimento)} editing={editing} onChange={v => updateField('data_nascimento', v)} type="date" />
            <EditableRow label="Gênero" value={d.genero} editing={editing} onChange={v => updateField('genero', v)} options={generos} />
            <EditableRow label="Telefone" value={d.telefone} editing={editing} onChange={v => updateField('telefone', v)} />
            
            <div className="py-2">
              <p className="text-xs text-muted-foreground mb-0.5">Chave PIX</p>
              {editing ? (
                <div className="space-y-2">
                  <Input className="h-9" value={d.chave_pix || ''} onChange={e => updateField('chave_pix', e.target.value)} />
                  <Select value={d.tipo_chave_pix || ''} onValueChange={v => updateField('tipo_chave_pix', v)}><SelectTrigger className="h-9"><SelectValue placeholder="Tipo de Chave" /></SelectTrigger><SelectContent>{tiposChavePix.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{d.chave_pix || '—'}</p>
                  {d.chave_pix && <span className="text-xs text-muted-foreground">({d.tipo_chave_pix})</span>}
                  <Tooltip><TooltipTrigger asChild><button onClick={copyPixKey} className="text-muted-foreground hover:text-primary">{pixCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}</button></TooltipTrigger><TooltipContent>{pixCopied ? 'Copiado!' : 'Copiar chave'}</TooltipContent></Tooltip>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profissionais" className="mt-4">
          <div className="kpi-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableRow label="Matrícula" value={d.matricula} editing={editing} onChange={v => updateField('matricula', v)} />
            <EditableRow label="Cargo" value={d.cargo} editing={editing} onChange={v => updateField('cargo', v)} error={errors.cargo} />
            <EditableRow label="Departamento" value={d.departamento} editing={editing} onChange={v => updateField('departamento', v)} options={departmentOptions} />
            
            <EditableRow label="Tipo de Contrato" value={d.tipo_contrato} editing={editing} onChange={v => updateField('tipo_contrato', v)} options={tiposContrato} />
            <EditableRow label="Data de Admissão" value={editing ? d.data_admissao : formatDateLocal(d.data_admissao)} editing={editing} onChange={v => updateField('data_admissao', v)} type="date" />
            <EditableRow label="Salário" value={d.salario} editing={editing} onChange={v => updateField('salario', Number(v))} type="number" />
            
            <EditableRow label="Status" value={d.status} editing={editing} onChange={v => updateField('status', v)} options={statusOptions} />
            <EditableRow label="Fim Experiência" value={editing ? d.data_fim_experiencia : formatDateLocal(d.data_fim_experiencia)} editing={editing} onChange={v => updateField('data_fim_experiencia', v)} type="date" />
            {d.status === 'Aviso Prévio' && (
              <>
                <EditableRow label="Data Início Aviso Prévio" value={editing ? d.data_inicio_aviso_previo : formatDateLocal(d.data_inicio_aviso_previo)} editing={editing} onChange={v => updateField('data_inicio_aviso_previo', v)} type="date" />
                <InfoRow label="Fim do Aviso Prévio" value={d.data_inicio_aviso_previo ? (() => { const dt = parseDateLocal(d.data_inicio_aviso_previo); dt.setDate(dt.getDate() + 30); return dt.toLocaleDateString('pt-BR'); })() : '—'} />
              </>
            )}
            {isAdmin && !editing && (
              <div className="col-span-full pt-4 border-t border-border">
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="gap-1.5">
                  <Trash2 className="w-4 h-4" />Excluir Funcionário
                </Button>
              </div>
            )}
          </div>

          {d.status === 'Desligado' && (
            <div className="kpi-card mt-4">
              <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Informações de Rescisão</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                <EditableRow label="Valor Rescisão Líquido" value={d.valor_rescisao} editing={editing} onChange={v => updateField('valor_rescisao', Number(v))} type="number" error={errors.valor_rescisao} />
                <EditableRow label="Desconto Alimentação" value={d.desconto_alimentacao} editing={editing} onChange={v => updateField('desconto_alimentacao', Number(v))} type="number" />
                <EditableRow label="Desconto Faltas" value={d.desconto_faltas} editing={editing} onChange={v => updateField('desconto_faltas', Number(v))} type="number" />
                <EditableRow label="Desconto Farmácia" value={(d as any).desconto_farmacia} editing={editing} onChange={v => updateField('desconto_farmacia' as any, Number(v))} type="number" />
                <EditableRow label="Data Desligamento" value={editing ? d.data_desligamento : formatDateLocal(d.data_desligamento)} editing={editing} onChange={v => updateField('data_desligamento', v)} type="date" />
                <EditableRow label="Data Pgto Rescisão" value={editing ? d.data_pagamento_rescisao : formatDateLocal(d.data_pagamento_rescisao)} editing={editing} onChange={v => updateField('data_pagamento_rescisao', v)} type="date" error={errors.data_pagamento_rescisao} />
                <EditableRow label="Motivo" value={d.motivo_desligamento} editing={editing} onChange={v => updateField('motivo_desligamento', v)} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">Documentos</h3>
              <Button size="sm" onClick={addDocument} className="gap-1.5"><Plus className="w-4 h-4" />Novo</Button>
            </div>
            {documents.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p> : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div><p className="text-sm font-medium text-foreground">{doc.nome}</p><p className="text-xs text-muted-foreground">{doc.tipo} · {doc.tamanho || '—'} · {new Date(doc.data_upload).toLocaleDateString('pt-BR')}</p></div>
                    <Button variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="avaliacao" className="mt-4">
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">Avaliações de Desempenho</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2"><Star className="w-4 h-4 fill-warning text-warning" /><span className="font-bold text-foreground">{mediaAvaliacao}</span><span className="text-xs text-muted-foreground">Média</span></div>
                <Button size="sm" onClick={() => setEvalDialogOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" />Nova Avaliação</Button>
              </div>
            </div>
            {evaluations.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p> : (
              <div className="space-y-4">
                {evaluations.map(av => {
                  const avg = (av.produtividade + av.comunicacao + av.trabalho_equipe + av.proatividade + av.lideranca + av.resultados) / 6;
                  return (
                    <div key={av.id} className="p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div><p className="font-medium text-foreground">{av.periodo}</p><p className="text-xs text-muted-foreground">{new Date(av.data).toLocaleDateString('pt-BR')}</p></div>
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-warning text-warning" /><span className="font-bold text-foreground">{avg.toFixed(1)}</span></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Produtividade</span><StarRating value={av.produtividade} /></div>
                        <div><span className="text-muted-foreground">Comunicação</span><StarRating value={av.comunicacao} /></div>
                        <div><span className="text-muted-foreground">Trabalho em Equipe</span><StarRating value={av.trabalho_equipe} /></div>
                        <div><span className="text-muted-foreground">Proatividade</span><StarRating value={av.proatividade} /></div>
                        <div><span className="text-muted-foreground">Liderança</span><StarRating value={av.lideranca} /></div>
                        <div><span className="text-muted-foreground">Resultados</span><StarRating value={av.resultados} /></div>
                      </div>
                      {(av.pontos_fortes || av.pontos_melhoria) && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {av.pontos_fortes && <div><span className="text-muted-foreground">Pontos Fortes:</span><p className="text-foreground">{av.pontos_fortes}</p></div>}
                          {av.pontos_melhoria && <div><span className="text-muted-foreground">Pontos de Melhoria:</span><p className="text-foreground">{av.pontos_melhoria}</p></div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <div className="kpi-card">
            <h3 className="font-heading font-semibold text-foreground mb-4">Histórico</h3>
            {history.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum registro de histórico.</p> : (
              <div className="space-y-3">
                {history.map(h => (
                  <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-lg">{timelineIcons[h.tipo] || '📋'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{h.descricao}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.data).toLocaleDateString('pt-BR')} {h.responsavel && `· ${h.responsavel}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Evaluation Dialog */}
      <Dialog open={evalDialogOpen} onOpenChange={setEvalDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Nova Avaliação — {employee.nome}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Período *</Label><Input placeholder="Ex: 1º Semestre 2026" value={evalForm.periodo} onChange={e => setEvalForm(p => ({ ...p, periodo: e.target.value }))} /></div>
              <div><Label>Data</Label><Input type="date" value={evalForm.data} onChange={e => setEvalForm(p => ({ ...p, data: e.target.value }))} /></div>
            </div>
            {(['produtividade', 'comunicacao', 'trabalho_equipe', 'proatividade', 'lideranca', 'resultados'] as const).map(field => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-sm capitalize">{field.replace('_', ' ')}</span>
                <StarRating value={evalForm[field]} interactive onChange={v => setEvalForm(p => ({ ...p, [field]: v }))} />
              </div>
            ))}
            <div><Label>Pontos Fortes</Label><Textarea value={evalForm.pontos_fortes} onChange={e => setEvalForm(p => ({ ...p, pontos_fortes: e.target.value }))} /></div>
            <div><Label>Pontos de Melhoria</Label><Textarea value={evalForm.pontos_melhoria} onChange={e => setEvalForm(p => ({ ...p, pontos_melhoria: e.target.value }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEvalDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateEvaluation} disabled={createEval.isPending}>{createEval.isPending ? 'Salvando...' : 'Criar Avaliação'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDesligamentoDialog} onOpenChange={setShowDesligamentoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Desligamento</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja alterar o status deste funcionário para "Desligado"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDesligamentoDialog(false); doSave(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar Desligamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDeleteDialog(false); handleDeleteEmployee(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
