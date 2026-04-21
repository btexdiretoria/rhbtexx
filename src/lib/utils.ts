import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a YYYY-MM-DD (or ISO datetime) string as DD/MM/YYYY
 * WITHOUT shifting timezones. Always interprets the date as local.
 */
export function formatDateLocal(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const datePart = String(dateStr).split("T")[0];
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

/** Parse YYYY-MM-DD as a local Date (no UTC shift). */
export function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
