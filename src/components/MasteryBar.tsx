import type { DeckSummary } from '../study/deckProgress';
import { MASTERY_LABEL } from '../study/deckProgress';
import type { Mastery } from '../srs/scheduler';
import styles from './MasteryBar.module.css';

const ORDER: Mastery[] = ['mastered', 'familiar', 'learning', 'new'];

interface MasteryBarProps {
  summary: DeckSummary;
  showLegend?: boolean;
}

/** 熟練度分布：精通／熟悉／學習中／新卡 */
export function MasteryBar({ summary, showLegend = false }: MasteryBarProps) {
  const label = ORDER.map((m) => `${MASTERY_LABEL[m]} ${summary.mastery[m]}`).join('、');
  return (
    <div className={styles.wrap}>
      <div className={styles.bar} role="img" aria-label={`熟練度：${label}`}>
        {ORDER.map(
          (m) =>
            summary.mastery[m] > 0 && (
              <span
                key={m}
                className={`${styles.segment} ${styles[m]}`}
                style={{ flexGrow: summary.mastery[m] }}
              />
            ),
        )}
      </div>
      {showLegend && (
        <ul className={styles.legend}>
          {ORDER.map((m) => (
            <li key={m}>
              <span className={`${styles.dot} ${styles[m]}`} />
              {MASTERY_LABEL[m]} <strong>{summary.mastery[m]}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
