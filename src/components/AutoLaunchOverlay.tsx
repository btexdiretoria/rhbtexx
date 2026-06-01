import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/hooks/useEmployees';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface Column {
  id: string;
  column_id: string;
  name: string;
  type: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  columns: Column[];
  selectedYear: number;
  selectedMonth: number;
  createColumn: (col: { column_id: string; name: string; type: 'earning' | 'deduction'; year: number; month: number; sort_order: number }) => Promise<{ column_id: string }>;
  upsertValue: (v: { employee_id: string; column_id: string; value: number; year: number; month: number }) => Promise<void>;
}

interface ParsedEmployee {
  name: string;
  earnings: { desc: string; value: number }[];
  deductions: { desc: string; value: number }[];
  liquidoHolerite: number | null;
}

interface ResultItem {
  name: string;
  status: 'success' | 'mismatch' | 'not_found';
  expected?: number;
  calculated?: number;
}

const normalizeName = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseBRNumber = (s: string): number | null => {
  if (!s) return null;
  const cleaned = s.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:[,.]|$))/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
};

const isMoney = (s: string): boolean => /^-?\s*\d{1,3}(\.\d{3})*,\d{2}$|^-?\s*\d+,\d{2}$|^-?\s*\d+\.\d{2}$/.test(s.trim());

