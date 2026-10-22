import styles from './Cat.module.css';

/** happy：開心瞇眼；neutral：會眨眼；confused：歪頭叉叉眼；sleepy：睡眼惺忪 */
export type CatMood = 'happy' | 'neutral' | 'confused' | 'sleepy';

/** bob：輕輕晃；hop：跳兩下；tilt：歪頭；none：不動 */
export type CatMotion = 'bob' | 'hop' | 'tilt' | 'none';

interface CatProps {
  size?: number;
  mood?: CatMood;
  /** 預設依表情決定：confused 會歪頭，其他不動 */
  motion?: CatMotion;
  className?: string;
}

const INK = '#5b5450';

function Eyes({ mood }: { mood: CatMood }) {
  if (mood === 'happy') {
    return (
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M38 64 Q44 57 50 64" />
        <path d="M70 64 Q76 57 82 64" />
      </g>
    );
  }
  if (mood === 'confused') {
    return (
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M38 60 L50 66 M38 66 L50 60" />
        <circle cx="76" cy="63" r="4" fill={INK} stroke="none" />
      </g>
    );
  }
  if (mood === 'sleepy') {
    return (
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M38 63 Q44 67 50 63" />
        <path d="M70 63 Q76 67 82 63" />
      </g>
    );
  }
  // neutral：圓眼睛，定時眨眼
  return (
    <g fill={INK} className={styles.blink}>
      <circle cx="44" cy="63" r="4.5" />
      <circle cx="76" cy="63" r="4.5" />
    </g>
  );
}

/** 吉祥物貓咪，顏色跟著主題 token 變化 */
export function Cat({ size = 96, mood = 'happy', motion, className }: CatProps) {
  const resolvedMotion = motion ?? (mood === 'confused' ? 'tilt' : 'none');
  const classes = [styles.cat, resolvedMotion !== 'none' && styles[resolvedMotion], className].filter(Boolean).join(' ');
  const label = { happy: '開心的貓咪', neutral: '貓咪', confused: '困惑的貓咪', sleepy: '想睡的貓咪' }[mood];

  return (
    <svg className={classes} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={label}>
      {/* 耳朵 */}
      <path d="M22 50 L28 14 L52 34 Z" fill="var(--sand)" />
      <path d="M98 50 L92 14 L68 34 Z" fill="var(--sand)" />
      <path d="M29 40 L32 23 L44 33 Z" fill="var(--rose)" />
      <path d="M91 40 L88 23 L76 33 Z" fill="var(--rose)" />
      {/* 臉 */}
      <ellipse cx="60" cy="66" rx="44" ry="38" fill="var(--sand)" />
      {/* 腮紅：開心時更紅 */}
      <ellipse cx="34" cy="76" rx="8" ry="5" fill="var(--rose)" opacity={mood === 'happy' ? 0.9 : 0.6} />
      <ellipse cx="86" cy="76" rx="8" ry="5" fill="var(--rose)" opacity={mood === 'happy' ? 0.9 : 0.6} />
      <Eyes mood={mood} />
      {/* 鼻子與嘴巴 */}
      <path d="M57 72 L63 72 L60 75 Z" fill="var(--clay)" />
      {mood === 'happy' ? (
        // 張嘴笑
        <path d="M53 78 Q60 88 67 78 Z" fill="var(--clay)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      ) : mood === 'confused' ? (
        <path d="M54 81 Q57 78 60 81 Q63 84 66 81" stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      ) : (
        <path
          d="M52 78 Q56 82 60 77 Q64 82 68 78"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {/* 鬍鬚 */}
      <g stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.55">
        <path d="M18 70 L32 72" />
        <path d="M18 79 L32 78" />
        <path d="M102 70 L88 72" />
        <path d="M102 79 L88 78" />
      </g>
      {/* 困惑時的問號、想睡時的 z */}
      {mood === 'confused' && (
        <text x="98" y="22" fontSize="20" fontWeight="700" fill="var(--lavender)" className={styles.mark}>
          ?
        </text>
      )}
      {mood === 'sleepy' && (
        <text x="94" y="24" fontSize="16" fontWeight="700" fill="var(--blue)" className={styles.mark}>
          z
        </text>
      )}
    </svg>
  );
}
