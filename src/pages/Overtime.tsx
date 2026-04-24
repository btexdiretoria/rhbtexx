import { useState, useMemo, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Clock, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import FileUpload from '@/components/FileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/hooks/useEmployees';
import { toast } from 'sonner';
import { formatHorasFromFraction, parseHorasToFraction } from '@/lib/overtime';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const BUCKET = 'overtime-files';
const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface OvertimeRow {
  id: string;
  colaborador: string;
  employee_id: string | null;
  matched: boolean;
  horas: number;
  valor: number;
  file_name: string | null;
  file_path: string | null;
}

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

export default function Overtime() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [rows, setRows] = useState<OvertimeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const { data: employees = [] } = useEmployees();

  const fileInfo = useMemo(() => {
    const r = rows.find(x => x.file_name);
    return r ? { name: r.file_name, path: r.file_path } : null;
  }, [rows]);

  const totals = useMemo(() => ({
    horas: rows.reduce((s, r) => s + (r.horas || 0), 0),
    valor: rows.reduce((s, r) => s + (r.valor || 0), 0),
    unmatched: rows.filter(r => !r.matched).length,
  }), [rows]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('overtime_entries')
        .select('id, colaborador, employee_id, matched, horas, valor, file_name, file_path')
        .eq('year', year)
        .eq('month', month)
        .order('colaborador');
      if (error) throw error;
      setRows((data || []) as OvertimeRow[]);
    } catch (e) {
      console.error(e);
      toast.error('Falha ao carregar Horas Extras.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

      if (data.length === 0) {
        toast.error('Planilha vazia.');
        return;
      }

      const empByName = new Map(employees.map(e => [stripAccents(e.nome), e]));

      const parsed = data
        .map(row => {
          // Find columns by case-insensitive match
          const keys = Object.keys(row);
          const findKey = (target: string) =>
            keys.find(k => stripAccents(k) === stripAccents(target));
          const colKey = findKey('Colaborador') || keys[0];
          const horasKey = findKey('Horas') || keys[1];
          const valorKey = findKey('Valor') || keys[2];

          const colaborador = String(row[colKey] ?? '').trim();
          if (!colaborador) return null;

          const horas = parseHorasToFraction(row[horasKey]);
          const valor = Number(String(row[valorKey] ?? '0').toString().replace(',', '.')) || 0;

          const emp = empByName.get(stripAccents(colaborador));
          return {
            colaborador,
            employee_id: emp?.id ?? null,
            matched: !!emp,
            horas,
            valor,
          };
        })
        .filter(Boolean) as Array<{
          colaborador: string;
          employee_id: string | null;
          matched: boolean;
          horas: number;
          valor: number;
        }>;

      // Remove previous file from storage if any
      if (fileInfo?.path) {
        await supabase.storage.from(BUCKET).remove([fileInfo.path]).catch(() => {});
      }

      // Upload new file
      const ext = file.name.split('.').pop() || 'xlsx';
      const newPath = `${year}-${month}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) {
        console.warn('Falha ao enviar arquivo:', upErr);
        toast.error('Falha ao enviar arquivo.');
        return;
      }

      // Replace existing rows for this period
      const { error: delErr } = await supabase
        .from('overtime_entries')
        .delete()
        .eq('year', year)
        .eq('month', month);
      if (delErr) throw delErr;

      const insertPayload = parsed.map(p => ({
        ...p,
        year,
        month,
        file_name: file.name,
        file_path: newPath,
      }));
      const { error: insErr } = await supabase
        .from('overtime_entries')
        .insert(insertPayload);
      if (insErr) throw insErr;

      const unmatched = parsed.filter(p => !p.matched).length;
      toast.success(
        unmatched > 0
          ? `Importado: ${parsed.length} linha(s). ${unmatched} sem correspondência.`
          : `Importado com sucesso: ${parsed.length} linha(s).`
      );
      await fetchRows();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao processar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    try {
      if (fileInfo?.path) {
        await supabase.storage.from(BUCKET).remove([fileInfo.path]).catch(() => {});
      }
      const { error } = await supabase
        .from('overtime_entries')
        .delete()
        .eq('year', year)
        .eq('month', month);
      if (error) throw error;
      setRows([]);
      toast.success('Horas Extras apagadas.');
    } catch (e) {
      console.error(e);
      toast.error('Falha ao limpar.');
    } finally {
      setConfirmClear(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">Horas Extras — {MONTHS[month]} {year}</h2>
        <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>{[2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
        {rows.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto gap-2"
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 className="w-4 h-4" /> Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Horas</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{formatHorasFromFraction(totals.horas)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{rows.length} colaborador(es)</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Valor</CardTitle></CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(totals.valor)}</span>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${totals.unmatched > 0 ? 'border-l-destructive' : 'border-l-muted'}`}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sem correspondência</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {totals.unmatched > 0 && <AlertTriangle className="w-5 h-5 text-destructive" />}
              <span className={`text-2xl font-bold ${totals.unmatched > 0 ? 'text-destructive' : 'text-foreground'}`}>{totals.unmatched}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Importar planilha (.xlsx)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <FileUpload onFileSelected={handleFile} isLoading={uploading} />
          <p className="text-xs text-muted-foreground">
            Colunas esperadas: <strong>Colaborador</strong>, <strong>Horas</strong>, <strong>Valor</strong>.
            Os nomes serão validados contra os funcionários cadastrados (correspondência exata, ignorando maiúsculas/acentos).
          </p>
          {fileInfo?.name && (
            <p className="text-xs text-muted-foreground">
              Arquivo carregado: <span className="font-medium text-foreground">{fileInfo.name}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 p-0 sm:p-6 sm:pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum dado para este mês. Faça upload da planilha.</TableCell></TableRow>
                ) : rows.map(r => (
                  <TableRow key={r.id} className={!r.matched ? 'bg-destructive/10 hover:bg-destructive/15' : ''}>
                    <TableCell className="font-medium">{r.colaborador}</TableCell>
                    <TableCell>
                      {r.matched ? (
                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400">Vinculado</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive gap-1">
                          <AlertTriangle className="w-3 h-3" /> Sem correspondência
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatHorasFromFraction(r.horas)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(r.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Horas Extras?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o arquivo carregado e todos os dados de Horas Extras de {MONTHS[month]}/{year}. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
