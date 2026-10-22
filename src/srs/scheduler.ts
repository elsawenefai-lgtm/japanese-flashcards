// SM-2 簡化版記憶排程（規則見 plan.md §6.1）
import { DAY, MINUTE, endOfDay } from './time';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface CardProgress {
  /** `${datasetId}:${itemId}:${direction}` */
  key: string;
  /** 難易度係數，初始 2.5，下限 1.3 */
  ease: number;
  /** 複習間隔（天）；0 表示還在學習中、當天要再看 */
  interval: number;
  /** 連續答對次數 */
  reps: number;
  /** 遺忘次數 */
  lapses: number;
  /** 下次到期時間 */
  due: number;
  lastReviewed: number;
  /** 第一次學習時間（計算每日新卡上限用） */
  created: number;
}

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;
/** 按「忘記」後多久再出現 */
export const RELEARN_DELAY = 10 * MINUTE;

const round1 = (n: number) => Math.round(n * 100) / 100;

/** 新卡第一次答對時的間隔（天） */
const FIRST_INTERVAL: Record<Exclude<Rating, 'again'>, number> = { hard: 1, good: 1, easy: 4 };

export function review(prev: CardProgress | undefined, key: string, rating: Rating, now: number): CardProgress {
  const base: CardProgress = prev ?? {
    key,
    ease: INITIAL_EASE,
    interval: 0,
    reps: 0,
    lapses: 0,
    due: now,
    lastReviewed: now,
    created: now,
  };

  if (rating === 'again') {
    return {
      ...base,
      ease: round1(Math.max(MIN_EASE, base.ease - 0.2)),
      interval: 0,
      reps: 0,
      // 新卡第一次就忘記不算遺忘
      lapses: prev && prev.reps > 0 ? base.lapses + 1 : base.lapses,
      due: now + RELEARN_DELAY,
      lastReviewed: now,
    };
  }

  let interval: number;
  if (base.reps === 0) {
    interval = FIRST_INTERVAL[rating];
  } else {
    const raw =
      rating === 'hard'
        ? base.interval * 1.2
        : rating === 'good'
          ? base.reps === 1
            ? 3
            : base.interval * base.ease
          : (base.reps === 1 ? 3 : base.interval) * base.ease * 1.3;
    // 至少比上次多 1 天，避免短間隔乘 1.2 後停滯不前
    interval = Math.max(Math.round(raw), base.interval + 1);
  }

  const ease = base.ease + (rating === 'hard' ? -0.15 : rating === 'easy' ? 0.15 : 0);

  return {
    ...base,
    ease: round1(Math.max(MIN_EASE, ease)),
    interval,
    reps: base.reps + 1,
    due: now + interval * DAY,
    lastReviewed: now,
  };
}

/** 今天結束前到期的都算待複習 */
export function isDue(progress: CardProgress, now: number): boolean {
  return progress.due <= endOfDay(now);
}

export type Mastery = 'new' | 'learning' | 'familiar' | 'mastered';

export function mastery(progress: CardProgress | undefined): Mastery {
  if (!progress) return 'new';
  if (progress.interval < 7) return 'learning';
  if (progress.interval <= 21) return 'familiar';
  return 'mastered';
}

/** 自評按鈕上顯示的下次間隔，例如「10 分」「3 天」「2 個月」 */
export function formatInterval(progress: CardProgress, now: number): string {
  const ms = progress.due - now;
  if (ms < DAY) return `${Math.max(1, Math.round(ms / MINUTE))} 分`;
  const days = Math.round(ms / DAY);
  if (days < 30) return `${days} 天`;
  if (days < 365) return `${Math.round(days / 30)} 個月`;
  return `${Math.round((days / 365) * 10) / 10} 年`;
}
