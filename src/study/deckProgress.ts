import type { Dataset } from '../types/dataset';
import { isDue, mastery, type Mastery } from '../srs/scheduler';
import type { ProgressMap } from '../srs/queue';
import { ALL_GRAMMAR_MODES, grammarKeys } from './grammarCards';

export interface DeckSummary {
  total: number;
  due: number;
  mastery: Record<Mastery, number>;
}

/** 某資料集的卡片鍵值；不指定方向時包含所有方向 */
export function deckKeys(dataset: Dataset, directions: string[]): string[] {
  return dataset.data.flatMap((item) => directions.map((d) => `${dataset.id}:${item.id}:${d}`));
}

/** 資料集所有可能的卡片鍵值：單字兩個方向、文法四種模式 */
export function allDeckKeys(dataset: Dataset): string[] {
  return dataset.category === 'vocabulary'
    ? deckKeys(dataset, ['jp-zh', 'zh-jp'])
    : grammarKeys(dataset, ALL_GRAMMAR_MODES);
}

/** 目前所有資料集的卡片鍵值；不在其中的進度屬於已刪除的卡片 */
export function knownKeys(list: Dataset[]): Set<string> {
  return new Set(list.flatMap(allDeckKeys));
}

export function summarize(keys: string[], progress: ProgressMap, now: number): DeckSummary {
  const summary: DeckSummary = {
    total: keys.length,
    due: 0,
    mastery: { new: 0, learning: 0, familiar: 0, mastered: 0 },
  };
  for (const key of keys) {
    const p = progress[key];
    summary.mastery[mastery(p)]++;
    if (p && isDue(p, now)) summary.due++;
  }
  return summary;
}

export const MASTERY_LABEL: Record<Mastery, string> = {
  new: '新卡',
  learning: '學習中',
  familiar: '熟悉',
  mastered: '精通',
};
