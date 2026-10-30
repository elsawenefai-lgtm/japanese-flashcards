import type { VocabItem } from '../types/dataset';
import { shuffle, spreadApart } from '../utils/shuffle';

/** jp-zh：日→中（V1 漢字題面／V2 平假名題面）；zh-jp：中→日（V3） */
export type VocabDirection = 'jp-zh' | 'zh-jp';
export type DirectionChoice = VocabDirection | 'mixed';

export const DIRECTION_CHOICES: { value: DirectionChoice; label: string; hint: string }[] = [
  { value: 'jp-zh', label: '日 → 中', hint: '看日文，回想中文意思' },
  { value: 'zh-jp', label: '中 → 日', hint: '看中文，回想日文' },
  { value: 'mixed', label: '混合', hint: '兩個方向隨機出現' },
];

export function parseDirection(value: string | null): DirectionChoice {
  return DIRECTION_CHOICES.some((c) => c.value === value) ? (value as DirectionChoice) : 'jp-zh';
}

export interface VocabCard {
  /** 進度鍵值：資料集 id + 卡片 id + 方向（P3 記憶演算法使用） */
  key: string;
  item: VocabItem;
  direction: VocabDirection;
}

const KANJI = /[一-鿿㐀-䶿々]/;

export function hasKanji(text: string): boolean {
  return KANJI.test(text);
}

/**
 * 朗讀用文字：用漢字寫法。只給假名時語音引擎認不出是哪個詞（例如 はし＝橋／箸／端），
 * 會套錯高低重音或念成平板；有漢字才能查到正確的詞與重音。
 */
export function speechText(item: VocabItem): string {
  return item.japanese || item.hiragana;
}

/** 選擇題的正解：日→中 答中文，中→日 答日文 */
export function vocabAnswer(item: VocabItem, direction: VocabDirection): string {
  return direction === 'jp-zh' ? item.simple_chinese : item.japanese;
}

/** 依方向展開成卡片（未洗牌）；混合時每個單字有兩張 */
export function buildVocabCards(datasetId: string, items: VocabItem[], choice: DirectionChoice): VocabCard[] {
  const directions: VocabDirection[] = choice === 'mixed' ? ['jp-zh', 'zh-jp'] : [choice];
  return items.flatMap((item) =>
    directions.map((direction) => ({ key: `${datasetId}:${item.id}:${direction}`, item, direction })),
  );
}

/** 自由練習用：整副洗牌，不看到期日 */
export function buildVocabSession(
  datasetId: string,
  items: VocabItem[],
  choice: DirectionChoice,
  random: () => number = Math.random,
): VocabCard[] {
  return spreadApart(shuffle(buildVocabCards(datasetId, items, choice), random), (c) => c.item.id);
}
