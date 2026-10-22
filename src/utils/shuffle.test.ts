import { describe, expect, it } from 'vitest';
import { shuffle, spreadApart } from './shuffle';

/** 固定序列的假亂數，讓結果可以重現 */
const seeded = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('shuffle', () => {
  it('不改動原陣列，且元素相同', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...result].sort()).toEqual(input);
  });

  it('使用注入的亂數', () => {
    // random 永遠為 0：每一步都和第 0 個交換
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });

  it('每種排列都有機會出現', () => {
    const seen = new Set<string>();
    for (let n = 0; n < 500; n++) seen.add(shuffle(['a', 'b', 'c']).join(''));
    expect(seen.size).toBe(6);
  });
});

describe('spreadApart', () => {
  const group = (s: string) => s[0];

  it('把相鄰的同組項目拆開', () => {
    const result = spreadApart(['a1', 'a2', 'b1', 'b2'], group);
    for (let i = 1; i < result.length; i++) expect(group(result[i])).not.toBe(group(result[i - 1]));
    expect([...result].sort()).toEqual(['a1', 'a2', 'b1', 'b2']);
  });

  it('相鄰項目在最後面時也能往前交換', () => {
    const result = spreadApart(['a1', 'b1', 'a2', 'b2', 'c1', 'c2'], group);
    for (let i = 1; i < result.length; i++) expect(group(result[i])).not.toBe(group(result[i - 1]));
  });

  it('無法拆開時維持原樣', () => {
    expect(spreadApart(['a1', 'a2'], group)).toEqual(['a1', 'a2']);
  });

  it('搭配洗牌使用時結果穩定', () => {
    const items = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const result = spreadApart(shuffle(items, seeded([0.1, 0.9, 0.5, 0.3])), group);
    expect(result).toHaveLength(6);
  });
});
