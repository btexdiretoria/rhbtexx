import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Employee } from '@/hooks/useEmployees';
import { formatHorasFromFraction } from '@/lib/overtime';

const EMPRESA = 'BTEX INDUSTRIA TEXTIL';

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const hoje = () => new Date().toLocaleDateString('pt-BR');

// ─────────────────────────────────────────────
// RELATÓRIO: QUADRO ATUAL DE FUNCIONÁRIOS
// ─────────────────────────────────────────────

export function exportFuncionariosPDF(funcionarios: Employee[]) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${EMPRESA} — Quadro Atual de Funcionários`, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${hoje()}`, 14, 25);
  doc.text(`Total: ${funcionarios.length} funcionário(s)`, 14, 31);

  autoTable(doc, {
    startY: 36,
    head: [['Matrícula', 'Nome', 'Cargo', 'Departamento', 'Contrato', 'Admissão', 'Salário', 'Status']],
    body: funcionarios.map(f => [
      f.matricula,
      f.nome,
      f.cargo,
      f.departamento,
      f.tipo_contrato,
      formatDate(f.data_admissao),
      formatCurrency(f.salario),
      f.status,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    columnStyles: { 6: { halign: 'right' } },
  });

  doc.save('quadro-funcionarios.pdf');
}

export function exportFuncionariosExcel(funcionarios: Employee[]) {
  const dados = funcionarios.map(f => ({
    Matrícula: f.matricula,
    Nome: f.nome,
    CPF: f.cpf,
    'Data Nascimento': formatDate(f.data_nascimento),
    Cargo: f.cargo,
    Departamento: f.departamento,
    'Centro de Custo': f.centro_custo || '',
    'Tipo Contrato': f.tipo_contrato,
    'Data Admissão': formatDate(f.data_admissao),
    'Carga Horária': f.carga_horaria,
    Salário: f.salario,
    Status: f.status,
    'E-mail Corporativo': f.email_corporativo || '',
    'Gestor Direto': f.gestor_direto || '',
    Telefone: f.telefone || '',
  }));

  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');
  XLSX.writeFile(wb, 'quadro-funcionarios.xlsx');
}

// ─────────────────────────────────────────────
// RELATÓRIO: DESLIGAMENTOS
// ─────────────────────────────────────────────

export function exportDesligamentosPDF(funcionarios: Employee[]) {
  const desligados = funcionarios.filter(f => f.status === 'Desligado');
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${EMPRESA} — Relatório de Desligamentos`, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${hoje()}`, 14, 25);
  doc.text(`Total de desligamentos: ${desligados.length}`, 14, 31);

  autoTable(doc, {
    startY: 36,
    head: [['Nome', 'Cargo', 'Departamento', 'Admissão', 'Desligamento', 'Motivo', 'Rescisão', 'Pgto Confirmado']],
    body: desligados.map(f => [
      f.nome,
      f.cargo,
      f.departamento,
      formatDate(f.data_admissao),
      formatDate(f.data_desligamento),
      f.motivo_desligamento || '-',
      f.valor_rescisao ? formatCurrency(f.valor_rescisao) : '-',
      f.pagamento_confirmado ? 'Sim' : 'Não',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [192, 57, 43], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [253, 245, 245] },
    columnStyles: { 6: { halign: 'right' } },
  });

  doc.save('relatorio-desligamentos.pdf');
}

export function exportDesligamentosExcel(funcionarios: Employee[]) {
  const desligados = funcionarios.filter(f => f.status === 'Desligado');

  const dados = desligados.map(f => ({
    Nome: f.nome,
    CPF: f.cpf,
    Cargo: f.cargo,
    Departamento: f.departamento,
    'Data Admissão': formatDate(f.data_admissao),
    'Data Desligamento': formatDate(f.data_desligamento),
    'Motivo': f.motivo_desligamento || '-',
    'Valor Rescisão': f.valor_rescisao ?? 0,
    'Data Pgto Rescisão': formatDate(f.data_pagamento_rescisao),
    'Pgto Confirmado': f.pagamento_confirmado ? 'Sim' : 'Não',
    'Contrato Assinado': f.contrato_assinado ? 'Sim' : 'Não',
  }));

  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Desligamentos');
  XLSX.writeFile(wb, 'relatorio-desligamentos.xlsx');
}

// ─────────────────────────────────────────────
// RELATÓRIO: ANIVERSARIANTES
// ─────────────────────────────────────────────

export function exportAniversariantesPDF(funcionarios: Employee[], mes?: number) {
  const mesAlvo = mes ?? new Date().getMonth() + 1;
  const nomeMes = new Date(2000, mesAlvo - 1).toLocaleString('pt-BR', { month: 'long' });

  const aniversariantes = funcionarios
    .filter(f => f.status === 'Ativo' && f.data_nascimento)
    .filter(f => {
      const m = parseInt(f.data_nascimento!.split('-')[1]);
      return m === mesAlvo;
    })
    .sort((a, b) => {
      const dA = parseInt(a.data_nascimento!.split('-')[2]);
      const dB = parseInt(b.data_nascimento!.split('-')[2]);
      return dA - dB;
    });

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${EMPRESA} — Aniversariantes de ${nomeMes}`, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${hoje()}`, 14, 25);
  doc.text(`Total: ${aniversariantes.length} aniversariante(s)`, 14, 31);

  if (aniversariantes.length === 0) {
    doc.setFontSize(11);
    doc.text('Nenhum aniversariante neste mês.', 14, 45);
  } else {
    autoTable(doc, {
      startY: 36,
      head: [['Nome', 'Cargo', 'Departamento', 'Data Nascimento', 'Dia']],
      body: aniversariantes.map(f => {
        const parts = f.data_nascimento!.split('-');
        return [
          f.nome,
          f.cargo,
          f.departamento,
          formatDate(f.data_nascimento),
          parts[2],
        ];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [155, 89, 182], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 245, 255] },
    });
  }

  doc.save(`aniversariantes-${nomeMes}.pdf`);
}

