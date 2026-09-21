/**
 * Feriados nacionais (fixos e móveis) + feriado municipal, cadastrados fixos no sistema.
 * Todas as datas em formato 'yyyy-MM-dd' (horário local / America/Sao_Paulo).
 */

export interface Holiday {
  date: string; // yyyy-MM-dd
  name: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const ddmm = (dateStr: string) => {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
};

/** Data atual no fuso America/Sao_Paulo. */
export function todaySaoPaulo(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [y, m, d] = parts.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Domingo de Páscoa (algoritmo de Meeus/Butcher). */
function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const addDaysTo = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const FIXED: { md: string; name: string }[] = [
  { md: '01-01', name: 'Confraternização Universal' },
  { md: '04-21', name: 'Tiradentes' },
  { md: '05-01', name: 'Dia do Trabalho' },
  { md: '06-24', name: 'Feriado Municipal' },
  { md: '09-07', name: 'Independência do Brasil' },
  { md: '10-12', name: 'Nossa Senhora Aparecida' },
  { md: '11-02', name: 'Finados' },
  { md: '11-15', name: 'Proclamação da República' },
  { md: '11-20', name: 'Consciência Negra' },
  { md: '12-25', name: 'Natal' },
];

export function holidaysOfYear(year: number): Holiday[] {
  const e = easter(year);
  const movable: Holiday[] = [
    { date: ymd(addDaysTo(e, -48)), name: 'Carnaval' },
    { date: ymd(addDaysTo(e, -47)), name: 'Carnaval' },
    { date: ymd(addDaysTo(e, -2)), name: 'Sexta-feira Santa' },
    { date: ymd(addDaysTo(e, 60)), name: 'Corpus Christi' },
  ];
  const fixed: Holiday[] = FIXED.map((f) => ({ date: `${year}-${f.md}`, name: f.name }));
  return [...fixed, ...movable].sort((a, b) => a.date.localeCompare(b.date));
}

const holidayMapCache = new Map<number, Map<string, string>>();
function holidayMap(year: number) {
  let m = holidayMapCache.get(year);
  if (!m) {
    m = new Map(holidaysOfYear(year).map((h) => [h.date, h.name]));
    holidayMapCache.set(year, m);
  }
  return m;
}

export const isHoliday = (d: Date) => holidayMap(d.getFullYear()).has(ymd(d));
export const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
export const isBusinessDay = (d: Date) => !isWeekend(d) && !isHoliday(d);

/** Dias úteis do dia seguinte ao informado até o último dia do mês. */
export function remainingBusinessDays(ref: Date): number {
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  let count = 0;
  for (let d = addDaysTo(ref, 1); d <= last; d = addDaysTo(d, 1)) {
    if (isBusinessDay(d)) count++;
  }
  return count;
}

/** Feriados do dia seguinte até o fim do mês, já formatados (ex.: "07/09 – Independência do Brasil"). */
export function remainingHolidayLabels(ref: Date): string[] {
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const map = holidayMap(ref.getFullYear());
  const out: string[] = [];
  for (let d = addDaysTo(ref, 1); d <= last; d = addDaysTo(d, 1)) {
    const key = ymd(d);
    const name = map.get(key);
    if (name && !isWeekend(d)) out.push(`${ddmm(key)} – ${name}`);
  }
  return out;
}

/**
 * Períodos das semanas do mês:
 * semana 1 do primeiro dia útil do mês até a sexta daquela semana;
 * demais de segunda a sexta, respeitando dias úteis e o fim do mês.
 */
export function monthWeekPeriods(ref: Date): string[] {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const last = new Date(year, month + 1, 0);
  const periods: string[] = [];

  // primeiro dia útil do mês
  let cursor = new Date(year, month, 1);
  while (cursor <= last && !isBusinessDay(cursor)) cursor = addDaysTo(cursor, 1);
  if (cursor > last) return periods;

  while (cursor <= last) {
    // fim da semana: sexta-feira desta semana (day 5) ou último dia do mês
    const daysToFriday = (5 - cursor.getDay() + 7) % 7;
    let end = addDaysTo(cursor, daysToFriday);
    if (end > last) end = last;
    // recua até o último dia útil do intervalo
    let endBiz = end;
    while (endBiz >= cursor && !isBusinessDay(endBiz)) endBiz = addDaysTo(endBiz, -1);
    if (endBiz >= cursor) {
      const a = ddmm(ymd(cursor));
      const b = ddmm(ymd(endBiz));
      periods.push(a === b ? a : `${a} a ${b}`);
    }
    // próxima semana: segunda-feira seguinte, ajustada ao próximo dia útil
    let next = addDaysTo(end, 1);
    while (next <= last && next.getDay() !== 1) next = addDaysTo(next, 1);
    while (next <= last && !isBusinessDay(next)) next = addDaysTo(next, 1);
    if (next <= last && next > cursor) cursor = next;
    else break;
  }
  return periods;
}
