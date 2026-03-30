import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

const steps = ['Dados Pessoais', 'Dados Profissionais', 'Documentos', 'Revisão'];

export default function NewEmployee() {
  const navigate = useNavigate();
  const { logAction } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    nome: '', cpf: '', rg: '', dataNascimento: '', genero: '', telefone: '', emailPessoal: '',
    chavePix: '', tipoChavePix: '',
    rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '',
    cargo: '', departamento: '', tipoContrato: '', salario: '', cargaHoraria: '', emailCorporativo: '', gestorDireto: '', dataAdmissao: '', dataFimExperiencia: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (currentStep === 0) return form.nome && form.cpf && form.dataNascimento;
    if (currentStep === 1) return form.cargo && form.departamento && form.dataAdmissao;
    return true;
  };

  const handleSubmit = () => {
    logAction('Cadastro', form.nome, `Cadastrou novo funcionário ${form.nome} como ${form.cargo || 'sem cargo definido'}`);
    toast({ title: 'Funcionário cadastrado com sucesso!', description: `${form.nome} foi adicionado ao sistema.` });
    navigate('/funcionarios');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Progress */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < currentStep ? 'bg-success text-success-foreground' : i === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs font-medium text-foreground hidden sm:inline">{step}</span>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:inline" />}
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      {/* Step Content */}
      <div className="kpi-card">
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg text-foreground">Dados Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Nome Completo *</Label><Input value={form.nome} onChange={e => update('nome', e.target.value)} placeholder="Nome completo" /></div>
              <div><Label>CPF *</Label><Input value={form.cpf} onChange={e => update('cpf', e.target.value)} placeholder="000.000.000-00" /></div>
              <div><Label>RG</Label><Input value={form.rg} onChange={e => update('rg', e.target.value)} placeholder="00.000.000-0" /></div>
              <div><Label>Data de Nascimento *</Label><Input type="date" value={form.dataNascimento} onChange={e => update('dataNascimento', e.target.value)} /></div>
              <div>
                <Label>Gênero</Label>
                <Select value={form.genero} onValueChange={v => update('genero', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => update('telefone', e.target.value)} placeholder="(00) 00000-0000" /></div>
              <div><Label>Chave PIX</Label><Input value={form.chavePix} onChange={e => update('chavePix', e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" /></div>
              <div>
                <Label>Tipo de Chave PIX</Label>
                <Select value={form.tipoChavePix} onValueChange={v => update('tipoChavePix', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Chave Aleatória'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>E-mail Pessoal</Label><Input type="email" value={form.emailPessoal} onChange={e => update('emailPessoal', e.target.value)} /></div>
            </div>
            <h4 className="font-heading font-medium text-foreground pt-2">Endereço</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Rua</Label><Input value={form.rua} onChange={e => update('rua', e.target.value)} /></div>
              <div><Label>Número</Label><Input value={form.numero} onChange={e => update('numero', e.target.value)} /></div>
              <div><Label>Bairro</Label><Input value={form.bairro} onChange={e => update('bairro', e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => update('cidade', e.target.value)} /></div>
              <div><Label>Estado</Label><Input value={form.estado} onChange={e => update('estado', e.target.value)} /></div>
              <div><Label>CEP</Label><Input value={form.cep} onChange={e => update('cep', e.target.value)} /></div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg text-foreground">Dados Profissionais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Cargo *</Label><Input value={form.cargo} onChange={e => update('cargo', e.target.value)} /></div>
              <div>
                <Label>Departamento *</Label>
                <Select value={form.departamento} onValueChange={v => update('departamento', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['Tecnologia', 'Recursos Humanos', 'Financeiro', 'Comercial', 'Marketing', 'Operações'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Data de Admissão *</Label><Input type="date" value={form.dataAdmissao} onChange={e => update('dataAdmissao', e.target.value)} /></div>
              <div>
                <Label>Tipo de Contrato</Label>
                <Select value={form.tipoContrato} onValueChange={v => update('tipoContrato', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['CLT', 'PJ', 'Estágio', 'Temporário'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Salário</Label><Input type="number" value={form.salario} onChange={e => update('salario', e.target.value)} placeholder="0.00" /></div>
              <div><Label>Carga Horária (h/semana)</Label><Input type="number" value={form.cargaHoraria} onChange={e => update('cargaHoraria', e.target.value)} /></div>
              <div><Label>E-mail Corporativo</Label><Input type="email" value={form.emailCorporativo} onChange={e => update('emailCorporativo', e.target.value)} /></div>
              <div><Label>Gestor Direto</Label><Input value={form.gestorDireto} onChange={e => update('gestorDireto', e.target.value)} /></div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg text-foreground">Documentos</h3>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground text-sm">Arraste arquivos aqui ou clique para fazer upload</p>
              <p className="text-xs text-muted-foreground mt-1">Contrato, CTPS, Exame Admissional, etc.</p>
              <Button variant="outline" className="mt-4">Selecionar Arquivos</Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg text-foreground">Revisão</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium text-foreground ml-1">{form.nome || '—'}</span></div>
              <div><span className="text-muted-foreground">CPF:</span> <span className="font-medium text-foreground ml-1">{form.cpf || '—'}</span></div>
              <div><span className="text-muted-foreground">Cargo:</span> <span className="font-medium text-foreground ml-1">{form.cargo || '—'}</span></div>
              <div><span className="text-muted-foreground">Departamento:</span> <span className="font-medium text-foreground ml-1">{form.departamento || '—'}</span></div>
              <div><span className="text-muted-foreground">Data de Admissão:</span> <span className="font-medium text-foreground ml-1">{form.dataAdmissao || '—'}</span></div>
              <div><span className="text-muted-foreground">Tipo de Contrato:</span> <span className="font-medium text-foreground ml-1">{form.tipoContrato || '—'}</span></div>
              <div><span className="text-muted-foreground">Salário:</span> <span className="font-medium text-foreground ml-1">{form.salario ? `R$ ${form.salario}` : '—'}</span></div>
              <div><span className="text-muted-foreground">Gestor:</span> <span className="font-medium text-foreground ml-1">{form.gestorDireto || '—'}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" />Anterior
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep(s => s + 1)} disabled={!canProceed()}>
            Próximo<ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit}>Salvar Funcionário</Button>
        )}
      </div>
    </div>
  );
}
