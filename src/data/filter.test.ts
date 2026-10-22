import { describe, expect, it } from 'vitest';
import type { Dataset } from '../types/dataset';
import { filterDatasets, filterFromParams, filterToParams } from './filter';

const make = (id: string, category: Dataset['category'], level: string) =>
  ({ id, name: id, category, level, data: [] }) as Dataset;

const list = [
  make('v3', 'vocabulary', 'N3'),
  make('v4', 'vocabulary', 'N4'),
  make('g3', 'grammar', 'N3'),
];

const ids = (d: Dataset[]) => d.map((x) => x.id);

describe('filterDatasets', () => {
  it('沒有條件時回傳全部', () => {
    expect(ids(filterDatasets(list, { category: null, levels: [] }))).toEqual(['v3', 'v4', 'g3']);
  });

  it('依分類篩選', () => {
    expect(ids(filterDatasets(list, { category: 'grammar', levels: [] }))).toEqual(['g3']);
  });

  it('等級可複選，並與分類同時套用', () => {
    expect(ids(filterDatasets(list, { category: null, levels: ['N3', 'N4'] }))).toEqual(['v3', 'v4', 'g3']);
    expect(ids(filterDatasets(list, { category: 'vocabulary', levels: ['N3'] }))).toEqual(['v3']);
  });
});

describe('網址參數', () => {
  it('可以來回轉換', () => {
    const filter = { category: 'grammar' as const, levels: ['N3', 'N4'] };
    expect(filterFromParams(filterToParams(filter))).toEqual(filter);
  });

  it('忽略無效的分類', () => {
    expect(filterFromParams(new URLSearchParams('category=abc&level=N3'))).toEqual({
      category: null,
      levels: ['N3'],
    });
  });

  it('沒有條件時不產生參數', () => {
    expect(filterToParams({ category: null, levels: [] }).toString()).toBe('');
  });
});
