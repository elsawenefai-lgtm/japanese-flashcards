import { useMemo, type CSSProperties } from 'react';
import styles from './Sparkles.module.css';

const COLORS = ['var(--rose)', 'var(--sage)', 'var(--blue)', 'var(--lavender)', 'var(--sand)'];
const SHAPES = ['★', '✦', '●', '♥'];

interface SparklesProps {
  /** 碎片數量 */
  count?: number;
}

/** 完成時從中心向外散開的小星星（低調款撒花），播一次就消失 */
export function Sparkles({ count = 14 }: SparklesProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 70 + Math.random() * 60;
        return {
          shape: SHAPES[i % SHAPES.length],
          style: {
            '--x': `${Math.cos(angle) * distance}px`,
            '--y': `${Math.sin(angle) * distance}px`,
            '--r': `${Math.random() * 180 - 90}deg`,
            color: COLORS[i % COLORS.length],
            fontSize: `${10 + Math.random() * 8}px`,
            animationDelay: `${Math.random() * 0.15}s`,
          } as CSSProperties,
        };
      }),
    [count],
  );

  return (
    <div className={styles.burst} aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className={styles.piece} style={p.style}>
          {p.shape}
        </span>
      ))}
    </div>
  );
}
