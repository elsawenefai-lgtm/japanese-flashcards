import { parseSentence } from '../quiz/grammarSentence';
import styles from './Sentence.module.css';

interface SentenceProps {
  sentence: string;
  /** highlight：文法部分高亮；cloze：文法部分挖空；plain：不標示 */
  variant: 'highlight' | 'cloze' | 'plain';
  className?: string;
}

/** 顯示文法例句，依 {} 標記高亮或挖空 */
export function Sentence({ sentence, variant, className }: SentenceProps) {
  return (
    <span lang="ja" className={className}>
      {parseSentence(sentence).map((seg, i) => {
        if (!seg.target || variant === 'plain') return <span key={i}>{seg.text}</span>;
        if (variant === 'highlight') {
          return (
            <mark key={i} className={styles.highlight}>
              {seg.text}
            </mark>
          );
        }
        // 空格寬度大致跟答案長度相同，但不透露確切字數
        return (
          <span
            key={i}
            className={styles.blank}
            style={{ minWidth: `${Math.max(3, Math.ceil(seg.text.length / 2) * 2)}em` }}
            aria-label="空格"
          />
        );
      })}
    </span>
  );
}
