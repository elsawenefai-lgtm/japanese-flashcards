import styles from './SpeakButton.module.css';

interface SpeakButtonProps {
  onSpeak: () => void;
}

export function SpeakButton({ onSpeak }: SpeakButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label="朗讀日文"
      title="朗讀（S）"
      onClick={(e) => {
        // 避免觸發外層卡片翻面
        e.stopPropagation();
        onSpeak();
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
        <path
          d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </button>
  );
}
