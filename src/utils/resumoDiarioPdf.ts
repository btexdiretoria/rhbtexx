import jsPDF from 'jspdf';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DailySummary } from '@/hooks/useDailySummary';

/* ── Paleta executiva ─────────────────────────────────────── */
const NAVY: [number, number, number] = [30, 58, 138];
const BLUE: [number, number, number] = [37, 99, 235];
const GRAY_LIGHT: [number, number, number] = [243, 244, 246];
const GRAY_LINE: [number, number, number] = [226, 232, 240];
const GRAY_DARK: [number, number, number] = [55, 65, 81];
const GRAY_SOFT: [number, number, number] = [107, 114, 128];
const GREEN: [number, number, number] = [22, 163, 74];
const RED: [number, number, number] = [185, 28, 28];
const AMBER_BG: [number, number, number] = [254, 252, 232];
const AMBER_BAR: [number, number, number] = [217, 119, 6];
const WHITE: [number, number, number] = [255, 255, 255];

const M = 14; // margem
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - M * 2;

export interface ResumoPdfMeta {
  empresa: string;
  responsavel?: string;
  departamento?: string;
  relatorio?: string;
}

const notEmpty = (v?: string) => !!v && String(v).trim() !== '';

export function dateExtenso(dateStr: string) {
  try {
    return format(parse(dateStr, 'yyyy-MM-dd', new Date()), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export async function exportResumoDiarioPDF(s: DailySummary, meta: ResumoPdfMeta) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const titulo = meta.relatorio || 'Resumo Diário';
  let y = 0;

  /* ── Cabeçalho institucional ── */
  const drawHeader = (first: boolean) => {
    if (first) {
      pdf.setFillColor(...NAVY);
      pdf.rect(0, 0, PAGE_W, 34, 'F');
      pdf.setFillColor(...BLUE);
      pdf.rect(0, 34, PAGE_W, 1.4, 'F');

      // "Logo" — monograma
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(M, 9, 16, 16, 3, 3, 'F');
      pdf.setTextColor(...NAVY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text((meta.empresa || 'R').trim().charAt(0).toUpperCase(), M + 8, 20, { align: 'center' });

      pdf.setTextColor(...WHITE);
      pdf.setFontSize(15);
      pdf.setFont('helvetica', 'bold');
      pdf.text(titulo.toUpperCase(), M + 22, 16.5);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(205, 219, 245);
      pdf.text(meta.empresa || '', M + 22, 22.5);
      pdf.text(dateExtenso(s.summary_date), M + 22, 28);

      const right: string[] = [];
      if (notEmpty(meta.responsavel)) right.push(`Responsável: ${meta.responsavel}`);
      if (notEmpty(meta.departamento)) right.push(`Departamento: ${meta.departamento}`);
      right.forEach((t, i) => pdf.text(t, PAGE_W - M, 22.5 + i * 5.5, { align: 'right' }));
      y = 44;
    } else {
      pdf.setFillColor(...NAVY);
      pdf.rect(0, 0, PAGE_W, 14, 'F');
      pdf.setTextColor(...WHITE);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(titulo.toUpperCase(), M, 9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(dateExtenso(s.summary_date), PAGE_W - M, 9, { align: 'right' });
      y = 24;
    }
  };

  const newPage = () => {
    pdf.addPage();
    drawHeader(false);
  };

  const ensure = (h: number) => {
    if (y + h > PAGE_H - 20) newPage();
  };

  drawHeader(true);

  /* ── Indicadores (KPI cards) ── */
  const kpis = [
    { label: 'Dias Úteis Restantes', value: s.dias_uteis_restante },
    { label: 'Faturamento Necessário', value: s.faturamento_necessario },
    { label: 'Receitas do Dia', value: s.receitas_dia, color: GREEN },
    { label: 'Despesas do Dia', value: s.despesas_dia, color: RED },
  ].filter((k) => notEmpty(k.value));

  if (kpis.length) {
    const gap = 4;
    const w = (CONTENT_W - gap * (kpis.length - 1)) / kpis.length;
    ensure(24);
    kpis.forEach((k, i) => {
      const x = M + i * (w + gap);
      pdf.setFillColor(...GRAY_LIGHT);
      pdf.setDrawColor(...GRAY_LINE);
      pdf.roundedRect(x, y, w, 20, 2.2, 2.2, 'FD');
      pdf.setFillColor(...(k.color || BLUE));
      pdf.rect(x, y + 3, 1.2, 14, 'F');
      pdf.setTextColor(...GRAY_SOFT);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      pdf.text(pdf.splitTextToSize(k.label.toUpperCase(), w - 8)[0], x + 4.5, y + 7.5);
      pdf.setTextColor(...(k.color || GRAY_DARK));
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(pdf.splitTextToSize(String(k.value), w - 8)[0], x + 4.5, y + 15);
    });
    y += 26;
  }

  /* ── Título de seção ── */
  const section = (title: string) => {
    ensure(16);
    pdf.setTextColor(...NAVY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.text(title.toUpperCase(), M, y);
    pdf.setDrawColor(...BLUE);
    pdf.setLineWidth(0.6);
    pdf.line(M, y + 2.2, M + 18, y + 2.2);
    pdf.setDrawColor(...GRAY_LINE);
    pdf.setLineWidth(0.3);
    pdf.line(M + 18, y + 2.2, PAGE_W - M, y + 2.2);
    y += 8;
  };

  /* ── Tabela zebrada ── */
  const table = (headers: string[], rows: string[][], widths: number[], aligns: ('left' | 'right')[] = []) => {
    const rowH = 7.5;
    ensure(rowH * 2);
    pdf.setFillColor(...NAVY);
    pdf.rect(M, y, CONTENT_W, rowH, 'F');
    pdf.setTextColor(...WHITE);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    let x = M;
    headers.forEach((h, i) => {
      const a = aligns[i] || 'left';
      pdf.text(h, a === 'right' ? x + widths[i] - 3 : x + 3, y + 5, { align: a });
      x += widths[i];
    });
    y += rowH;

    rows.forEach((r, ri) => {
      if (y + rowH > PAGE_H - 20) {
        newPage();
        pdf.setFillColor(...NAVY);
        pdf.rect(M, y, CONTENT_W, rowH, 'F');
        pdf.setTextColor(...WHITE);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        let hx = M;
        headers.forEach((h, i) => {
          const a = aligns[i] || 'left';
          pdf.text(h, a === 'right' ? hx + widths[i] - 3 : hx + 3, y + 5, { align: a });
          hx += widths[i];
        });
        y += rowH;
      }
      if (ri % 2 === 1) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(M, y, CONTENT_W, rowH, 'F');
      }
      pdf.setTextColor(...GRAY_DARK);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      let cx = M;
      r.forEach((c, i) => {
        const a = aligns[i] || 'left';
        const txt = pdf.splitTextToSize(String(c ?? ''), widths[i] - 6)[0] || '';
        pdf.text(txt, a === 'right' ? cx + widths[i] - 3 : cx + 3, y + 5, { align: a });
        cx += widths[i];
      });
      pdf.setDrawColor(...GRAY_LINE);
      pdf.setLineWidth(0.2);
      pdf.line(M, y + rowH, PAGE_W - M, y + rowH);
      y += rowH;
    });
    y += 6;
  };

  /* ── Lista com bullets ── */
  const bullets = (items: string[]) => {
    items.forEach((t) => {
      const lines = pdf.splitTextToSize(t, CONTENT_W - 10) as string[];
      ensure(lines.length * 5 + 3);
      pdf.setFillColor(...BLUE);
      pdf.circle(M + 2, y + 1.8, 0.9, 'F');
      pdf.setTextColor(...GRAY_DARK);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.text(lines, M + 6, y + 3);
      y += lines.length * 5 + 2;
    });
    y += 4;
  };

  /* ── Pares rótulo/valor ── */
  const pairs = (items: { label: string; value: string }[]) => {
    items.forEach((it) => {
      ensure(9);
      pdf.setFillColor(...GRAY_LIGHT);
      pdf.roundedRect(M, y, CONTENT_W, 8, 1.6, 1.6, 'F');
      pdf.setTextColor(...GRAY_SOFT);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.8);
      pdf.text(it.label, M + 4, y + 5.4);
      pdf.setTextColor(...NAVY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text(String(it.value), PAGE_W - M - 4, y + 5.4, { align: 'right' });
      y += 10;
    });
    y += 2;
  };

  /* ── Conteúdo — seções vazias são omitidas ── */
  const despesas = s.despesas.filter((d) => notEmpty(d.descricao) || notEmpty(d.gasto) || notEmpty(d.orcado));
  if (despesas.length) {
    section('Controle de Despesas');
    table(
      ['Descrição', 'Gasto', 'Orçado'],
      despesas.map((d) => [d.descricao, d.gasto, d.orcado]),
      [CONTENT_W - 70, 35, 35],
      ['left', 'right', 'right'],
    );
  }

  const resultados = [
    { label: 'Resultado esperado no início do mês', value: s.resultado_inicio },
    { label: 'Resultado esperado ontem', value: s.resultado_ontem },
    { label: 'Resultado esperado hoje', value: s.resultado_hoje },
  ].filter((r) => notEmpty(r.value));
  const alteracoes = s.alteracoes.map((a) => a.texto).filter(notEmpty);
  if (resultados.length || alteracoes.length) {
    section('Resultado Esperado');
    if (resultados.length) pairs(resultados);
    if (alteracoes.length) {
      pdf.setTextColor(...GRAY_SOFT);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      ensure(8);
      pdf.text('ALTERAÇÕES', M, y);
      y += 5;
      bullets(alteracoes);
    }
  }

  const avisos = s.avisos.map((a) => a.texto).filter(notEmpty);
  if (avisos.length) {
    section('Avisos e Pendências');
    bullets(avisos);
  }

  if (notEmpty(s.anotacoes)) {
    section('Observações');
    const lines = pdf.splitTextToSize(s.anotacoes, CONTENT_W - 14) as string[];
    const h = lines.length * 5 + 8;
    ensure(h);
    pdf.setFillColor(...AMBER_BG);
    pdf.roundedRect(M, y, CONTENT_W, h, 2, 2, 'F');
    pdf.setFillColor(...AMBER_BAR);
    pdf.rect(M, y, 1.5, h, 'F');
    pdf.setTextColor(...GRAY_DARK);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.text(lines, M + 6, y + 6);
    y += h + 8;
  }

  const assinaturas = s.assinaturas.map((a) => a.nome).filter(notEmpty);
  if (assinaturas.length) {
    ensure(30);
    section('Assinaturas');
    const per = Math.min(3, assinaturas.length);
    const gap = 8;
    const w = (CONTENT_W - gap * (per - 1)) / per;
    let row = 0;
    assinaturas.forEach((nome, i) => {
      const col = i % per;
      if (col === 0 && i > 0) row++;
      if (col === 0) ensure(22);
      const x = M + col * (w + gap);
      const yy = y + row * 20;
      pdf.setDrawColor(...GRAY_DARK);
      pdf.setLineWidth(0.4);
      pdf.line(x, yy + 10, x + w, yy + 10);
      pdf.setTextColor(...GRAY_DARK);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(nome, x + w / 2, yy + 15, { align: 'center' });
    });
    y += (row + 1) * 20;
  }

  /* ── Rodapé em todas as páginas ── */
  const total = pdf.getNumberOfPages();
  const now = new Date();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(...GRAY_LINE);
    pdf.setLineWidth(0.3);
    pdf.line(M, PAGE_H - 14, PAGE_W - M, PAGE_H - 14);
    pdf.setTextColor(...GRAY_SOFT);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text(`${meta.empresa} · ${titulo}`, M, PAGE_H - 9);
    pdf.text(
      `Gerado em ${format(now, "d 'de' MMMM 'de' yyyy", { locale: ptBR })} às ${format(now, 'HH:mm')}`,
      PAGE_W / 2,
      PAGE_H - 9,
      { align: 'center' },
    );
    pdf.text(`Página ${p} de ${total}`, PAGE_W - M, PAGE_H - 9, { align: 'right' });
  }

  pdf.save(`resumo-diario-${s.summary_date}.pdf`);
}
