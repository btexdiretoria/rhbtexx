import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency, formatDateBR } from "@/lib/cashflow";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface AlteracaoItem {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  value: number;
}

interface Props {
  items: AlteracaoItem[];
  onChange: (items: AlteracaoItem[]) => void;
  baseSaldoFinal: number;
  valorPrevisto?: number;
  onValorPrevistoChange?: (value: number) => void;
  title?: string;
  totalLabel?: string;
  hideMonthYearFilters?: boolean;
}


const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const AlteracoesPanel = ({ items, onChange, valorPrevisto = 0, onValorPrevistoChange, title = "✍️ Eventualidades", totalLabel = "Valor total de eventualidades do mês", hideMonthYearFilters = false }: Props) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [valueStr, setValueStr] = useState("");
  const currentYear = new Date().getFullYear();
  const [monthFilter, setMonthFilter] = useState<string>("all"); // "all" | "YYYY-MM"
  const [yearFilter, setYearFilter] = useState<string>(String(currentYear));
  const [valorPrevistoStr, setValorPrevistoStr] = useState<string>(valorPrevisto ? String(valorPrevisto) : "");
  const [listOpen, setListOpen] = useState(true);

  // Sync local input when prop changes (e.g., after restore from DB)
  useEffect(() => {
    setValorPrevistoStr(valorPrevisto ? String(valorPrevisto) : "");
  }, [valorPrevisto]);


  // Years: current year ± 5 plus any years present in items
  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    for (let y = currentYear - 5; y <= currentYear + 5; y++) set.add(y);
    for (const it of items) {
      const y = parseInt(it.date?.slice(0, 4) || "", 10);
      if (!isNaN(y)) set.add(y);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [items, currentYear]);

  const reset = () => {
    setDate("");
    setDescription("");
    setValueStr("");
  };

  const handleSave = () => {
    if (!date) {
      toast.error("Informe a data.");
      return;
    }
    if (!description.trim()) {
      toast.error("Informe a descrição.");
      return;
    }
    const parsed = parseFloat(valueStr.replace(",", "."));
    if (isNaN(parsed)) {
      toast.error("Informe um valor numérico válido.");
      return;
    }
    const item: AlteracaoItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      description: description.trim(),
      value: parsed,
    };
    onChange([...items, item]);
    reset();
    setOpen(false);
    toast.success("Acontecimento adicionado.");
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const sorted = useMemo(() => {
    const filtered = items.filter((i) => {
      if (!i.date) return monthFilter === "all";
      const [y, m] = i.date.split("-");
      if (yearFilter !== "all" && y !== yearFilter) return false;
      if (monthFilter !== "all" && m !== monthFilter) return false;
      return true;
    });
    return [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  }, [items, monthFilter, yearFilter]);

  const totalAcontecimentos = useMemo(
    () => sorted.reduce((acc, it) => acc + (it.value || 0), 0),
    [sorted],
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{title}</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-2 print:hidden">
            <Plus className="h-4 w-4" />
            Inserir Acontecimento
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top controls: Month filter + Valor Previsto Inicial */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 border-b border-border pb-4">
            <div className="space-y-1.5 md:w-44">
              <Label htmlFor="month-filter" className="text-xs text-muted-foreground">
                Mês
              </Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger id="month-filter">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {MONTH_NAMES.map((name, idx) => {
                    const mm = String(idx + 1).padStart(2, "0");
                    return (
                      <SelectItem key={mm} value={mm}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:w-32">
              <Label htmlFor="year-filter" className="text-xs text-muted-foreground">
                Ano
              </Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger id="year-filter">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:w-56">
              <Label htmlFor="valor-previsto" className="text-xs text-muted-foreground">
                Valor Previsto Inicial
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  R$
                </span>
                <Input
                  id="valor-previsto"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={valorPrevistoStr}
                  onChange={(e) => setValorPrevistoStr(e.target.value)}
                  onBlur={() => {
                    const n = parseFloat(valorPrevistoStr.replace(",", "."));
                    onValorPrevistoChange?.(isNaN(n) ? 0 : n);
                  }}
                  placeholder="0,00"
                  className="pl-9"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:w-56">
              <Label className="text-xs text-muted-foreground">Resultado anual</Label>
              <div
                className={cn(
                  "h-10 flex items-center px-3 rounded-md border border-border bg-muted/40 text-base font-bold tabular-nums",
                  (valorPrevisto + totalAcontecimentos) > 0
                    ? "text-positive-foreground"
                    : (valorPrevisto + totalAcontecimentos) < 0
                      ? "text-negative-foreground"
                      : "text-foreground",
                )}
              >
                {formatCurrency(valorPrevisto + totalAcontecimentos)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setListOpen((v) => !v)}
              className="gap-1 -ml-2"
              aria-expanded={listOpen}
            >
              {listOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {listOpen ? "Ocultar lista" : "Mostrar lista"}
              <span className="text-xs text-muted-foreground ml-1">({sorted.length})</span>
            </Button>
          </div>

          {listOpen && (sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum acontecimento cadastrado. Clique em "Inserir Acontecimento" para começar.
            </p>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-header-bg text-header-foreground">
                    <th className="px-3 py-2 text-left font-semibold">Data</th>
                    <th className="px-3 py-2 text-left font-semibold">Descrição</th>
                    <th className="px-3 py-2 text-right font-semibold">Valor</th>
                    <th className="px-3 py-2 text-right font-semibold print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((it) => (
                    <tr key={it.id} className="border-t border-border hover:bg-row-alt transition-colors">
                      <td className="px-3 py-1.5 text-foreground whitespace-nowrap">{formatDateBR(it.date)}</td>
                      <td className="px-3 py-1.5 text-foreground">{it.description}</td>
                      <td
                        className={cn(
                          "px-3 py-1.5 text-right font-medium whitespace-nowrap",
                          it.value > 0
                            ? "text-positive-foreground"
                            : it.value < 0
                              ? "text-negative-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {formatCurrency(it.value)}
                      </td>
                      <td className="px-3 py-1.5 text-right print:hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDelete(it.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}


          <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
            <span className="text-sm font-medium text-foreground">
              {totalLabel}
            </span>
            <span
              className={cn(
                "text-base font-semibold tabular-nums",
                totalAcontecimentos > 0
                  ? "text-positive-foreground"
                  : totalAcontecimentos < 0
                    ? "text-negative-foreground"
                    : "text-muted-foreground",
              )}
            >
              {formatCurrency(totalAcontecimentos)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inserir Acontecimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="alt-date">Data</Label>
              <Input
                id="alt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt-desc">Descrição</Label>
              <Textarea
                id="alt-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o acontecimento"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt-value">Valor (use sinal negativo para saídas)</Label>
              <Input
                id="alt-value"
                type="number"
                step="0.01"
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                placeholder="Ex: 1500.00 ou -1500.00"
                className={cn(
                  "font-medium",
                  valueStr && !isNaN(parseFloat(valueStr.replace(",", ".")))
                    ? parseFloat(valueStr.replace(",", ".")) > 0
                      ? "text-positive-foreground"
                      : parseFloat(valueStr.replace(",", ".")) < 0
                        ? "text-negative-foreground"
                        : ""
                    : "",
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AlteracoesPanel;
