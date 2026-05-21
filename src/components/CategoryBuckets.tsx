import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDateBR, type RawEntry } from "@/lib/cashflow";
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

interface DetailEntry extends RawEntry {
  __cat: string;
}

const FIELD_LABELS: Record<keyof RawEntry, string> = {
  dataMovimento: "Data Movimento",
  identificador: "Identificador Fornecedor/Cliente",
  nome: "Nome Fornecedor/Cliente",
  recorrencia: "Recorrência",
  qtdRecorrencia: "Quantidade Recorrência",
  descricao: "Descrição",
  agendado: "Agendado",
  tipo: "Tipo",
  origemLancamento: "Origem do Lançamento",
  contaBancaria: "Conta Bancária",
  formaPgto: "Forma Pgto/Recbto",
  valor: "Valor",
  saldoConta: "Saldo Conta",
  situacao: "Situação",
  valorOriginal: "Valor Original",
  juros: "Juros",
  multa: "Multa",
  desconto: "Desconto",
  taxas: "Taxas",
  dataCompetencia: "Data Competência",
  dataOriginalVencimento: "Data Original Vencimento",
  dataPrevista: "Data Prevista",
  observacoes: "Observações",
  notaFiscal: "Nota Fiscal",
  categoria1: "Categoria 1",
  valorCategoria1: "Valor na Categoria 1",
};

const NUMERIC_FIELDS: (keyof RawEntry)[] = [
  "valor", "saldoConta", "valorOriginal", "juros", "multa", "desconto", "taxas", "valorCategoria1",
];
const DATE_FIELDS: (keyof RawEntry)[] = [
  "dataMovimento", "dataCompetencia", "dataOriginalVencimento", "dataPrevista",
];

export default function CategoryBuckets({ entries, startDate, endDate }: Props) {
  const [assignments, setAssignments] = useState<Record<string, BucketKey>>({});
  const [loaded, setLoaded] = useState(false);
  const [detail, setDetail] = useState<RawEntry | null>(null);
  const [situacaoFilter, setSituacaoFilter] = useState<Record<BucketKey, string[]>>({
    receitas: [],
    despesas_op: [],
    demais_despesas: [],
  });

  const allSituacoes = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      const s = (e.situacao || "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [entries]);

  const toggleSituacao = (bucket: BucketKey, sit: string) => {
    setSituacaoFilter((prev) => {
      const cur = prev[bucket];
      const next = cur.includes(sit) ? cur.filter((s) => s !== sit) : [...cur, sit];
      return { ...prev, [bucket]: next };
    });
  };

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

  // ALL unique categories (não filtra por data)
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      const cat = e.categoria1 || "Sem categoria";
      set.add(cat);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [entries]);

  // Entries by category (filtradas por data)
  const entriesByCategory = useMemo(() => {
    const map: Record<string, RawEntry[]> = {};
    for (const e of entries) {
      if (startDate && e.dataMovimento < startDate) continue;
      if (endDate && e.dataMovimento > endDate) continue;
      const cat = e.categoria1 || "Sem categoria";
      if (!map[cat]) map[cat] = [];
      map[cat].push(e);
    }
    return map;
  }, [entries, startDate, endDate]);

  const bucketCategories = (b: BucketKey) =>
    Object.entries(assignments).filter(([, v]) => v === b).map(([k]) => k);

  const toggleCategory = async (category: string, bucket: BucketKey) => {
    const current = assignments[category];
    if (current === bucket) {
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BUCKETS.map(({ key, title }) => {
          const selected = bucketCategories(key);
          const available = allCategories.filter((c) => !assignments[c] || assignments[c] === key);
          const sitSelected = situacaoFilter[key];

          let items: DetailEntry[] = selected.flatMap((cat) =>
            (entriesByCategory[cat] || []).map((e) => ({ ...e, __cat: cat }))
          );
          if (sitSelected.length > 0) {
            items = items.filter((it) => sitSelected.includes((it.situacao || "").trim()));
          }
          items.sort((a, b) => a.dataMovimento.localeCompare(b.dataMovimento));
          const subtotal = items.reduce((s, it) => s + it.valor, 0);

          return (
            <Card key={key} className="flex flex-col min-h-[320px] bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between print:hidden">
                      <span className="truncate">
                        Selecionar categorias{selected.length > 0 ? ` (${selected.length})` : ""}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <ScrollArea className="h-64">
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
                  <div className="grid grid-cols-[80px_1fr_auto] gap-2 bg-muted/60 text-xs font-semibold text-muted-foreground px-3 py-1.5 border-b border-border">
                    <span>Data Mov.</span>
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
                        {items.map((it, i) => {
                          const desc = it.descricao || it.nome || it.__cat;
                          return (
                            <button
                              key={`${it.__cat}-${i}`}
                              type="button"
                              onClick={() => setDetail(it)}
                              className="w-full grid grid-cols-[80px_1fr_auto] gap-2 px-3 py-1.5 text-xs border-b border-border/50 last:border-0 hover:bg-accent/50 text-left transition-colors"
                            >
                              <span className="text-muted-foreground tabular-nums">{formatDateBR(it.dataMovimento)}</span>
                              <span className="truncate" title={desc}>{desc}</span>
                              <span
                                className={cn(
                                  "text-right font-medium tabular-nums",
                                  it.valor >= 0 ? "text-success" : "text-destructive"
                                )}
                              >
                                {formatCurrency(it.valor)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-muted border-t-2 border-primary/40 text-sm font-semibold">
                    <span>Subtotal</span>
                    <span
                      className={cn(
                        "text-right tabular-nums",
                        subtotal >= 0 ? "text-success" : "text-destructive"
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

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border shrink-0">
            <DialogTitle>Detalhes do Lançamento</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {detail && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(FIELD_LABELS) as (keyof RawEntry)[]).map((field) => {
                  const raw = detail[field];
                  let display: string;
                  if (NUMERIC_FIELDS.includes(field)) {
                    display = formatCurrency(Number(raw) || 0);
                  } else if (DATE_FIELDS.includes(field)) {
                    display = raw ? formatDateBR(String(raw)) : "—";
                  } else {
                    display = raw ? String(raw) : "—";
                  }
                  return (
                    <div key={field} className="border border-border rounded-md p-2 bg-muted/30">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                        {FIELD_LABELS[field]}
                      </p>
                      <p className="text-sm text-foreground break-words mt-0.5">{display}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-3 border-t border-border shrink-0">
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
