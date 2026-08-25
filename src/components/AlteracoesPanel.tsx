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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Plus, Trash2, ChevronDown, ChevronRight, FolderPlus, GripVertical, Pencil } from "lucide-react";
import { formatCurrency, formatDateBR } from "@/lib/cashflow";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type AlteracaoImpact = "dre" | "caixa" | "ambos";

export const IMPACT_LABEL: Record<AlteracaoImpact, string> = {
  dre: "DRE",
  caixa: "Caixa",
  ambos: "DRE/Caixa",
};

export interface AlteracaoItem {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  value: number;
  groupId?: string | null;
  impact?: AlteracaoImpact;
}


export interface AlteracaoGroup {
  id: string;
  name: string;
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
  enableGroups?: boolean;
  groups?: AlteracaoGroup[];
  onGroupsChange?: (groups: AlteracaoGroup[]) => void;
}


const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const AlteracoesPanel = ({ items, onChange, valorPrevisto = 0, onValorPrevistoChange, title = "✍️ Eventualidades", totalLabel = "Valor total de eventualidades do mês", hideMonthYearFilters = false, enableGroups = false, groups = [], onGroupsChange }: Props) => {
  const today = new Date();
  const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
  const currentYear = today.getFullYear();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [valueStr, setValueStr] = useState("");
  const [impact, setImpact] = useState<AlteracaoImpact>("ambos");

  const [monthFilter, setMonthFilter] = useState<string>(hideMonthYearFilters ? "all" : currentMonth); // "all" | "YYYY-MM"
  const [yearFilter, setYearFilter] = useState<string>(String(currentYear));
  const [valorPrevistoStr, setValorPrevistoStr] = useState<string>(valorPrevisto ? String(valorPrevisto) : "");
  const [listOpen, setListOpen] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState("");

  const addGroup = () => {
    if (!onGroupsChange) return;
    const name = window.prompt("Nome da separação:");
    if (!name || !name.trim()) return;
    const newGroup: AlteracaoGroup = {
      id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
    };
    onGroupsChange([...groups, newGroup]);
  };

  const deleteGroup = (id: string) => {
    if (!onGroupsChange) return;
    onGroupsChange(groups.filter((g) => g.id !== id));
    // Move items back to ungrouped
    onChange(items.map((it) => (it.groupId === id ? { ...it, groupId: null } : it)));
  };

  const renameGroup = (id: string, name: string) => {
    if (!onGroupsChange) return;
    onGroupsChange(groups.map((g) => (g.id === id ? { ...g, name } : g)));
  };

  const handleDragStart = (id: string) => (e: React.DragEvent) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDropOnGroup = (groupId: string | null) => (e: React.DragEvent) => {
    e.preventDefault();
    const id = draggingId || e.dataTransfer.getData("text/plain");
    if (!id) return;
    onChange(items.map((it) => (it.id === id ? { ...it, groupId } : it)));
    setDraggingId(null);
    setDragOverGroup(null);
  };

  const moveToGroup = (id: string, groupId: string | null) => {
    onChange(items.map((it) => (it.id === id ? { ...it, groupId } : it)));
  };


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
    setImpact("ambos");
    setEditingId(null);
  };

  const startEdit = (it: AlteracaoItem) => {
    setEditingId(it.id);
    setDate(it.date || "");
    setDescription(it.description || "");
    setValueStr(String(it.value ?? ""));
    setImpact(it.impact ?? "ambos");
    setOpen(true);
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
    if (editingId) {
      onChange(
        items.map((i) =>
          i.id === editingId ? { ...i, date, description: description.trim(), value: parsed, impact } : i,
        ),
      );
      reset();
      setOpen(false);
      toast.success("Lançamento atualizado.");
      return;
    }
    const item: AlteracaoItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      description: description.trim(),
      value: parsed,
      impact,
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
            {!hideMonthYearFilters && (
              <>
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
              </>
            )}

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
              <Label className="text-xs text-muted-foreground">{hideMonthYearFilters ? "Resultado anual" : "Resultado mensal"}</Label>
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
            {enableGroups && onGroupsChange && (
              <Button variant="outline" size="sm" onClick={addGroup} className="gap-1 ml-auto">
                <FolderPlus className="h-4 w-4" />
                Nova separação
              </Button>
            )}
          </div>

          {listOpen && (
            enableGroups ? (
              (() => {
                const buckets: { id: string | null; name: string }[] = [
                  ...groups.map((g) => ({ id: g.id, name: g.name })),
                  { id: null, name: "Sem separação" },
                ];
                const renderRow = (it: AlteracaoItem) => (
                  <ContextMenu key={it.id}>
                    <ContextMenuTrigger asChild>
                      <tr
                        draggable
                        onDragStart={handleDragStart(it.id)}
                        onDragEnd={() => setDraggingId(null)}
                        className={cn(
                          "border-t border-border hover:bg-row-alt transition-colors cursor-move",
                          draggingId === it.id && "opacity-50",
                        )}
                      >
                        <td className="px-2 py-1.5 w-6 text-muted-foreground">
                          <GripVertical className="h-3.5 w-3.5" />
                        </td>
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
                        <td className="px-3 py-1.5 text-right print:hidden whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEdit(it)}
                            aria-label="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
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
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56">
                      <ContextMenuItem onSelect={() => startEdit(it)}>Editar lançamento</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuLabel>Mover para separação</ContextMenuLabel>
                      <ContextMenuSeparator />
                      {groups.length === 0 && (
                        <ContextMenuItem disabled>Nenhuma separação criada</ContextMenuItem>
                      )}
                      {groups.map((g) => (
                        <ContextMenuItem
                          key={g.id}
                          disabled={(it.groupId || null) === g.id}
                          onSelect={() => moveToGroup(it.id, g.id)}
                        >
                          {g.name}
                        </ContextMenuItem>
                      ))}
                      {(it.groupId || null) !== null && (
                        <>
                          <ContextMenuSeparator />
                          <ContextMenuItem onSelect={() => moveToGroup(it.id, null)}>
                            Remover da separação
                          </ContextMenuItem>
                        </>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                );

                return (
                  <div className="space-y-3">
                    {buckets.map((b) => {
                      const rows = sorted.filter((it) => (it.groupId || null) === b.id);
                      const subtotal = rows.reduce((a, r) => a + (r.value || 0), 0);
                      const isEditing = renamingGroupId === b.id;
                      return (
                        <div
                          key={b.id ?? "__none__"}
                          onDragOver={(e) => { e.preventDefault(); setDragOverGroup(b.id ?? "__none__"); }}
                          onDragLeave={() => setDragOverGroup(null)}
                          onDrop={handleDropOnGroup(b.id)}
                          className={cn(
                            "border border-border rounded-lg overflow-hidden transition-colors",
                            dragOverGroup === (b.id ?? "__none__") && "ring-2 ring-primary bg-primary/5",
                          )}
                        >
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border">
                            {b.id && isEditing ? (
                              <Input
                                autoFocus
                                value={renamingName}
                                onChange={(e) => setRenamingName(e.target.value)}
                                onBlur={() => {
                                  if (renamingName.trim()) renameGroup(b.id!, renamingName.trim());
                                  setRenamingGroupId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
                                  if (e.key === "Escape") setRenamingGroupId(null);
                                }}
                                className="h-7 max-w-xs"
                              />
                            ) : (
                              <span className="font-semibold text-sm text-foreground">{b.name}</span>
                            )}
                            <span className="text-xs text-muted-foreground">({rows.length})</span>
                            <span
                              className={cn(
                                "ml-auto text-sm font-medium tabular-nums",
                                subtotal > 0 ? "text-positive-foreground" : subtotal < 0 ? "text-negative-foreground" : "text-muted-foreground",
                              )}
                            >
                              {formatCurrency(subtotal)}
                            </span>
                            {b.id && onGroupsChange && (
                              <div className="flex items-center gap-1 print:hidden">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => { setRenamingGroupId(b.id!); setRenamingName(b.name); }}
                                  aria-label="Renomear separação"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    if (window.confirm(`Excluir a separação "${b.name}"? Os itens voltarão para "Sem separação".`)) {
                                      deleteGroup(b.id!);
                                    }
                                  }}
                                  aria-label="Excluir separação"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {rows.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">
                              Arraste acontecimentos para esta separação.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="bg-header-bg text-header-foreground">
                                    <th className="w-6" />
                                    <th className="px-3 py-2 text-left font-semibold">Data</th>
                                    <th className="px-3 py-2 text-left font-semibold">Descrição</th>
                                    <th className="px-3 py-2 text-right font-semibold">Valor</th>
                                    <th className="px-3 py-2 text-right font-semibold print:hidden">Ações</th>
                                  </tr>
                                </thead>
                                <tbody>{rows.map(renderRow)}</tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (sorted.length === 0 ? (
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
                        <td className="px-3 py-1.5 text-right print:hidden whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEdit(it)}
                            aria-label="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
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
            ))
          )}


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
            <DialogTitle>{editingId ? "Editar Lançamento" : "Inserir Acontecimento"}</DialogTitle>
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
            <div className="space-y-2">
              <Label htmlFor="alt-impact">Impacto</Label>
              <Select value={impact} onValueChange={(v) => setImpact(v as AlteracaoImpact)}>
                <SelectTrigger id="alt-impact">
                  <SelectValue placeholder="Selecione o impacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dre">{IMPACT_LABEL.dre}</SelectItem>
                  <SelectItem value="caixa">{IMPACT_LABEL.caixa}</SelectItem>
                  <SelectItem value="ambos">{IMPACT_LABEL.ambos}</SelectItem>
                </SelectContent>
              </Select>
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
