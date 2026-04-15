import { useState } from "react";
import { RawEntry, formatCurrency, formatDateBR } from "@/lib/cashflow";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";

interface TransactionPanelProps {
  open: boolean;
  onClose: () => void;
  transactions: RawEntry[];
  label: string;
  editable?: boolean;
  onDateChange?: (entryIndex: number, newDate: string) => void;
  getOriginalDate?: (entry: RawEntry) => string | undefined;
}

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TransactionPanel = ({ open, onClose, transactions, label, editable, onDateChange, getOriginalDate }: TransactionPanelProps) => {
  const total = transactions.reduce((sum, t) => sum + t.valor, 0);
  const [openPopoverIdx, setOpenPopoverIdx] = useState<number | null>(null);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] h-full flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Detalhes dos Lançamentos</SheetTitle>
          <SheetDescription>{label}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lançamento encontrado.</p>
          ) : (
            transactions.map((t, i) => {
              const origDate = getOriginalDate?.(t);
              const wasEdited = origDate && origDate !== t.dataMovimento;
              return (
                <div key={i} className={cn("border border-border rounded-md px-3 py-2 space-y-0.5 text-sm", wasEdited && "border-primary/50 bg-primary/5")}>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Data Mov.</span>
                    {editable && onDateChange ? (
                      <Popover open={openPopoverIdx === i} onOpenChange={(v) => setOpenPopoverIdx(v ? i : null)}>
                        <PopoverTrigger asChild>
                          <button className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                            {t.dataMovimento ? formatDateBR(t.dataMovimento) : "—"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={isoToDate(t.dataMovimento)}
                            onSelect={(d) => {
                              if (d) {
                                onDateChange(i, dateToIso(d));
                                setOpenPopoverIdx(null);
                              }
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-foreground">{t.dataMovimento ? formatDateBR(t.dataMovimento) : "—"}</span>
                    )}
                  </div>
                  {wasEdited && origDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Data original</span>
                      <span className="text-muted-foreground text-xs line-through">{formatDateBR(origDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Mov.</span>
                    <span className="text-foreground">{t.dataMovimento ? formatDateBR(t.dataMovimento) : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descrição</span>
                    <span className="text-foreground truncate ml-4 text-right">{t.descricao || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria</span>
                    <span className="text-foreground">{t.categoria1 || "Sem categoria"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Situação</span>
                    <span className="text-foreground">{t.situacao || "—"}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground">Valor</span>
                    <span className={t.valor >= 0 ? "text-positive-foreground" : "text-negative-foreground"}>
                      {formatCurrency(t.valor)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {transactions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border flex justify-between font-bold text-sm">
            <span className="text-foreground">Total</span>
            <span className={total >= 0 ? "text-positive-foreground" : "text-negative-foreground"}>
              {formatCurrency(total)}
            </span>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TransactionPanel;
