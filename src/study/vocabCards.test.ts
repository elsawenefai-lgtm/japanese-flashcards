import { describe, expect, it } from 'vitest';
import type { VocabItem } from '../types/dataset';
import { buildVocabSession, hasKanji, parseDirection, speechText } from './vocabCards';

const items: VocabItem[] = [
  { id: '1', japanese: '株式', hiragana: 'かぶしき', simple_chinese: '股份' },
  { id: '2', japanese: '会議', hiragana: 'かいぎ', simple_chinese: '會議' },
  { id: '3', japanese: 'スケジュール', hiragana: 'スケジュール', simple_chinese: '行程' },
];

describe('buildVocabSession', () => {
  it('單一方向時每張卡出現一次', () => {
    const cards = buildVocabSession('v/test', items, 'zh-jp');
    expect(cards).toHaveLength(3);
    expect(cards.every((c) => c.direction === 'zh-jp')).toBe(true);
    expect(cards.map((c) => c.key).sort()).toEqual(['v/test:1:zh-jp', 'v/test:2:zh-jp', 'v/test:3:zh-jp']);
  });

  it('混合模式兩個方向都有，且同一張卡不相鄰', () => {
    for (let n = 0; n < 50; n++) {
      const cards = buildVocabSession('v/test', items, 'mixed');
      expect(cards).toHaveLength(6);
      for (let i = 1; i < cards.length; i++) expect(cards[i].item.id).not.toBe(cards[i - 1].item.id);
    }
  });
});

describe('輔助函式', () => {
  it('hasKanji', () => {
    expect(hasKanji('株式')).toBe(true);
    expect(hasKanji('引っ越す')).toBe(true);
    expect(hasKanji('スケジュール')).toBe(false);
  });

  it('speechText 使用讀音', () => {
    expect(speechText(items[0])).toBe('かぶしき');
  });

  it('parseDirection 對無效值回傳預設', () => {
    expect(parseDirection('mixed')).toBe('mixed');
    expect(parseDirection('abc')).toBe('jp-zh');
    expect(parseDirection(null)).toBe('jp-zh');
  });
});
