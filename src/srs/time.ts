export const MINUTE = 60 * 1000;
export const DAY = 24 * 60 * MINUTE;

/** 當地時間當天 00:00 */
export function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 當地時間當天 23:59:59.999 */
export function endOfDay(now: number): number {
  return startOfDay(now) + DAY - 1;
}

/** 統計用的日期鍵值，例如 2026-10-22 */
export function dateKey(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
