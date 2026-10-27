import type { GrammarDataset, GrammarExample, GrammarItem } from '../types/dataset';
import { shuffle, spreadApart } from '../utils/shuffle';
import { clozeAnswers, speechSentence } from '../quiz/grammarSentence';

/**
 * G1 g-zh：文法 → 中文
 * G2 ex-zh：高亮例句 → 中文
 * G3 zh-g：中文 → 文法
 * G4 cloze：挖空例句＋翻譯 → 文法
 */
export type GrammarMode = 'g-zh' | 'ex-zh' | 'zh-g' | 'cloze';

export const GRAMMAR_MODES: { value: GrammarMode; label: string; hint: string; needsExample: boolean }[] = [
  { value: 'g-zh', label: '文法 → 中', hint: '看文法，回想意思', needsExample: false },
  { value: 'ex-zh', label: '例句 → 中', hint: '看高亮例句，回想意思', needsExample: true },
  { value: 'zh-g', label: '中 → 文法', hint: '看意思，回想文法', needsExample: false },
  { value: 'cloze', label: '例句填空', hint: '看挖空例句與翻譯，填入文法', needsExample: true },
];

export const ALL_GRAMMAR_MODES = GRAMMAR_MODES.map((m) => m.value);

/** 從網址參數讀取模式，例如 modes=g-zh,cloze；無效時回傳 G1 */
export function parseGrammarModes(value: string | null): GrammarMode[] {
  const modes = (value ?? '').split(',').filter((m): m is GrammarMode => ALL_GRAMMAR_MODES.includes(m as GrammarMode));
  // 依固定順序並去重
  const result = ALL_GRAMMAR_MODES.filter((m) => modes.includes(m));
  return result.length > 0 ? result : ['g-zh'];
}

export interface GrammarCard {
  key: string;
  item: GrammarItem;
  mode: GrammarMode;
  /** 例句類模式使用的例句（每輪隨機挑一句） */
  example?: GrammarExample;
}

const needsExample = (mode: GrammarMode) => GRAMMAR_MODES.find((m) => m.value === mode)!.needsExample;
const hasExamples = (item: GrammarItem) => (item.examples?.length ?? 0) > 0;

/** 依模式展開成卡片（未洗牌）；沒有例句的條目會略過例句類模式 */
export function buildGrammarCards(
  datasetId: string,
  items: GrammarItem[],
  modes: GrammarMode[],
  random: () => number = Math.random,
): GrammarCard[] {
  return items.flatMap((item) =>
    modes
      .filter((mode) => !needsExample(mode) || hasExamples(item))
      .map((mode) => ({
        key: `${datasetId}:${item.id}:${mode}`,
        item,
        mode,
        example: needsExample(mode) ? item.examples![Math.floor(random() * item.examples!.length)] : undefined,
      })),
  );
}

/** 自由練習用：整副洗牌 */
export function buildGrammarSession(
  datasetId: string,
  items: GrammarItem[],
  modes: GrammarMode[],
  random: () => number = Math.random,
): GrammarCard[] {
  return spreadApart(shuffle(buildGrammarCards(datasetId, items, modes, random), random), (c) => c.item.id);
}

/** 進度統計用的卡片鍵值（與 buildGrammarCards 一致） */
export function grammarKeys(dataset: GrammarDataset, modes: GrammarMode[]): string[] {
  return buildGrammarCards(dataset.id, dataset.data, modes, () => 0).map((c) => c.key);
}

/** 選擇題的正解：G1/G2 答中文，G3 答文法，G4 答例句中實際的形態 */
export function grammarAnswer(card: GrammarCard): string {
  if (card.mode === 'g-zh' || card.mode === 'ex-zh') return card.item.simple_chinese;
  if (card.mode === 'cloze' && card.example) return clozeAnswers(card.example.sentence).join(' … ');
  return card.item.japanese;
}

/**
 * 干擾選項候選：與正解同類型的文字。
 * 填空題用其他文法例句中的實際形態，避免只有正解是變形、其他都是原形而露出破綻。
 */
export function grammarDistractors(card: GrammarCard, items: GrammarItem[]): string[] {
  return items
    .filter((item) => item.id !== card.item.id)
    .map((item) => {
      if (card.mode === 'g-zh' || card.mode === 'ex-zh') return item.simple_chinese;
      if (card.mode === 'cloze' && item.examples?.length) return clozeAnswers(item.examples[0].sentence).join(' … ');
      return item.japanese;
    });
}

/** 朗讀用文字：有例句就念整句（漢字改用標注的讀音），否則念文法本身 */
export function grammarSpeechText(card: GrammarCard): string {
  return card.example ? speechSentence(card.example.sentence) : card.item.japanese;
}

/** 題面是否為日文（決定自動朗讀時機） */
export function grammarFrontIsJapanese(card: GrammarCard): boolean {
  return card.mode === 'g-zh' || card.mode === 'ex-zh';
}
