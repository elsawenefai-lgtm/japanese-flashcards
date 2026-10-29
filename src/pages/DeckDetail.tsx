import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findDataset } from '../data/loadDatasets';
import { DIRECTION_CHOICES, type DirectionChoice } from '../study/vocabCards';
import { GRAMMAR_MODES, grammarKeys, type GrammarMode } from '../study/grammarCards';
import { useSettings } from '../store/settings';
import { useProgress } from '../store/progress';
import { newCardsRemaining } from '../srs/queue';
import { allDeckKeys, deckKeys, summarize } from '../study/deckProgress';
import { SESSION_COUNT_OPTIONS, type SessionCount } from '../study/sessionCount';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Segmented } from '../components/Segmented';
import { MasteryBar } from '../components/MasteryBar';
import { Cat } from '../components/Cat';
import styles from './DeckDetail.module.css';

const categoryLabel = { vocabulary: '單字', grammar: '文法' } as const;


export function DeckDetail() {
  const id = useParams()['*'] ?? '';
  const dataset = findDataset(id);
  const [direction, setDirection] = useState<DirectionChoice>('jp-zh');
  const [grammarModes, setGrammarModes] = useState<GrammarMode[]>(['g-zh']);
  const [query, setQuery] = useState('');
  const [studyCount, setStudyCount] = useState<SessionCount>('all');
  const [quizCount, setQuizCount] = useState<SessionCount>('10');
  const [showList, setShowList] = useState(false);
  const vocabScript = useSettings((s) => s.vocabScript);
  const setVocabScript = useSettings((s) => s.setVocabScript);
  const dailyNewLimit = useSettings((s) => s.dailyNewLimit);
  const progress = useProgress((s) => s.progress);
  const removeKeys = useProgress((s) => s.removeKeys);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!dataset) {
    return (
      <div className={styles.notFound}>
        <Cat size={96} mood="confused" />
        <p>找不到這個學習集</p>
        <Link to="/" className="btn">
          回首頁
        </Link>
      </div>
    );
  }

  const isVocab = dataset.category === 'vocabulary';
  const keys = isVocab
    ? deckKeys(dataset, direction === 'mixed' ? ['jp-zh', 'zh-jp'] : [direction])
    : grammarKeys(dataset, grammarModes);
  const now = Date.now();
  const summary = summarize(keys, progress, now);
  const newToday = Math.min(summary.mastery.new, newCardsRemaining(progress, now, dailyNewLimit));
  const learnedKeys = allDeckKeys(dataset).filter((k) => progress[k]);
  const studyQuery = isVocab ? `dir=${direction}` : `modes=${grammarModes.join(',')}`;
  const withExamples = isVocab ? 0 : dataset.data.filter((g) => (g.examples?.length ?? 0) > 0).length;

  // 文法模式可複選，但至少保留一個；依固定順序排列
  const toggleGrammarMode = (mode: GrammarMode) => {
    const next = grammarModes.includes(mode) ? grammarModes.filter((m) => m !== mode) : [...grammarModes, mode];
    if (next.length > 0) setGrammarModes(GRAMMAR_MODES.map((m) => m.value).filter((m) => next.includes(m)));
  };

  const q = query.trim().toLowerCase();
  const items = dataset.data.filter(
    (item) =>
      !q ||
      item.japanese.toLowerCase().includes(q) ||
      item.simple_chinese.toLowerCase().includes(q) ||
      ('hiragana' in item && item.hiragana.toLowerCase().includes(q)),
  );

  return (
    <section className={styles.page}>
      <Link to="/" className="back-link">
        ← 學習集
      </Link>

      <header className={styles.header}>
        <div className={styles.chips}>
          <span className={`chip chip--${dataset.category}`}>{categoryLabel[dataset.category]}</span>
          <span className="chip chip--level">{dataset.level}</span>
        </div>
        <h2 className={styles.title}>{dataset.name}</h2>
        <p className={styles.count}>{dataset.data.length} 張卡片</p>
      </header>

      <div className={`card ${styles.setup}`}>
        {isVocab ? (
          <>
            <h3 className={styles.label}>學習方向</h3>
            <div className={styles.directions} role="radiogroup" aria-label="學習方向">
              {DIRECTION_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={direction === choice.value}
                  className={
                    direction === choice.value ? `${styles.direction} ${styles.directionSelected}` : styles.direction
                  }
                  onClick={() => setDirection(choice.value)}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.hint}</span>
                </button>
              ))}
            </div>

            {direction !== 'zh-jp' && (
              <div className={styles.row}>
                <h3 className={styles.label}>日文題面</h3>
                <Segmented
                  label="日文題面"
                  options={[
                    { value: 'kanji', label: '漢字' },
                    { value: 'hiragana', label: '平假名' },
                  ]}
                  value={vocabScript}
                  onChange={setVocabScript}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className={styles.label}>
              測驗模式 <small className={styles.labelHint}>可複選，混合出題</small>
            </h3>
            <div className={styles.directions} role="group" aria-label="測驗模式">
              {GRAMMAR_MODES.map((m) => {
                const selected = grammarModes.includes(m.value);
                const unavailable = m.needsExample && withExamples === 0;
                return (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={selected}
                    disabled={unavailable}
                    className={selected ? `${styles.direction} ${styles.directionSelected}` : styles.direction}
                    onClick={() => toggleGrammarMode(m.value)}
                  >
                    <strong>
                      {selected ? '✓ ' : ''}
                      {m.label}
                    </strong>
                    <span>{unavailable ? '這個學習集沒有例句' : m.hint}</span>
                  </button>
                );
              })}
            </div>
            {withExamples < dataset.data.length && withExamples > 0 && (
              <p className={styles.modeHint}>
                共 {withExamples} / {dataset.data.length} 條文法有例句；沒有例句的文法不會出現在例句類模式中。
              </p>
            )}
          </>
        )}

        <div className={styles.row}>
          <h3 className={styles.label}>題數</h3>
          <Segmented label="複習題數" options={SESSION_COUNT_OPTIONS} value={studyCount} onChange={setStudyCount} />
        </div>

        <div className={styles.progressBox}>
          <div className={styles.todo}>
            <span>
              待複習 <strong>{summary.due}</strong>
            </span>
            <span>
              今日新卡 <strong>{newToday}</strong>
            </span>
          </div>
          <MasteryBar summary={summary} showLegend />
        </div>

        <div className={styles.actions}>
          <Link to={`/study/${dataset.id}?${studyQuery}&count=${studyCount}`} className={`btn ${styles.start}`}>
            開始複習
          </Link>
          <Link
            to={`/study/${dataset.id}?${studyQuery}&count=${studyCount}&mode=free`}
            className={`btn btn--ghost ${styles.start}`}
          >
            自由練習
          </Link>
        </div>
        <p className={styles.modeHint}>「開始複習」依記憶排程出題並記錄進度；「自由練習」整副洗牌，不影響進度。</p>
      </div>

      <div className={`card ${styles.setup}`}>
        <div className={styles.row}>
          <h3 className={styles.label}>選擇題測驗</h3>
          <Segmented label="測驗題數" options={SESSION_COUNT_OPTIONS} value={quizCount} onChange={setQuizCount} />
        </div>
        <div className={styles.actions}>
          <Link to={`/quiz/${dataset.id}?${studyQuery}&count=${quizCount}`} className={`btn ${styles.start}`}>
            開始測驗
          </Link>
        </div>
        <p className={styles.modeHint}>
          使用上方選擇的{isVocab ? '方向' : '模式'}出題。答錯會記為「忘記」；答對只在新卡或已到期時計入記憶排程。
        </p>
      </div>

      {/* 卡片列表預設收合，避免先看到答案 */}
      <div className={styles.listHeader}>
        <button
          type="button"
          className={styles.listToggle}
          aria-expanded={showList}
          aria-controls="card-list"
          onClick={() => setShowList((v) => !v)}
        >
          <span className={styles.chevron} aria-hidden="true">
            ▸
          </span>
          卡片列表
        </button>
        {showList && (
          <input
            type="search"
            className={styles.search}
            placeholder={isVocab ? '搜尋日文、讀音或中文' : '搜尋文法或中文'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜尋卡片"
          />
        )}
      </div>
      <ul id="card-list" className={styles.list} hidden={!showList}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <span lang="ja" className={styles.itemJapanese}>
              {item.japanese}
            </span>
            {'hiragana' in item && item.hiragana !== item.japanese && (
              <span lang="ja" className={styles.itemReading}>
                {item.hiragana}
              </span>
            )}
            {'examples' in item && item.examples && item.examples.length > 0 && (
              <span className={styles.itemReading}>例句 {item.examples.length}</span>
            )}
            <span className={styles.itemChinese}>{item.simple_chinese}</span>
          </li>
        ))}
        {items.length === 0 && <li className={styles.noMatch}>沒有符合的卡片</li>}
      </ul>

      {learnedKeys.length > 0 && (
        <button type="button" className={styles.resetLink} onClick={() => setConfirmReset(true)}>
          重置這個學習集的進度（{learnedKeys.length} 筆）
        </button>
      )}
      <ConfirmDialog
        open={confirmReset}
        title="重置這個學習集？"
        confirmLabel="重置"
        danger
        onConfirm={() => {
          removeKeys(learnedKeys);
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      >
        <p>「{dataset.name}」所有方向／模式的 {learnedKeys.length} 筆進度會被刪除，卡片回到新卡。每日紀錄不受影響。</p>
      </ConfirmDialog>
    </section>
  );
}
