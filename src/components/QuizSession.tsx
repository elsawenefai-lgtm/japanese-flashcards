import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { buildQuestions, isCorrect, scoreOf, type QuizAnswer, type QuizQuestion } from '../quiz/multipleChoice';
import { isDue } from '../srs/scheduler';
import { useProgress, useStats } from '../store/progress';
import { useSettings } from '../store/settings';
import { useSpeech } from '../speech/useSpeech';
import { Cat, type CatMood } from './Cat';
import { Sparkles } from './Sparkles';
import styles from './QuizSession.module.css';

/** 單字、文法各自提供的出題與顯示方式 */
export interface QuizConfig<C extends { key: string }> {
  buildCards: () => C[];
  answerOf: (card: C) => string;
  distractorsOf: (card: C) => string[];
  renderFace: (card: C, side: 'front' | 'back', hint: string, onSpeak?: () => void) => ReactNode;
  /** 錯題回顧中顯示的簡短題目文字 */
  promptText: (card: C) => string;
  speechText: (card: C) => string;
  /** 題面是日文（答案是中文）時為 true */
  frontIsJapanese: (card: C) => boolean;
}

interface QuizSessionProps<C extends { key: string }> {
  config: QuizConfig<C>;
  /** 題數；Infinity 表示全部 */
  count: number;
  deckName: string;
  deckLink: string;
}

/**
 * 計入記憶排程：答錯一律記為「忘記」；答對只在新卡或已到期時記為「記得」，
 * 避免提早測驗把還沒到期的卡間隔一直拉長。
 */
function recordAnswer(key: string, correct: boolean) {
  const now = Date.now();
  const { progress, rate } = useProgress.getState();
  const p = progress[key];
  if (!correct) rate(key, 'again', now);
  else if (!p || isDue(p, now)) rate(key, 'good', now);
  else useStats.getState().record('good', false, now);
}

const OPTION_KEYS = ['1', '2', '3', '4'];

