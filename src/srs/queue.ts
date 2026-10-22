// 學習佇列：到期卡 + 新卡，規則見 plan.md §6.2
import { isDue, type CardProgress } from './scheduler';
import { startOfDay } from './time';
import { shuffle, spreadApart } from '../utils/shuffle';

export type ProgressMap = Record<string, CardProgress>;

/** 到期卡分段洗牌的每段張數 */
const DUE_CHUNK = 10;
/** 每幾張到期卡穿插 1 張新卡 */
const DUE_PER_NEW = 3;
/** 按「忘記」後，在本輪中隔幾張再出現 */
export const REQUEUE_OFFSET = 4;

/** 今天還能學幾張新卡（每日上限是全部資料集共用） */
export function newCardsRemaining(progress: ProgressMap, now: number, dailyLimit: number): number {
  const today = startOfDay(now);
  const learnedToday = Object.values(progress).filter((p) => p.created >= today).length;
  return Math.max(0, dailyLimit - learnedToday);
}

export interface QueueOptions<T> {
  cards: T[];
  progress: ProgressMap;
  now: number;
  newLimit: number;
  /** 同一群組（同一張卡的不同方向）盡量不相鄰 */
  groupOf: (card: T) => string;
  random?: () => number;
}

export interface QueueResult<T> {
  queue: T[];
  dueCount: number;
  newCount: number;
}

export function buildReviewQueue<T extends { key: string }>({
  cards,
  progress,
  now,
  newLimit,
  groupOf,
  random = Math.random,
}: QueueOptions<T>): QueueResult<T> {
  // 到期卡：越早到期越前面，但每 10 張內打亂，避免每次順序都一樣
  const dueSorted = cards
    .filter((c) => progress[c.key] && isDue(progress[c.key], now))
    .sort((a, b) => progress[a.key].due - progress[b.key].due);
  const due: T[] = [];
  for (let i = 0; i < dueSorted.length; i += DUE_CHUNK) {
    due.push(...shuffle(dueSorted.slice(i, i + DUE_CHUNK), random));
  }

  const fresh = shuffle(
    cards.filter((c) => !progress[c.key]),
    random,
  ).slice(0, Math.max(0, newLimit));

  // 穿插：每 3 張到期卡放 1 張新卡，用完一邊就接上另一邊
  const queue: T[] = [];
  let d = 0;
  let n = 0;
  while (d < due.length || n < fresh.length) {
    for (let k = 0; k < DUE_PER_NEW && d < due.length; k++) queue.push(due[d++]);
    if (n < fresh.length) queue.push(fresh[n++]);
  }

  return { queue: spreadApart(queue, groupOf), dueCount: due.length, newCount: fresh.length };
}

/** 把目前這張卡再插回後面（按「忘記」時使用） */
export function requeue<T>(queue: T[], index: number, offset = REQUEUE_OFFSET): T[] {
  const next = [...queue];
  next.splice(Math.min(index + 1 + offset, next.length), 0, queue[index]);
  return next;
}
