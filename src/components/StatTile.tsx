import styles from './StatTile.module.css';

interface StatTileProps {
  label: string;
  value: string | number;
  /** 數值後面的單位，例如「天」「張」 */
  unit?: string;
  hint?: string;
}

/** 單一數字的統計方塊 */
export function StatTile({ label, value, unit, hint }: StatTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value}
        {unit && <small>{unit}</small>}
      </span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
