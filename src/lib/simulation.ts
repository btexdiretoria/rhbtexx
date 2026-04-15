import { RawEntry } from "./cashflow";
import * as XLSX from "xlsx";

// dateEdits maps a unique entry key to the new dataPrevista
// We use the index in the original entries array as the key
export type DateEdits = Record<number, string>;

export function applyEdits(entries: RawEntry[], edits: DateEdits): RawEntry[] {
  return entries.map((e, i) => {
    if (edits[i] !== undefined) {
      return { ...e, dataMovimento: edits[i] };
    }
    return e;
  });
}

export function exportEdits(entries: RawEntry[], edits: DateEdits): void {
  const rows = Object.entries(edits).map(([idxStr, newDate]) => {
    const idx = parseInt(idxStr, 10);
    const e = entries[idx];
    return {
      "Descrição": e.descricao,
      "Categoria 1": e.categoria1,
      "Valor (R$)": e.valor,
      "Data Mov. original": e.dataMovimento,
      "Data Mov. nova": newDate,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Alterações");
  XLSX.writeFile(wb, "alteracoes_simulacao.xlsx");
}
