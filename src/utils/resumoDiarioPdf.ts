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
  relatorio?: string;
}

const parseMoney = (v?: string) => {
  if (!v) return 0;
  const clean = String(v).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
};

const money = (v?: string | number) => {
  const n = typeof v === 'number' ? v : parseMoney(v);
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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
      pdf.rect(0, 0, PAGE_W, 18, 'F');
      pdf.setFillColor(...BLUE);
      pdf.rect(0, 18, PAGE_W, 0.9, 'F');

      // "Logo" — monograma
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(M, 4, 9, 9, 1.8, 1.8, 'F');
      pdf.setTextColor(...NAVY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text((meta.empresa || 'R').trim().charAt(0).toUpperCase(), M + 4.5, 10.3, { align: 'center' });

      pdf.setTextColor(...WHITE);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(titulo.toUpperCase(), M + 13, 8);
      pdf.setFontSize(7.2);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(205, 219, 245);
      pdf.text(`${meta.empresa || ''}  ·  ${dateExtenso(s.summary_date)}`, M + 13, 12.5);

      if (notEmpty(meta.responsavel)) {
        pdf.text(`Responsável: ${meta.responsavel}`, PAGE_W - M, 12.5, { align: 'right' });
      }
      y = 26;
    } else {
      pdf.setFillColor(...NAVY);
      pdf.rect(0, 0, PAGE_W, 10, 'F');
      pdf.setTextColor(...WHITE);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.text(titulo.toUpperCase(), M, 6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(dateExtenso(s.summary_date), PAGE_W - M, 6.5, { align: 'right' });
      y = 18;
    }
  };


  const newPage = () => {
    pdf.addPage();
    drawHeader(false);
  };

  const ensure = (h: number) => {
    if (y + h > PAGE_H - 20) newPage();
  };

  /* Evita cortar um bloco/departamento entre páginas:
     se o bloco inteiro não couber, deixa o restante da página em branco. */
  const AVAILABLE_H = PAGE_H - 20 - 18;
  const ensureBlock = (h: number) => {
    if (h <= AVAILABLE_H && y + h > PAGE_H - 20) newPage();
  };
  const SECTION_H = 14;
  const tableH = (rows: number) => 7.5 * (rows + 1) + 6;

  drawHeader(true);

  /* ── Indicadores (KPI cards) ── */
  const kpis = [
    { label: 'Dias Úteis Restantes', value: s.dias_uteis_restante },
    { label: 'Faturamento Atual', value: notEmpty(s.faturamento_necessario) ? money(s.faturamento_necessario) : '' },
    { label: 'Objetivo de Faturamento', value: notEmpty(s.objetivo_faturamento) ? money(s.objetivo_faturamento) : '' },
    { label: 'Receitas do Dia', value: notEmpty(s.receitas_dia) ? money(s.receitas_dia) : '', color: GREEN },
    { label: 'Despesas do Dia', value: notEmpty(s.despesas_dia) ? money(s.despesas_dia) : '', color: RED },
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
      pdf.setFontSize(kpis.length >= 5 ? 9.5 : 12);
      pdf.text(pdf.splitTextToSize(String(k.value), w - 8)[0], x + 4.5, y + 15);
    });
    y += 26;
  }

  /* ── Saldos do dia ── */
  const saldos = [
    { label: 'Saldo inicial do dia', value: s.saldo_inicial_dia },
    { label: 'Saldo final do dia', value: s.saldo_final_dia },
  ].filter((b) => notEmpty(b.value));
  if (saldos.length) {
    ensureBlock(22);
    const gap = 5;
    const bw = (CONTENT_W - gap * (saldos.length - 1)) / saldos.length;
    saldos.forEach((b, i) => {
      const x = M + i * (bw + gap);
      pdf.setFillColor(239, 246, 255);
      pdf.setDrawColor(191, 219, 254);
      pdf.roundedRect(x, y, bw, 17, 2, 2, 'FD');
      pdf.setFillColor(...BLUE);
      pdf.rect(x, y + 2.5, 1.2, 12, 'F');
      pdf.setTextColor(...GRAY_SOFT);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      pdf.text(b.label.toUpperCase(), x + 4.5, y + 6.5);
      pdf.setTextColor(...BLUE);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(money(b.value), x + 4.5, y + 13.5);
    });
    y += 22;
  }

  /* ── Título de seção (faixa destacada) ── */
  const section = (title: string) => {
    ensure(18);
    const h = 9;
    pdf.setFillColor(232, 240, 254);
    pdf.roundedRect(M, y, CONTENT_W, h, 1.6, 1.6, 'F');
    pdf.setFillColor(...NAVY);
    pdf.rect(M, y, 2.6, h, 'F');
    pdf.setTextColor(...NAVY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.8);
    pdf.text(title.toUpperCase(), M + 6, y + 6.2);
    pdf.setDrawColor(...BLUE);
    pdf.setLineWidth(0.5);
    pdf.line(M, y + h, PAGE_W - M, y + h);
    y += h + 5;
  };

  /* ── Tabela zebrada ── */
  const HEAD_BG: [number, number, number] = [226, 236, 252];
  const table = (headers: string[], rows: string[][], widths: number[], aligns: ('left' | 'right')[] = []) => {
    const rowH = 7.5;
    const drawHead = () => {
      pdf.setFillColor(...HEAD_BG);
      pdf.rect(M, y, CONTENT_W, rowH, 'F');
      pdf.setDrawColor(...GRAY_LINE);
      pdf.setLineWidth(0.2);
      pdf.line(M, y + rowH, PAGE_W - M, y + rowH);
      pdf.setTextColor(...NAVY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      let hx = M;
      headers.forEach((h, i) => {
        const a = aligns[i] || 'left';
        pdf.text(h, a === 'right' ? hx + widths[i] - 3 : hx + 3, y + 5, { align: a });
        hx += widths[i];
      });
      y += rowH;
    };
    ensure(rowH * 2);
    drawHead();

    rows.forEach((r, ri) => {
      if (y + rowH > PAGE_H - 20) {
        newPage();
        drawHead();
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
      ['Descrição', 'Previsão', 'Gasto', '% Consumida'],
      despesas.map((d) => {
        const prev = parseMoney(d.orcado);
        const gasto = parseMoney(d.gasto);
        const pct = prev > 0 ? `${((gasto / prev) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—';
        return [d.descricao, money(prev), money(gasto), pct];
      }),
      [CONTENT_W - 100, 34, 34, 32],
      ['left', 'right', 'right', 'right'],
    );
  }

  const receitas = (s.receitas_receber || []).filter((r) => notEmpty(r.texto) || notEmpty(r.valor));
  if (receitas.length) {
    section('Receitas a Receber');
    table(
      ['Descritivo', 'Valor'],
      receitas.map((r) => [r.texto, money(r.valor)]),
      [CONTENT_W - 45, 45],
      ['left', 'right'],
    );
    if (receitas.length > 1) {
      const totalRec = receitas.reduce((acc, r) => acc + parseMoney(r.valor), 0);
      ensure(10);
      pdf.setFillColor(...GRAY_LIGHT);
      pdf.roundedRect(M, y, CONTENT_W, 9, 1.6, 1.6, 'F');
      pdf.setTextColor(...GRAY_SOFT);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('TOTAL DE RECEITAS', M + 4, y + 6);
      pdf.setTextColor(...GREEN);
      pdf.setFontSize(10);
      pdf.text(money(totalRec), PAGE_W - M - 4, y + 6, { align: 'right' });
      y += 15;
    }
  }

  const renderResultado = (
    title: string,
    vals: { inicio?: string; ontem?: string; hoje?: string; rec?: string; desp?: string; alts: { texto: string; valor?: string }[] },
  ) => {
    const resultCols = [
      { label: 'Início do mês', value: vals.inicio },
      { label: 'Ontem', value: vals.ontem },
      { label: 'Hoje', value: vals.hoje },
    ];
    const hasResult = resultCols.some((r) => notEmpty(r.value));
    const alteracoes = (vals.alts || []).filter((a) => notEmpty(a.texto) || notEmpty(a.valor));
    const mesBoxes = [
      { label: 'Receitas esperadas para o mês', value: vals.rec, color: GREEN },
      { label: 'Despesas programadas para o mês', value: vals.desp, color: RED },
    ].filter((b) => notEmpty(b.value));
    if (!hasResult && !alteracoes.length && !mesBoxes.length) return;

    section(title);
    if (mesBoxes.length) {
      ensure(20);
      const gap = 5;
      const bw = (CONTENT_W - gap) / 2;
      mesBoxes.forEach((b, i) => {
        const x = M + i * (bw + gap);
        pdf.setFillColor(...GRAY_LIGHT);
        pdf.setDrawColor(...GRAY_LINE);
        pdf.roundedRect(x, y, bw, 17, 2, 2, 'FD');
        pdf.setFillColor(...b.color);
        pdf.rect(x, y + 2.5, 1.2, 12, 'F');
        pdf.setTextColor(...GRAY_SOFT);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.8);
        pdf.text(b.label.toUpperCase(), x + 4.5, y + 6.5);
        pdf.setTextColor(...b.color);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(money(b.value), x + 4.5, y + 13.5);
      });
      y += 22;
    }
    if (hasResult) {
      ensure(20);
      pdf.setFillColor(...GRAY_LIGHT);
      pdf.roundedRect(M, y, CONTENT_W, 18, 2, 2, 'F');
      pdf.setTextColor(...GRAY_DARK);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('Resultado esperado', M + 4, y + 11);
      const colW = 34;
      let cx = PAGE_W - M - (colW * 3 + 8);
      resultCols.forEach((r, i) => {
        if (i === 1) cx += 8;
        const n = parseMoney(r.value);
        pdf.setTextColor(...GRAY_SOFT);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.8);
        pdf.text(r.label.toUpperCase(), cx + colW, y + 6.5, { align: 'right' });
        pdf.setTextColor(...(n < 0 ? RED : n > 0 ? GREEN : GRAY_DARK));
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(notEmpty(r.value) ? money(n) : '—', cx + colW, y + 13.5, { align: 'right' });
        cx += colW;
      });
      y += 24;
    }
    if (alteracoes.length) {
      pdf.setTextColor(...GRAY_SOFT);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      ensure(8);
      pdf.text('ALTERAÇÕES', M, y);
      y += 5;
      const total = alteracoes.reduce((acc, a) => acc + parseMoney(a.valor), 0);
      table(
        ['Descritivo', 'Valor'],
        alteracoes.map((a) => [a.texto, money(a.valor)]),
        [CONTENT_W - 45, 45],
        ['left', 'right'],
      );
      ensure(10);
      pdf.setFillColor(...GRAY_LIGHT);
      pdf.roundedRect(M, y, CONTENT_W, 9, 1.6, 1.6, 'F');
      pdf.setTextColor(...GRAY_SOFT);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('SALDO TOTAL', M + 4, y + 6);
      pdf.setTextColor(...(total < 0 ? RED : total > 0 ? GREEN : GRAY_DARK));
      pdf.setFontSize(10);
      pdf.text(money(total), PAGE_W - M - 4, y + 6, { align: 'right' });
      y += 15;
    }
  };

  renderResultado('Resultado Esperado — Caixa', {
    inicio: s.resultado_inicio,
    ontem: s.resultado_ontem,
    hoje: s.resultado_hoje,
    rec: s.receitas_esperadas,
    desp: s.despesas_programadas,
    alts: s.alteracoes || [],
  });

  renderResultado('Resultado Esperado — Competência', {
    inicio: s.resultado_comp_inicio,
    ontem: s.resultado_comp_ontem,
    hoje: s.resultado_comp_hoje,
    rec: s.receitas_esperadas_comp,
    desp: s.despesas_programadas_comp,
    alts: s.alteracoes_comp || [],
  });


  const avisos = s.avisos.map((a) => a.texto).filter(notEmpty);
  if (avisos.length) {
    section('Avisos e Pendências');
    bullets(avisos);
  }

  {
    section('Observações');
    const rows = 4;
    const rowH = 7;
    const h = rows * rowH + 4;
    ensure(h);
    pdf.setDrawColor(...GRAY_LINE);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(M, y, CONTENT_W, h, 2, 2, 'S');
    for (let i = 1; i <= rows - 1; i++) {
      pdf.line(M + 4, y + 2 + i * rowH, PAGE_W - M - 4, y + 2 + i * rowH);
    }
    y += h + 8;
  }

  const checklist = s.checklist?.filter((c) => notEmpty(c.texto)) || [];
  if (checklist.length) {
    section('Anexos');
    checklist.forEach((c) => {
      ensure(9);
      pdf.setDrawColor(...GRAY_DARK);
      pdf.setLineWidth(0.3);
      pdf.rect(M + 1, y, 4, 4, 'S');
      if (c.done) {
        pdf.setFillColor(...BLUE);
        pdf.rect(M + 1.8, y + 0.8, 2.4, 2.4, 'F');
      }
      pdf.setTextColor(...GRAY_DARK);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.text(pdf.splitTextToSize(c.texto, CONTENT_W - 12)[0], M + 8, y + 3.5);
      y += 7;
    });
    y += 6;
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
