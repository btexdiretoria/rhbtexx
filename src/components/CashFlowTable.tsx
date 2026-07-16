import { useState, useMemo, useCallback } from "react";
import { CashFlowData, RawEntry, formatCurrency, formatDateBR } from "@/lib/cashflow";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight } from "lucide-react";
import TransactionPanel from "@/components/TransactionPanel";
import { cn } from "@/lib/utils";
import DaySummaryPanel from "@/components/DaySummaryPanel";

const todayIso = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

interface CashFlowTableProps {
  data: CashFlowData;
  filteredDates: string[];
  entries: RawEntry[];
  title?: string;
  readOnly?: boolean;
  comparisonSaldoFinal?: Record<string, number>;
  editable?: boolean;
  onDateChange?: (entryIndex: number, newDate: string) => void;
  originalEntries?: RawEntry[];
}

const ClickableValueCell = ({
  value,
  colored,
  onClick,
  highlight,
}: {
  value: number;
  colored?: boolean;
  onClick?: () => void;
  highlight?: "improved" | "worsened";
}) => {
  const cls = colored
    ? value < 0
      ? "text-negative-foreground font-semibold"
      : value > 0
      ? "text-positive-foreground font-semibold"
      : "text-muted-foreground"
    : "text-foreground";
  const highlightCls = highlight === "improved" ? "bg-positive/15" : highlight === "worsened" ? "bg-negative/15" : "";
  return (
    <td
      className={cn(
        "px-3 py-1.5 text-right whitespace-nowrap text-sm",
        cls,
        highlightCls,
        onClick && "cursor-pointer hover:bg-accent/50 transition-colors"
      )}
      onClick={onClick}
    >
      {value !== 0 ? formatCurrency(value) : "—"}
    </td>
  );
};

