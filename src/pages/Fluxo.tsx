import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import FileUpload from "@/components/FileUpload";
import CategoryBuckets from "@/components/CategoryBuckets";
import MonthlyBalance from "@/components/MonthlyBalance";
import AlteracoesPanel, { type AlteracaoItem } from "@/components/AlteracoesPanel";
import DateRangeFilter from "@/components/DateRangeFilter";
import CashFlowTable from "@/components/CashFlowTable";
import { parseFile, buildCashFlow, formatCurrency, formatDateBR, type RawEntry, type CashFlowData } from "@/lib/cashflow";
import { DateEdits, applyEdits, exportEdits } from "@/lib/simulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FlaskConical, Save, Download, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChangeHistoryEntry {
  description: string;
  previousDate: string;
  newDate: string;
  valor: number;
  timestamp: string;
}

const STATE_KEY = "default";
const BUCKET = "cashflow-files";

const Index = () => {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [entries, setEntries] = useState<RawEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState<string>("");
  const [simulationMode, setSimulationMode] = useState(false);
  const [dateEdits, setDateEdits] = useState<DateEdits>({});
  const [savedEdits, setSavedEdits] = useState<DateEdits>({});
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryEntry[]>([]);
  const [lastSaved, setLastSaved] = useState<string>("");
  const [alteracoes, setAlteracoes] = useState<AlteracaoItem[]>([]);
  const [valorPrevisto, setValorPrevisto] = useState<number>(0);
  const [alteracoesAnual, setAlteracoesAnual] = useState<AlteracaoItem[]>([]);
  const [valorPrevistoAnual, setValorPrevistoAnual] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);


  const saveTimer = useRef<number | null>(null);

  // Restore persisted state from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from("cashflow_state")
          .select("*")
          .eq("state_key", STATE_KEY)
          .maybeSingle();
        if (error) throw error;
        if (row) {
          const rawEntries = (row.entries as unknown as RawEntry[]) || [];
          if (rawEntries.length > 0) {
            setEntries(rawEntries);
            setData(buildCashFlow(rawEntries));
          }
          setFileName(row.file_name || "");
          setFilePath(row.file_path || "");
          setStartDate(row.start_date || "");
          setEndDate(row.end_date || "");
          setSavedEdits((row.saved_edits as unknown as DateEdits) || {});
          setDateEdits((row.date_edits as unknown as DateEdits) || {});
          setChangeHistory((row.change_history as unknown as ChangeHistoryEntry[]) || []);
          setAlteracoes((row.alteracoes as unknown as AlteracaoItem[]) || []);
          setValorPrevisto(Number((row as any).valor_previsto) || 0);
          if (row.updated_at) setLastSaved(new Date(row.updated_at).toLocaleString("pt-BR"));

        }
      } catch (e) {
        console.warn("Falha ao restaurar Fluxo:", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Auto-save (debounced) to Supabase after hydration
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        const payload = {
          state_key: STATE_KEY,
          file_name: fileName || null,
          file_path: filePath || null,
          entries: entries as unknown as never,
          start_date: startDate || null,
          end_date: endDate || null,
          saved_edits: savedEdits as unknown as never,
          date_edits: dateEdits as unknown as never,
          change_history: changeHistory as unknown as never,
          alteracoes: alteracoes as unknown as never,
          valor_previsto: valorPrevisto,
        };
        const { error } = await supabase
          .from("cashflow_state")
          .upsert(payload, { onConflict: "state_key" });
        if (error) throw error;
        setLastSaved(new Date().toLocaleString("pt-BR"));
      } catch (e) {
        console.warn("Falha ao salvar Fluxo:", e);
      }
    }, 600);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [entries, fileName, filePath, startDate, endDate, savedEdits, dateEdits, changeHistory, alteracoes, valorPrevisto, hydrated]);


  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseFile(file);

      // If a previous file exists, remove it from storage
      if (filePath) {
        await supabase.storage.from(BUCKET).remove([filePath]).catch(() => {});
      }

      // Upload new file to Supabase Storage
      const ext = file.name.split(".").pop() || "xlsx";
      const newPath = `${STATE_KEY}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) {
        console.warn("Falha ao enviar arquivo:", upErr);
        toast.error("Falha ao enviar arquivo para o servidor.");
      } else {
        setFilePath(newPath);
      }

      // New upload overwrites previous data
      setEntries(parsed);
      const cf = buildCashFlow(parsed);
      setData(cf);
      setFileName(file.name);
      setDateEdits({});
      setSavedEdits({});
      setSimulationMode(false);
      setChangeHistory([]);
      // Preserve Acontecimentos and Valor Previsto Inicial on new uploads
      if (cf.dates.length > 0) {
        setStartDate(cf.dates[0]);
        setEndDate(cf.dates[cf.dates.length - 1]);
      }
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      toast.error("Erro ao processar arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = useCallback(async (keepAlteracoes: boolean) => {
    try {
      if (filePath) {
        await supabase.storage.from(BUCKET).remove([filePath]).catch(() => {});
      }

      if (keepAlteracoes) {
        // Reset everything but keep the alteracoes records
        const payload = {
          state_key: STATE_KEY,
          file_name: null,
          file_path: null,
          entries: [] as unknown as never,
          start_date: null,
          end_date: null,
          saved_edits: {} as unknown as never,
          date_edits: {} as unknown as never,
          change_history: [] as unknown as never,
          alteracoes: alteracoes as unknown as never,
        };
        const { error } = await supabase
          .from("cashflow_state")
          .upsert(payload, { onConflict: "state_key" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cashflow_state")
          .delete()
          .eq("state_key", STATE_KEY);
        if (error) throw error;
      }

      setData(null);
      setEntries([]);
      setFileName("");
      setFilePath("");
      setStartDate("");
      setEndDate("");
      setSavedEdits({});
      setDateEdits({});
      setChangeHistory([]);
      if (!keepAlteracoes) setAlteracoes([]);
      setSimulationMode(false);
      setLastSaved("");
      toast.success(keepAlteracoes ? "Dados apagados (Acontecimentos preservados)." : "Dados do Fluxo apagados.");
    } catch (e) {
      console.error("Falha ao limpar Fluxo:", e);
      toast.error("Não foi possível limpar os dados.");
    } finally {
      setConfirmClearOpen(false);
    }
  }, [filePath, alteracoes]);

  const filteredDates = useMemo(() => {
    if (!data) return [];
    return data.dates.filter((d) => {
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [data, startDate, endDate]);

  // Simulated entries and data
  const activeEdits = useMemo(() => ({ ...savedEdits, ...dateEdits }), [savedEdits, dateEdits]);
  const hasEdits = Object.keys(activeEdits).length > 0;

  const simulatedEntries = useMemo(() => applyEdits(entries, activeEdits), [entries, activeEdits]);
  const simulatedData = useMemo(() => (hasEdits ? buildCashFlow(simulatedEntries) : data), [simulatedEntries, hasEdits, data]);

  const simulatedFilteredDates = useMemo(() => {
    if (!simulatedData) return [];
    const allDates = new Set([...(data?.dates || []), ...simulatedData.dates]);
    return Array.from(allDates).sort().filter((d) => {
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [simulatedData, data, startDate, endDate]);

  const originalSaldoFinal = useMemo(() => {
    if (!data) return {};
    const dates = simulatedFilteredDates;
    const saldoFinal: Record<string, number> = {};
    let prev = 0;
    for (const d of dates) {
      let rev = 0, exp = 0;
      for (const cat of data.revenueCategories) rev += data.matrix[`rev::${cat}`]?.[d] || 0;
      for (const cat of data.expenseCategories) exp += data.matrix[`exp::${cat}`]?.[d] || 0;
      saldoFinal[d] = prev + rev + exp;
      prev = saldoFinal[d];
    }
    return saldoFinal;
  }, [data, simulatedFilteredDates]);

  const handleSimDateChange = useCallback((entryIndex: number, newDate: string) => {
    const entry = entries[entryIndex];
    const previousDate = activeEdits[entryIndex] || entry.dataMovimento;
    setDateEdits((prev) => ({ ...prev, [entryIndex]: newDate }));
    setChangeHistory((prev) => [{
      description: entry.categoria1 || entry.descricao || "Sem descrição",
      previousDate,
      newDate,
      valor: entry.valor,
      timestamp: new Date().toLocaleString("pt-BR"),
    }, ...prev]);
  }, [entries, activeEdits]);

  const handleSaveSession = useCallback(() => {
    setSavedEdits((prev) => ({ ...prev, ...dateEdits }));
    setDateEdits({});
    toast.success("Sessão salva! As alterações foram preservadas.");
  }, [dateEdits]);

  const handleExport = useCallback(() => {
    exportEdits(entries, activeEdits);
    toast.success("Arquivo exportado com sucesso!");
  }, [entries, activeEdits]);

  const toggleSimulation = useCallback(() => {
    setSimulationMode((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa Diário</h1>
              <p className="text-sm text-muted-foreground">Faça upload de sua planilha para visualizar o fluxo</p>
            </div>
          </div>

          {data && (
            <div className="flex items-center gap-2">
              <Button
                variant={simulationMode ? "default" : "outline"}
                onClick={toggleSimulation}
                className="gap-2"
              >
                <FlaskConical className="h-4 w-4" />
                {simulationMode ? "Sair da Simulação" : "Modo Simulação"}
              </Button>
              {simulationMode && hasEdits && (
                <>
                  <Button variant="outline" onClick={handleSaveSession} className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar sessão
                  </Button>
                  <Button variant="outline" onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar alterações
                  </Button>
                </>
              )}
              <Button variant="destructive" onClick={() => setConfirmClearOpen(true)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          )}
        </div>

        {/* Upload */}
        <Card>
          <CardContent className="pt-6">
            <FileUpload onFileSelected={handleFile} isLoading={loading} />
            {fileName && (
              <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  Arquivo carregado: <span className="font-medium text-foreground">{fileName}</span>
                </p>
                {lastSaved && (
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    Dados salvos · {lastSaved}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filtros + Tabela */}
        {data && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  onStartChange={setStartDate}
                  onEndChange={setEndDate}
                />
              </CardContent>
            </Card>

            {simulationMode ? (
              <div className="space-y-6">
                <div>
                  <CashFlowTable
                    data={data}
                    filteredDates={filteredDates}
                    entries={entries}
                    title="📋 Original"
                    readOnly
                  />
                </div>
                <div>
                  <CashFlowTable
                    data={simulatedData!}
                    filteredDates={simulatedFilteredDates}
                    entries={simulatedEntries}
                    title="🧪 Simulado"
                    comparisonSaldoFinal={originalSaldoFinal}
                    editable
                    onDateChange={handleSimDateChange}
                    originalEntries={entries}
                  />
                </div>

                {/* Change History Log */}
                {changeHistory.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">📝 Histórico de Alterações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto border border-border rounded-lg">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-header-bg text-header-foreground">
                              <th className="px-3 py-2 text-left font-semibold">Descrição</th>
                              <th className="px-3 py-2 text-left font-semibold">Data anterior</th>
                              <th className="px-3 py-2 text-left font-semibold">Nova data</th>
                              <th className="px-3 py-2 text-right font-semibold">Valor</th>
                              <th className="px-3 py-2 text-right font-semibold">Quando</th>
                            </tr>
                          </thead>
                          <tbody>
                            {changeHistory.map((ch, i) => (
                              <tr key={i} className="border-t border-border hover:bg-row-alt transition-colors">
                                <td className="px-3 py-1.5 text-foreground">{ch.description}</td>
                                <td className="px-3 py-1.5 text-muted-foreground line-through">{formatDateBR(ch.previousDate)}</td>
                                <td className="px-3 py-1.5 text-primary font-medium">{formatDateBR(ch.newDate)}</td>
                                <td className={cn("px-3 py-1.5 text-right font-medium", ch.valor >= 0 ? "text-positive-foreground" : "text-negative-foreground")}>{formatCurrency(ch.valor)}</td>
                                <td className="px-3 py-1.5 text-right text-muted-foreground text-xs">{ch.timestamp}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <CashFlowTable data={data} filteredDates={filteredDates} entries={entries} />
            )}

            {/* Category buckets summary */}
            <CategoryBuckets entries={entries} startDate={startDate} endDate={endDate} />

            {/* Alterações */}
            <AlteracoesPanel
              items={alteracoes}
              onChange={setAlteracoes}
              valorPrevisto={valorPrevisto}
              onValorPrevistoChange={setValorPrevisto}
              baseSaldoFinal={(() => {

                const activeData = simulationMode && simulatedData ? simulatedData : data;
                const activeDates = simulationMode ? simulatedFilteredDates : filteredDates;
                if (!activeData || activeDates.length === 0) return 0;
                let prev = 0;
                for (const d of activeDates) {
                  let rev = 0, exp = 0;
                  for (const cat of activeData.revenueCategories) rev += activeData.matrix[`rev::${cat}`]?.[d] || 0;
                  for (const cat of activeData.expenseCategories) exp += activeData.matrix[`exp::${cat}`]?.[d] || 0;
                  prev = prev + rev + exp;
                }
                return prev;
              })()}
            />

            {/* Monthly balance */}
            <MonthlyBalance data={data} />

            {/* Print button */}
            <div className="flex justify-end print:hidden">
              <Button onClick={() => window.print()} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                🖨️ Imprimir Página
              </Button>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar dados do Fluxo?</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha como deseja limpar os dados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="sm:mr-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleClearAll(true)}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Apagar tudo, exceto Acontecimentos
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleClearAll(false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
