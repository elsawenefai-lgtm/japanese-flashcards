import { Link } from 'react-router-dom';
import { datasets } from '../data/loadDatasets';
import { useProgress, useStats } from '../store/progress';
import { allDeckKeys, knownKeys, summarize } from '../study/deckProgress';
import { forecast, lastDays, streak, totals } from '../stats/summary';
import { StatTile } from '../components/StatTile';
import { ColumnChart } from '../components/ColumnChart';
import { MasteryBar } from '../components/MasteryBar';
import styles from './Stats.module.css';

/** 2026-10-22 → 10/22 */
const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

export function Stats() {
  const progress = useProgress((s) => s.progress);
  const daily = useStats((s) => s.daily);
  const now = Date.now();

  const recent = lastDays(daily, 14, now);
  const month = totals(lastDays(daily, 30, now));
  const keys = knownKeys(datasets);
  const learned = Object.keys(progress).filter((k) => keys.has(k)).length;
  const overall = summarize([...keys], progress, now);
  const upcoming = forecast(progress, keys, 7, now);

  const hasHistory = Object.keys(daily).length > 0;

  return (
    <section className={styles.page}>
      <h2>學習統計</h2>

      <div className={styles.tiles}>
        <StatTile label="連續學習" value={streak(daily, now)} unit="天" />
        <StatTile label="近 30 天作答" value={month.reviewed} unit="次" />
        <StatTile label="近 30 天正確率" value={month.reviewed ? month.accuracy : '—'} unit={month.reviewed ? '%' : undefined} />
        <StatTile label="已學卡片" value={learned} unit="張" hint={`精通 ${overall.mastery.mastered} 張`} />
      </div>

      <div className={`card ${styles.chartCard}`}>
        <h3>最近 14 天作答次數</h3>
        {hasHistory ? (
          <ColumnChart
            data={recent.map((d) => ({
              label: shortDate(d.date),
              value: d.reviewed,
              detail: `${shortDate(d.date)}：作答 ${d.reviewed} 次${d.reviewed ? `，答對 ${d.correct} 次` : ''}`,
            }))}
            summary={`最近 14 天作答次數，合計 ${totals(recent).reviewed} 次`}
            valueLabel="作答次數"
          />
        ) : (
          <p className={styles.empty}>
            還沒有學習紀錄，<Link to="/">去學幾張卡片</Link>吧！
          </p>
        )}
      </div>

      <div className={`card ${styles.chartCard}`}>
        <h3>未來 7 天待複習</h3>
        <ColumnChart
          data={upcoming.map((d, i) => ({
            label: i === 0 ? '今天' : shortDate(d.date),
            value: d.count,
            detail: `${i === 0 ? '今天（含逾期）' : shortDate(d.date)}：${d.count} 張到期`,
          }))}
          summary={`未來 7 天到期卡片數，合計 ${upcoming.reduce((n, d) => n + d.count, 0)} 張`}
          valueLabel="到期張數"
        />
      </div>

      <div className={`card ${styles.chartCard}`}>
        <h3>各學習集熟練度</h3>
        <MasteryBar summary={overall} showLegend />
        <ul className={styles.deckList}>
          {datasets.map((d) => {
            const summary = summarize(allDeckKeys(d), progress, now);
            const pct = Math.round(((summary.total - summary.mastery.new) / Math.max(1, summary.total)) * 100);
            return (
              <li key={d.id}>
                <div className={styles.deckRow}>
                  <Link to={`/deck/${d.id}`}>{d.name}</Link>
                  <span className={styles.deckPct}>已學 {pct}%</span>
                </div>
                <MasteryBar summary={summary} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
