import { useState, useMemo } from 'react';
import { FileSpreadsheet, FileText, Cake, DollarSign, Filter, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { funcionariosMock } from '@/data/mockData';
import {
  exportFuncionariosPDF,
  exportFuncionariosExcel,
  exportDesligamentosPDF,
  exportDesligamentosExcel,
  exportAniversariantesPDF,
  exportFinanceiroPDF,
  exportFinanceiroExcel,
  type FinancialReportType,
} from '@/utils/exportReports';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const financialReportOptions: { id: FinancialReportType; label: string; description: string }[] = [
  { id: 'gross', label: 'Salário (Bruto)', description: 'Folha de pagamento bruta do período' },
  { id: 'net', label: 'Salário (Líquido)', description: 'Folha de pagamento líquida com proventos e descontos' },
  { id: 'food', label: 'Vale Alimentação', description: 'Valores e métodos de entrega do vale alimentação' },
  { id: 'transport', label: 'Vale Transporte', description: 'Pagamentos de vale transporte do período' },
];

const departments = [...new Set(funcionariosMock.map(f => f.departamento))];

export default function Reports() {
  const [selectedReports, setSelectedReports] = useState<FinancialReportType[]>([]);
  const [periodType, setPeriodType] = useState<'single' | 'range'>('single');
  const [singleMonth, setSingleMonth] = useState(new Date().getMonth());
  const [singleYear, setSingleYear] = useState(new Date().getFullYear());
  const [fromMonth, setFromMonth] = useState(new Date().getMonth());
  const [fromYear, setFromYear] = useState(new Date().getFullYear());
  const [toMonth, setToMonth] = useState(new Date().getMonth());
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState('all');

  const toggleReport = (id: FinancialReportType) => {
    setSelectedReports(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Exportações gerais ──────────────────────
  const handleExport = (title: string, format: string) => {
    try {
      if (title === 'Quadro Atual de Funcionários') {
        const ativos = funcionariosMock.filter(f => f.status !== 'Desligado');
        if (format === 'PDF') exportFuncionariosPDF(ativos);
        else exportFuncionariosExcel(ativos);
      } else if (title === 'Relatório de Desligamentos') {
        if (format === 'PDF') exportDesligamentosPDF(funcionariosMock);
        else exportDesligamentosExcel(funcionariosMock);
      } else if (title === 'Relatório de Aniversariantes') {
        exportAniversariantesPDF(funcionariosMock, singleMonth + 1);
      }
      toast({ title: 'Exportação concluída!', description: `${title} foi baixado com sucesso.` });
    } catch (err) {
      toast({ title: 'Erro ao exportar', description: String(err), variant: 'destructive' });
    }
  };

  // ── Exportações financeiras ─────────────────
  const periodLabel = periodType === 'single'
    ? `${MONTHS[singleMonth]}/${singleYear}`
    : `${MONTHS[fromMonth]}/${fromYear} a ${MONTHS[toMonth]}/${toYear}`;

  const getVoucherTotal = (prefix: string, month: number, year: number): number => {
    try {
      const raw = localStorage.getItem(`${prefix}-${year}-${month}`);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (prefix === 'food-voucher') {
        return (parsed.entries || []).reduce((s: number, e: any) => s + (e.value || 0), 0);
      }
      return (parsed.entries || []).reduce((s: number, e: any) => s + (e.payment1Value || 0) + (e.payment2Value || 0), 0);
    } catch { return 0; }
  };

  const foodTotal = getVoucherTotal('food-voucher', singleMonth, singleYear);
  const transportTotal = getVoucherTotal('transport-voucher', singleMonth, singleYear);

  const handleFinancialExport = (format: 'PDF' | 'Excel') => {
    if (selectedReports.length === 0) {
      toast({ title: 'Selecione ao menos um relatório', description: 'Escolha pelo menos um tipo de relatório financeiro.', variant: 'destructive' });
      return;
    }
    try {
      const opts = {
        selectedReports,
        funcionarios: funcionariosMock,
        periodLabel,
        departmentFilter,
        employeeFilter,
        foodTotal,
        transportTotal,
      };
      if (format === 'PDF') exportFinanceiroPDF(opts);
      else exportFinanceiroExcel(opts);
      toast({ title: `Exportação ${format} concluída!`, description: `Relatório financeiro — ${periodLabel}` });
    } catch (err) {
      toast({ title: 'Erro ao exportar', description: String(err), variant: 'destructive' });
    }
  };

  // ── Preview ─────────────────────────────────
  const previewData = useMemo(() => {
    const filtered = funcionariosMock.filter(f => {
      if (f.status !== 'Ativo') return false;
      if (departmentFilter !== 'all' && f.departamento !== departmentFilter) return false;
      if (employeeFilter !== 'all' && f.id !== employeeFilter) return false;
      return true;
    });
    const grossTotal = filtered.reduce((s, f) => s + f.salario, 0);
    return { grossTotal, foodTotal, transportTotal, employeeCount: filtered.length };
  }, [departmentFilter, employeeFilter, foodTotal, transportTotal]);

  const reports = [
    { title: 'Quadro Atual de Funcionários', description: 'Lista completa de todos os funcionários ativos com dados pessoais e profissionais.', icon: FileSpreadsheet, formats: ['PDF', 'Excel'] },
    { title: 'Relatório de Desligamentos', description: 'Histórico de desligamentos com motivos, datas e análise comparativa por período.', icon: FileText, formats: ['PDF', 'Excel'] },
    { title: 'Relatório de Aniversariantes', description: 'Lista de funcionários com aniversário no mês selecionado.', icon: Cake, formats: ['PDF'] },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* General Reports */}
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-4">Relatórios Gerais</h2>
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

      <Separator />

      {/* Financial Reports */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Relatórios Financeiros</h2>
            <p className="text-sm text-muted-foreground">Exporte relatórios detalhados do setor financeiro</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Tipo de Relatório */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Relatório</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {financialReportOptions.map(opt => (
                  <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedReports.includes(opt.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}>
                    <Checkbox checked={selectedReports.includes(opt.id)} onCheckedChange={() => toggleReport(opt.id)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" /> Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Período</label>
                  <div className="flex gap-2">
                    <Button variant={periodType === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodType('single')}>Mês único</Button>
                    <Button variant={periodType === 'range' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodType('range')}>Intervalo</Button>
                  </div>
                </div>

                {periodType === 'single' ? (
                  <div className="flex gap-2">
                    <Select value={String(singleMonth)} onValueChange={v => setSingleMonth(Number(v))}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={String(singleYear)} onValueChange={v => setSingleYear(Number(v))}>
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">De:</span>
                      <Select value={String(fromMonth)} onValueChange={v => setFromMonth(Number(v))}>
                        <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={String(fromYear)} onValueChange={v => setFromYear(Number(v))}>
                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">Até:</span>
                      <Select value={String(toMonth)} onValueChange={v => setToMonth(Number(v))}>
                        <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={String(toYear)} onValueChange={v => setToYear(Number(v))}>
                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Departamento</label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os departamentos</SelectItem>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Funcionário</label>
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os funcionários</SelectItem>
                      {funcionariosMock.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {selectedReports.includes('food') && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Método de Entrega (Vale Alimentação)</label>
                    <Select value={deliveryMethodFilter} onValueChange={setDeliveryMethodFilter}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Alelo">Alelo</SelectItem>
                        <SelectItem value="Cesta Básica">Cesta Básica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview + Export */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" /> Prévia dos Totais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Selecione um tipo de relatório</p>
                ) : (
                  <>
                    {selectedReports.includes('gross') && (
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Folha Bruta</span>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(previewData.grossTotal)}</span>
                      </div>
                    )}
                    {selectedReports.includes('food') && (
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Vale Alimentação</span>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(previewData.foodTotal)}</span>
                      </div>
                    )}
                    {selectedReports.includes('transport') && (
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Vale Transporte</span>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(previewData.transportTotal)}</span>
                      </div>
                    )}
                    {selectedReports.includes('net') && (
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Salário Líquido</span>
                        <Badge variant="outline" className="text-xs">Ver no relatório</Badge>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Funcionários</span>
                      <span className="text-sm font-semibold text-foreground">{previewData.employeeCount}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Exportar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full gap-2" onClick={() => handleFinancialExport('PDF')} disabled={selectedReports.length === 0}>
                  <FileText className="w-4 h-4" /> Exportar PDF
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => handleFinancialExport('Excel')} disabled={selectedReports.length === 0}>
                  <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
                </Button>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Inclui: nome da empresa, período, data de geração e filtros aplicados
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
