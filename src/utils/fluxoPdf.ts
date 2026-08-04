import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateBR } from "@/lib/cashflow";

export interface FluxoPdfRow {
  date: string;
  receita: number;
  despesa: number;
  balanco: number;
  saldoFinal: number;
}

const NAVY: [number, number, number] = [30, 58, 95];
const SOFT: [number, number, number] = [219, 234, 254];
const GREY: [number, number, number] = [100, 116, 139];
const ZEBRA: [number, number, number] = [246, 249, 252];

const money = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function exportFluxoPDF(rows: FluxoPdfRow[], systemName = "Gestão Btex") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  const now = new Date();
  const exportedAt = `${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  const periodo =
    rows.length > 0
      ? `${formatDateBR(rows[0].date)} a ${formatDateBR(rows[rows.length - 1].date)}`
      : "—";

  const receitas = rows.map((r) => r.receita);
  const total = receitas.reduce((a, b) => a + b, 0);
  const media = rows.length ? total / rows.length : 0;
  const comValor = receitas.filter((v) => v > 0);
  const maior = comValor.length ? Math.max(...comValor) : 0;
  const menor = comValor.length ? Math.min(...comValor) : 0;

  const drawHeader = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Relatório de Fluxo de Receitas", margin, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Período: ${periodo}`, margin, 17);
    doc.setFontSize(9);
    doc.text(systemName, pageW - margin, 11, { align: "right" });
    doc.setFontSize(8);
    doc.text(`Emitido em ${exportedAt}`, pageW - margin, 17, { align: "right" });
  };

  // Resumo
  drawHeader();
  let y = 32;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Resumo do período", margin, y);
  y += 4;

  const cards: [string, number][] = [
    ["Total de receitas", total],
    ["Média diária", media],
    ["Maior receita", maior],
    ["Menor receita", menor],
  ];
  const cardW = (pageW - margin * 2 - 6 * 3) / 4;
  cards.forEach(([label, value], i) => {
    const x = margin + i * (cardW + 6);
    doc.setFillColor(...SOFT);
    doc.setDrawColor(200, 214, 232);
    doc.roundedRect(x, y, cardW, 16, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text(label.toUpperCase(), x + 4, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(money(value), x + 4, y + 12.5);
  });
  y += 24;

  const fontSize = rows.length > 120 ? 7 : 8;

  autoTable(doc, {
    startY: y,
    margin: { top: 28, right: margin, bottom: 16, left: margin },
    head: [["Data", "Receitas", "Despesas", "Balanço do dia", "Saldo final"]],
    body: rows.map((r) => [
      formatDateBR(r.date),
      money(r.receita),
      money(r.despesa),
      money(r.balanco),
      money(r.saldoFinal),
    ]),
    styles: {
      font: "helvetica",
      fontSize,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: fontSize + 0.5,
      halign: "right",
    },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: {
      0: { halign: "center", cellWidth: 30, fontStyle: "bold" },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right", fontStyle: "bold" },
    },
    rowPageBreak: "avoid",
    showHead: "everyPage",
    didDrawPage: () => drawHeader(),
  });

  // Rodapé com paginação
  const pages = doc.getNumberOfPages();
  const pageH = doc.internal.pageSize.getHeight();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageH - 11, pageW - margin, pageH - 11);
    doc.text(systemName, margin, pageH - 7);
    doc.text(`Página ${p} de ${pages}`, pageW - margin, pageH - 7, { align: "right" });
  }

  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  doc.save(`fluxo-receitas-${stamp}.pdf`);
}
