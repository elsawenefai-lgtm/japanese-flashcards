import type { VocabItem } from '../types/dataset';
import type { VocabCard } from '../study/vocabCards';
import { hasKanji } from '../study/vocabCards';
import type { VocabScript } from '../store/settings';
import { SpeakButton } from './SpeakButton';
import { Markdown } from './Markdown';
import styles from './VocabCardFace.module.css';

interface VocabCardFaceProps {
  card: VocabCard;
  side: 'front' | 'back';
  script: VocabScript;
  showExplanation: boolean;
  /** 裝置沒有日文語音時為 undefined，隱藏朗讀按鈕 */
  onSpeak?: () => void;
  /** 右上角提示文字；預設為「點擊翻面」／「答案」 */
  hint?: string;
}

const directionLabel = { 'jp-zh': '日 → 中', 'zh-jp': '中 → 日' } as const;

/** 漢字上方標讀音；沒有漢字（外來語等）就直接顯示原字 */
function Reading({ item }: { item: VocabItem }) {
  if (!hasKanji(item.japanese) || item.japanese === item.hiragana) return <>{item.japanese}</>;
  return (
    <ruby>
      {item.japanese}
      <rt>{item.hiragana}</rt>
    </ruby>
  );
}

export function VocabCardFace({ card, side, script, showExplanation, onSpeak, hint }: VocabCardFaceProps) {
  const { item, direction } = card;
  const speak = onSpeak && <SpeakButton onSpeak={onSpeak} />;

  const header = (
    <div className={styles.header}>
      <span className={styles.direction}>{directionLabel[direction]}</span>
      <span className={styles.hint}>{hint ?? (side === 'front' ? '點擊翻面' : '答案')}</span>
    </div>
  );

  if (side === 'front') {
    const prompt =
      direction === 'zh-jp' ? (
        <p className={styles.chinese}>{item.simple_chinese}</p>
      ) : (
        <p className={styles.japanese} lang="ja">
          {script === 'hiragana' ? item.hiragana : item.japanese}
        </p>
      );
    return (
      <>
        {header}
        <div className={styles.center}>
          {prompt}
          {direction === 'jp-zh' && speak}
        </div>
      </>
    );
  }

  const explanation = showExplanation && item.full_explanation && (
    <div className={styles.explanation}>
      <Markdown>{item.full_explanation}</Markdown>
    </div>
  );

  return (
    <>
      {header}
      <div className={styles.center}>
        {direction === 'jp-zh' ? (
          <>
            <p className={styles.chinese}>{item.simple_chinese}</p>
            <div className={styles.sub}>
              <span lang="ja" className={styles.subJapanese}>
                <Reading item={item} />
              </span>
              {speak}
            </div>
          </>
        ) : (
          <>
            <p className={styles.japanese} lang="ja">
              <Reading item={item} />
            </p>
            <div className={styles.sub}>
              <span>{item.simple_chinese}</span>
              {speak}
            </div>
          </>
        )}
      </div>
      {explanation}
    </>
  );
}
