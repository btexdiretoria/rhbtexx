import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatCurrency, formatDateBR } from "@/lib/cashflow";

interface CategoryValue {
  categoria: string;
  valor: number;
}

interface DaySummaryPanelProps {
  open: boolean;
  onClose: () => void;
  date: string;
  saldoInicial: number;
  saldoFinal: number;
  revenues: CategoryValue[];
  expenses: CategoryValue[];
}

const DaySummaryPanel = ({ open, onClose, date, saldoInicial, saldoFinal, revenues, expenses }: DaySummaryPanelProps) => {
  const totalRev = revenues.reduce((s, r) => s + r.valor, 0);
  const totalExp = expenses.reduce((s, r) => s + r.valor, 0);
  const balance = totalRev + totalExp;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] h-full flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Resumo do Dia</SheetTitle>
          <SheetDescription>{date ? formatDateBR(date) : ""}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex-1 overflow-y-auto space-y-4 min-h-0">
          <div className="flex justify-between items-center bg-section-bg px-3 py-2 rounded-md">
            <span className="font-semibold text-section-foreground">Saldo Inicial</span>
            <span className={saldoInicial < 0 ? "text-negative-foreground font-semibold" : "text-foreground font-semibold"}>
              {formatCurrency(saldoInicial)}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center bg-positive-row-bg px-3 py-2 rounded-md mb-1">
              <span className="font-bold text-positive-foreground">📈 Receitas</span>
              <span className="font-bold text-positive-foreground">{formatCurrency(totalRev)}</span>
            </div>
            {revenues.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-1">Nenhuma receita.</p>
            ) : (
              <div className="space-y-0.5">
                {revenues.map((r) => (
                  <div key={r.categoria} className="flex justify-between text-sm px-3 py-1 hover:bg-row-alt rounded">
                    <span className="text-foreground">{r.categoria}</span>
                    <span className="text-foreground">{formatCurrency(r.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center bg-negative-row-bg px-3 py-2 rounded-md mb-1">
              <span className="font-bold text-negative-foreground">📉 Despesas</span>
              <span className="font-bold text-negative-foreground">{formatCurrency(totalExp)}</span>
            </div>
            {expenses.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-1">Nenhuma despesa.</p>
            ) : (
              <div className="space-y-0.5">
                {expenses.map((r) => (
                  <div key={r.categoria} className="flex justify-between text-sm px-3 py-1 hover:bg-row-alt rounded">
                    <span className="text-foreground">{r.categoria}</span>
                    <span className="text-foreground">{formatCurrency(r.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center bg-section-bg px-3 py-2 rounded-md">
            <span className="font-semibold text-section-foreground">Balanço do Dia</span>
            <span className={balance < 0 ? "text-negative-foreground font-semibold" : "text-positive-foreground font-semibold"}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex justify-between font-bold text-base bg-saldo-final-bg px-3 py-2 rounded-md">
          <span className="text-saldo-final-foreground">💰 Saldo Final</span>
          <span className={saldoFinal < 0 ? "text-negative-foreground" : "text-positive-foreground"}>
            {formatCurrency(saldoFinal)}
          </span>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DaySummaryPanel;
