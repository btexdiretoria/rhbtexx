import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import { formatCurrency, type CashFlowData } from "@/lib/cashflow";
import { cn } from "@/lib/utils";

interface Props {
  data: CashFlowData;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function MonthlyBalance({ data }: Props) {
  // Compute saldo final per date (cumulative)
  const monthlyBalances = useMemo(() => {
    const result: { key: string; label: string; saldoFinal: number; lastDate: string }[] = [];
    let cumulative = 0;
    const byMonth: Record<string, { lastDate: string; saldoFinal: number }> = {};

    for (const d of data.dates) {
      let rev = 0, exp = 0;
      for (const cat of data.revenueCategories) rev += data.matrix[`rev::${cat}`]?.[d] || 0;
      for (const cat of data.expenseCategories) exp += data.matrix[`exp::${cat}`]?.[d] || 0;
      cumulative += rev + exp;
      const monthKey = d.slice(0, 7); // YYYY-MM
      byMonth[monthKey] = { lastDate: d, saldoFinal: cumulative };
    }

    Object.keys(byMonth).sort().forEach((key) => {
      const [y, m] = key.split("-");
      result.push({
        key,
        label: `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`,
        saldoFinal: byMonth[key].saldoFinal,
        lastDate: byMonth[key].lastDate,
      });
    });
    return result;
  }, [data]);

  const [selected, setSelected] = useState<string[]>([]);

  // Default: all months selected
  const effectiveSelected = selected.length === 0 ? monthlyBalances.map((m) => m.key) : selected;
  const visible = monthlyBalances.filter((m) => effectiveSelected.includes(m.key));

  const toggle = (key: string) => {
    const base = selected.length === 0 ? monthlyBalances.map((m) => m.key) : selected;
    setSelected(base.includes(key) ? base.filter((k) => k !== key) : [...base, key]);
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Saldo Mensal</CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 print:hidden">
              Filtrar meses ({visible.length}/{monthlyBalances.length})
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <ScrollArea className="h-64">
              <div className="p-2 space-y-1">
                {monthlyBalances.length === 0 && (
                  <p className="text-xs text-muted-foreground p-2">Nenhum mês disponível</p>
                )}
                {monthlyBalances.map((m) => (
                  <label
                    key={m.key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={effectiveSelected.includes(m.key)}
                      onCheckedChange={() => toggle(m.key)}
                    />
                    <span className="truncate flex-1">{m.label}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum mês selecionado</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-md">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted text-muted-foreground">
                  <th className="px-4 py-2 text-left font-semibold">Mês</th>
                  <th className="px-4 py-2 text-right font-semibold">Saldo Final</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <tr key={m.key} className="border-t border-border hover:bg-accent/30">
                    <td className="px-4 py-2 text-foreground">{m.label}</td>
                    <td
                      className={cn(
                        "px-4 py-2 text-right font-semibold tabular-nums",
                        m.saldoFinal >= 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {formatCurrency(m.saldoFinal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
