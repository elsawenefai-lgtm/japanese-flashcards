import { Link } from 'react-router-dom';
import { Cat, type CatMood } from '../components/Cat';
import { DeckList } from '../components/DeckList';
import { StatTile } from '../components/StatTile';
import { datasets } from '../data/loadDatasets';
import { useProgress, useStats } from '../store/progress';
import { useSettings } from '../store/settings';
import { newCardsRemaining } from '../srs/queue';
import { allDeckKeys, summarize } from '../study/deckProgress';
import { streak } from '../stats/summary';
import { dateKey } from '../srs/time';
import styles from './Home.module.css';

function greeting(hour: number): string {
  if (hour >= 5 && hour < 11) return 'おはよう！今日も一緒にがんばろう';
  if (hour >= 11 && hour < 18) return 'こんにちは！ちょっと復習しよう';
  if (hour >= 18 && hour < 23) return 'こんばんは！寝る前に少しだけ';
  return 'もう遅いよ、早く寝ようね';
}

const categoryLabel = { vocabulary: '單字', grammar: '文法' } as const;

export function Home() {
  const progress = useProgress((s) => s.progress);
  const daily = useStats((s) => s.daily);
  const dailyNewLimit = useSettings((s) => s.dailyNewLimit);

  const now = Date.now();
  const decks = datasets.map((d) => ({ dataset: d, summary: summarize(allDeckKeys(d), progress, now) }));
  const totalDue = decks.reduce((n, d) => n + d.summary.due, 0);
  const unseen = decks.reduce((n, d) => n + d.summary.mastery.new, 0);
  const newToday = Math.min(unseen, newCardsRemaining(progress, now, dailyNewLimit));
  const today = daily[dateKey(now)];
  const streakDays = streak(daily, now);
  const dueDecks = decks.filter((d) => d.summary.due > 0).sort((a, b) => b.summary.due - a.summary.due);
  const allDone = totalDue === 0 && newToday === 0;
  const hour = new Date(now).getHours();
  // 今天任務完成就開心；深夜（23–5 點）想睡；其他時候會眨眼
  const catMood: CatMood = allDone && today ? 'happy' : hour >= 23 || hour < 5 ? 'sleepy' : 'neutral';

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Cat size={120} className={styles.cat} mood={catMood} motion={catMood === 'sleepy' ? 'none' : 'bob'} />
        <div>
          <h1 className={styles.title} lang="ja">
            {greeting(hour)}
          </h1>
          <p className={styles.subtitle}>
            {totalDue > 0
              ? `今天有 ${totalDue} 張卡片等你複習`
              : newToday > 0
                ? '沒有待複習的卡片，來學點新的吧！'
                : today
                  ? '今天的任務都完成了，好棒！'
                  : '所有卡片都學過了，可以用自由練習或測驗複習喔'}
          </p>
        </div>
      </section>

      <div className={styles.tiles}>
        <StatTile label="待複習" value={totalDue} unit="張" />
        <StatTile label="今日新卡" value={newToday} unit="張" hint={`每日上限 ${dailyNewLimit}`} />
        <StatTile
          label="今天已學"
          value={today?.reviewed ?? 0}
          unit="次"
          hint={today?.reviewed ? `正確率 ${Math.round((today.correct / today.reviewed) * 100)}%` : undefined}
        />
        <StatTile label="連續學習" value={streakDays} unit="天" />
      </div>

      {dueDecks.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>今天要複習</h2>
            <Link to="/stats" className="back-link">
              查看統計 →
            </Link>
          </div>
          <ul className={styles.dueList}>
            {dueDecks.map(({ dataset, summary }) => (
              <li key={dataset.id}>
                <Link to={`/deck/${dataset.id}`} className={styles.dueItem}>
                  <span className={`chip chip--${dataset.category}`}>{categoryLabel[dataset.category]}</span>
                  <span className={styles.dueName}>{dataset.name}</span>
                  <span className={styles.dueCount}>{summary.due} 張</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>學習集</h2>
        </div>
        <DeckList />
      </section>
    </div>
  );
}
