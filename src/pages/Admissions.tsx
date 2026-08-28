import { useMemo, useState } from 'react';
import { Plus, Settings2, Trash2, UserPlus, UserMinus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useEmployees } from '@/hooks/useEmployees';
import {
  useHrTemplates, useCreateTemplate, useDeleteTemplate,
  useHrCases, useCreateCase, useToggleStep, useDeleteCase,
  type HrProcessTipo,
} from '@/hooks/useHrProcesses';

const TIPO_LABEL: Record<HrProcessTipo, string> = { admissao: 'Admissão', demissao: 'Demissão' };

export default function Admissions() {
  const { toast } = useToast();
  const { data: employees = [] } = useEmployees();
  const { data: templates = [] } = useHrTemplates();
  const { data: cases = [], isLoading } = useHrCases();
  const createCase = useCreateCase();
  const toggleStep = useToggleStep();
  const deleteCase = useDeleteCase();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [newOpen, setNewOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [filterTipo, setFilterTipo] = useState<'todos' | HrProcessTipo>('todos');

  const [tipo, setTipo] = useState<HrProcessTipo>('admissao');
  const [employeeId, setEmployeeId] = useState('');
  const [dataRef, setDataRef] = useState('');
  const [obs, setObs] = useState('');

  const [cfgTipo, setCfgTipo] = useState<HrProcessTipo>('admissao');
  const [cfgNome, setCfgNome] = useState('');

  const employeeName = (id: string) => employees.find(e => e.id === id)?.nome ?? '—';

  const visibleCases = useMemo(
    () => (filterTipo === 'todos' ? cases : cases.filter(c => c.tipo === filterTipo)),
    [cases, filterTipo],
  );

  const cfgList = templates.filter(t => t.tipo === cfgTipo);

  const handleCreate = async () => {
    if (!employeeId) {
      toast({ title: 'Selecione um funcionário', variant: 'destructive' });
      return;
    }
    const steps = templates
      .filter(t => t.tipo === tipo)
      .map((t, i) => ({ nome: t.nome, sort_order: t.sort_order ?? i }));
    try {
      await createCase.mutateAsync({
        tipo,
        employee_id: employeeId,
        data_referencia: dataRef || null,
        observacoes: obs || null,
        steps,
      });
      toast({ title: `${TIPO_LABEL[tipo]} lançada com sucesso` });
      setNewOpen(false);
      setEmployeeId(''); setDataRef(''); setObs('');
    } catch (e: any) {
      toast({ title: 'Erro ao lançar', description: e.message, variant: 'destructive' });
    }
  };

  const handleAddTemplate = async () => {
    if (!cfgNome.trim()) return;
    await createTemplate.mutateAsync({
      tipo: cfgTipo,
      nome: cfgNome.trim(),
      sort_order: cfgList.length + 1,
    });
    setCfgNome('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <h2 className="font-heading text-xl font-semibold text-foreground">Admissões / Demissões</h2>
          <p className="text-sm text-muted-foreground">Acompanhe a conclusão de cada etapa dos processos.</p>
        </div>
        <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="admissao">Admissões</SelectItem>
            <SelectItem value="demissao">Demissões</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setConfigOpen(true)}>
          <Settings2 className="w-4 h-4 mr-2" />Configurar processos
        </Button>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />Novo lançamento
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : visibleCases.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nenhum lançamento registrado.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleCases.map(c => {
            const steps = [...(c.hr_process_case_steps ?? [])].sort((a, b) => a.sort_order - b.sort_order);
            const done = steps.filter(s => s.concluido).length;
            const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
            const isAdm = c.tipo === 'admissao';
            return (
              <Card key={c.id} className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isAdm ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                    {isAdm ? <UserPlus className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{employeeName(c.employee_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {TIPO_LABEL[c.tipo as HrProcessTipo]}
                      {c.data_referencia ? ` · ${new Date(c.data_referencia + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
                    </p>
                  </div>
                  {pct === 100 && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  <Button variant="ghost" size="icon" onClick={() => deleteCase.mutate(c.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{done} de {steps.length} etapas</span><span>{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>

                <div className="space-y-2">
                  {steps.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhuma etapa configurada para este tipo.</p>
                  )}
                  {steps.map(s => (
                    <label key={s.id} className="flex items-center gap-3 text-sm cursor-pointer">
                      <Checkbox
                        checked={s.concluido}
                        onCheckedChange={(v) => toggleStep.mutate({ id: s.id, concluido: !!v })}
                      />
                      <span className={s.concluido ? 'line-through text-muted-foreground' : 'text-foreground'}>{s.nome}</span>
                    </label>
                  ))}
                </div>

                {c.observacoes && <p className="text-xs text-muted-foreground border-t border-border pt-3">{c.observacoes}</p>}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as HrProcessTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admissao">Admissão</SelectItem>
                  <SelectItem value="demissao">Demissão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nome} — {e.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de referência</Label>
              <Input type="date" value={dataRef} onChange={(e) => setDataRef(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} />
            </div>
            <p className="text-xs text-muted-foreground">
              Serão criadas {templates.filter(t => t.tipo === tipo).length} etapas conforme a configuração de {TIPO_LABEL[tipo].toLowerCase()}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createCase.isPending}>Lançar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configurar processos</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={cfgTipo} onValueChange={(v) => setCfgTipo(v as HrProcessTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admissao">Processos de Admissão</SelectItem>
                <SelectItem value="demissao">Processos de Demissão</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              {cfgList.length === 0 && <p className="text-sm text-muted-foreground">Nenhum processo cadastrado.</p>}
              {cfgList.map(t => (
                <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <span className="flex-1 text-sm text-foreground">{t.nome}</span>
                  <Button variant="ghost" size="icon" onClick={() => deleteTemplate.mutate(t.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Novo processo"
                value={cfgNome}
                onChange={(e) => setCfgNome(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTemplate(); }}
              />
              <Button onClick={handleAddTemplate}><Plus className="w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">
              As alterações valem para novos lançamentos; lançamentos existentes mantêm suas etapas.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setConfigOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
