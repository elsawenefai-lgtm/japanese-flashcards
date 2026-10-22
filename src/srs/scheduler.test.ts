import { describe, expect, it } from 'vitest';
import { formatInterval, isDue, mastery, review, RELEARN_DELAY, type CardProgress, type Rating } from './scheduler';
import { DAY } from './time';

// 2026-10-22 09:00 當地時間
const NOW = new Date(2026, 9, 22, 9, 0).getTime();

/** 依序作答，每次都在到期時複習 */
function run(ratings: Rating[]): CardProgress {
  let p: CardProgress | undefined;
  let now = NOW;
  for (const r of ratings) {
    p = review(p, 'k', r, now);
    now = p.due;
  }
  return p!;
}

describe('review', () => {
  it('新卡：記得 1 天、簡單 4 天、困難 1 天', () => {
    expect(review(undefined, 'k', 'good', NOW).interval).toBe(1);
    expect(review(undefined, 'k', 'easy', NOW).interval).toBe(4);
    expect(review(undefined, 'k', 'hard', NOW).interval).toBe(1);
  });

  it('連續記得：1 → 3 → 3×ease', () => {
    expect(run(['good', 'good']).interval).toBe(3);
    expect(run(['good', 'good', 'good']).interval).toBe(8); // 3 × 2.5 = 7.5 → 8
  });

  it('困難會降低 ease，但間隔至少 +1 天', () => {
    const p = run(['good', 'hard']);
    expect(p.interval).toBe(2);
    expect(p.ease).toBe(2.35);
  });

  it('簡單會提高 ease', () => {
    expect(run(['good', 'easy']).ease).toBe(2.65);
  });

  it('忘記：重置、10 分鐘後再出現、記一次遺忘', () => {
    const p = run(['good', 'good', 'again']);
    expect(p.reps).toBe(0);
    expect(p.interval).toBe(0);
    expect(p.lapses).toBe(1);
    expect(p.ease).toBe(2.3);
    expect(p.due - p.lastReviewed).toBe(RELEARN_DELAY);
  });

  it('新卡第一次忘記不算遺忘', () => {
    expect(review(undefined, 'k', 'again', NOW).lapses).toBe(0);
  });

  it('ease 不會低於 1.3', () => {
    expect(run(Array(10).fill('again')).ease).toBe(1.3);
  });

  it('保留第一次學習時間', () => {
    const first = review(undefined, 'k', 'good', NOW);
    expect(review(first, 'k', 'good', NOW + DAY).created).toBe(NOW);
  });
});

describe('isDue', () => {
  it('今天結束前到期都算', () => {
    const p = review(undefined, 'k', 'again', NOW);
    expect(isDue(p, NOW)).toBe(true);
    const tomorrow = review(undefined, 'k', 'good', NOW);
    expect(isDue(tomorrow, NOW)).toBe(false);
    expect(isDue(tomorrow, NOW + DAY)).toBe(true);
  });
});

describe('mastery', () => {
  it('依間隔分級', () => {
    expect(mastery(undefined)).toBe('new');
    expect(mastery(run(['good']))).toBe('learning');
    expect(mastery({ ...run(['good']), interval: 10 })).toBe('familiar');
    expect(mastery({ ...run(['good']), interval: 30 })).toBe('mastered');
  });
});

describe('formatInterval', () => {
  it('顯示分鐘、天、月', () => {
    expect(formatInterval(review(undefined, 'k', 'again', NOW), NOW)).toBe('10 分');
    expect(formatInterval(review(undefined, 'k', 'easy', NOW), NOW)).toBe('4 天');
    expect(formatInterval({ ...run(['good']), due: NOW + 60 * DAY }, NOW)).toBe('2 個月');
  });
});