const CashFlowTable = ({
  data,
  filteredDates,
  entries,
  title,
  readOnly,
  comparisonSaldoFinal,
  editable,
  onDateChange,
  originalEntries,
}: CashFlowTableProps) => {
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [revenueExpanded, setRevenueExpanded] = useState(true);
  const [expenseExpanded, setExpenseExpanded] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTransactions, setPanelTransactions] = useState<RawEntry[]>([]);
  const [panelLabel, setPanelLabel] = useState("");
  const [panelFilterFn, setPanelFilterFn] = useState<((e: RawEntry) => boolean) | null>(null);
  const [daySummaryDate, setDaySummaryDate] = useState<string | null>(null);

  const computedRows = useMemo(() => {
    const dates = filteredDates;
    const dailyRevenue: Record<string, number> = {};
    const dailyExpense: Record<string, number> = {};

    for (const d of dates) {
      let rev = 0;
      let exp = 0;
      for (const cat of data.revenueCategories) {
        rev += data.matrix[`rev::${cat}`]?.[d] || 0;
      }
      for (const cat of data.expenseCategories) {
        exp += data.matrix[`exp::${cat}`]?.[d] || 0;
      }
      dailyRevenue[d] = rev;
      dailyExpense[d] = exp;
    }

    const balance: Record<string, number> = {};
    const saldoInicial: Record<string, number> = {};
    const saldoFinal: Record<string, number> = {};

    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      saldoInicial[d] = i === 0 ? initialBalance : saldoFinal[dates[i - 1]];
      balance[d] = dailyRevenue[d] + dailyExpense[d];
      saldoFinal[d] = saldoInicial[d] + balance[d];
    }

    return { dailyRevenue, dailyExpense, balance, saldoInicial, saldoFinal };
  }, [data, filteredDates, initialBalance]);

  const openPanel = useCallback(
    (label: string, filterFn: (e: RawEntry) => boolean) => {
      const txns = entries.filter(filterFn);
      setPanelTransactions(txns);
      setPanelLabel(label);
      setPanelFilterFn(() => filterFn);
      setPanelOpen(true);
    },
    [entries]
  );

  const handlePanelDateChange = useCallback(
    (txnIndex: number, newDate: string) => {
      if (!onDateChange || !panelFilterFn) return;
      // Find the real index in the full entries array
      const filtered = entries.filter(panelFilterFn);
      const txn = filtered[txnIndex];
      const realIndex = entries.indexOf(txn);
      if (realIndex >= 0) {
        onDateChange(realIndex, newDate);
        // Refresh panel transactions
        const updatedEntries = [...entries];
        updatedEntries[realIndex] = { ...txn, dataMovimento: newDate };
        setPanelTransactions(updatedEntries.filter(panelFilterFn));
      }
    },
    [entries, onDateChange, panelFilterFn]
  );

  const getOriginalDate = useCallback(
    (entry: RawEntry) => {
      if (!originalEntries) return undefined;
      const idx = entries.indexOf(entry);
      if (idx >= 0 && originalEntries[idx]) {
        return originalEntries[idx].dataMovimento;
      }
      return undefined;
    },
    [entries, originalEntries]
  );

  const dates = filteredDates;

  if (dates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        Nenhuma data encontrada no intervalo selecionado.
      </p>
    );
  }

  const getHighlight = (d: string): "improved" | "worsened" | undefined => {
    if (!comparisonSaldoFinal) return undefined;
    const orig = comparisonSaldoFinal[d];
    const sim = computedRows.saldoFinal[d];
    if (orig === undefined || sim === undefined) return undefined;
    if (sim > orig) return "improved";
    if (sim < orig) return "worsened";
    return undefined;
  };

  return (
    <>
      {title && (
        <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
      )}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-max w-full text-sm">
          <colgroup>
            <col />
            {dates.map((d) => (
              <col key={d} className={d === todayIso ? "bg-primary/5" : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-header-bg text-header-foreground">
              <th className="sticky left-0 z-10 bg-header-bg px-4 py-2 text-left font-semibold min-w-[200px]">
                Descrição
              </th>
              {dates.map((d) => (
                <th
                  key={d}
                  onClick={() => setDaySummaryDate(d)}
                  className={cn(
                    "px-3 py-2 text-right font-semibold whitespace-nowrap min-w-[130px] cursor-pointer hover:bg-primary/20 transition-colors",
                    d === todayIso && "bg-primary/30 text-foreground ring-1 ring-primary"
                  )}
                  title="Ver resumo do dia"
                >
                  {formatDateBR(d)}
                  {d === todayIso && <span className="ml-1 text-[10px] uppercase">(hoje)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Saldo Inicial */}
            <tr className="bg-section-bg font-semibold">
              <td className="sticky left-0 z-10 bg-section-bg px-4 py-2 text-section-foreground">
                <div className="flex items-center gap-2">
                  Saldo Inicial
                  {!readOnly && (
                    <Input
                      type="number"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                      className="w-32 h-7 text-xs"
                      placeholder="R$ 0,00"
                    />
                  )}
                </div>
              </td>
              {dates.map((d) => (
                <ClickableValueCell key={d} value={computedRows.saldoInicial[d]} colored />
              ))}
            </tr>

            {/* Receitas header */}
            <tr
              className="bg-positive-row-bg cursor-pointer select-none"
              onClick={() => setRevenueExpanded(!revenueExpanded)}
            >
              <td className="sticky left-0 z-10 bg-positive-row-bg px-4 py-1.5 font-bold text-positive-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {revenueExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  📈 Receitas
                </span>
              </td>
              {dates.map((d) => (
                <td key={d} className="px-3 py-1.5 text-right font-bold text-positive-foreground whitespace-nowrap">
                  {computedRows.dailyRevenue[d] ? formatCurrency(computedRows.dailyRevenue[d]) : "—"}
                </td>
              ))}
            </tr>

            {revenueExpanded &&
              data.revenueCategories.map((cat) => (
                <tr key={cat} className="hover:bg-row-alt transition-colors">
                  <td className="sticky left-0 z-10 bg-card px-6 py-1.5 text-foreground">{cat}</td>
                  {dates.map((d) => {
                    const v = data.matrix[`rev::${cat}`]?.[d] || 0;
                    return (
                      <td
                        key={d}
                        className="px-3 py-1.5 text-right whitespace-nowrap text-foreground cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() =>
                          openPanel(`${cat} — ${formatDateBR(d)}`, (e) => e.dataMovimento === d && (e.categoria1 || "Sem categoria") === cat && e.valor > 0)
                        }
                      >
                        {v !== 0 ? formatCurrency(v) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}

            {/* Despesas header */}
            <tr
              className="bg-negative-row-bg cursor-pointer select-none"
              onClick={() => setExpenseExpanded(!expenseExpanded)}
            >
              <td className="sticky left-0 z-10 bg-negative-row-bg px-4 py-1.5 font-bold text-negative-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {expenseExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  📉 Despesas
                </span>
              </td>
              {dates.map((d) => (
                <td key={d} className="px-3 py-1.5 text-right font-bold text-negative-foreground whitespace-nowrap">
                  {computedRows.dailyExpense[d] ? formatCurrency(computedRows.dailyExpense[d]) : "—"}
                </td>
              ))}
            </tr>

            {expenseExpanded &&
              data.expenseCategories.map((cat) => (
                <tr key={cat} className="hover:bg-row-alt transition-colors">
                  <td className="sticky left-0 z-10 bg-card px-6 py-1.5 text-foreground">{cat}</td>
                  {dates.map((d) => {
                    const v = data.matrix[`exp::${cat}`]?.[d] || 0;
                    return (
                      <td
                        key={d}
                        className="px-3 py-1.5 text-right whitespace-nowrap text-foreground cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() =>
                          openPanel(`${cat} — ${formatDateBR(d)}`, (e) => e.dataMovimento === d && (e.categoria1 || "Sem categoria") === cat && e.valor < 0)
                        }
                      >
                        {v !== 0 ? formatCurrency(v) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}

            {/* Balanço */}
            <tr className="bg-section-bg font-semibold border-t-2 border-border">
              <td className="sticky left-0 z-10 bg-section-bg px-4 py-2 text-section-foreground">
                Balanço do Dia
              </td>
              {dates.map((d) => (
                <ClickableValueCell
                  key={d}
                  value={computedRows.balance[d]}
                  colored
                  onClick={() => openPanel(`Balanço — ${formatDateBR(d)}`, (e) => e.dataMovimento === d)}
                />
              ))}
            </tr>

            {/* Saldo Final */}
            <tr className="bg-saldo-final-bg border-t-4 border-primary">
              <td className="sticky left-0 z-10 bg-saldo-final-bg px-4 py-3 text-saldo-final-foreground text-base font-extrabold">
                💰 Saldo Final
              </td>
              {dates.map((d) => {
                const v = computedRows.saldoFinal[d];
                const hl = getHighlight(d);
                return (
                  <td
                    key={d}
                    className={cn(
                      "px-3 py-3 text-right whitespace-nowrap text-base font-extrabold",
                      v < 0 ? "text-negative-foreground" : v > 0 ? "text-positive-foreground" : "text-saldo-final-foreground",
                      hl === "improved" && "bg-positive/20",
                      hl === "worsened" && "bg-negative/20"
                    )}
                  >
                    {formatCurrency(v)}
                  </td>
                );
              })}
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-header-bg text-header-foreground">
              <th className="sticky left-0 z-10 bg-header-bg px-4 py-2 text-left font-semibold min-w-[200px]">
                Descrição
              </th>
              {dates.map((d) => (
                <th
                  key={d}
                  onClick={() => setDaySummaryDate(d)}
                  className={cn(
                    "px-3 py-2 text-right font-semibold whitespace-nowrap min-w-[130px] cursor-pointer hover:bg-primary/20 transition-colors",
                    d === todayIso && "bg-primary/30 text-foreground ring-1 ring-primary"
                  )}
                >
                  {formatDateBR(d)}
                </th>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <TransactionPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        transactions={panelTransactions}
        label={panelLabel}
        editable={editable}
        onDateChange={editable ? handlePanelDateChange : undefined}
        getOriginalDate={editable ? getOriginalDate : undefined}
      />

      <DaySummaryPanel
        open={daySummaryDate !== null}
        onClose={() => setDaySummaryDate(null)}
        date={daySummaryDate || ""}
        saldoInicial={daySummaryDate ? computedRows.saldoInicial[daySummaryDate] || 0 : 0}
        saldoFinal={daySummaryDate ? computedRows.saldoFinal[daySummaryDate] || 0 : 0}
        revenues={
          daySummaryDate
            ? data.revenueCategories
                .map((cat) => ({ categoria: cat, valor: data.matrix[`rev::${cat}`]?.[daySummaryDate] || 0 }))
                .filter((r) => r.valor !== 0)
            : []
        }
        expenses={
          daySummaryDate
            ? data.expenseCategories
                .map((cat) => ({ categoria: cat, valor: data.matrix[`exp::${cat}`]?.[daySummaryDate] || 0 }))
                .filter((r) => r.valor !== 0)
            : []
        }
      />
    </>
  );
};

export default CashFlowTable;
