import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

interface HoleriteItem {
  codigo?: string;
  descricao: string;
  referencia?: string;
  vencimento: number;
  desconto: number;
}

interface ParsedHolerite {
  funcionario: string;
  competencia?: string;
  salario_base?: number;
  itens: HoleriteItem[];
  total_vencimentos: number;
  total_descontos: number;
  valor_liquido: number;
}

interface ResultItem {
  name: string;
  status: 'success' | 'mismatch' | 'not_found' | 'error';
  expected?: number;
  calculated?: number;
  message?: string;
}

const normalizeName = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function renderPagesAsImages(file: File, onProgress?: (n: number, total: number) => void): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const out: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    out.push(canvas.toDataURL('image/jpeg', 0.85));
    onProgress?.(p, pdf.numPages);
  }
  return out;
}

async function extractHolerite(image: string): Promise<ParsedHolerite> {
  const { data, error } = await supabase.functions.invoke('extract-holerite', { body: { image } });
  if (error) throw new Error(error.message);
  if (!data?.holerite) throw new Error('Resposta inválida da IA');
  return data.holerite as ParsedHolerite;
}

export default function AutoLaunchOverlay({ open, onClose, employees, columns, selectedYear, selectedMonth, createColumn, upsertValue }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; phase: string }>({ current: 0, total: 0, phase: '' });
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const reset = () => {
    setResults(null);
    setFileName('');
    setProgress({ current: 0, total: 0, phase: '' });
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
      setProgress({ current: 0, total: 0, phase: 'Renderizando páginas do PDF...' });
      const images = await renderPagesAsImages(file, (n, total) =>
        setProgress({ current: n, total, phase: 'Renderizando páginas do PDF...' })
      );

      // Extrai cada página via IA e desduplica por nome
      const parsedList: ParsedHolerite[] = [];
      const seenNames = new Set<string>();
      for (let i = 0; i < images.length; i++) {
        setProgress({ current: i + 1, total: images.length, phase: 'Extraindo holerites via IA...' });
        try {
          const h = await extractHolerite(images[i]);
          const key = normalizeName(h.funcionario || '');
          if (!key) continue;
          if (seenNames.has(key)) continue;
          seenNames.add(key);
          parsedList.push(h);
        } catch (err) {
          console.error('Erro na página', i + 1, err);
        }
      }

      if (parsedList.length === 0) {
        toast({ title: 'Nenhum holerite identificado', description: 'A IA não conseguiu extrair dados.', variant: 'destructive' });
        setProcessing(false);
        setProgress({ current: 0, total: 0, phase: '' });
        return;
      }

      setProgress({ current: 0, total: parsedList.length, phase: 'Lançando valores...' });

      const colKey = (name: string, type: 'earning' | 'deduction') => `${type}:${normalizeName(name)}`;
      const colMap = new Map<string, string>();
      let maxSort = columns.length;
      for (const c of columns) colMap.set(colKey(c.name, c.type as 'earning' | 'deduction'), c.column_id);

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

      for (let i = 0; i < parsedList.length; i++) {
        const entry = parsedList[i];
        setProgress({ current: i + 1, total: parsedList.length, phase: 'Lançando valores...' });

        const target = normalizeName(entry.funcionario);
        const emp =
          employees.find(e => normalizeName(e.nome) === target) ||
          employees.find(e => normalizeName(e.nome).startsWith(target) || target.startsWith(normalizeName(e.nome)));

        if (!emp) {
          out.push({ name: entry.funcionario, status: 'not_found' });
          continue;
        }

        try {
          let totalVenc = 0;
          let totalDesc = 0;

          for (const item of entry.itens || []) {
            const desc = (item.descricao || '').trim();
            if (!desc) continue;
            if (item.vencimento && item.vencimento > 0) {
              const colId = await ensureColumn(desc, 'earning');
              await upsertValue({ employee_id: emp.id, column_id: colId, value: item.vencimento, year: selectedYear, month: selectedMonth });
              totalVenc += item.vencimento;
            }
            if (item.desconto && item.desconto > 0) {
              const colId = await ensureColumn(desc, 'deduction');
              await upsertValue({ employee_id: emp.id, column_id: colId, value: item.desconto, year: selectedYear, month: selectedMonth });
              totalDesc += item.desconto;
            }
          }

          const calc = +(totalVenc - totalDesc).toFixed(2);
          const expected = entry.valor_liquido != null ? +Number(entry.valor_liquido).toFixed(2) : null;

          if (expected != null && Math.abs(calc - expected) > 0.01) {
            out.push({ name: entry.funcionario, status: 'mismatch', expected, calculated: calc });
          } else {
            out.push({ name: entry.funcionario, status: 'success', expected: expected ?? calc, calculated: calc });
          }
        } catch (err) {
          out.push({ name: entry.funcionario, status: 'error', message: err instanceof Error ? err.message : 'Erro' });
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
      setProgress({ current: 0, total: 0, phase: '' });
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
                  <p className="text-sm font-medium text-foreground">{progress.phase || `Processando ${fileName}...`}</p>
                  {progress.total > 0 && (
                    <p className="text-xs text-muted-foreground">{progress.current} de {progress.total}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Extração via IA — pode levar alguns instantes.</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-primary" />
                  <p className="text-sm font-medium text-foreground">Clique ou arraste o PDF do holerite</p>
                  <p className="text-xs text-muted-foreground">A extração é feita por IA (Gemini). Duplicatas são ignoradas.</p>
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
            <div className="grid grid-cols-4 gap-2 text-center">
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
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2">
                <p className="text-xs text-muted-foreground">Erros</p>
                <p className="text-lg font-bold text-destructive">{results.filter(r => r.status === 'error').length}</p>
              </div>
            </div>
            <div className="max-h-[400px] space-y-1.5 overflow-y-auto">
              {results.map((r, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-md border border-border bg-card p-2 text-sm">
                  {r.status === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
                  {r.status === 'mismatch' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                  {(r.status === 'not_found' || r.status === 'error') && <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
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
                    {r.status === 'error' && (
                      <p className="text-xs text-destructive">{r.message || 'Erro ao lançar.'}</p>
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
