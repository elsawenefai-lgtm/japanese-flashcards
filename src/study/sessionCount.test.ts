import { describe, expect, it } from 'vitest';
import { parseCount } from './sessionCount';

describe('parseCount', () => {
  it('解析數字與 all', () => {
    expect(parseCount('30', 10)).toBe(30);
    expect(parseCount('all', 10)).toBe(Infinity);
  });

  it('缺少或不合法時用預設值', () => {
    expect(parseCount(null, 10)).toBe(10);
    expect(parseCount(null, Infinity)).toBe(Infinity);
    expect(parseCount('0', 10)).toBe(10);
    expect(parseCount('abc', 10)).toBe(10);
    expect(parseCount('2.5', 10)).toBe(10);
  });
});