async function parseHolerites(file: File): Promise<ParsedEmployee[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const results: ParsedEmployee[] = [];
  const seen = new Set<string>();

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const items = tc.items
      .map((it: any) => ({ str: String(it.str || ''), x: it.transform[4] as number, y: it.transform[5] as number }))
      .filter(it => it.str.trim() !== '');

    if (items.length === 0) continue;

    const linesMap = new Map<number, { x: number; str: string }[]>();
    for (const it of items) {
      const key = Math.round(it.y / 2) * 2;
      if (!linesMap.has(key)) linesMap.set(key, []);
      linesMap.get(key)!.push({ x: it.x, str: it.str });
    }
    const lines = Array.from(linesMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([y, arr]) => ({ y, items: arr.sort((a, b) => a.x - b.x) }));

    let headerIdx = -1;
    let xDesc = 0, xVenc = 0, xDesconto = 0;
    for (let i = 0; i < lines.length; i++) {
      const joined = lines[i].items.map(it => it.str).join(' ').toLowerCase();
      if (joined.includes('descri') && joined.includes('venciment') && joined.includes('desconto')) {
        headerIdx = i;
        for (const it of lines[i].items) {
          const s = it.str.toLowerCase();
          if (s.includes('descri')) xDesc = it.x;
          else if (s.includes('venciment')) xVenc = it.x;
          else if (s.includes('desconto')) xDesconto = it.x;
        }
        break;
      }
    }

    let employeeName = '';
    let xNomeCol = 0;
    let xNomeEnd = 0;

    // Procura cabeçalho: "Código | Nome do Funcionário | CBO | Departamento | Filial"
    let empHeaderIdx = -1;
    for (let i = 0; i < (headerIdx >= 0 ? headerIdx : lines.length); i++) {
      const joined = lines[i].items.map(it => it.str).join(' ').toLowerCase();
      if (/c[óo]digo/.test(joined) && /nome/.test(joined) && (/cbo/.test(joined) || /departamento/.test(joined) || /filial/.test(joined))) {
        empHeaderIdx = i;
        for (const it of lines[i].items) {
          const s = it.str.toLowerCase();
          if (s.includes('nome')) xNomeCol = it.x;
          else if (s.includes('cbo') || s.includes('departamento') || s.includes('filial')) {
            if (xNomeCol && it.x > xNomeCol && (xNomeEnd === 0 || it.x < xNomeEnd)) xNomeEnd = it.x;
          }
        }
        break;
      }
    }

    const isHeaderWord = (w: string) => /^(c[óo]digo|nome|do|funcion[áa]rio|cbo|departamento|filial|cargo|admiss[ãa]o|ctps|cpf|fun[çc][ãa]o)$/i.test(w.trim());

    if (empHeaderIdx >= 0) {
      // Linha imediatamente abaixo do cabeçalho contém: <código> <NOME COMPLETO> <cbo> <depto> <filial>
      const dataLine = lines[empHeaderIdx + 1];
      if (dataLine) {
        const nameTokens: string[] = [];
        for (const it of dataLine.items) {
          const txt = it.str.trim();
          if (!txt) continue;
          if (xNomeEnd && it.x >= xNomeEnd - 5) break;
          if (xNomeCol && it.x + 2 < xNomeCol) continue; // pula coluna Código
          if (/^\d+$/.test(txt)) continue; // pula códigos numéricos
          if (isHeaderWord(txt)) continue;
          if (/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\-]*$/.test(txt)) nameTokens.push(txt);
        }
        if (nameTokens.length >= 2) employeeName = nameTokens.join(' ').trim();
      }
    }

    // Fallback: padrão "Nome: <X>" ou padrão antigo
    if (!employeeName) {
      for (let i = 0; i < (headerIdx >= 0 ? headerIdx : lines.length); i++) {
        const lineStr = lines[i].items.map(it => it.str).join(' ');
        const m = lineStr.match(/Nome(?:\s+do)?(?:\s+Funcion[áa]rio)?[\s:]+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s']+?)(?:\s{2,}|\s+CTPS|\s+CPF|\s+Fun[çc]|\s+Cargo|\s+Admiss|\s+CBO|\s+\d|$)/i);
        if (m && m[1].trim().length > 3 && !isHeaderWord(m[1].trim().split(/\s+/)[0])) {
          employeeName = m[1].trim();
          break;
        }
      }
    }

    if (!employeeName || headerIdx < 0) continue;

    employeeName = employeeName
      .replace(/\s+(CTPS|CPF|Cargo|Admiss|CBO|Departamento|Filial|Fun[çc][aã]o).*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (isHeaderWord(employeeName) || employeeName.split(/\s+/).length < 2) continue;

    const earnings: { desc: string; value: number }[] = [];
    const deductions: { desc: string; value: number }[] = [];
    let liquidoHolerite: number | null = null;

    const xVencMin = xVenc - 30;
    const xDescontoMin = xDesconto - 30;

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      const lineStr = line.items.map(it => it.str).join(' ');
      const lower = lineStr.toLowerCase();

      if (lower.includes('l[íi]quido') || /l[íi]quido/.test(lower)) {
        for (let j = line.items.length - 1; j >= 0; j--) {
          if (isMoney(line.items[j].str)) {
            liquidoHolerite = parseBRNumber(line.items[j].str);
            break;
          }
        }
        if (liquidoHolerite == null) {
          for (let k = i + 1; k < Math.min(i + 3, lines.length); k++) {
            for (const it of lines[k].items) {
              if (isMoney(it.str)) { liquidoHolerite = parseBRNumber(it.str); break; }
            }
            if (liquidoHolerite != null) break;
          }
        }
        break;
      }
      if (lower.includes('total de venciment') || lower.includes('total venciment') || lower.includes('total de desconto') || lower.includes('total desconto') || lower.includes('salario base inss') || lower.includes('base inss') || lower.includes('base fgts')) {
        continue;
      }

      let vencVal: number | null = null;
      let descontoVal: number | null = null;
      const descTokens: string[] = [];

      for (const it of line.items) {
        if (isMoney(it.str)) {
          if (xDesconto && it.x >= xDescontoMin) {
            descontoVal = parseBRNumber(it.str);
          } else if (xVenc && it.x >= xVencMin) {
            vencVal = parseBRNumber(it.str);
          }
        } else {
          if (!xVenc || it.x < xVencMin) {
            descTokens.push(it.str);
          }
        }
      }

      if (vencVal == null && descontoVal == null) continue;

      const desc = descTokens
        .join(' ')
        .replace(/^\s*\d{2,5}\s+/, '')
        .replace(/\s+\d+([.,]\d+)?\s*$/, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!desc) continue;

      if (vencVal != null && vencVal > 0) earnings.push({ desc, value: vencVal });
      if (descontoVal != null && descontoVal > 0) deductions.push({ desc, value: descontoVal });
    }

    if (earnings.length === 0 && deductions.length === 0) continue;

    const sig =
      normalizeName(employeeName) +
      '|' +
      earnings.map(e => `${e.desc}:${e.value}`).sort().join(',') +
      '|' +
      deductions.map(e => `${e.desc}:${e.value}`).sort().join(',');

    if (seen.has(sig)) continue;
    seen.add(sig);

    results.push({ name: employeeName, earnings, deductions, liquidoHolerite });
  }

  return results;
}

