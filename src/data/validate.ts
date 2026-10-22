// 資料集驗證：App 載入時與 scripts/validate-data.ts 共用
// 只使用 type import，讓 Node 可以直接執行（type stripping）
import type { Category, Dataset, GrammarExample } from '../types/dataset.ts';

export type IssueLevel = 'error' | 'warning';

export interface Issue {
  level: IssueLevel;
  /** 問題位置，例如 data[3].hiragana */
  path: string;
  message: string;
}

export interface ValidationResult {
  issues: Issue[];
  /** 頂層欄位無效時為 null；否則只保留沒有錯誤的項目 */
  dataset: Dataset | null;
}

const CATEGORIES: Category[] = ['vocabulary', 'grammar'];
const TOP_KEYS = ['name', 'category', 'level', 'data'];
const ITEM_KEYS: Record<Category, string[]> = {
  vocabulary: ['id', 'japanese', 'hiragana', 'simple_chinese', 'full_explanation'],
  grammar: ['id', 'japanese', 'simple_chinese', 'full_explanation', 'examples'],
};
const EXAMPLE_KEYS = ['sentence', 'chinese'];
const KANJI = /[一-鿿㐀-䶿々]/;

type Obj = Record<string, unknown>;

const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** 檢查例句中的 {} 標記：至少一組、成對、不可巢狀、不可為空 */
export function checkBraces(sentence: string): string | null {
  let depth = 0;
  let pairs = 0;
  let start = -1;
  for (let i = 0; i < sentence.length; i++) {
    const ch = sentence[i];
    if (ch === '{') {
      if (depth > 0) return '{} 標記不可巢狀';
      depth = 1;
      start = i;
    } else if (ch === '}') {
      if (depth === 0) return '多出一個 }';
      if (i === start + 1) return '{} 內不可為空';
      depth = 0;
      pairs++;
    }
  }
  if (depth > 0) return '缺少對應的 }';
  if (pairs === 0) return '例句沒有用 {} 標記文法部分';
  return null;
}

export function validateDataset(raw: unknown, datasetId: string): ValidationResult {
  const issues: Issue[] = [];
  const error = (path: string, message: string) => issues.push({ level: 'error', path, message });
  const warn = (path: string, message: string) => issues.push({ level: 'warning', path, message });

  const unknownKeys = (obj: Obj, allowed: string[], base: string) => {
    for (const key of Object.keys(obj)) {
      if (!allowed.includes(key)) warn(base ? `${base}.${key}` : key, `未知欄位「${key}」（是否拼錯？）`);
    }
  };

  if (!isObject(raw)) {
    error('', '檔案內容必須是 JSON 物件');
    return { issues, dataset: null };
  }

  if (!isNonEmptyString(raw.name)) error('name', '必須是非空字串');
  if (!CATEGORIES.includes(raw.category as Category)) {
    error('category', `必須是 ${CATEGORIES.join(' 或 ')}，目前為 ${JSON.stringify(raw.category)}`);
  }
  if (!isNonEmptyString(raw.level)) error('level', '必須是非空字串');
  else if (!/^N[1-5]$/.test(raw.level)) warn('level', `建議使用 N1–N5，目前為「${raw.level}」`);
  if (!Array.isArray(raw.data)) error('data', '必須是陣列');
  unknownKeys(raw, TOP_KEYS, '');

  if (issues.some((i) => i.level === 'error')) return { issues, dataset: null };

  const category = raw.category as Category;
  const seenIds = new Map<string, number>();
  const validItems: unknown[] = [];

  (raw.data as unknown[]).forEach((item, index) => {
    const base = `data[${index}]`;
    const before = issues.filter((i) => i.level === 'error').length;

    if (!isObject(item)) {
      error(base, '必須是物件');
      return;
    }

    if (!isNonEmptyString(item.id)) {
      error(`${base}.id`, '必須是非空字串');
    } else if (seenIds.has(item.id)) {
      error(`${base}.id`, `id「${item.id}」與 data[${seenIds.get(item.id)}] 重複`);
    } else {
      seenIds.set(item.id, index);
    }

    for (const key of ['japanese', 'simple_chinese']) {
      if (!isNonEmptyString(item[key])) error(`${base}.${key}`, '必須是非空字串');
    }
    if (item.full_explanation !== undefined && typeof item.full_explanation !== 'string') {
      error(`${base}.full_explanation`, '必須是字串');
    }

    if (category === 'vocabulary') {
      if (!isNonEmptyString(item.hiragana)) error(`${base}.hiragana`, '必須是非空字串');
      else if (KANJI.test(item.hiragana)) warn(`${base}.hiragana`, `讀音中含有漢字：「${item.hiragana}」`);
    } else if (item.examples !== undefined) {
      if (!Array.isArray(item.examples)) {
        error(`${base}.examples`, '必須是陣列');
      } else {
        item.examples.forEach((ex: unknown, j: number) => {
          const exBase = `${base}.examples[${j}]`;
          if (!isObject(ex)) {
            error(exBase, '必須是物件');
            return;
          }
          const { sentence, chinese } = ex as Partial<GrammarExample>;
          if (!isNonEmptyString(sentence)) error(`${exBase}.sentence`, '必須是非空字串');
          else {
            const braceError = checkBraces(sentence);
            if (braceError) error(`${exBase}.sentence`, `${braceError}：「${sentence}」`);
          }
          if (!isNonEmptyString(chinese)) error(`${exBase}.chinese`, '必須是非空字串（例句的中文翻譯）');
          unknownKeys(ex, EXAMPLE_KEYS, exBase);
        });
      }
    }

    unknownKeys(item, ITEM_KEYS[category], base);

    if (issues.filter((i) => i.level === 'error').length === before) validItems.push(item);
  });

  if (validItems.length === 0) warn('data', '沒有任何可用的卡片');

  const dataset = { ...raw, id: datasetId, data: validItems } as Dataset;
  return { issues, dataset };
}
