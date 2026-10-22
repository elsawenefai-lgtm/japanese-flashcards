// 統計頁與首頁用的計算
import type { DailyStats } from '../store/progress';
import type { ProgressMap } from '../srs/queue';
import { DAY, dateKey, endOfDay, startOfDay } from '../srs/time';

export type DailyMap = Record<string, DailyStats>;

const EMPTY: DailyStats = { reviewed: 0, correct: 0, newCards: 0 };

/** 連續學習天數：今天還沒學也不會中斷（從昨天往回算） */
export function streak(daily: DailyMap, now: number): number {
  let day = startOfDay(now);
  if (!daily[dateKey(day)]?.reviewed) day -= DAY;
  let count = 0;
  // 用中午計算日期，避免日光節約時間造成同一天被算兩次
  while (daily[dateKey(day + DAY / 2)]?.reviewed) {
    count++;
    day -= DAY;
  }
  return count;
}

export interface DayPoint extends DailyStats {
  date: string;
}

/** 最近 n 天（含今天）的每日紀錄，舊 → 新；沒學習的日子補 0 */
export function lastDays(daily: DailyMap, n: number, now: number): DayPoint[] {
  const today = startOfDay(now);
  return Array.from({ length: n }, (_, i) => {
    const date = dateKey(today - (n - 1 - i) * DAY + DAY / 2);
    return { date, ...(daily[date] ?? EMPTY) };
  });
}

export function totals(points: DailyStats[]): DailyStats & { accuracy: number } {
  const sum = points.reduce(
    (acc, p) => ({
      reviewed: acc.reviewed + p.reviewed,
      correct: acc.correct + p.correct,
      newCards: acc.newCards + p.newCards,
    }),
    EMPTY,
  );
  return { ...sum, accuracy: sum.reviewed === 0 ? 0 : Math.round((sum.correct / sum.reviewed) * 100) };
}

/** 未來 n 天每天到期的卡片數；第 0 天包含已逾期的卡。keys 用來排除已刪除卡片的進度 */
export function forecast(
  progress: ProgressMap,
  keys: Set<string>,
  n: number,
  now: number,
): { date: string; count: number }[] {
  const counts = new Array<number>(n).fill(0);
  const today = startOfDay(now);
  for (const p of Object.values(progress)) {
    if (!keys.has(p.key)) continue;
    const offset = p.due <= endOfDay(now) ? 0 : Math.round((startOfDay(p.due) - today) / DAY);
    if (offset < n) counts[offset]++;
  }
  return counts.map((count, i) => ({ date: dateKey(today + i * DAY + DAY / 2), count }));
}
