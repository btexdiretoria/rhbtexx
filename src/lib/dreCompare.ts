import type { DreRow } from "@/lib/dreParser";
import type { DreCategoryMap } from "@/hooks/useDreCaixa";
import { monthSortValue } from "@/lib/dreParser";

export const UNMAPPED_GROUP = "Não Parametrizado";

export interface CompareCell {
  dre: number;
  caixa: number;
  diff: number;
}

export interface CompareRow {
  categoria: string;
  mapped: boolean;
  cells: Record<string, CompareCell>;
}

export interface CompareGroup {
  group: string;
  rows: CompareRow[];
  totals: Record<string, CompareCell>;
}

export interface CompareModel {
  months: string[];
  groups: CompareGroup[];
  totals: Record<string, CompareCell>;
}

function emptyCell(): CompareCell {
  return { dre: 0, caixa: 0, diff: 0 };
}

function addInto(target: Record<string, CompareCell>, months: string[], cells: Record<string, CompareCell>) {
  months.forEach((m) => {
    if (!target[m]) target[m] = emptyCell();
    target[m].dre += cells[m]?.dre ?? 0;
    target[m].caixa += cells[m]?.caixa ?? 0;
    target[m].diff += cells[m]?.diff ?? 0;
  });
}

export function buildCompareModel(
  dreRows: DreRow[],
  caixaRows: DreRow[],
  dreMonths: string[],
  caixaMonths: string[],
  mapping: DreCategoryMap[]
): CompareModel {
  const months = Array.from(new Set([...dreMonths, ...caixaMonths])).sort(
    (a, b) => monthSortValue(a) - monthSortValue(b)
  );

  const norm = (s: string) => s.trim().toLowerCase();
  const dreIndex = new Map(dreRows.map((r) => [norm(r.categoria), r]));
  const caixaIndex = new Map(caixaRows.map((r) => [norm(r.categoria), r]));
  const mapIndex = new Map(mapping.map((m) => [norm(m.category_name), m]));

  const makeRow = (categoria: string, mapped: boolean): CompareRow => {
    const d = dreIndex.get(norm(categoria));
    const c = caixaIndex.get(norm(categoria));
    const cells: Record<string, CompareCell> = {};
    months.forEach((m) => {
      const dv = d?.values[m] ?? 0;
      const cv = c?.values[m] ?? 0;
      cells[m] = { dre: dv, caixa: cv, diff: dv - cv };
    });
    return { categoria, mapped, cells };
  };

  const groupsMap = new Map<string, CompareRow[]>();

  // Mapped categories (always shown, even if absent from files)
  mapping.forEach((m) => {
    const list = groupsMap.get(m.group_name) ?? [];
    list.push(makeRow(m.category_name, true));
    groupsMap.set(m.group_name, list);
  });

  // Unmapped detail categories present in the files
  const seen = new Set<string>();
  [...dreRows, ...caixaRows].forEach((r) => {
    const key = norm(r.categoria);
    if (r.isGroupRow) return;
    if (mapIndex.has(key) || seen.has(key)) return;
    seen.add(key);
    const list = groupsMap.get(UNMAPPED_GROUP) ?? [];
    list.push(makeRow(r.categoria, false));
    groupsMap.set(UNMAPPED_GROUP, list);
  });

  const groupNames = Array.from(groupsMap.keys())
    .filter((g) => g !== UNMAPPED_GROUP)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  if (groupsMap.has(UNMAPPED_GROUP)) groupNames.push(UNMAPPED_GROUP);

  const totals: Record<string, CompareCell> = {};
  const groups: CompareGroup[] = groupNames.map((g) => {
    const rows = (groupsMap.get(g) ?? []).sort((a, b) => a.categoria.localeCompare(b.categoria, "pt-BR"));
    const gTotals: Record<string, CompareCell> = {};
    rows.forEach((r) => addInto(gTotals, months, r.cells));
    if (g !== UNMAPPED_GROUP) addInto(totals, months, gTotals);
    return { group: g, rows, totals: gTotals };
  });

  months.forEach((m) => {
    if (!totals[m]) totals[m] = emptyCell();
  });

  return { months, groups, totals };
}
