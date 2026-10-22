// 文法例句解析：例句中用 {} 標記文法部分，例如「日本にいる{うちに}、富士山に登りたい。」

export interface Segment {
  text: string;
  /** 是否為 {} 標記的文法部分 */
  target: boolean;
}

/** 切成一般文字與文法部分；格式已由資料驗證保證，這裡遇到不成對的括號就當一般文字 */
export function parseSentence(sentence: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /\{([^{}]+)\}/g;
  let last = 0;
  for (const match of sentence.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) segments.push({ text: sentence.slice(last, start), target: false });
    segments.push({ text: match[1], target: true });
    last = start + match[0].length;
  }
  if (last < sentence.length) segments.push({ text: sentence.slice(last), target: false });
  return segments;
}

/** 去掉標記的純文字（朗讀用） */
export function plainSentence(sentence: string): string {
  return parseSentence(sentence)
    .map((s) => s.text)
    .join('');
}

/** 挖空的答案（可能有多處） */
export function clozeAnswers(sentence: string): string[] {
  return parseSentence(sentence)
    .filter((s) => s.target)
    .map((s) => s.text);
}
