import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { buildReviewQueue, newCardsRemaining, requeue } from '../srs/queue';
import { formatInterval, review, type Rating } from '../srs/scheduler';
import { useSettings } from '../store/settings';
import { useProgress } from '../store/progress';
import { useSpeech } from '../speech/useSpeech';
import { Flashcard, type SwipeDirection } from './Flashcard';
import { RatingButtons, RATINGS } from './RatingButtons';
import { Cat } from './Cat';
import { Sparkles } from './Sparkles';
import styles from './StudySession.module.css';

/** review：依記憶排程複習並記錄進度；free：自由練習，整副洗牌、不影響進度 */
export type StudyMode = 'review' | 'free';

/** 單字、文法各自提供的出題與顯示方式 */
export interface StudyConfig<C extends { key: string }> {
  /** 所有卡片（未洗牌），複習模式從中挑到期卡與新卡 */
  buildCards: () => C[];
  /** 自由練習的整副洗牌 */
  buildFreeSession: () => C[];
  /** 同一群組（同一條目的不同模式）盡量不相鄰 */
  groupOf: (card: C) => string;
  renderFace: (card: C, side: 'front' | 'back', onSpeak?: () => void) => ReactNode;
  speechText: (card: C) => string;
  /** 題面是否為日文，決定自動朗讀在正面還是背面 */
  frontIsJapanese: (card: C) => boolean;
}

interface StudySessionProps<C extends { key: string }> {
  config: StudyConfig<C>;
  mode: StudyMode;
  deckName: string;
  deckLink: string;
  freeLink: string;
  /** 工具列額外的控制項，例如漢字／かな切換 */
  toolbarExtra?: ReactNode;
}

const emptyResults = (): Record<Rating, number> => ({ again: 0, hard: 0, good: 0, easy: 0 });

