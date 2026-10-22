import { Link, useSearchParams } from 'react-router-dom';
import { datasets, levels } from '../data/loadDatasets';
import { filterDatasets, filterFromParams, filterToParams, type DatasetFilter } from '../data/filter';
import { FilterBar } from '../components/FilterBar';
import { Cat } from '../components/Cat';
import { MasteryBar } from '../components/MasteryBar';
import { useProgress } from '../store/progress';
import { allDeckKeys, summarize, type DeckSummary } from '../study/deckProgress';
import styles from './Decks.module.css';

const categoryLabel = { vocabulary: '單字', grammar: '文法' } as const;

export function Decks() {
  // 篩選條件放在網址上，重新整理或分享連結都能保留
  const [params, setParams] = useSearchParams();
  const filter = filterFromParams(params);
  const visible = filterDatasets(datasets, filter);

  const updateFilter = (next: DatasetFilter) => setParams(filterToParams(next), { replace: true });

  // 熟練度：單字合計兩個方向，文法合計四種模式
  const progress = useProgress((s) => s.progress);
  const now = Date.now();
  const summaries: Record<string, DeckSummary> = Object.fromEntries(
    visible.map((d) => [d.id, summarize(allDeckKeys(d), progress, now)]),
  );

  return (
    <section>
      <h2>資料集</h2>
      <FilterBar datasets={datasets} levels={levels} filter={filter} onChange={updateFilter} />

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <Cat size={96} mood="confused" />
          <p>找不到符合條件的資料集</p>
          <button className="btn" onClick={() => updateFilter({ category: null, levels: [] })}>
            清除篩選
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((d) => (
            <Link key={d.id} to={`/deck/${d.id}`} className={styles.link}>
              <article className={`card ${styles.deck}`}>
                <div className={styles.chips}>
                  <span className={`chip chip--${d.category}`}>{categoryLabel[d.category]}</span>
                  <span className="chip chip--level">{d.level}</span>
                </div>
                <h3 className={styles.name}>{d.name}</h3>
                <p className={styles.count}>
                  {d.data.length} 張卡片
                  {summaries[d.id] && summaries[d.id].due > 0 && (
                    <span className={styles.due}>待複習 {summaries[d.id].due}</span>
                  )}
                </p>
                {summaries[d.id] && <MasteryBar summary={summaries[d.id]} />}
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
