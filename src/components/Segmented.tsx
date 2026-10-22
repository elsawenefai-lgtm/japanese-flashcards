import styles from './Segmented.module.css';

interface SegmentedProps<T extends string | number> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'normal' | 'small';
}

/** 膠囊形單選切換（主題、題面文字、語速等共用） */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  size = 'normal',
}: SegmentedProps<T>) {
  return (
    <div
      className={size === 'small' ? `${styles.segment} ${styles.small}` : styles.segment}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={value === opt.value ? `${styles.option} ${styles.selected}` : styles.option}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
