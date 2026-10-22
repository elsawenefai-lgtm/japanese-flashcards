import type { GrammarCard } from '../study/grammarCards';
import { GRAMMAR_MODES } from '../study/grammarCards';
import { clozeAnswers } from '../quiz/grammarSentence';
import { SpeakButton } from './SpeakButton';
import { Markdown } from './Markdown';
import { Sentence } from './Sentence';
import styles from './GrammarCardFace.module.css';

interface GrammarCardFaceProps {
  card: GrammarCard;
  side: 'front' | 'back';
  showExplanation: boolean;
  /** 裝置沒有日文語音時為 undefined，隱藏朗讀按鈕 */
  onSpeak?: () => void;
  /** 右上角提示文字；預設為「點擊翻面」／「答案」 */
  hint?: string;
}

const modeLabel = Object.fromEntries(GRAMMAR_MODES.map((m) => [m.value, m.label]));

export function GrammarCardFace({ card, side, showExplanation, onSpeak, hint }: GrammarCardFaceProps) {
  const { item, mode, example } = card;
  const speak = onSpeak && <SpeakButton onSpeak={onSpeak} />;

  const header = (
    <div className={styles.header}>
      <span className={styles.mode}>{modeLabel[mode]}</span>
      <span className={styles.hint}>{hint ?? (side === 'front' ? '點擊翻面' : '答案')}</span>
    </div>
  );

  if (side === 'front') {
    return (
      <>
        {header}
        <div className={styles.center}>
          {mode === 'g-zh' && (
            <>
              <p className={styles.grammar} lang="ja">
                {item.japanese}
              </p>
              {speak}
            </>
          )}
          {mode === 'ex-zh' && example && (
            <>
              <p className={styles.sentence}>
                <Sentence sentence={example.sentence} variant="highlight" />
              </p>
              <p className={styles.prompt}>畫線部分是什麼意思？</p>
              {speak}
            </>
          )}
          {mode === 'zh-g' && <p className={styles.chinese}>{item.simple_chinese}</p>}
          {mode === 'cloze' && example && (
            <>
              <p className={styles.sentence}>
                <Sentence sentence={example.sentence} variant="cloze" />
              </p>
              <p className={styles.translation}>{example.chinese}</p>
              <p className={styles.prompt}>空格要填入什麼文法？</p>
            </>
          )}
        </div>
      </>
    );
  }

  // 答案面
  const answer =
    mode === 'g-zh' || mode === 'ex-zh' ? (
      <>
        <p className={styles.chinese}>{item.simple_chinese}</p>
        <div className={styles.sub}>
          <span lang="ja" className={styles.subGrammar}>
            {item.japanese}
          </span>
          {mode === 'g-zh' && speak}
        </div>
      </>
    ) : (
      <>
        <p className={styles.grammar} lang="ja">
          {mode === 'cloze' && example ? clozeAnswers(example.sentence).join(' … ') : item.japanese}
        </p>
        <div className={styles.sub}>
          {mode === 'cloze' && example && clozeAnswers(example.sentence).join('') !== item.japanese && (
            <span lang="ja" className={styles.subGrammar}>
              {item.japanese}
            </span>
          )}
          <span>{item.simple_chinese}</span>
          {mode === 'zh-g' && speak}
        </div>
      </>
    );

  // 例句類模式顯示出題的那一句；其他模式列出所有例句
  const examples = example ? [example] : (item.examples ?? []);

  return (
    <>
      {header}
      <div className={styles.center}>{answer}</div>
      {examples.length > 0 && (
        <ul className={styles.examples}>
          {examples.map((ex, i) => (
            <li key={i}>
              <div className={styles.exampleRow}>
                <Sentence sentence={ex.sentence} variant="highlight" className={styles.exampleJa} />
                {example && speak}
              </div>
              <span className={styles.exampleZh}>{ex.chinese}</span>
            </li>
          ))}
        </ul>
      )}
      {showExplanation && item.full_explanation && (
        <div className={styles.explanation}>
          <Markdown>{item.full_explanation}</Markdown>
        </div>
      )}
    </>
  );
}
