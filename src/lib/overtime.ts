// Helpers for handling Excel "hours" values.
// Excel stores time as a fraction of a day (1h = 1/24).
// We always persist hours as that fraction (number) and format
// it as HH:MM:SS for display / reports.

export function formatHorasFromFraction(fraction: number): string {
  if (!isFinite(fraction) || fraction <= 0) return '00:00:00';
  const totalSeconds = Math.round(fraction * 24 * 60 * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Parse a value coming from a spreadsheet cell into a "fraction of day".
 * Accepts:
 *  - number (Excel's native time fraction, e.g. 0.0423611 for 01:01:00)
 *  - "HH:MM:SS" / "HH:MM" string
 *  - decimal string with comma or dot (treated as fraction of day)
 */
export function parseHorasToFraction(raw: unknown): number {
  if (raw == null || raw === '') return 0;

  if (typeof raw === 'number' && isFinite(raw)) {
    return raw;
  }

  const str = String(raw).trim();
  if (!str) return 0;

  // HH:MM:SS or HH:MM
  if (str.includes(':')) {
    const parts = str.split(':').map(p => Number(p) || 0);
    const [h = 0, m = 0, s = 0] = parts;
    const totalSeconds = h * 3600 + m * 60 + s;
    return totalSeconds / (24 * 60 * 60);
  }

  const num = Number(str.replace(',', '.'));
  return isFinite(num) ? num : 0;
}
