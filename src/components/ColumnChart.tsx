import { useState } from 'react';
import styles from './ColumnChart.module.css';

export interface ColumnDatum {
  /** x 軸標籤，例如 10/22 */
  label: string;
  value: number;
  /** 提示框中的完整說明，例如「10月22日：學習 12 次，答對 10 次」 */
  detail: string;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  /** 圖表的文字說明（無障礙用） */
  summary: string;
  /** 表格檢視的欄位名稱 */
  valueLabel: string;
}

/**
 * 單一系列的直條圖：直條最寬 24px、頂端 4px 圓角、從同一條基準線長出。
 * 只標示最大值，其他數值用滑鼠移入或鍵盤聚焦時的提示框查看；另附表格檢視。
 */
export function ColumnChart({ data, summary, valueLabel }: ColumnChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const maxIndex = data.findIndex((d) => d.value === max);
  // 資料點多時 x 軸標籤隔一個顯示，但保留最後一個
  const showLabel = (i: number) => data.length <= 8 || i % 2 === (data.length - 1) % 2;

  return (
    <figure className={styles.figure}>
      <div className={styles.plot} role="img" aria-label={summary} onMouseLeave={() => setActive(null)}>
        {data.map((d, i) => (
          <div
            key={d.label}
            className={styles.slot}
            tabIndex={0}
            aria-label={d.detail}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            {active === i && (
              <div className={styles.tooltip} role="tooltip">
                {d.detail}
              </div>
            )}
            {i === maxIndex && d.value > 0 && active !== i && <span className={styles.peak}>{d.value}</span>}
            <div
              className={`${styles.column} ${active === i ? styles.columnActive : ''}`}
              style={{ height: d.value === 0 ? 0 : `max(4px, ${(d.value / max) * 100}%)` }}
            />
          </div>
        ))}
      </div>
      <div className={styles.axis} aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.label}>{showLabel(i) ? d.label : ''}</span>
        ))}
      </div>
      <details className={styles.table}>
        <summary>以表格檢視</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">日期</th>
              <th scope="col">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td>{d.label}</td>
                <td>{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