export function StudySession<C extends { key: string }>({
  config,
  mode,
  deckName,
  deckLink,
  freeLink,
  toolbarExtra,
}: StudySessionProps<C>) {
  const { autoSpeak, dailyNewLimit } = useSettings();
  const progress = useProgress((s) => s.progress);
  const rateCard = useProgress((s) => s.rate);
  const { available: canSpeak, speak } = useSpeech();

  const buildQueue = () => {
    if (mode === 'free') return config.buildFreeSession();
    const now = Date.now();
    const snapshot = useProgress.getState().progress;
    return buildReviewQueue({
      cards: config.buildCards(),
      progress: snapshot,
      now,
      newLimit: newCardsRemaining(snapshot, now, dailyNewLimit),
      groupOf: config.groupOf,
    }).queue;
  };

  const [cards, setCards] = useState<C[]>(buildQueue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState(emptyResults);

  const done = index >= cards.length;
  const card = cards[index] as C | undefined;

  const flip = useCallback(() => setFlipped((f) => !f), []);
  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.min(Math.max(i + delta, 0), cards.length));
      setFlipped(false);
    },
    [cards.length],
  );
  const restart = () => {
    setCards(buildQueue());
    setIndex(0);
    setFlipped(false);
    setResults(emptyResults());
  };
  const speakCard = useCallback(() => card && speak(config.speechText(card)), [card, speak, config]);

  const rate = useCallback(
    (rating: Rating) => {
      if (!card || !flipped) return;
      rateCard(card.key, rating);
      // 忘記的卡在本輪稍後再出現一次
      if (rating === 'again') setCards((q) => requeue(q, index));
      setResults((r) => ({ ...r, [rating]: r[rating] + 1 }));
      setIndex((i) => i + 1);
      setFlipped(false);
    },
    [card, flipped, index, rateCard],
  );

  // 每個評分的下次間隔預覽
  const previews = useMemo(() => {
    if (!card) return null;
    const now = Date.now();
    return Object.fromEntries(
      RATINGS.map((r) => [r.value, formatInterval(review(progress[card.key], card.key, r.value, now), now)]),
    ) as Record<Rating, string>;
  }, [card, progress]);

  // 日文那一面出現時自動朗讀
  useEffect(() => {
    if (!autoSpeak || !card) return;
    const japaneseVisible = config.frontIsJapanese(card) ? !flipped : flipped;
    if (japaneseVisible) speakCard();
  }, [autoSpeak, card, flipped, speakCard, config]);

  // 鍵盤：空白／Enter 翻面、S 朗讀；複習模式 1–4 自評，自由練習 ← → 換卡
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
      // 空白鍵一律翻面（點過工具列按鈕後焦點還在按鈕上也一樣）；Enter 保留按鈕原本的行為
      const onButton = target.closest('button, a') !== null;
      const rating = RATINGS.find((r) => r.key === e.key);
      if ((e.key === ' ' || (e.key === 'Enter' && !onButton)) && !done) {
        e.preventDefault();
        flip();
      } else if (mode === 'review' && rating) {
        rate(rating.value);
      } else if (mode === 'free' && e.key === 'ArrowRight') {
        go(1);
      } else if (mode === 'free' && e.key === 'ArrowLeft') {
        go(-1);
      } else if (e.key.toLowerCase() === 's' && canSpeak) {
        speakCard();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, flip, go, rate, mode, canSpeak, speakCard]);

  const onSpeak = canSpeak ? speakCard : undefined;

  if (cards.length === 0) {
    return (
      <section className={styles.page}>
        <div className={`card ${styles.finished}`}>
          <Cat size={110} mood="happy" />
          <h2>今天的複習都完成了！</h2>
          <p>目前沒有到期的卡片，也沒有今天可以學的新卡（新卡都學過了，或已達每日上限）。</p>
          <div className={styles.finishedActions}>
            <Link to={freeLink} className="btn">
              自由練習
            </Link>
            <Link to={deckLink} className="btn btn--ghost">
              回到資料集
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const reviewed = results.again + results.hard + results.good + results.easy;

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <Link to={deckLink} className="back-link">
          ← {deckName}
        </Link>
        <div className={styles.tools}>
          {toolbarExtra}
          {mode === 'free' && (
            <button type="button" className={styles.iconButton} onClick={restart} title="重新洗牌">
              ⟳ 洗牌
            </button>
          )}
        </div>
      </div>

      <div className={styles.progress} aria-label={`進度 ${Math.min(index + 1, cards.length)} / ${cards.length}`}>
        <div className={styles.progressBar} style={{ width: `${(index / cards.length) * 100}%` }} />
      </div>

      {done || !card ? (
        <div className={`card ${styles.finished}`}>
          <Sparkles />
          <Cat size={120} mood="happy" motion="hop" />
          <h2>{mode === 'review' ? '今日複習完成！' : '完成一輪！'}</h2>
          {mode === 'review' ? (
            <>
              <p>這次共作答 {reviewed} 次，進度已自動儲存。</p>
              <ul className={styles.summary}>
                {RATINGS.map((r) => (
                  <li key={r.value} className={styles[`summary_${r.value}`]}>
                    {r.label} <strong>{results[r.value]}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>這一輪共練習了 {cards.length} 張卡片，好棒！</p>
          )}
          <div className={styles.finishedActions}>
            {mode === 'review' ? (
              <Link to={freeLink} className="btn">
                再自由練習
              </Link>
            ) : (
              <button type="button" className="btn" onClick={restart}>
                再洗牌一輪
              </button>
            )}
            <Link to={deckLink} className="btn btn--ghost">
              回到資料集
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className={styles.counter}>
            {mode === 'free' ? '自由練習 · ' : ''}
            {index + 1} / {cards.length}
          </p>
          {/* key 讓換卡時重新建立元件，避免翻回正面的動畫露出下一張的答案 */}
          <Flashcard
            key={`${card.key}-${index}`}
            flipped={flipped}
            onFlip={flip}
            front={config.renderFace(card, 'front', onSpeak)}
            back={config.renderFace(card, 'back', onSpeak)}
            {...(mode === 'review'
              ? // 複習：翻面後左滑「忘記」、右滑「記得」
                flipped && {
                  onSwipe: (d: SwipeDirection) => rate(d === 'left' ? 'again' : 'good'),
                  swipeHints: { left: '忘記', right: '記得' },
                }
              : // 自由練習：左滑下一張、右滑上一張（第一張不能往回）
                {
                  onSwipe: (d: SwipeDirection) => go(d === 'left' ? 1 : -1),
                  swipeDirections: index === 0 ? (['left'] as SwipeDirection[]) : undefined,
                })}
          />
          {mode === 'review' ? (
            <div className={styles.controls}>
              {flipped && previews ? (
                <div className={styles.rating}>
                  <RatingButtons previews={previews} onRate={rate} />
                </div>
              ) : (
                <button type="button" className={`btn ${styles.flipButton}`} onClick={flip}>
                  翻面看答案
                </button>
              )}
            </div>
          ) : (
            <div className={styles.controls}>
              <button type="button" className="btn btn--ghost" onClick={() => go(-1)} disabled={index === 0}>
                ← 上一張
              </button>
              <button type="button" className="btn" onClick={flip}>
                翻面
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => go(1)}>
                下一張 →
              </button>
            </div>
          )}
          <p className={styles.shortcuts}>
            快捷鍵：空白鍵翻面 · {mode === 'review' ? '1–4 自評' : '← → 換卡'}
            {canSpeak && ' · S 朗讀'}
          </p>
          <p className={styles.swipeHelp}>
            {mode === 'review' ? '翻面後：左滑「忘記」· 右滑「記得」' : '左滑下一張 · 右滑上一張'}
          </p>
        </>
      )}
    </section>
  );
}
