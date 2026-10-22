import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import styles from './Flashcard.module.css';

export type SwipeDirection = 'left' | 'right';

interface FlashcardProps {
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  onFlip: () => void;
  /** 有提供時可以左右滑動卡片 */
  onSwipe?: (direction: SwipeDirection) => void;
  /** 滑動時顯示在卡片上的提示，例如 { left: '忘記', right: '記得' } */
  swipeHints?: Record<SwipeDirection, string>;
  /** 允許的滑動方向；預設兩邊都可以 */
  swipeDirections?: SwipeDirection[];
}

/** 滑超過這個距離（px）才算數 */
const SWIPE_THRESHOLD = 80;
/** 移動距離小於這個值視為點擊 */
const TAP_SLOP = 6;
const EXIT_MS = 180;

/**
 * 可翻面的卡片；兩面疊在同一格，高度取較高的一面。
 * 點擊翻面；有 onSwipe 時可以左右滑動（觸控、滑鼠拖曳都可以）。
 */
export function Flashcard({
  front,
  back,
  flipped,
  onFlip,
  onSwipe,
  swipeHints,
  swipeDirections = ['left', 'right'],
}: FlashcardProps) {
  // 拖曳狀態放在 ref：pointerup 可能在 React 重新 render 前就觸發，不能依賴 state
  const drag = useRef<{ x: number; y: number; id: number; dragging: boolean } | null>(null);
  const [dx, setDx] = useState(0);
  const [exit, setExit] = useState<SwipeDirection | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // 卡片上的按鈕（例如朗讀）自己處理點擊
    if ((e.target as HTMLElement).closest('button') || exit) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, dragging: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !onSwipe) return;
    const moveX = e.clientX - d.x;
    const moveY = e.clientY - d.y;
    if (!d.dragging) {
      // 還沒開始拖曳時，若主要是上下移動就交給頁面捲動
      if (Math.abs(moveY) > TAP_SLOP && Math.abs(moveY) > Math.abs(moveX)) {
        drag.current = null;
        return;
      }
      if (Math.abs(moveX) <= TAP_SLOP) return;
      d.dragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDx(moveX);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    // 以放開的位置計算最終距離
    const finalDx = e.clientX - d.x;
    const direction: SwipeDirection = finalDx < 0 ? 'left' : 'right';
    if (onSwipe && Math.abs(finalDx) >= SWIPE_THRESHOLD && swipeDirections.includes(direction)) {
      setDx(finalDx);
      setExit(direction);
      window.setTimeout(() => onSwipe(direction), EXIT_MS);
      return;
    }
    if (!d.dragging && Math.abs(finalDx) <= TAP_SLOP) onFlip();
    setDx(0);
  };

  const onPointerCancel = () => {
    drag.current = null;
    setDx(0);
  };

  const dragging = dx !== 0 && !exit;
  const offset = exit ? (exit === 'left' ? -1 : 1) * window.innerWidth : dx;
  const hint = dx < 0 ? swipeHints?.left : swipeHints?.right;
  const hintStrength = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD);

  return (
    <div
      className={[styles.scene, dragging && styles.dragging, exit && styles.exiting, onSwipe && styles.swipeable]
        .filter(Boolean)
        .join(' ')}
      style={{ transform: offset ? `translateX(${offset}px) rotate(${offset / 25}deg)` : undefined }}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={flipped ? '卡片背面，點擊翻回正面' : '卡片正面，點擊翻面'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      // 指標操作已在 pointerup 處理；detail 為 0 代表鍵盤或輔助科技觸發的點擊
      onClick={(e) => e.detail === 0 && onFlip()}
    >
      {hint && dx !== 0 && (
        <span
          className={`${styles.swipeHint} ${dx < 0 ? styles.hintLeft : styles.hintRight}`}
          style={{ opacity: hintStrength }}
          aria-hidden="true"
        >
          {hint}
        </span>
      )}
      <div className={flipped ? `${styles.inner} ${styles.flipped}` : styles.inner}>
        <div className={`${styles.face} ${styles.front}`} aria-hidden={flipped}>
          {front}
        </div>
        <div className={`${styles.face} ${styles.back}`} aria-hidden={!flipped}>
          {back}
        </div>
      </div>
    </div>
  );
}
