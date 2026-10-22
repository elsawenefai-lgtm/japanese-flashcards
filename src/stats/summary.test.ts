import { describe, expect, it } from 'vitest';
import { forecast, lastDays, streak, totals, type DailyMap } from './summary';
import { review } from '../srs/scheduler';
import { DAY } from '../srs/time';

const NOW = new Date(2026, 9, 22, 9, 0).getTime();
const day = (n: number) => ({ reviewed: n, correct: n, newCards: 0 });

describe('streak', () => {
  it('從今天往回連續計算', () => {
    const daily: DailyMap = { '2026-10-22': day(3), '2026-10-21': day(1), '2026-10-20': day(2), '2026-10-18': day(5) };
    expect(streak(daily, NOW)).toBe(3);
  });

  it('今天還沒學時從昨天算起', () => {
    expect(streak({ '2026-10-21': day(1), '2026-10-20': day(1) }, NOW)).toBe(2);
  });

  it('昨天也沒學就是 0', () => {
    expect(streak({ '2026-10-20': day(1) }, NOW)).toBe(0);
  });
});

describe('lastDays / totals', () => {
  it('補齊沒有學習的日子，舊到新排列', () => {
    const points = lastDays({ '2026-10-22': day(4), '2026-10-20': day(2) }, 3, NOW);
    expect(points.map((p) => [p.date, p.reviewed])).toEqual([
      ['2026-10-20', 2],
      ['2026-10-21', 0],
      ['2026-10-22', 4],
    ]);
  });

  it('跨月份也正確', () => {
    const points = lastDays({}, 25, NOW);
    expect(points[0].date).toBe('2026-09-28');
    expect(points.at(-1)!.date).toBe('2026-10-22');
  });

  it('計算正確率', () => {
    expect(totals([{ reviewed: 4, correct: 3, newCards: 1 }, { reviewed: 0, correct: 0, newCards: 0 }])).toEqual({
      reviewed: 4,
      correct: 3,
      newCards: 1,
      accuracy: 75,
    });
    expect(totals([]).accuracy).toBe(0);
  });
});

describe('forecast', () => {
  it('依到期日分組，逾期算今天，排除不在清單中的卡', () => {
    const progress = {
      a: { ...review(undefined, 'a', 'good', NOW), due: NOW - 3 * DAY },
      b: review(undefined, 'b', 'good', NOW), // 明天
      c: review(undefined, 'c', 'easy', NOW), // 4 天後
      d: review(undefined, 'd', 'good', NOW), // 不在清單
    };
    const result = forecast(progress, new Set(['a', 'b', 'c']), 7, NOW);
    expect(result.map((p) => p.count)).toEqual([1, 1, 0, 0, 1, 0, 0]);
    expect(result[0].date).toBe('2026-10-22');
  });
});
