import * as XLSX from "xlsx";

export interface RawEntry {
  dataMovimento: string;
  identificador: string;
  nome: string;
  recorrencia: string;
  qtdRecorrencia: string;
  descricao: string;
  agendado: string;
  tipo: string;
  origemLancamento: string;
  contaBancaria: string;
  formaPgto: string;
  valor: number;
  saldoConta: number;
  situacao: string;
  valorOriginal: number;
  juros: number;
  multa: number;
  desconto: number;
  taxas: number;
  dataCompetencia: string;
  dataOriginalVencimento: string;
  dataPrevista: string;
  observacoes: string;
  notaFiscal: string;
  categoria1: string;
  valorCategoria1: number;
}

export interface CashFlowData {
  dates: string[];
  revenueCategories: string[];
  expenseCategories: string[];
  matrix: Record<string, Record<string, number>>;
}

function parseNumber(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseDate(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) {
    const d = v;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // yyyy-mm-dd
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return "";
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const HEADER_MAP: Record<string, keyof RawEntry> = {
  datamovimento: "dataMovimento",
  identificadordofornecedorcliente: "identificador",
  nomedofornecedorcliente: "nome",
  recorrencia: "recorrencia",
  quantidadederecorrencia: "qtdRecorrencia",
  descricao: "descricao",
  agendado: "agendado",
  tipo: "tipo",
  origemdolancamento: "origemLancamento",
  contabancaria: "contaBancaria",
  formadepgtorecbto: "formaPgto",
  valorr: "valor",
  saldocontar: "saldoConta",
  situacao: "situacao",
  valororiginalr: "valorOriginal",
  jurosr: "juros",
  multar: "multa",
  descontor: "desconto",
  taxasr: "taxas",
  datadecompetencia: "dataCompetencia",
  dataoriginaldevencimento: "dataOriginalVencimento",
  dataprevista: "dataPrevista",
  observacoes: "observacoes",
  notafiscal: "notaFiscal",
  categoria1: "categoria1",
  valornacategoria1: "valorCategoria1",
};

export function parseFile(file: File): Promise<RawEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        if (json.length === 0) {
          resolve([]);
          return;
        }

        console.log("Raw headers:", Object.keys(json[0]));
        console.log("First 3 rows:", json.slice(0, 3));

        const headerKeys = Object.keys(json[0]);
        const mapping: Record<string, keyof RawEntry> = {};
        for (const hk of headerKeys) {
          const norm = normalizeHeader(hk);
          // Exact match first, then fallback to includes (longest pattern first)
          const exactMatch = HEADER_MAP[norm];
          if (exactMatch) {
            mapping[hk] = exactMatch;
          } else {
            // Sort patterns by length desc to prefer more specific matches
            const sorted = Object.entries(HEADER_MAP).sort((a, b) => b[0].length - a[0].length);
            for (const [pattern, field] of sorted) {
              if (norm.includes(pattern) || pattern.includes(norm)) {
                mapping[hk] = field;
                break;
              }
            }
          }
        }
        console.log("Header mapping:", JSON.stringify(mapping));

        // Hard fallback: ensure categoria1 is read from column index 24
        const cat1Header = headerKeys[24];
        const valCat1Header = headerKeys[25];
        if (cat1Header && !Object.values(mapping).includes("categoria1")) {
          mapping[cat1Header] = "categoria1";
          console.log("Fallback: mapped column 24 to categoria1:", cat1Header);
        }
        // Ensure column 25 is never mapped to categoria1
        if (valCat1Header && mapping[valCat1Header] === "categoria1") {
          mapping[valCat1Header] = "valorCategoria1";
          console.log("Fixed: column 25 remapped to valorCategoria1:", valCat1Header);
        }

        const entries: RawEntry[] = json.map((row) => {
          const entry: Partial<RawEntry> = {};
          for (const [hk, field] of Object.entries(mapping)) {
            const val = row[hk];
            if (["valor", "saldoConta", "valorOriginal", "juros", "multa", "desconto", "taxas", "valorCategoria1"].includes(field)) {
              (entry as any)[field] = parseNumber(val);
            } else if (["dataMovimento", "dataCompetencia", "dataOriginalVencimento", "dataPrevista"].includes(field)) {
              (entry as any)[field] = parseDate(val);
            } else {
              (entry as any)[field] = val != null ? String(val) : "";
            }
          }
          return entry as RawEntry;
        });

        resolve(entries);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function buildCashFlow(entries: RawEntry[]): CashFlowData {
  const dateSet = new Set<string>();
  const revCats = new Set<string>();
  const expCats = new Set<string>();
  const matrix: Record<string, Record<string, number>> = {};

  for (const e of entries) {
    const d = e.dataMovimento;
    if (!d) continue;
    dateSet.add(d);
    const cat = e.categoria1 || "Sem categoria";
    const val = e.valor;

    // Split by sign: prefix keys to separate revenue/expense for same category
    if (val > 0) {
      const key = `rev::${cat}`;
      revCats.add(cat);
      if (!matrix[key]) matrix[key] = {};
      matrix[key][d] = (matrix[key][d] || 0) + val;
    } else if (val < 0) {
      const key = `exp::${cat}`;
      expCats.add(cat);
      if (!matrix[key]) matrix[key] = {};
      matrix[key][d] = (matrix[key][d] || 0) + val;
    }
  }

  const dates = Array.from(dateSet).sort();
  return {
    dates,
    revenueCategories: Array.from(revCats).sort(),
    expenseCategories: Array.from(expCats).sort(),
    matrix,
  };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
