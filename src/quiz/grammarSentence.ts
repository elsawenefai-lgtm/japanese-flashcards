// 文法例句解析
// - 【】 標出文法部分，例如「日本にいる【うちに】、富士山に登りたい。」
// - {漢字|かな} 標注讀音，例如「{富士山|ふじさん}」；可以出現在 【】 內外
// - 句末標點之後的最後一組 【】（例如「…ました。【自動詞】」）是註記標籤，不算文法部分

export type SegmentKind = 'text' | 'target' | 'note';

export interface Segment {
  text: string;
  /** 有 {漢字|かな} 標注時的讀音 */
  reading?: string;
  kind: SegmentKind;
  /** 文法部分的編號：同一組 【】 內的片段編號相同（填空時合併成一個空格） */
  group?: number;
}

const TOKEN = /【|】|\{([^{}|]+)\|([^{}]+)\}/g;
const SENTENCE_END = /[。？！?!」』）)]\s*$/;

export function parseSentence(sentence: string): Segment[] {
  const segments: Segment[] = [];
  let inTarget = false;
  let group = -1;
  let last = 0;

  const push = (text: string, reading?: string) => {
    if (!text) return;
    const kind: SegmentKind = inTarget ? 'target' : 'text';
    const prev = segments[segments.length - 1];
    // 相鄰、同類、都沒有讀音的文字合併成一段
    if (prev && !reading && !prev.reading && prev.kind === kind && prev.group === (inTarget ? group : undefined)) {
      prev.text += text;
      return;
    }
    segments.push({ text, reading, kind, group: inTarget ? group : undefined });
  };

  for (const match of sentence.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    push(sentence.slice(last, index));
    if (match[0] === '【') {
      inTarget = true;
      group++;
    } else if (match[0] === '】') {
      inTarget = false;
    } else {
      push(match[1], match[2]);
    }
    last = index + match[0].length;
  }
  push(sentence.slice(last));

  markTrailingNote(segments);
  return segments;
}

/** 句末標點之後的最後一組 【】 改成註記 */
function markTrailingNote(segments: Segment[]) {
  const lastGroup = segments[segments.length - 1]?.group;
  if (lastGroup === undefined) return;
  const firstOfGroup = segments.findIndex((s) => s.group === lastGroup);
  const before = segments
    .slice(0, firstOfGroup)
    .map((s) => s.text)
    .join('');
  // 至少要留下一個真正的文法部分
  const otherTargets = segments.some((s) => s.kind === 'target' && s.group !== lastGroup);
  if (!SENTENCE_END.test(before) || !otherTargets) return;
  for (const s of segments) {
    if (s.group === lastGroup) {
      s.kind = 'note';
      s.group = undefined;
    }
  }
}

/** 去掉所有標記的純文字（不含註記） */
export function plainSentence(sentence: string): string {
  return parseSentence(sentence)
    .filter((s) => s.kind !== 'note')
    .map((s) => s.text)
    .join('');
}

/** 朗讀用：有讀音的地方改用假名，避免語音引擎念錯漢字 */
export function speechSentence(sentence: string): string {
  return parseSentence(sentence)
    .filter((s) => s.kind !== 'note')
    .map((s) => s.reading ?? s.text)
    .join('');
}

/** 挖空的答案（可能有多處），每組 【】 一個 */
export function clozeAnswers(sentence: string): string[] {
  const answers: string[] = [];
  for (const s of parseSentence(sentence)) {
    if (s.kind !== 'target' || s.group === undefined) continue;
    answers[s.group] = (answers[s.group] ?? '') + s.text;
  }
  return answers.filter(Boolean);
}
