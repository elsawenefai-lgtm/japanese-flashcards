import type { Category, Dataset } from '../types/dataset';

export interface DatasetFilter {
  /** null 表示全部分類 */
  category: Category | null;
  /** 空陣列表示全部等級 */
  levels: string[];
}

export function filterDatasets(list: Dataset[], filter: DatasetFilter): Dataset[] {
  return list.filter(
    (d) =>
      (filter.category === null || d.category === filter.category) &&
      (filter.levels.length === 0 || filter.levels.includes(d.level)),
  );
}

const CATEGORY_VALUES: Category[] = ['vocabulary', 'grammar'];

/** 從網址參數讀取篩選條件，例如 ?category=grammar&level=N3,N4 */
export function filterFromParams(params: URLSearchParams): DatasetFilter {
  const category = params.get('category');
  const levels = params.get('level');
  return {
    category: CATEGORY_VALUES.includes(category as Category) ? (category as Category) : null,
    levels: levels ? levels.split(',').filter(Boolean) : [],
  };
}

export function filterToParams(filter: DatasetFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.category) params.set('category', filter.category);
  if (filter.levels.length > 0) params.set('level', filter.levels.join(','));
  return params;
}
