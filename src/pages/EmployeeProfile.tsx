import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Briefcase, FileText, History, User, Plus } from 'lucide-react';
import { funcionariosMock } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= value ? 'fill-warning text-warning' : 'text-muted'}`} />
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

const timelineIcons: Record<string, string> = {
  admissao: '🟢', promocao: '⬆️', mudanca_cargo: '🔄', advertencia: '⚠️', desligamento: '🔴', afastamento: '🟡',
};

export default function EmployeeProfile() {
  const { id } = useParams();
  const func = funcionariosMock.find(f => f.id === id);

  if (!func) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-lg text-muted-foreground">Funcionário não encontrado.</p>
      <Link to="/funcionarios"><Button variant="outline">Voltar</Button></Link>
    </div>
  );

  const mediaAvaliacao = func.avaliacoes.length > 0
    ? (func.avaliacoes.reduce((acc, a) => acc + (a.produtividade + a.comunicacao + a.trabalhoEquipe + a.proatividade + a.lideranca + a.resultados) / 6, 0) / func.avaliacoes.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/funcionarios"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button></Link>
      </div>

      <div className="kpi-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {func.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold text-foreground">{func.nome}</h2>
            <p className="text-muted-foreground">{func.cargo} · {func.departamento}</p>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={func.status} />
              <span className="text-xs text-muted-foreground">Matrícula: {func.matricula}</span>
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
            <InfoRow label="Nome Completo" value={func.nome} />
            <InfoRow label="CPF" value={func.cpf} />
            <InfoRow label="RG" value={func.rg} />
            <InfoRow label="Data de Nascimento" value={new Date(func.dataNascimento).toLocaleDateString('pt-BR')} />
            <InfoRow label="Gênero" value={func.genero} />
            <InfoRow label="Telefone" value={func.telefone} />
            <InfoRow label="E-mail Pessoal" value={func.emailPessoal} />
            <InfoRow label="Endereço" value={`${func.endereco.rua}, ${func.endereco.numero} - ${func.endereco.bairro}`} />
            <InfoRow label="Cidade/Estado" value={`${func.endereco.cidade}/${func.endereco.estado} - CEP: ${func.endereco.cep}`} />
          </div>
        </TabsContent>

        <TabsContent value="profissionais" className="mt-4">
          <div className="kpi-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <InfoRow label="Matrícula" value={func.matricula} />
            <InfoRow label="Cargo" value={func.cargo} />
            <InfoRow label="Departamento" value={func.departamento} />
            <InfoRow label="Centro de Custo" value={func.centroCusto} />
            <InfoRow label="Data de Admissão" value={new Date(func.dataAdmissao).toLocaleDateString('pt-BR')} />
            <InfoRow label="Tipo de Contrato" value={func.tipoContrato} />
            <InfoRow label="Salário" value={`R$ ${func.salario.toLocaleString('pt-BR')}`} />
            <InfoRow label="Carga Horária" value={`${func.cargaHoraria}h/semana`} />
            <InfoRow label="E-mail Corporativo" value={func.emailCorporativo} />
            <InfoRow label="Gestor Direto" value={func.gestorDireto} />
            <InfoRow label="Status" value={func.status} />
            {func.status === 'Desligado' && (
              <>
                <InfoRow label="Data de Desligamento" value={func.dataDesligamento ? new Date(func.dataDesligamento).toLocaleDateString('pt-BR') : '—'} />
                <InfoRow label="Motivo" value={func.motivoDesligamento} />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <div className="kpi-card">
            {func.documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum documento cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {func.documentos.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.nome}</p>
                        <p className="text-xs text-muted-foreground">{doc.tipo} · {doc.tamanho} · {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
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
            func.avaliacoes.map(av => (
              <div key={av.id} className="kpi-card space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-semibold text-foreground">{av.periodo}</h4>
                  <span className="text-xs text-muted-foreground">{new Date(av.data).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Produtividade', val: av.produtividade },
                    { label: 'Comunicação', val: av.comunicacao },
                    { label: 'Trabalho em Equipe', val: av.trabalhoEquipe },
                    { label: 'Proatividade', val: av.proatividade },
                    { label: 'Liderança', val: av.lideranca },
                    { label: 'Resultados', val: av.resultados },
                  ].map(c => (
                    <div key={c.label}>
                      <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                      <StarRating value={c.val} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pontos Fortes</p>
                    <p className="text-sm text-foreground">{av.pontosFortes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pontos de Melhoria</p>
                    <p className="text-sm text-foreground">{av.pontosMelhoria}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          <Button className="gap-2"><Plus className="w-4 h-4" />Nova Avaliação</Button>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <div className="kpi-card">
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
    </div>
  );
}
