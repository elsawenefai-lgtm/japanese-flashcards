import { describe, expect, it } from 'vitest';
import type { GrammarDataset, GrammarItem } from '../types/dataset';
import {
  buildGrammarCards,
  buildGrammarSession,
  grammarAnswer,
  grammarDistractors,
  grammarFrontIsJapanese,
  grammarKeys,
  grammarSpeechText,
  parseGrammarModes,
} from './grammarCards';

const items: GrammarItem[] = [
  {
    id: '1',
    japanese: 'うちに',
    simple_chinese: '趁～',
    examples: [
      { sentence: '日本にいる【うちに】行きたい。', chinese: '趁在日本時想去。' },
      { sentence: '若い【うちに】勉強しよう。', chinese: '趁年輕時學習吧。' },
    ],
  },
  { id: '2', japanese: 'ばかり', simple_chinese: '淨是～' },
];

describe('buildGrammarCards', () => {
  it('沒有例句的條目略過例句類模式', () => {
    const cards = buildGrammarCards('g/t', items, ['g-zh', 'cloze']);
    expect(cards.map((c) => c.key)).toEqual(['g/t:1:g-zh', 'g/t:1:cloze', 'g/t:2:g-zh']);
  });

  it('例句類模式會挑一句例句，非例句模式沒有', () => {
    const cards = buildGrammarCards('g/t', items, ['g-zh', 'ex-zh'], () => 0.99);
    expect(cards[0].example).toBeUndefined();
    expect(cards[1].example?.chinese).toBe('趁年輕時學習吧。');
  });

  it('自由練習洗牌後同一條文法不相鄰', () => {
    const many: GrammarItem[] = [0, 1, 2].map((i) => ({ ...items[0], id: String(i) }));
    for (let n = 0; n < 30; n++) {
      const cards = buildGrammarSession('g/t', many, ['g-zh', 'zh-g', 'cloze']);
      for (let i = 1; i < cards.length; i++) expect(cards[i].item.id).not.toBe(cards[i - 1].item.id);
    }
  });
});

describe('grammarKeys', () => {
  it('與實際產生的卡片一致', () => {
    const dataset = { id: 'g/t', name: 't', category: 'grammar', level: 'N3', data: items } as GrammarDataset;
    expect(grammarKeys(dataset, ['ex-zh', 'zh-g'])).toEqual(['g/t:1:ex-zh', 'g/t:1:zh-g', 'g/t:2:zh-g']);
  });
});

describe('parseGrammarModes', () => {
  it('過濾無效值並依固定順序排列', () => {
    expect(parseGrammarModes('cloze,abc,g-zh,cloze')).toEqual(['g-zh', 'cloze']);
    expect(parseGrammarModes(null)).toEqual(['g-zh']);
  });
});

describe('選擇題答案', () => {
  it('依模式決定正解；填空用實際形態', () => {
    const [g1, zhg, cloze] = buildGrammarCards('g/t', items, ['g-zh', 'zh-g', 'cloze'], () => 0);
    expect(grammarAnswer(g1)).toBe('趁～');
    expect(grammarAnswer(zhg)).toBe('うちに');
    expect(grammarAnswer(cloze)).toBe('うちに');
  });

  it('干擾選項排除自己，填空沒有例句時退回原形', () => {
    const other: GrammarItem = {
      id: '3',
      japanese: 'ようにする',
      simple_chinese: '盡量',
      examples: [{ sentence: '食べる【ようにして】います。', chinese: '盡量吃。' }],
    };
    const cloze = buildGrammarCards('g/t', items, ['cloze'], () => 0)[0];
    expect(grammarDistractors(cloze, [...items, other])).toEqual(['ばかり', 'ようにして']);
    const g1 = buildGrammarCards('g/t', items, ['g-zh'])[0];
    expect(grammarDistractors(g1, [...items, other])).toEqual(['淨是～', '盡量']);
  });
});

describe('朗讀與題面', () => {
  it('有例句時念整句（去掉標記）', () => {
    const [g1, cloze] = buildGrammarCards('g/t', items, ['g-zh', 'cloze'], () => 0);
    expect(grammarSpeechText(g1)).toBe('うちに');
    expect(grammarSpeechText(cloze)).toBe('日本にいるうちに行きたい。');
    expect(grammarFrontIsJapanese(g1)).toBe(true);
    expect(grammarFrontIsJapanese(cloze)).toBe(false);
  });
});
