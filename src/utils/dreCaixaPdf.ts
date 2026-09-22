import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CompareModel } from "@/lib/dreCompare";
import { UNMAPPED_GROUP } from "@/lib/dreCompare";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function exportDreCaixaPDF(
  model: CompareModel,
  companyName: string,
  hideCategories = false
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 62, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("DRE x Caixa", 32, 27);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(companyName || "", 32, 45);
  const periodo = model.months.length ? model.months.join("  •  ") : "Sem período";
  doc.text(`Período: ${periodo}`, pageW - 32, 27, { align: "right" });
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    pageW - 32,
    45,
    { align: "right" }
  );

  // ── Head rows (month groups over DRE | Caixa | Diferença)
  const head: any[] = [
    [
      { content: "Categoria", rowSpan: 2, styles: { halign: "left", valign: "middle" } },
      ...model.months.map((m) => ({ content: m, colSpan: 3, styles: { halign: "center" } })),
    ],
    model.months.flatMap(() => [
      { content: "DRE", styles: { halign: "right" } },
      { content: "Caixa", styles: { halign: "right" } },
      { content: "Diferença", styles: { halign: "right" } },
    ]),
  ];

  const colCount = 1 + model.months.length * 3;
  const body: any[] = [];

  model.groups.forEach((g) => {
    if (!g.rows.length) return;
    body.push([
      {
        content: g.group,
        colSpan: colCount,
        styles: {
          fillColor: g.group === UNMAPPED_GROUP ? [254, 226, 226] : [226, 232, 240],
          textColor: g.group === UNMAPPED_GROUP ? [153, 27, 27] : [15, 23, 42],
          fontStyle: "bold",
        },
      },
    ]);
    if (hideCategories) return;
    g.rows.forEach((r) => {
      body.push([
        r.categoria,
        ...model.months.flatMap((m) => {
          const c = r.cells[m];
          return [fmt(c.dre), fmt(c.caixa), fmt(c.diff)];
        }),
      ]);
    });
    body.push([
      { content: `Total ${g.group}`, styles: { fontStyle: "bold" } },
      ...model.months.flatMap((m) => {
        const c = g.totals[m];
        return [
          { content: fmt(c.dre), styles: { fontStyle: "bold" } },
          { content: fmt(c.caixa), styles: { fontStyle: "bold" } },
          { content: fmt(c.diff), styles: { fontStyle: "bold" } },
        ];
      }),
    ]);
  });

  body.push([
    { content: "TOTAL GERAL", styles: { fontStyle: "bold", fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
    ...model.months.flatMap((m) => {
      const c = model.totals[m];
      return [fmt(c.dre), fmt(c.caixa), fmt(c.diff)].map((v) => ({
        content: v,
        styles: { fontStyle: "bold", fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      }));
    }),
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 78,
    margin: { left: 24, right: 24, top: 78, bottom: 34 },
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 3, overflow: "linebreak", halign: "right", lineColor: [226, 232, 240] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { halign: "left", cellWidth: 150 } },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index === 0) return;
      const raw = String(data.cell.raw && typeof data.cell.raw === "object" ? (data.cell.raw as any).content : data.cell.raw);
      if (raw.trim().startsWith("-")) {
        const isDark = (data.cell.styles.fillColor as any)?.[0] === 15;
        if (!isDark) data.cell.styles.textColor = [185, 28, 28];
      }
    },
    didDrawPage: () => {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Página ${doc.getCurrentPageInfo().pageNumber}`,
        pageW - 24,
        pageH - 14,
        { align: "right" }
      );
    },
  });

  doc.save(`dre-x-caixa-${new Date().toISOString().slice(0, 10)}.pdf`);
}
