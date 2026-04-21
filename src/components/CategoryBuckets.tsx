import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, type RawEntry } from "@/lib/cashflow";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BucketKey = "receitas" | "despesas_op" | "demais_despesas";

const BUCKETS: { key: BucketKey; title: string }[] = [
  { key: "receitas", title: "Receitas" },
  { key: "despesas_op", title: "Despesas O.P" },
  { key: "demais_despesas", title: "Demais Despesas" },
];

interface Props {
  entries: RawEntry[];
  startDate: string;
  endDate: string;
}

export default function CategoryBuckets({ entries, startDate, endDate }: Props) {
  const [assignments, setAssignments] = useState<Record<string, BucketKey>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("cashflow_bucket_categories").select("category, bucket");
      if (error) {
        console.error(error);
      } else if (data) {
        const map: Record<string, BucketKey> = {};
        for (const r of data) map[r.category] = r.bucket as BucketKey;
        setAssignments(map);
      }
      setLoaded(true);
    })();
  }, []);

  // All categories in the period
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      if (startDate && e.dataMovimento < startDate) continue;
      if (endDate && e.dataMovimento > endDate) continue;
      const cat = e.categoria1 || "Sem categoria";
      set.add(cat);
    }
    return Array.from(set).sort();
  }, [entries, startDate, endDate]);

  // Entries in period grouped by category
  const entriesByCategory = useMemo(() => {
    const map: Record<string, { description: string; valor: number }[]> = {};
    for (const e of entries) {
      if (startDate && e.dataMovimento < startDate) continue;
      if (endDate && e.dataMovimento > endDate) continue;
      const cat = e.categoria1 || "Sem categoria";
      if (!map[cat]) map[cat] = [];
      map[cat].push({
        description: e.descricao || e.nome || cat,
        valor: e.valor,
      });
    }
    return map;
  }, [entries, startDate, endDate]);

  const bucketCategories = (b: BucketKey) =>
    Object.entries(assignments)
      .filter(([, v]) => v === b)
      .map(([k]) => k);

  const toggleCategory = async (category: string, bucket: BucketKey) => {
    const current = assignments[category];
    if (current === bucket) {
      // remove
      const next = { ...assignments };
      delete next[category];
      setAssignments(next);
      const { error } = await supabase.from("cashflow_bucket_categories").delete().eq("category", category);
      if (error) {
        toast.error("Erro ao remover categoria");
        setAssignments(assignments);
      }
    } else {
      const next = { ...assignments, [category]: bucket };
      setAssignments(next);
      const { error } = await supabase
        .from("cashflow_bucket_categories")
        .upsert({ category, bucket }, { onConflict: "category" });
      if (error) {
        toast.error("Erro ao salvar categoria");
        setAssignments(assignments);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {BUCKETS.map(({ key, title }) => {
        const selected = bucketCategories(key);
        // Available options = unassigned OR already in this bucket
        const available = allCategories.filter((c) => !assignments[c] || assignments[c] === key);

        const items = selected.flatMap((cat) =>
          (entriesByCategory[cat] || []).map((it, i) => ({ ...it, cat, key: `${cat}-${i}` }))
        );
        const subtotal = items.reduce((s, it) => s + it.valor, 0);

        return (
          <Card key={key} className="flex flex-col min-h-[280px] bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span className="truncate">
                      Selecionar categorias{selected.length > 0 ? ` (${selected.length})` : ""}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <ScrollArea className="max-h-64">
                    <div className="p-2 space-y-1">
                      {!loaded && <p className="text-xs text-muted-foreground p-2">Carregando...</p>}
                      {loaded && available.length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">Nenhuma categoria disponível</p>
                      )}
                      {available.map((cat) => {
                        const checked = assignments[cat] === key;
                        return (
                          <label
                            key={cat}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                          >
                            <Checkbox checked={checked} onCheckedChange={() => toggleCategory(cat, key)} />
                            <span className="truncate flex-1">{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <div className="flex-1 border border-border rounded-md overflow-hidden flex flex-col">
                <div className="grid grid-cols-[1fr_auto] bg-muted/60 text-xs font-semibold text-muted-foreground px-3 py-1.5 border-b border-border">
                  <span>Descrição</span>
                  <span className="text-right">Valor</span>
                </div>
                <ScrollArea className="flex-1 max-h-72">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center">
                      Selecione categorias para visualizar lançamentos
                    </p>
                  ) : (
                    <div>
                      {items.map((it) => (
                        <div
                          key={it.key}
                          className="grid grid-cols-[1fr_auto] gap-2 px-3 py-1.5 text-xs border-b border-border/50 last:border-0 hover:bg-accent/30"
                        >
                          <span className="truncate" title={it.description}>{it.description}</span>
                          <span
                            className={cn(
                              "text-right font-medium tabular-nums",
                              it.valor >= 0 ? "text-success" : "text-destructive"
                            )}
                          >
                            {formatCurrency(it.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-muted border-t border-border text-sm font-semibold">
                  <span>Subtotal</span>
                  <span
                    className={cn(
                      "text-right tabular-nums",
                      subtotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
