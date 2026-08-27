import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AlteracoesPanel, { type AlteracaoItem } from "@/components/AlteracoesPanel";
import MonthlyBalance from "@/components/MonthlyBalance";
import { buildCashFlow, type RawEntry } from "@/lib/cashflow";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STATE_KEY = "default";

const Resultados = () => {
  const [entries, setEntries] = useState<RawEntry[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [alteracoes, setAlteracoes] = useState<AlteracaoItem[]>([]);
  const [valorPrevisto, setValorPrevisto] = useState<number>(0);
  const [valorPrevistoComp, setValorPrevistoComp] = useState<number>(0);
  const [alteracoesAnual, setAlteracoesAnual] = useState<AlteracaoItem[]>([]);
  const [valorPrevistoAnual, setValorPrevistoAnual] = useState<number>(0);
  const [valorPrevistoAnualComp, setValorPrevistoAnualComp] = useState<number>(0);
  const [alteracoesGroups, setAlteracoesGroups] = useState<{ id: string; name: string }[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<number | null>(null);

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
          setEntries(((row.entries as unknown as RawEntry[]) || []));
          setStartDate(row.start_date || "");
          setEndDate(row.end_date || "");
          setAlteracoes((row.alteracoes as unknown as AlteracaoItem[]) || []);
          setValorPrevisto(Number((row as any).valor_previsto) || 0);
          setValorPrevistoComp(Number((row as any).valor_previsto_comp) || 0);
          setAlteracoesAnual(((row as any).alteracoes_anual as unknown as AlteracaoItem[]) || []);
          setValorPrevistoAnual(Number((row as any).valor_previsto_anual) || 0);
          setValorPrevistoAnualComp(Number((row as any).valor_previsto_anual_comp) || 0);
          setAlteracoesGroups(((row as any).alteracoes_groups as any) || []);
        }
      } catch (e) {
        console.warn("Falha ao restaurar Resultados:", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Auto-save only the fields owned by this page
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("cashflow_state")
          .update({
            alteracoes: alteracoes as unknown as never,
            valor_previsto: valorPrevisto,
            alteracoes_anual: alteracoesAnual as unknown as never,
            valor_previsto_anual: valorPrevistoAnual,
            alteracoes_groups: alteracoesGroups as unknown as never,
          })
          .eq("state_key", STATE_KEY);
        if (error) throw error;
      } catch (e) {
        console.warn("Falha ao salvar Resultados:", e);
      }
    }, 600);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [alteracoes, valorPrevisto, alteracoesAnual, valorPrevistoAnual, alteracoesGroups, hydrated]);

  const data = useMemo(() => (entries.length ? buildCashFlow(entries) : null), [entries]);

  const filteredDates = useMemo(() => {
    if (!data) return [];
    return data.dates.filter((d) => {
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [data, startDate, endDate]);

  const baseSaldoFinal = useCallback(() => {
    if (!data || filteredDates.length === 0) return 0;
    let prev = 0;
    for (const d of filteredDates) {
      let rev = 0, exp = 0;
      for (const cat of data.revenueCategories) rev += data.matrix[`rev::${cat}`]?.[d] || 0;
      for (const cat of data.expenseCategories) exp += data.matrix[`exp::${cat}`]?.[d] || 0;
      prev = prev + rev + exp;
    }
    return prev;
  }, [data, filteredDates]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resultados</h1>
            <p className="text-sm text-muted-foreground">Eventualidades, alterações anuais e saldo mensal</p>
          </div>
        </div>

        <AlteracoesPanel
          title="✍️ Eventualidades"
          totalLabel="Valor total de eventualidades do mês"
          items={alteracoes}
          onChange={setAlteracoes}
          valorPrevisto={valorPrevisto}
          onValorPrevistoChange={setValorPrevisto}
          enableGroups
          groups={alteracoesGroups}
          onGroupsChange={setAlteracoesGroups}
          baseSaldoFinal={baseSaldoFinal()}
        />

        <AlteracoesPanel
          title="📊 Alteração de resultado Anual"
          totalLabel="Valor total de alterações do Ano"
          hideMonthYearFilters
          items={alteracoesAnual}
          onChange={setAlteracoesAnual}
          valorPrevisto={valorPrevistoAnual}
          onValorPrevistoChange={setValorPrevistoAnual}
          baseSaldoFinal={0}
        />

        {data ? (
          <MonthlyBalance data={data} />
        ) : (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Nenhuma planilha carregada no Fluxo — o saldo mensal aparecerá aqui após o upload.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Resultados;
