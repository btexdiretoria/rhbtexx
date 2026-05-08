import { useState, useMemo } from 'react';
import { FileSpreadsheet, FileText, Cake, DollarSign, Filter, Download, Eye, Clock, Users, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useEmployees } from '@/hooks/useEmployees';
import { useFoodVoucherEntries, useTransportVoucherEntries, useNetSalaryColumns, useNetSalaryValues } from '@/hooks/useFinancial';
import {
  exportFuncionariosPDF,
  exportFuncionariosExcel,
  exportDesligamentosPDF,
  exportDesligamentosExcel,
  exportAniversariantesPDF,
  exportFinanceiroPDF,
  exportFinanceiroExcel,
  exportHorasExtrasPDF,
  exportHorasExtrasExcel,
  exportChavesPixPDF,
  exportChavesPixExcel,
  type FinancialReportType,
  type OvertimeReportRow,
  type NetSalaryRow,
} from '@/utils/exportReports';
import { supabase } from '@/integrations/supabase/client';

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

type EmployeeReportType = 'quadro' | 'desligamentos' | 'aniversariantes' | 'horas_extras';

const employeeReportOptions: { id: EmployeeReportType; label: string; description: string; icon: typeof FileSpreadsheet; formats: ('PDF' | 'Excel')[] }[] = [
  { id: 'quadro', label: 'Quadro Atual de Funcionários', description: 'Lista completa de funcionários ativos com dados pessoais e profissionais.', icon: FileSpreadsheet, formats: ['PDF', 'Excel'] },
  { id: 'desligamentos', label: 'Relatório de Desligamentos', description: 'Histórico de desligamentos com motivos, datas e análise por período.', icon: FileText, formats: ['PDF', 'Excel'] },
  { id: 'aniversariantes', label: 'Relatório de Aniversariantes', description: 'Funcionários com aniversário no mês selecionado.', icon: Cake, formats: ['PDF'] },
  { id: 'horas_extras', label: 'Relatório de Horas Extras', description: 'Horas extras importadas no período, com Chave PIX antes do valor.', icon: Clock, formats: ['PDF', 'Excel'] },
];

