import type { Category, Dataset } from '../types/dataset';
import type { DatasetFilter } from '../data/filter';
import styles from './FilterBar.module.css';

const categoryOptions: { value: Category | null; label: string }[] = [
  { value: null, label: '全部' },
  { value: 'vocabulary', label: '單字' },
  { value: 'grammar', label: '文法' },
];

interface FilterBarProps {
  datasets: Dataset[];
  levels: string[];
  filter: DatasetFilter;
  onChange: (filter: DatasetFilter) => void;
}

export function FilterBar({ datasets, levels, filter, onChange }: FilterBarProps) {
  // 分類的數量受等級篩選影響，等級的數量受分類篩選影響
  const categoryCount = (value: Category | null) =>
    datasets.filter(
      (d) =>
        (value === null || d.category === value) &&
        (filter.levels.length === 0 || filter.levels.includes(d.level)),
    ).length;
  const levelCount = (level: string) =>
    datasets.filter((d) => d.level === level && (filter.category === null || d.category === filter.category))
      .length;

  const toggleLevel = (level: string) => {
    const next = filter.levels.includes(level)
      ? filter.levels.filter((l) => l !== level)
      : [...filter.levels, level];
    onChange({ ...filter, levels: levels.filter((l) => next.includes(l)) });
  };

  return (
    <div className={styles.bar}>
      <div className={styles.group} role="radiogroup" aria-label="分類">
        {categoryOptions.map((opt) => {
          const selected = filter.category === opt.value;
          return (
            <button
              key={opt.label}
              role="radio"
              aria-checked={selected}
              className={selected ? `${styles.pill} ${styles.selected}` : styles.pill}
              onClick={() => onChange({ ...filter, category: opt.value })}
            >
              {opt.label}
              <span className={styles.count}>{categoryCount(opt.value)}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.group} role="group" aria-label="等級（可複選）">
        <button
          aria-pressed={filter.levels.length === 0}
          className={filter.levels.length === 0 ? `${styles.pill} ${styles.selected}` : styles.pill}
          onClick={() => onChange({ ...filter, levels: [] })}
        >
          全部等級
        </button>
        {levels.map((level) => {
          const selected = filter.levels.includes(level);
          return (
            <button
              key={level}
              aria-pressed={selected}
              className={selected ? `${styles.pill} ${styles.selectedLevel}` : styles.pill}
              onClick={() => toggleLevel(level)}
            >
              {level}
              <span className={styles.count}>{levelCount(level)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
