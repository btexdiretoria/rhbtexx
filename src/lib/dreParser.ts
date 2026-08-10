import * as XLSX from "xlsx";

export interface DreRow {
  categoria: string;
  isGroupRow: boolean;
  values: Record<string, number>; // month key -> value
}

export interface DreParsed {
  fileName: string;
  months: string[];
  rows: DreRow[];
}

const MONTH_RE = /^[A-Za-zçÇ]{3,10}\/\d{2,4}$/;
// Group/subtotal lines start with a numeric code, e.g. "02 Deduções", "02.1 Impostos", "07T Lucro"
const GROUP_RE = /^\d{1,2}(\.\d+)*[A-Za-z]?\s+\S/;

const MONTH_ORDER = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
const EN_MONTHS: Record<string, string> = {
  jan: "jan", feb: "fev", mar: "mar", apr: "abr", may: "mai", jun: "jun",
  jul: "jul", aug: "ago", sep: "set", oct: "out", nov: "nov", dec: "dez",
};

export function normalizeMonthKey(raw: string): string {
  const [m, y] = String(raw).trim().split("/");
  const mm = m.slice(0, 3).toLowerCase();
  const pt = EN_MONTHS[mm] ?? mm;
  const year = y.length === 2 ? `20${y}` : y;
  const label = pt.charAt(0).toUpperCase() + pt.slice(1);
  return `${label}/${year}`;
}

export function monthSortValue(key: string): number {
  const [m, y] = key.split("/");
  const idx = MONTH_ORDER.indexOf(m.slice(0, 3).toLowerCase());
  return Number(y) * 12 + (idx < 0 ? 0 : idx);
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  let s = String(v).trim();
  if (!s) return 0;
  let neg = false;
  if (/^\(.*\)$/.test(s)) {
    neg = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[R$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  if (!isFinite(n)) return 0;
  return neg ? -Math.abs(n) : n;
}

export async function parseDreFile(file: File): Promise<DreParsed> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });

  // Find the header row: the row containing at least one "Mmm/AAAA" cell
  let headerIdx = -1;
  for (let i = 0; i < Math.min(matrix.length, 25); i++) {
    const row = matrix[i] ?? [];
    if (row.some((c) => typeof c === "string" && MONTH_RE.test(c.trim()))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    throw new Error(
      'Não foi possível identificar as colunas de mês (formato esperado "Jul/2026").'
    );
  }

  const header = matrix[headerIdx] ?? [];
  const monthCols: { key: string; index: number }[] = [];
  header.forEach((cell, idx) => {
    if (typeof cell === "string" && MONTH_RE.test(cell.trim())) {
      monthCols.push({ key: normalizeMonthKey(cell), index: idx });
    }
  });

  const rows: DreRow[] = [];
  for (let i = headerIdx + 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const categoria = String(row[0] ?? "").trim();
    if (!categoria) continue;
    if (/^total/i.test(categoria)) continue;
    const values: Record<string, number> = {};
    monthCols.forEach((c) => {
      values[c.key] = toNumber(row[c.index]);
    });
    rows.push({ categoria, isGroupRow: GROUP_RE.test(categoria), values });
  }

  const months = monthCols.map((c) => c.key).sort((a, b) => monthSortValue(a) - monthSortValue(b));

  return { fileName: file.name, months, rows };
}

export function formatCurrency(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
