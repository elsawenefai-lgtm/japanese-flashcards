/** Fisher–Yates 洗牌，回傳新陣列；random 可注入以便測試 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 盡量讓相同群組（例如同一張卡的不同方向）不要相鄰。
 * 遇到相鄰時，先往後、再往前找一個交換後兩邊都不會相鄰的位置；找不到就維持原樣。
 */
export function spreadApart<T>(items: readonly T[], groupOf: (item: T) => string): T[] {
  const result = [...items];
  const n = result.length;
  const swap = (a: number, b: number) => ([result[a], result[b]] = [result[b], result[a]]);
  const conflicts = (pos: number) =>
    (pos > 0 && groupOf(result[pos]) === groupOf(result[pos - 1])) ||
    (pos < n - 1 && groupOf(result[pos]) === groupOf(result[pos + 1]));

  for (let i = 1; i < n; i++) {
    if (groupOf(result[i]) !== groupOf(result[i - 1])) continue;
    const candidates = [
      ...Array.from({ length: n - i - 1 }, (_, k) => i + 1 + k),
      ...Array.from({ length: i - 1 }, (_, k) => k),
    ];
    for (const k of candidates) {
      swap(i, k);
      if (!conflicts(i) && !conflicts(k)) break;
      swap(i, k);
    }
  }
  return result;
}