export default function AutoLaunchOverlay({ open, onClose, employees, columns, selectedYear, selectedMonth, createColumn, upsertValue }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const reset = () => {
    setResults(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    if (processing) return;
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast({ title: 'Arquivo inválido', description: 'Envie um arquivo PDF.', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    setResults(null);
    setFileName(file.name);

    try {
      const parsed = await parseHolerites(file);
      if (parsed.length === 0) {
        toast({ title: 'Nenhum holerite identificado', description: 'Verifique se o PDF está no formato esperado.', variant: 'destructive' });
        setProcessing(false);
        return;
      }

      const colKey = (name: string, type: 'earning' | 'deduction') => `${type}:${normalizeName(name)}`;
      const colMap = new Map<string, string>();
      let maxSort = 0;
      for (const c of columns) {
        colMap.set(colKey(c.name, c.type as 'earning' | 'deduction'), c.column_id);
      }
      maxSort = columns.length;

      const ensureColumn = async (name: string, type: 'earning' | 'deduction'): Promise<string> => {
        const k = colKey(name, type);
        const existing = colMap.get(k);
        if (existing) return existing;
        const newId = `col_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        await createColumn({ column_id: newId, name, type, year: selectedYear, month: selectedMonth, sort_order: maxSort++ });
        colMap.set(k, newId);
        return newId;
      };

      const out: ResultItem[] = [];

      for (const entry of parsed) {
        const target = normalizeName(entry.name);
        const emp =
          employees.find(e => normalizeName(e.nome) === target) ||
          employees.find(e => normalizeName(e.nome).startsWith(target) || target.startsWith(normalizeName(e.nome)));

        if (!emp) {
          out.push({ name: entry.name, status: 'not_found' });
          continue;
        }

        let totalVenc = 0;
        let totalDesc = 0;

        for (const e of entry.earnings) {
          const colId = await ensureColumn(e.desc, 'earning');
          await upsertValue({ employee_id: emp.id, column_id: colId, value: e.value, year: selectedYear, month: selectedMonth });
          totalVenc += e.value;
        }
        for (const d of entry.deductions) {
          const colId = await ensureColumn(d.desc, 'deduction');
          await upsertValue({ employee_id: emp.id, column_id: colId, value: d.value, year: selectedYear, month: selectedMonth });
          totalDesc += d.value;
        }

        const calc = +(totalVenc - totalDesc).toFixed(2);
        const expected = entry.liquidoHolerite != null ? +entry.liquidoHolerite.toFixed(2) : null;

        if (expected != null && Math.abs(calc - expected) > 0.01) {
          out.push({ name: entry.name, status: 'mismatch', expected, calculated: calc });
        } else {
          out.push({ name: entry.name, status: 'success', expected: expected ?? calc, calculated: calc });
        }
      }

      setResults(out);

      const ok = out.filter(r => r.status === 'success').length;
      toast({ title: 'Processamento concluído', description: `${ok} holerite(s) lançado(s) com sucesso.` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao processar PDF', description: err instanceof Error ? err.message : 'Erro desconhecido', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Lançamento Automático via Holerite (PDF)</DialogTitle>
        </DialogHeader>

        {!results && (
          <div className="space-y-4">
            <div
              onClick={() => !processing && fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => {
                e.preventDefault();
                if (processing) return;
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${processing ? 'cursor-wait border-muted bg-muted/30' : 'cursor-pointer border-primary/40 hover:border-primary hover:bg-primary/5'}`}
            >
              {processing ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Processando {fileName}...</p>
                  <p className="text-xs text-muted-foreground">Lendo holerites, identificando funcionários e lançando valores.</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-primary" />
                  <p className="text-sm font-medium text-foreground">Clique ou arraste o PDF do holerite</p>
                  <p className="text-xs text-muted-foreground">Duplicatas serão ignoradas automaticamente.</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{fileName}</p>
              <Button size="sm" variant="outline" onClick={reset}><X className="mr-1 h-4 w-4" /> Novo upload</Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="text-xs text-muted-foreground">Sucesso</p>
                <p className="text-lg font-bold text-emerald-600">{results.filter(r => r.status === 'success').length}</p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-xs text-muted-foreground">Divergências</p>
                <p className="text-lg font-bold text-amber-600">{results.filter(r => r.status === 'mismatch').length}</p>
              </div>
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2">
                <p className="text-xs text-muted-foreground">Não encontrados</p>
                <p className="text-lg font-bold text-destructive">{results.filter(r => r.status === 'not_found').length}</p>
              </div>
            </div>
            <div className="max-h-[400px] space-y-1.5 overflow-y-auto">
              {results.map((r, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-md border border-border bg-card p-2 text-sm">
                  {r.status === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
                  {r.status === 'mismatch' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                  {r.status === 'not_found' && <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{r.name}</p>
                    {r.status === 'mismatch' && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Esperado: {r.expected?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • Calculado: {r.calculated?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    )}
                    {r.status === 'not_found' && (
                      <p className="text-xs text-destructive">Funcionário não localizado no cadastro.</p>
                    )}
                    {r.status === 'success' && r.calculated != null && (
                      <p className="text-xs text-muted-foreground">Líquido: {r.calculated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
