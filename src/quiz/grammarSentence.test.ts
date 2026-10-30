import { describe, expect, it } from 'vitest';
import { clozeAnswers, parseSentence, plainSentence } from './grammarSentence';

describe('parseSentence', () => {
  it('切出文法部分', () => {
    expect(parseSentence('日本にいる【うちに】、富士山に登りたい。')).toEqual([
      { text: '日本にいる', kind: 'text', group: undefined },
      { text: 'うちに', kind: 'target', group: 0 },
      { text: '、富士山に登りたい。', kind: 'text', group: undefined },
    ]);
  });

  it('解析讀音標注，文法部分內外都可以', () => {
    expect(parseSentence('{味|あじ}【が{変|へん}】')).toEqual([
      { text: '味', reading: 'あじ', kind: 'text', group: undefined },
      { text: 'が', kind: 'target', group: 0 },
      { text: '変', reading: 'へん', kind: 'target', group: 0 },
    ]);
  });

  it('多組文法部分各自編號', () => {
    const groups = parseSentence('【A】と【B】').filter((s) => s.kind === 'target').map((s) => s.group);
    expect(groups).toEqual([0, 1]);
  });

  it('句末標點之後的最後一組【】是註記', () => {
    const segments = parseSentence('ピザが{焼き|やき}【あがり】ました。【{自動詞|じどうし}】');
    expect(segments.filter((s) => s.kind === 'note').map((s) => s.text)).toEqual(['自動詞']);
    expect(clozeAnswers('ピザが焼き【あがり】ました。【自動詞】')).toEqual(['あがり']);
  });

  it('只有一組【】時，即使在句尾也是文法部分', () => {
    expect(clozeAnswers('どうすれ【ばいい】の？')).toEqual(['ばいい']);
    expect(clozeAnswers('これでいいです。【よ】')).toEqual(['よ']);
  });

  it('句中的最後一組不會被當成註記', () => {
    expect(clozeAnswers('【A】と【B】です。')).toEqual(['A', 'B']);
  });

  it('沒有標記時整句都是一般文字', () => {
    expect(parseSentence('こんにちは')).toEqual([{ text: 'こんにちは', kind: 'text', group: undefined }]);
  });
});

describe('plainSentence / clozeAnswers', () => {
  const s = '{暗|くら}く【ならないうちに】{帰|かえ}りましょう。';

  it('去掉標記', () => {
    expect(plainSentence(s)).toBe('暗くならないうちに帰りましょう。');
    expect(plainSentence('焼き【あがり】ました。【自動詞】')).toBe('焼きあがりました。');
  });

  it('取出答案，同一組內的讀音標注會合併', () => {
    expect(clozeAnswers(s)).toEqual(['ならないうちに']);
    expect(clozeAnswers('【{見|み}てみる】と【A】')).toEqual(['見てみる', 'A']);
  });
});
