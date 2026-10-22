import { describe, expect, it } from 'vitest';
import { clozeAnswers, parseSentence, plainSentence } from './grammarSentence';

describe('parseSentence', () => {
  it('切出文法部分', () => {
    expect(parseSentence('日本にいる{うちに}、富士山に登りたい。')).toEqual([
      { text: '日本にいる', target: false },
      { text: 'うちに', target: true },
      { text: '、富士山に登りたい。', target: false },
    ]);
  });

  it('支援開頭、結尾與多處標記', () => {
    expect(parseSentence('{A}と{B}')).toEqual([
      { text: 'A', target: true },
      { text: 'と', target: false },
      { text: 'B', target: true },
    ]);
  });

  it('沒有標記時整句都是一般文字', () => {
    expect(parseSentence('こんにちは')).toEqual([{ text: 'こんにちは', target: false }]);
  });
});

describe('plainSentence / clozeAnswers', () => {
  it('去掉標記、取出答案', () => {
    const s = '暗く{ならないうちに}帰りましょう。';
    expect(plainSentence(s)).toBe('暗くならないうちに帰りましょう。');
    expect(clozeAnswers(s)).toEqual(['ならないうちに']);
    expect(clozeAnswers('{A}と{B}')).toEqual(['A', 'B']);
  });
});
