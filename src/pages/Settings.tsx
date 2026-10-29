import { useSettings, type SpeechRate, type ThemePref, type VocabScript } from '../store/settings';
import { useSpeech } from '../speech/useSpeech';
import { Segmented } from '../components/Segmented';
import { DataSection } from '../components/DataSection';
import styles from './Settings.module.css';

const themeOptions: { value: ThemePref; label: string }[] = [
  { value: 'system', label: '跟隨系統' },
  { value: 'light', label: '淺色' },
  { value: 'dark', label: '深色' },
];

const scriptOptions: { value: VocabScript; label: string }[] = [
  { value: 'kanji', label: '漢字' },
  { value: 'hiragana', label: '平假名' },
];

const newLimitOptions = [10, 20, 30, 50].map((n) => ({ value: n, label: String(n) }));

const rateOptions: { value: SpeechRate; label: string }[] = [
  { value: 0.7, label: '慢速' },
  { value: 1, label: '正常' },
];

export function Settings() {
  const s = useSettings();
  const { available: canSpeak, speak } = useSpeech();

  return (
    <section className={styles.page}>
      <h2>設定</h2>

      <div className="card">
        <h3 className={styles.section}>外觀</h3>
        <div className={styles.row}>
          <span>主題</span>
          <Segmented label="主題" options={themeOptions} value={s.theme} onChange={s.setTheme} />
        </div>
      </div>

      <div className="card">
        <h3 className={styles.section}>學習</h3>
        <div className={styles.row}>
          <span>
            單字題面
            <small>「日 → 中」時顯示漢字或平假名</small>
          </span>
          <Segmented label="單字題面" options={scriptOptions} value={s.vocabScript} onChange={s.setVocabScript} />
        </div>
        <div className={styles.row}>
          <span>
            每日新卡上限
            <small>所有資料集合計，每天最多學幾張新卡</small>
          </span>
          <Segmented
            label="每日新卡上限"
            options={newLimitOptions}
            value={s.dailyNewLimit}
            onChange={s.setDailyNewLimit}
          />
        </div>
        <label className={styles.row}>
          <span>
            顯示完整解釋
            <small>翻到答案面時顯示 full_explanation</small>
          </span>
          <input
            type="checkbox"
            className={styles.switch}
            checked={s.showExplanation}
            onChange={(e) => s.setShowExplanation(e.target.checked)}
          />
        </label>
        <label className={styles.row}>
          <span>
            例句顯示讀音
            <small>文法例句的漢字上方標示假名（資料有標注時）</small>
          </span>
          <input
            type="checkbox"
            className={styles.switch}
            checked={s.showFurigana}
            onChange={(e) => s.setShowFurigana(e.target.checked)}
          />
        </label>
      </div>

      <div className="card">
        <h3 className={styles.section}>語音</h3>
        {canSpeak ? (
          <>
            <label className={styles.row}>
              <span>
                自動朗讀
                <small>日文那一面出現時自動念出來</small>
              </span>
              <input
                type="checkbox"
                className={styles.switch}
                checked={s.autoSpeak}
                onChange={(e) => s.setAutoSpeak(e.target.checked)}
              />
            </label>
            <div className={styles.row}>
              <span>語速</span>
              <div className={styles.inline}>
                <Segmented label="語速" options={rateOptions} value={s.speechRate} onChange={s.setSpeechRate} />
                <button type="button" className="btn btn--ghost" onClick={() => speak('こんにちは、よろしくね')}>
                  試聽
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className={styles.note}>
            這個瀏覽器或裝置沒有日文語音，朗讀功能已隱藏。可以在作業系統的語音設定中加入日文語音後重新開啟頁面。
          </p>
        )}
      </div>

      <DataSection />

      <div className="card">
        <h3 className={styles.section}>資料來源</h3>
        <p className={styles.note}>
          N3–N5 詞彙與文法資料由 Liu, An-Chi（
          <a href="https://github.com/tigercosmos/japanese-learner" target="_blank" rel="noreferrer">
            tigercosmos/japanese-learner
          </a>
          ）製作，以 MIT License 授權使用。
        </p>
      </div>
    </section>
  );
}
