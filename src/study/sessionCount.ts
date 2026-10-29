// 複習／測驗的題數選項（網址參數 count=10|20|30|all）

export type SessionCount = '10' | '20' | '30' | 'all';

export const SESSION_COUNT_OPTIONS: { value: SessionCount; label: string }[] = [
  { value: '10', label: '10 題' },
  { value: '20', label: '20 題' },
  { value: '30', label: '30 題' },
  { value: 'all', label: '全部' },
];

/** 解析 count 參數；all 為不限，缺少或不合法時用 fallback */
export function parseCount(value: string | null, fallback: number): number {
  if (value === 'all') return Infinity;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