export function QuizSession<C extends { key: string }>({ config, count, deckName, deckLink }: QuizSessionProps<C>) {
  const autoSpeak = useSettings((s) => s.autoSpeak);
  const { available: canSpeak, speak } = useSpeech();

  const makeQuestions = useCallback(
    (cards: C[]) =>
      buildQuestions({ cards, count, answerOf: config.answerOf, distractorsOf: config.distractorsOf }),
    [config, count],
  );

  const [questions, setQuestions] = useState<QuizQuestion<C>[]>(() => makeQuestions(config.buildCards()));
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer<C>[]>([]);

  const question = questions[index] as QuizQuestion<C> | undefined;
  const done = index >= questions.length;
  const answered = chosen !== null;

  const start = (cards: C[]) => {
    setQuestions(makeQuestions(cards));
    setIndex(0);
    setChosen(null);
    setAnswers([]);
  };

  const choose = useCallback(
    (optionIndex: number) => {
      if (!question || chosen !== null || optionIndex >= question.options.length) return;
      setChosen(optionIndex);
      const answer = { question, chosenIndex: optionIndex };
      setAnswers((a) => [...a, answer]);
      recordAnswer(question.card.key, isCorrect(answer));
    },
    [question, chosen],
  );

  const next = useCallback(() => {
    if (chosen === null) return;
    setIndex((i) => i + 1);
    setChosen(null);
  }, [chosen]);

  const speakCard = useCallback(() => question && speak(config.speechText(question.card)), [question, speak, config]);

  // 日文出現時自動朗讀：日文題面在出題時念，日文答案在作答後念
  useEffect(() => {
    if (!autoSpeak || !question) return;
    if (config.frontIsJapanese(question.card) ? !answered : answered) speakCard();
  }, [autoSpeak, question, answered, speakCard, config]);

  // 鍵盤：1–4 作答、Enter／空白鍵下一題、S 朗讀
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest?.('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
      const option = OPTION_KEYS.indexOf(e.key);
      // 焦點在按鈕上（例如自動聚焦的「下一題」）時交給按鈕本身處理，避免一次跳兩題
      const onButton = target.closest?.('button, a') != null;
      if (option !== -1 && !answered) {
        choose(option);
      } else if ((e.key === 'Enter' || e.key === ' ') && answered && !onButton) {
        e.preventDefault();
        next();
      } else if (e.key.toLowerCase() === 's' && canSpeak) {
        speakCard();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, choose, next, canSpeak, speakCard]);

  const onSpeak = canSpeak ? speakCard : undefined;

  if (questions.length === 0) {
    return (
      <section className={styles.page}>
        <div className={`card ${styles.result}`}>
          <Cat size={96} mood="confused" />
          <h2>沒辦法出選擇題</h2>
          <p>這個學習集的卡片太少，湊不出干擾選項。至少需要 2 張內容不同的卡片。</p>
          <Link to={deckLink} className="btn">
            回到學習集
          </Link>
        </div>
      </section>
    );
  }

  if (done || !question) {
    const score = scoreOf(answers);
    const wrong = answers.filter((a) => !isCorrect(a));
    const mood: CatMood = score.percent >= 80 ? 'happy' : score.percent >= 50 ? 'neutral' : 'confused';
    const message =
      score.percent === 100 ? '全對！太厲害了！' : score.percent >= 80 ? '很棒！' : score.percent >= 50 ? '還不錯，繼續加油！' : '多練習幾次就會記住了！';
    return (
      <section className={styles.page}>
        <div className={`card ${styles.result}`}>
          {mood === 'happy' && <Sparkles count={score.percent === 100 ? 20 : 12} />}
          <Cat size={110} mood={mood} motion={mood === 'happy' ? 'hop' : undefined} />
          <p className={styles.scoreLabel}>{message}</p>
          <p className={styles.score}>
            {score.correct} <span>/ {score.total}</span>
          </p>
          <div className={styles.meter} aria-label={`正確率 ${score.percent}%`}>
            <div className={styles.meterBar} style={{ width: `${score.percent}%` }} />
          </div>
          <p className={styles.percent}>正確率 {score.percent}%</p>
          <div className={styles.resultActions}>
            {wrong.length > 0 && (
              <button type="button" className="btn" onClick={() => start(wrong.map((a) => a.question.card))}>
                只練錯題（{wrong.length}）
              </button>
            )}
            <button
              type="button"
              className={wrong.length > 0 ? 'btn btn--ghost' : 'btn'}
              onClick={() => start(config.buildCards())}
            >
              再測一次
            </button>
            <Link to={deckLink} className="btn btn--ghost">
              回到學習集
            </Link>
          </div>
        </div>

        {wrong.length > 0 && (
          <div className={styles.review}>
            <h3>錯題回顧</h3>
            <ul className={styles.wrongList}>
              {wrong.map((a, i) => (
                <li key={i} className="card">
                  <p className={styles.wrongPrompt}>{config.promptText(a.question.card)}</p>
                  <p className={styles.wrongRow}>
                    <span className={styles.tagWrong}>你的答案</span>
                    <span className={styles.yours}>{a.question.options[a.chosenIndex]}</span>
                  </p>
                  <p className={styles.wrongRow}>
                    <span className={styles.tagRight}>正確答案</span>
                    <strong>{a.question.options[a.question.answerIndex]}</strong>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  const correctSoFar = answers.filter(isCorrect).length;
  const lastCorrect = answered && chosen === question.answerIndex;
  const answerIsJapanese = !config.frontIsJapanese(question.card);

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <Link to={deckLink} className="back-link">
          ← {deckName}
        </Link>
        <span className={styles.tally}>
          答對 {correctSoFar} / {answers.length}
        </span>
      </div>

      <div className={styles.progress} aria-label={`第 ${index + 1} 題，共 ${questions.length} 題`}>
        <div className={styles.progressBar} style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className={styles.counter}>
        第 {index + 1} / {questions.length} 題
      </p>

      <div className={styles.prompt}>{config.renderFace(question.card, 'front', '選出正確答案', onSpeak)}</div>

      <div className={styles.options} role="group" aria-label="選項">
        {question.options.map((option, i) => {
          const state = !answered
            ? ''
            : i === question.answerIndex
              ? styles.correct
              : i === chosen
                ? styles.wrong
                : styles.dimmed;
          return (
            <button
              key={i}
              type="button"
              className={`${styles.option} ${state}`}
              onClick={() => choose(i)}
              disabled={answered}
              lang={answerIsJapanese ? 'ja' : undefined}
            >
              <span className={styles.optionKey}>{i + 1}</span>
              <span className={answerIsJapanese ? styles.optionJa : undefined}>{option}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          <div className={`${styles.feedback} ${lastCorrect ? styles.feedbackRight : styles.feedbackWrong}`}>
            <Cat size={44} mood={lastCorrect ? 'happy' : 'confused'} motion={lastCorrect ? 'hop' : 'tilt'} />
            <strong>{lastCorrect ? '答對了！' : '答錯了，再記一次吧'}</strong>
            <button type="button" className="btn" onClick={next} autoFocus>
              {index + 1 < questions.length ? '下一題 →' : '看結果'}
            </button>
          </div>
          <details className={`card ${styles.detail}`} open={!lastCorrect}>
            <summary>查看詳解</summary>
            <div className={styles.detailBody}>{config.renderFace(question.card, 'back', '詳解', onSpeak)}</div>
          </details>
        </>
      )}

      <p className={styles.shortcuts}>
        快捷鍵：1–4 作答 · Enter 下一題{canSpeak && ' · S 朗讀'}
      </p>
    </section>
  );
}
