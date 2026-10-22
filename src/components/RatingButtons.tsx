import type { Rating } from '../srs/scheduler';
import styles from './RatingButtons.module.css';

export const RATINGS: { value: Rating; label: string; key: string }[] = [
  { value: 'again', label: '忘記', key: '1' },
  { value: 'hard', label: '困難', key: '2' },
  { value: 'good', label: '記得', key: '3' },
  { value: 'easy', label: '簡單', key: '4' },
];

interface RatingButtonsProps {
  /** 每個評分對應的下次間隔文字，例如「3 天」 */
  previews: Record<Rating, string>;
  onRate: (rating: Rating) => void;
}

export function RatingButtons({ previews, onRate }: RatingButtonsProps) {
  return (
    <div className={styles.row} role="group" aria-label="自評">
      {RATINGS.map((r) => (
        <button
          key={r.value}
          type="button"
          className={`${styles.button} ${styles[r.value]}`}
          onClick={() => onRate(r.value)}
          title={`${r.label}（${r.key}）`}
        >
          <span className={styles.label}>{r.label}</span>
          <span className={styles.preview}>{previews[r.value]}</span>
        </button>
      ))}
    </div>
  );
}
