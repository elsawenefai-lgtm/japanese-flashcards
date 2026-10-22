import { describe, expect, it } from 'vitest';
import { buildReviewQueue, newCardsRemaining, requeue, type ProgressMap } from './queue';
import { review } from './scheduler';
import { DAY } from './time';

const NOW = new Date(2026, 9, 22, 9, 0).getTime();

interface Card {
  key: string;
  group: string;
}

const cards = (n: number, prefix = 'c'): Card[] =>
  Array.from({ length: n }, (_, i) => ({ key: `${prefix}${i}`, group: `${prefix}${i}` }));

/** 建立一筆進度：到期日 = NOW + offsetDays */
function progressDue(key: string, offsetDays: number, created = NOW - 30 * DAY) {
  const p = review(undefined, key, 'good', created);
  return { ...p, due: NOW + offsetDays * DAY };
}

const groupOf = (c: Card) => c.group;

describe('buildReviewQueue', () => {
  it('包含到期卡與新卡，不含未到期的卡', () => {
    const all = cards(6);
    const progress: ProgressMap = {
      c0: progressDue('c0', -2),
      c1: progressDue('c1', 0),
      c2: progressDue('c2', 5), // 未到期
    };
    const { queue, dueCount, newCount } = buildReviewQueue({ cards: all, progress, now: NOW, newLimit: 10, groupOf });
    expect(dueCount).toBe(2);
    expect(newCount).toBe(3);
    expect(queue.map((c) => c.key).sort()).toEqual(['c0', 'c1', 'c3', 'c4', 'c5']);
  });

  it('新卡數量受上限限制', () => {
    const { queue, newCount } = buildReviewQueue({ cards: cards(30), progress: {}, now: NOW, newLimit: 5, groupOf });
    expect(newCount).toBe(5);
    expect(queue).toHaveLength(5);
  });

  it('每 3 張到期卡穿插 1 張新卡', () => {
    const due = cards(6, 'd');
    const fresh = cards(2, 'n');
    const progress: ProgressMap = Object.fromEntries(due.map((c, i) => [c.key, progressDue(c.key, -i)]));
    const { queue } = buildReviewQueue({
      cards: [...due, ...fresh],
      progress,
      now: NOW,
      newLimit: 10,
      groupOf,
    });
    expect(queue.map((c) => c.key[0]).join('')).toBe('dddndddn');
  });

  it('到期卡大致依逾期程度排序（分段洗牌）', () => {
    const due = cards(20, 'd');
    // d0 逾期最久
    const progress: ProgressMap = Object.fromEntries(due.map((c, i) => [c.key, progressDue(c.key, -20 + i)]));
    const { queue } = buildReviewQueue({ cards: due, progress, now: NOW, newLimit: 0, groupOf });
    const firstHalf = queue.slice(0, 10).map((c) => Number(c.key.slice(1)));
    expect(firstHalf.every((i) => i < 10)).toBe(true);
  });

  it('同一群組不相鄰', () => {
    const mixed = cards(4).flatMap((c) => [
      { key: `${c.key}:a`, group: c.group },
      { key: `${c.key}:b`, group: c.group },
    ]);
    for (let r = 0; r < 30; r++) {
      const { queue } = buildReviewQueue({ cards: mixed, progress: {}, now: NOW, newLimit: 20, groupOf });
      for (let i = 1; i < queue.length; i++) expect(queue[i].group).not.toBe(queue[i - 1].group);
    }
  });
});

describe('newCardsRemaining', () => {
  it('扣掉今天已學的新卡', () => {
    const progress: ProgressMap = {
      a: progressDue('a', 1, NOW - 1000), // 今天
      b: progressDue('b', 1, NOW - 1000), // 今天
      c: progressDue('c', 1, NOW - 2 * DAY), // 前天
    };
    expect(newCardsRemaining(progress, NOW, 20)).toBe(18);
    expect(newCardsRemaining(progress, NOW, 1)).toBe(0);
  });
});

describe('requeue', () => {
  it('插回後面第 4 張之後；不足時放最後', () => {
    expect(requeue(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 0)).toEqual(['a', 'b', 'c', 'd', 'e', 'a', 'f', 'g']);
    expect(requeue(['a', 'b', 'c'], 1)).toEqual(['a', 'b', 'c', 'b']);
  });
});