// ─────────────────────────────────────────────
// RELATÓRIOS FINANCEIROS
// ─────────────────────────────────────────────

export type FinancialReportType = 'gross' | 'net' | 'food' | 'transport';

interface FinancialExportOptions {
  selectedReports: FinancialReportType[];
  funcionarios: Employee[];
  periodLabel: string;
  departmentFilter: string;
  employeeFilter: string;
  foodTotal?: number;
  transportTotal?: number;
}

function calcINSS(salario: number): number {
  if (salario <= 1518.00) return salario * 0.075;
  if (salario <= 2793.88) return salario * 0.09;
  if (salario <= 4190.83) return salario * 0.12;
  return salario * 0.14;
}

function calcIRRF(base: number): number {
  if (base <= 2259.20) return 0;
  if (base <= 2826.65) return base * 0.075 - 169.44;
  if (base <= 3751.05) return base * 0.15 - 381.44;
  if (base <= 4664.68) return base * 0.225 - 662.77;
  return base * 0.275 - 896.00;
}

export function exportFinanceiroPDF(opts: FinancialExportOptions) {
  const { selectedReports, funcionarios, periodLabel, departmentFilter, employeeFilter, foodTotal = 0, transportTotal = 0 } = opts;

  const ativos = funcionarios.filter(f => {
    if (f.status !== 'Ativo') return false;
    if (departmentFilter !== 'all' && f.departamento !== departmentFilter) return false;
    if (employeeFilter !== 'all' && f.id !== employeeFilter) return false;
    return true;
  });

  const doc = new jsPDF({ orientation: 'landscape' });
  let cursorY = 18;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${EMPRESA} — Relatório Financeiro`, 14, cursorY);
  cursorY += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${periodLabel}`, 14, cursorY); cursorY += 5;
  doc.text(`Gerado em: ${hoje()}`, 14, cursorY); cursorY += 5;
  if (departmentFilter !== 'all') doc.text(`Departamento: ${departmentFilter}`, 14, cursorY++);
  cursorY += 3;

  if (selectedReports.includes('gross')) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Salário Bruto', 14, cursorY); cursorY += 4;

    const total = ativos.reduce((s, f) => s + f.salario, 0);

    autoTable(doc, {
      startY: cursorY,
      head: [['Nome', 'Matrícula', 'Cargo', 'Departamento', 'Contrato', 'Salário Bruto']],
      body: [
        ...ativos.map(f => [f.nome, f.matricula, f.cargo, f.departamento, f.tipo_contrato, formatCurrency(f.salario)]),
        [{ content: 'TOTAL', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } }, { content: formatCurrency(total), styles: { fontStyle: 'bold', halign: 'right' } }],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 5: { halign: 'right' } },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  if (selectedReports.includes('net')) {
    if (cursorY > 160) { doc.addPage(); cursorY = 18; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Salário Líquido (estimativa)', 14, cursorY); cursorY += 4;

    let totalLiq = 0;
    const rows = ativos.map(f => {
      const inss = calcINSS(f.salario);
      const irrf = calcIRRF(f.salario - inss);
      const liquido = f.salario - inss - irrf;
      totalLiq += liquido;
      return [f.nome, f.matricula, formatCurrency(f.salario), formatCurrency(inss), formatCurrency(irrf), formatCurrency(liquido)];
    });

    autoTable(doc, {
      startY: cursorY,
      head: [['Nome', 'Matrícula', 'Bruto', 'INSS', 'IRRF', 'Líquido']],
      body: [
        ...rows,
        [{ content: 'TOTAL', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } }, { content: formatCurrency(totalLiq), styles: { fontStyle: 'bold', halign: 'right' } }],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  if (selectedReports.includes('food')) {
    if (cursorY > 160) { doc.addPage(); cursorY = 18; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vale Alimentação', 14, cursorY); cursorY += 4;

    autoTable(doc, {
      startY: cursorY,
      head: [['Nome', 'Departamento', 'Status']],
      body: [
        ...ativos.map(f => [f.nome, f.departamento, f.status]),
        [{ content: `Total do período: ${formatCurrency(foodTotal)}`, colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } }],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [230, 126, 34], textColor: 255, fontStyle: 'bold' },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  if (selectedReports.includes('transport')) {
    if (cursorY > 160) { doc.addPage(); cursorY = 18; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vale Transporte', 14, cursorY); cursorY += 4;

    autoTable(doc, {
      startY: cursorY,
      head: [['Nome', 'Departamento', 'Status']],
      body: [
        ...ativos.map(f => [f.nome, f.departamento, f.status]),
        [{ content: `Total do período: ${formatCurrency(transportTotal)}`, colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } }],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
    });
  }

  doc.save(`relatorio-financeiro-${periodLabel.replace('/', '-')}.pdf`);
}

export function exportFinanceiroExcel(opts: FinancialExportOptions) {
  const { selectedReports, funcionarios, periodLabel, departmentFilter, employeeFilter, foodTotal = 0, transportTotal = 0 } = opts;

  const ativos = funcionarios.filter(f => {
    if (f.status !== 'Ativo') return false;
    if (departmentFilter !== 'all' && f.departamento !== departmentFilter) return false;
    if (employeeFilter !== 'all' && f.id !== employeeFilter) return false;
    return true;
  });

  const wb = XLSX.utils.book_new();

  if (selectedReports.includes('gross')) {
    const dados: any[] = ativos.map(f => ({
      Nome: f.nome,
      Matrícula: f.matricula,
      Cargo: f.cargo,
      Departamento: f.departamento,
      'Tipo Contrato': f.tipo_contrato,
      'Salário Bruto': f.salario,
    }));
    dados.push({ Nome: 'TOTAL', Matrícula: '', Cargo: '', Departamento: '', 'Tipo Contrato': '', 'Salário Bruto': ativos.reduce((s, f) => s + f.salario, 0) });
    const ws = XLSX.utils.json_to_sheet(dados);
    XLSX.utils.book_append_sheet(wb, ws, 'Folha Bruta');
  }

  if (selectedReports.includes('net')) {
    const dados = ativos.map(f => {
      const inss = calcINSS(f.salario);
      const irrf = calcIRRF(f.salario - inss);
      const liquido = f.salario - inss - irrf;
      return { Nome: f.nome, Matrícula: f.matricula, Bruto: f.salario, INSS: parseFloat(inss.toFixed(2)), IRRF: parseFloat(irrf.toFixed(2)), Líquido: parseFloat(liquido.toFixed(2)) };
    });
    const ws = XLSX.utils.json_to_sheet(dados);
    XLSX.utils.book_append_sheet(wb, ws, 'Folha Líquida');
  }

  if (selectedReports.includes('food')) {
    const dados: any[] = ativos.map(f => ({ Nome: f.nome, Departamento: f.departamento, Status: f.status }));
    dados.push({ Nome: `TOTAL DO PERÍODO: ${formatCurrency(foodTotal)}`, Departamento: '', Status: '' });
    const ws = XLSX.utils.json_to_sheet(dados);
    XLSX.utils.book_append_sheet(wb, ws, 'Vale Alimentação');
  }

  if (selectedReports.includes('transport')) {
    const dados: any[] = ativos.map(f => ({ Nome: f.nome, Departamento: f.departamento, Status: f.status }));
    dados.push({ Nome: `TOTAL DO PERÍODO: ${formatCurrency(transportTotal)}`, Departamento: '', Status: '' });
    const ws = XLSX.utils.json_to_sheet(dados);
    XLSX.utils.book_append_sheet(wb, ws, 'Vale Transporte');
  }

  XLSX.writeFile(wb, `relatorio-financeiro-${periodLabel.replace('/', '-')}.xlsx`);
}

// ─────────────────────────────────────────────
// RELATÓRIO: HORAS EXTRAS
// ─────────────────────────────────────────────

export interface OvertimeReportRow {
  colaborador: string;
  horas: number;
  valor: number;
  chave_pix: string;
  matched: boolean;
}

export function exportHorasExtrasPDF(rows: OvertimeReportRow[], periodLabel: string) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${EMPRESA} — Relatório de Horas Extras`, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${periodLabel}`, 14, 25);
  doc.text(`Gerado em: ${hoje()}`, 14, 31);
  doc.text(`Total: ${rows.length} colaborador(es)`, 14, 37);

  const totalHoras = rows.reduce((s, r) => s + (r.horas || 0), 0);
  const totalValor = rows.reduce((s, r) => s + (r.valor || 0), 0);

  autoTable(doc, {
    startY: 42,
    head: [['Colaborador', 'Horas', 'Chave PIX', 'Valor']],
    body: [
      ...rows.map(r => [
        r.colaborador + (r.matched ? '' : ' (sem cadastro)'),
        formatHorasFromFraction(r.horas),
        r.chave_pix || '-',
        formatCurrency(r.valor),
      ]),
      [
        { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'right' } },
        { content: formatHorasFromFraction(totalHoras), styles: { fontStyle: 'bold', halign: 'right' } },
        { content: '', styles: {} },
        { content: formatCurrency(totalValor), styles: { fontStyle: 'bold', halign: 'right' } },
      ],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [142, 68, 173], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 245, 252] },
    columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
  });

  doc.save(`horas-extras-${periodLabel.replace('/', '-')}.pdf`);
}

export function exportHorasExtrasExcel(rows: OvertimeReportRow[], periodLabel: string) {
  const dados = rows.map(r => ({
    Colaborador: r.colaborador,
    Vinculado: r.matched ? 'Sim' : 'Não',
    Horas: formatHorasFromFraction(r.horas),
    'Chave PIX': r.chave_pix || '',
    Valor: r.valor,
  }));
  dados.push({
    Colaborador: 'TOTAL',
    Vinculado: '',
    Horas: formatHorasFromFraction(rows.reduce((s, r) => s + (r.horas || 0), 0)),
    'Chave PIX': '',
    Valor: rows.reduce((s, r) => s + (r.valor || 0), 0),
  });
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Horas Extras');
  XLSX.writeFile(wb, `horas-extras-${periodLabel.replace('/', '-')}.xlsx`);
}
