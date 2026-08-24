import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const hoje = () => new Date().toLocaleDateString('pt-BR');

export interface ExpenseCategoryRow {
  id: string;
  name: string;
  forecast: number;
  spent: number;
  sort_order?: number | null;
}

export function exportExpenseControlPDF(
  categories: ExpenseCategoryRow[],
  monthName: string,
  year: number,
  companyName?: string
) {
  const doc = new jsPDF({ orientation: 'landscape' });

  const totalForecast = categories.reduce((s, c) => s + (c.forecast || 0), 0);
  const totalSpent = categories.reduce((s, c) => s + (c.spent || 0), 0);
  const totalRemaining = totalForecast - totalSpent;
  const totalPct = totalForecast > 0 ? Math.round((totalSpent / totalForecast) * 100) : 0;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${companyName || 'BTEX INDUSTRIA TEXTIL'} — Controle de Despesas`, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${monthName} ${year}`, 14, 25);
  doc.text(`Data de geração: ${hoje()}`, 14, 31);
  doc.text(`Total de categorias: ${categories.length}`, 14, 37);

  autoTable(doc, {
    startY: 44,
    head: [['Categoria', 'Previsão', 'Gasto', 'Restante', '% Utilizado']],
    body: [
      ...categories.map((c) => {
        const pct = c.forecast > 0 ? Math.round((c.spent / c.forecast) * 100) : 0;
        const remaining = c.forecast - c.spent;
        return [
          c.name,
          formatCurrency(c.forecast),
          formatCurrency(c.spent),
          formatCurrency(remaining),
          `${pct}%`,
        ];
      }),
      [
        { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'left' } },
        { content: formatCurrency(totalForecast), styles: { fontStyle: 'bold', halign: 'right' } },
        { content: formatCurrency(totalSpent), styles: { fontStyle: 'bold', halign: 'right' } },
        { content: formatCurrency(totalRemaining), styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `${totalPct}%`, styles: { fontStyle: 'bold', halign: 'right' } },
      ],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  });

  doc.save(`controle-despesas-${monthName.toLowerCase()}-${year}.pdf`);
}
