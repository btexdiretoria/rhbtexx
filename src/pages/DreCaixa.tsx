import React, { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, FileDown, Settings2, Trash2, Pencil, Plus, AlertTriangle, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { parseDreFile, formatCurrency, type DreParsed } from "@/lib/dreParser";
import { buildCompareModel, UNMAPPED_GROUP } from "@/lib/dreCompare";
import { exportDreCaixaPDF } from "@/utils/dreCaixaPdf";
import {
  useDreCategoryMap,
  useDreDatasets,
  useSaveDreDataset,
  useClearDreDataset,
  useSaveDreCategory,
  useSaveDreCategoriesBatch,
  useDeleteDreCategory,
} from "@/hooks/useDreCaixa";
import { useCompanySettings } from "@/hooks/useFinancial";

type Kind = "dre" | "caixa";

const UploadBox = ({
  title,
  fileName,
  onFile,
  onClear,
}: {
  title: string;
  fileName?: string | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {fileName || "Nenhum arquivo carregado"}
        </p>
      </div>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Button variant="outline" size="sm" onClick={() => ref.current?.click()}>
        Enviar
      </Button>
      {fileName && (
        <Button variant="ghost" size="icon" onClick={onClear} title="Remover">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </Card>
  );
};

export default function DreCaixa() {
  const { toast } = useToast();
  const { data: mapping = [] } = useDreCategoryMap();
  const { data: datasets = [] } = useDreDatasets();
  const { data: company } = useCompanySettings();
  const saveDataset = useSaveDreDataset();
  const clearDataset = useClearDreDataset();
  const saveCategory = useSaveDreCategory();
  const saveBatch = useSaveDreCategoriesBatch();
  const deleteCategory = useDeleteDreCategory();

  const [paramOpen, setParamOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [groupName, setGroupName] = useState("");

  const dre = datasets.find((d) => d.kind === "dre");
  const caixa = datasets.find((d) => d.kind === "caixa");

  const model = useMemo(
    () =>
      buildCompareModel(
        dre?.rows_data ?? [],
        caixa?.rows_data ?? [],
        dre?.months ?? [],
        caixa?.months ?? [],
        mapping
      ),
    [dre, caixa, mapping]
  );

  const existingGroups = useMemo(
    () => Array.from(new Set(mapping.map((m) => m.group_name))).sort(),
    [mapping]
  );

  const unmappedCount = model.groups.find((g) => g.group === UNMAPPED_GROUP)?.rows.length ?? 0;

  const handleUpload = async (kind: Kind, file: File) => {
    try {
      const parsed: DreParsed = await parseDreFile(file);
      if (!parsed.months.length) throw new Error("Nenhuma coluna de mês encontrada.");
      await saveDataset.mutateAsync({ kind, parsed });
      toast({
        title: `${kind === "dre" ? "DRE" : "Caixa"} carregado`,
        description: `${parsed.rows.length} linhas • ${parsed.months.join(", ")}`,
      });
    } catch (e: any) {
      toast({ title: "Erro ao processar arquivo", description: e.message, variant: "destructive" });
    }
  };

  const submitCategory = async () => {
    if (!catName.trim() || !groupName.trim()) {
      toast({ title: "Preencha categoria e grupo", variant: "destructive" });
      return;
    }
    try {
      await saveCategory.mutateAsync({ id: editingId ?? undefined, category_name: catName, group_name: groupName });
      setEditingId(null);
      setCatName("");
      setGroupName("");
      toast({ title: "Parametrização salva" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const importUnmapped = async () => {
    const rows = model.groups.find((g) => g.group === UNMAPPED_GROUP)?.rows ?? [];
    if (!rows.length) return;
    const target = groupName.trim() || "Sem Grupo";
    await saveBatch.mutateAsync(rows.map((r) => ({ category_name: r.categoria, group_name: target })));
    toast({ title: `${rows.length} categorias parametrizadas em "${target}"` });
  };

  const money = (v: number) => (v === 0 ? "—" : formatCurrency(v));
  const cls = (v: number) => (v < 0 ? "text-destructive" : "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">DRE / CAIXA</h1>
          <p className="text-sm text-muted-foreground">
            Comparativo entre DRE e Caixa por categoria e mês
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/fluxo"><ChevronLeft className="h-4 w-4 mr-1" /> Fluxo</Link>
          </Button>
          <Button variant="outline" onClick={() => setParamOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" /> Parametrizar Categorias
          </Button>
          <Button
            onClick={() => exportDreCaixaPDF(model, company?.company_name ?? "")}
            disabled={!model.months.length}
          >
            <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UploadBox
          title="Arquivo DRE (.xlsx)"
          fileName={dre?.file_name}
          onFile={(f) => handleUpload("dre", f)}
          onClear={() => clearDataset.mutate("dre")}
        />
        <UploadBox
          title="Arquivo Caixa (.xlsx)"
          fileName={caixa?.file_name}
          onFile={(f) => handleUpload("caixa", f)}
          onClear={() => clearDataset.mutate("caixa")}
        />
      </div>

      {unmappedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span>
            {unmappedCount} categoria(s) encontrada(s) nos arquivos sem parametrização — veja o grupo
            "{UNMAPPED_GROUP}" no final da tabela.
          </span>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th rowSpan={2} className="sticky left-0 z-10 bg-muted text-left px-3 py-2 font-semibold min-w-[240px]">
                  Categoria
                </th>
                {model.months.map((m) => (
                  <th key={m} colSpan={3} className="px-3 py-2 text-center font-semibold border-l">
                    {m}
                  </th>
                ))}
                {!model.months.length && <th className="px-3 py-2 text-left font-normal text-muted-foreground">Envie os arquivos de DRE e Caixa</th>}
              </tr>
              <tr className="bg-muted/70 text-xs">
                {model.months.flatMap((m) => [
                  <th key={`${m}-d`} className="px-3 py-1.5 text-right border-l">DRE</th>,
                  <th key={`${m}-c`} className="px-3 py-1.5 text-right">Caixa</th>,
                  <th key={`${m}-x`} className="px-3 py-1.5 text-right">Diferença</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {model.groups.filter((g) => g.rows.length).map((g) => (
                <React.Fragment key={g.group}>
                  <tr className={g.group === UNMAPPED_GROUP ? "bg-destructive/10" : "bg-accent/40"}>
                    <td
                      colSpan={1 + model.months.length * 3}
                      className={`px-3 py-1.5 font-semibold uppercase text-xs tracking-wide ${g.group === UNMAPPED_GROUP ? "text-destructive" : ""}`}
                    >
                      {g.group}
                    </td>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={`${g.group}-${r.categoria}`} className="border-t hover:bg-muted/40">
                      <td className="sticky left-0 z-10 bg-background px-3 py-1.5">{r.categoria}</td>
                      {model.months.flatMap((m) => {
                        const c = r.cells[m];
                        return [
                          <td key={`${m}-d`} className={`px-3 py-1.5 text-right border-l tabular-nums ${cls(c.dre)}`}>{money(c.dre)}</td>,
                          <td key={`${m}-c`} className={`px-3 py-1.5 text-right tabular-nums ${cls(c.caixa)}`}>{money(c.caixa)}</td>,
                          <td key={`${m}-x`} className={`px-3 py-1.5 text-right tabular-nums font-medium ${cls(c.diff)}`}>{money(c.diff)}</td>,
                        ];
                      })}
                    </tr>
                  ))}
                  <tr className="border-t bg-muted/50 font-semibold">
                    <td className="sticky left-0 z-10 bg-muted/50 px-3 py-1.5">Total {g.group}</td>
                    {model.months.flatMap((m) => {
                      const c = g.totals[m];
                      return [
                        <td key={`${m}-d`} className={`px-3 py-1.5 text-right border-l tabular-nums ${cls(c.dre)}`}>{money(c.dre)}</td>,
                        <td key={`${m}-c`} className={`px-3 py-1.5 text-right tabular-nums ${cls(c.caixa)}`}>{money(c.caixa)}</td>,
                        <td key={`${m}-x`} className={`px-3 py-1.5 text-right tabular-nums ${cls(c.diff)}`}>{money(c.diff)}</td>,
                      ];
                    })}
                  </tr>
                </React.Fragment>
              ))}
              {!!model.months.length && (
                <tr className="border-t-2 bg-primary/10 font-bold">
                  <td className="sticky left-0 z-10 bg-primary/10 px-3 py-2">TOTAL GERAL</td>
                  {model.months.flatMap((m) => {
                    const c = model.totals[m];
                    return [
                      <td key={`${m}-d`} className={`px-3 py-2 text-right border-l tabular-nums ${cls(c.dre)}`}>{money(c.dre)}</td>,
                      <td key={`${m}-c`} className={`px-3 py-2 text-right tabular-nums ${cls(c.caixa)}`}>{money(c.caixa)}</td>,
                      <td key={`${m}-x`} className={`px-3 py-2 text-right tabular-nums ${cls(c.diff)}`}>{money(c.diff)}</td>,
                    ];
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={paramOpen} onOpenChange={setParamOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Parametrizar Categorias</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
            <div className="space-y-1">
              <Label className="text-xs">Categoria (texto exato do arquivo)</Label>
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Simples Nacional - DAS" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Grupo</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Obrigações Tributárias"
                list="dre-groups"
              />
              <datalist id="dre-groups">
                {existingGroups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <Button onClick={submitCategory}>
              <Plus className="h-4 w-4 mr-1" /> {editingId ? "Salvar" : "Adicionar"}
            </Button>
          </div>

          {unmappedCount > 0 && (
            <Button variant="outline" size="sm" onClick={importUnmapped}>
              Importar {unmappedCount} categoria(s) não parametrizada(s) para o grupo informado
            </Button>
          )}

          <div className="max-h-[45vh] overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Categoria</th>
                  <th className="text-left px-3 py-2">Grupo</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {mapping.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-1.5">{m.category_name}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{m.group_name}</td>
                    <td className="px-2 py-1 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(m.id);
                          setCatName(m.category_name);
                          setGroupName(m.group_name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCategory.mutate(m.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!mapping.length && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                      Nenhuma categoria parametrizada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