export default function Reports() {
  const [selectedEmployeeReport, setSelectedEmployeeReport] = useState<EmployeeReportType>('quadro');
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

  // Real data from Supabase
  const { data: employees = [] } = useEmployees();
  const { data: foodEntries = [] } = useFoodVoucherEntries(singleYear, singleMonth);
  const { data: transportEntries = [] } = useTransportVoucherEntries(singleYear, singleMonth);
  const { data: netColumns = [] } = useNetSalaryColumns(singleYear, singleMonth);
  const { data: netValues = [] } = useNetSalaryValues(singleYear, singleMonth);

  const departments = useMemo(() => [...new Set(employees.map(f => f.departamento))], [employees]);

  const toggleReport = (id: FinancialReportType) => {
    setSelectedReports(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExport = async (title: string, format: string) => {
    try {
      if (title === 'Quadro Atual de Funcionários') {
        const ativos = employees.filter(f => f.status !== 'Desligado');
        if (format === 'PDF') exportFuncionariosPDF(ativos);
        else exportFuncionariosExcel(ativos);
      } else if (title === 'Relatório de Desligamentos') {
        if (format === 'PDF') exportDesligamentosPDF(employees);
        else exportDesligamentosExcel(employees);
      } else if (title === 'Relatório de Aniversariantes') {
        exportAniversariantesPDF(employees, singleMonth + 1);
      } else if (title === 'Relatório de Horas Extras') {
        const { data, error } = await supabase
          .from('overtime_entries')
          .select('colaborador, horas, valor, matched, employee_id')
          .eq('year', singleYear)
          .eq('month', singleMonth)
          .order('colaborador');
        if (error) throw error;
        if (!data || data.length === 0) {
          toast({ title: 'Sem dados', description: `Não há horas extras para ${MONTHS[singleMonth]}/${singleYear}.`, variant: 'destructive' });
          return;
        }
        const empById = new Map(employees.map(e => [e.id, e]));
        const rows: OvertimeReportRow[] = data.map(d => ({
          colaborador: d.colaborador,
          horas: Number(d.horas) || 0,
          valor: Number(d.valor) || 0,
          chave_pix: (d.employee_id ? empById.get(d.employee_id)?.chave_pix : '') || '',
          matched: !!d.matched,
        }));
        const periodLabel = `${MONTHS[singleMonth]}/${singleYear}`;
        if (format === 'PDF') exportHorasExtrasPDF(rows, periodLabel);
        else exportHorasExtrasExcel(rows, periodLabel);
      }
      toast({ title: 'Exportação concluída!', description: `${title} foi baixado com sucesso.` });
    } catch (err) {
      toast({ title: 'Erro ao exportar', description: String(err), variant: 'destructive' });
    }
  };

  const periodLabel = periodType === 'single'
    ? `${MONTHS[singleMonth]}/${singleYear}`
    : `${MONTHS[fromMonth]}/${fromYear} a ${MONTHS[toMonth]}/${toYear}`;

  const foodTotal = useMemo(() => foodEntries.reduce((s, e) => s + (e.value || 0), 0), [foodEntries]);
  const transportTotal = useMemo(() => transportEntries.reduce((s, e) => s + (e.payment1_value || 0) + (e.payment2_value || 0), 0), [transportEntries]);

  const netRows = useMemo<NetSalaryRow[]>(() => {
    const earningIds = new Set(netColumns.filter(c => c.type === 'earning').map(c => c.column_id));
    const deductionIds = new Set(netColumns.filter(c => c.type === 'deduction').map(c => c.column_id));
    const byEmp: Record<string, { p: number; d: number }> = {};
    netValues.forEach(v => {
      if (!byEmp[v.employee_id]) byEmp[v.employee_id] = { p: 0, d: 0 };
      const val = Number(v.value) || 0;
      if (earningIds.has(v.column_id)) byEmp[v.employee_id].p += val;
      else if (deductionIds.has(v.column_id)) byEmp[v.employee_id].d += val;
    });
    const filtered = employees.filter(f => {
      if (departmentFilter !== 'all' && f.departamento !== departmentFilter) return false;
      if (employeeFilter !== 'all' && f.id !== employeeFilter) return false;
      const t = byEmp[f.id];
      return t && (t.p > 0 || t.d > 0);
    });
    return filtered.map(f => {
      const t = byEmp[f.id];
      return { nome: f.nome, matricula: f.matricula, proventos: t.p, descontos: t.d, liquido: t.p - t.d };
    });
  }, [employees, netColumns, netValues, departmentFilter, employeeFilter]);

  const netTotal = useMemo(() => netRows.reduce((s, r) => s + r.liquido, 0), [netRows]);

  const handleFinancialExport = (format: 'PDF' | 'Excel') => {
    if (selectedReports.length === 0) {
      toast({ title: 'Selecione ao menos um relatório', description: 'Escolha pelo menos um tipo de relatório financeiro.', variant: 'destructive' });
      return;
    }
    try {
      const opts = {
        selectedReports,
        funcionarios: employees,
        periodLabel,
        departmentFilter,
        employeeFilter,
        foodTotal,
        transportTotal,
        foodEntries,
        netRows,
      };
      if (format === 'PDF') exportFinanceiroPDF(opts);
      else exportFinanceiroExcel(opts);
      toast({ title: `Exportação ${format} concluída!`, description: `Relatório financeiro — ${periodLabel}` });
    } catch (err) {
      toast({ title: 'Erro ao exportar', description: String(err), variant: 'destructive' });
    }
  };

  const previewData = useMemo(() => {
    const filtered = employees.filter(f => {
      if (f.status !== 'Ativo') return false;
      if (departmentFilter !== 'all' && f.departamento !== departmentFilter) return false;
      if (employeeFilter !== 'all' && f.id !== employeeFilter) return false;
      return true;
    });
    const grossTotal = filtered.reduce((s, f) => s + f.salario, 0);
    return { grossTotal, foodTotal, transportTotal, employeeCount: filtered.length };
  }, [employees, departmentFilter, employeeFilter, foodTotal, transportTotal]);


  const currentEmployeeReport = employeeReportOptions.find(o => o.id === selectedEmployeeReport)!;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Employee Reports */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Relatórios de Funcionários</h2>
            <p className="text-sm text-muted-foreground">Exporte relatórios relacionados ao quadro de funcionários</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Relatório</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {employeeReportOptions.map(opt => {
                  const checked = selectedEmployeeReport === opt.id;
                  return (
                    <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}>
                      <input
                        type="radio"
                        name="employee-report"
                        className="accent-primary w-4 h-4"
                        checked={checked}
                        onChange={() => setSelectedEmployeeReport(opt.id)}
                      />
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <opt.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Exportar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(selectedEmployeeReport === 'aniversariantes' || selectedEmployeeReport === 'horas_extras') && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Mês de referência</label>
                    <div className="flex gap-2">
                      <Select value={String(singleMonth)} onValueChange={v => setSingleMonth(Number(v))}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={String(singleYear)} onValueChange={v => setSingleYear(Number(v))}>
                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                {currentEmployeeReport.formats.includes('PDF') && (
                  <Button className="w-full gap-2" onClick={() => handleExport(currentEmployeeReport.label, 'PDF')}>
                    <FileText className="w-4 h-4" /> Exportar PDF
                  </Button>
                )}
                {currentEmployeeReport.formats.includes('Excel') && (
                  <Button variant="outline" className="w-full gap-2" onClick={() => handleExport(currentEmployeeReport.label, 'Excel')}>
                    <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
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
                      {employees.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
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

        {/* Chaves PIX Report */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Chaves PIX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <p className="text-sm text-muted-foreground">
                Lista de funcionários (Ativos, Prestadores de Serviço, Afastados, Teste e Aviso Prévio) com nome, status e chave PIX cadastrada.
              </p>
              <div className="flex gap-2">
                <Button className="gap-2" onClick={() => { try { exportChavesPixPDF(employees); toast({ title: 'Exportação concluída!', description: 'Chaves PIX (PDF) baixado.' }); } catch (e) { toast({ title: 'Erro ao exportar', description: String(e), variant: 'destructive' }); } }}>
                  <FileText className="w-4 h-4" /> PDF
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => { try { exportChavesPixExcel(employees); toast({ title: 'Exportação concluída!', description: 'Chaves PIX (Excel) baixado.' }); } catch (e) { toast({ title: 'Erro ao exportar', description: String(e), variant: 'destructive' }); } }}>
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
