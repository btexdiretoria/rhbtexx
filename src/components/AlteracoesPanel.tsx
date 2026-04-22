import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
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
}

const AlteracoesPanel = ({ items, onChange, baseSaldoFinal }: Props) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [valueStr, setValueStr] = useState("");

  const totalAlteracoes = useMemo(
    () => items.reduce((acc, i) => acc + (Number(i.value) || 0), 0),
    [items],
  );
  const saldoTotal = baseSaldoFinal + totalAlteracoes;

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

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.date.localeCompare(b.date)),
    [items],
  );

  const saldoColor =
    saldoTotal > 0
      ? "text-positive-foreground"
      : saldoTotal < 0
        ? "text-negative-foreground"
        : "text-muted-foreground";

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">✍️ Alterações</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-2 print:hidden">
            <Plus className="h-4 w-4" />
            Inserir Acontecimento
          </Button>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
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
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="text-sm text-muted-foreground">
              Saldo Final do período:{" "}
              <span className="font-medium text-foreground">{formatCurrency(baseSaldoFinal)}</span>
              <span className="mx-2">+</span>
              Alterações:{" "}
              <span className="font-medium text-foreground">{formatCurrency(totalAlteracoes)}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Saldo Total</p>
              <p className={cn("text-lg font-bold", saldoColor)}>{formatCurrency(saldoTotal)}</p>
            </div>
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
