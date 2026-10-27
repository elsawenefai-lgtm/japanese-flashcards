import { describe, expect, it } from 'vitest';
import { checkMarkup, validateDataset } from './validate';

const vocab = (data: unknown[], extra: object = {}) => ({
  name: '測試',
  category: 'vocabulary',
  level: 'N3',
  data,
  ...extra,
});

const grammar = (examples: unknown) => ({
  name: '測試文法',
  category: 'grammar',
  level: 'N3',
  data: [{ id: 'g1', japanese: 'うちに', simple_chinese: '趁～', examples }],
});

const errorPaths = (raw: unknown) =>
  validateDataset(raw, 'x')
    .issues.filter((i) => i.level === 'error')
    .map((i) => i.path);

describe('checkMarkup', () => {
  it('接受一組或多組【】，以及讀音標注', () => {
    expect(checkMarkup('日本にいる【うちに】、')).toBeNull();
    expect(checkMarkup('【A】と【B】')).toBeNull();
    expect(checkMarkup('{日本|にほん}に【{居|い}る】')).toBeNull();
  });

  it('找出各種【】錯誤', () => {
    expect(checkMarkup('うちに')).toContain('沒有用 【】');
    expect(checkMarkup('【うちに')).toContain('缺少對應的 】');
    expect(checkMarkup('うちに】')).toContain('多出一個 】');
    expect(checkMarkup('【う【ち】に】')).toContain('巢狀');
    expect(checkMarkup('【】です')).toContain('不可為空');
  });

  it('找出讀音標注格式錯誤', () => {
    expect(checkMarkup('【A】{日本}')).toContain('{漢字|かな}');
    expect(checkMarkup('【A】{日本|}')).toContain('{漢字|かな}');
    expect(checkMarkup('【A】日本|にほん')).toContain('{漢字|かな}');
  });
});

describe('validateDataset', () => {
  it('正確的單字資料集沒有任何問題', () => {
    const raw = vocab([{ id: '1', japanese: '株式', hiragana: 'かぶしき', simple_chinese: '股份' }]);
    const result = validateDataset(raw, 'vocabulary/test');
    expect(result.issues).toEqual([]);
    expect(result.dataset?.id).toBe('vocabulary/test');
    expect(result.dataset?.data).toHaveLength(1);
  });

  it('頂層欄位錯誤時整個資料集無法載入', () => {
    const result = validateDataset({ name: 'x', category: 'vocab', level: 'N3', data: [] }, 'x');
    expect(result.dataset).toBeNull();
    expect(result.issues[0].path).toBe('category');
  });

  it('只略過有錯誤的卡片', () => {
    const raw = vocab([
      { id: '1', japanese: '株式', hiragana: 'かぶしき', simple_chinese: '股份' },
      { id: '2', japanese: '会議', simple_chinese: '會議' },
      { id: '1', japanese: '準備', hiragana: 'じゅんび', simple_chinese: '準備' },
    ]);
    const result = validateDataset(raw, 'x');
    expect(result.dataset?.data.map((d) => d.japanese)).toEqual(['株式']);
    expect(errorPaths(raw)).toEqual(['data[1].hiragana', 'data[2].id']);
  });

  it('未知欄位與讀音含漢字只算警告', () => {
    const raw = vocab([{ id: '1', japanese: '株式', hiragana: '株しき', simple_chinese: '股份', note: '' }]);
    const result = validateDataset(raw, 'x');
    expect(result.dataset?.data).toHaveLength(1);
    expect(result.issues.map((i) => [i.level, i.path])).toEqual([
      ['warning', 'data[0].hiragana'],
      ['warning', 'data[0].note'],
    ]);
  });

  it('文法 examples 為選填', () => {
    expect(errorPaths(grammar(undefined))).toEqual([]);
  });

  it('檢查文法例句的標記與翻譯', () => {
    const raw = grammar([
      { sentence: '日本にいる【うちに】', chinese: '趁在日本' },
      { sentence: '日本にいるうちに', chinese: '' },
    ]);
    expect(errorPaths(raw)).toEqual(['data[0].examples[1].sentence', 'data[0].examples[1].chinese']);
  });
});
