import type { ReactNode } from 'react';
import { parseSentence, type Segment } from '../quiz/grammarSentence';
import { useSettings } from '../store/settings';
import styles from './Sentence.module.css';

interface SentenceProps {
  sentence: string;
  /** highlight：文法部分高亮；cloze：文法部分挖空；plain：不標示 */
  variant: 'highlight' | 'cloze' | 'plain';
  className?: string;
}

/** 有讀音且設定開啟時加上振假名 */
function Text({ seg, furigana }: { seg: Segment; furigana: boolean }) {
  if (!seg.reading || !furigana) return <>{seg.text}</>;
  return (
    <ruby>
      {seg.text}
      <rt>{seg.reading}</rt>
    </ruby>
  );
}

/** 顯示文法例句：【】 部分高亮或挖空、{漢字|かな} 顯示振假名、句尾註記顯示成小標籤 */
export function Sentence({ sentence, variant, className }: SentenceProps) {
  const furigana = useSettings((s) => s.showFurigana);
  const segments = parseSentence(sentence);
  const nodes: ReactNode[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.kind === 'note') {
      nodes.push(
        <span key={i} className={styles.note}>
          {seg.text}
        </span>,
      );
    } else if (seg.kind === 'text' || variant === 'plain') {
      nodes.push(<Text key={i} seg={seg} furigana={furigana} />);
    } else if (variant === 'highlight') {
      nodes.push(
        <mark key={i} className={styles.highlight}>
          <Text seg={seg} furigana={furigana} />
        </mark>,
      );
    } else {
      // 同一組 【】 合併成一個空格；寬度大致跟答案長度相同，但不透露確切字數
      let length = 0;
      while (i < segments.length && segments[i].group === seg.group && segments[i].kind === 'target') {
        length += segments[i].text.length;
        i++;
      }
      i--;
      nodes.push(
        <span
          key={i}
          className={styles.blank}
          style={{ minWidth: `${Math.max(3, Math.ceil(length / 2) * 2)}em` }}
          aria-label="空格"
        />,
      );
    }
  }

  return (
    <span lang="ja" className={className}>
      {nodes}
    </span>
  );
}
