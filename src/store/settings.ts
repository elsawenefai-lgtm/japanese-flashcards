import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePref = 'system' | 'light' | 'dark';
/** 單字「日→中」題面顯示漢字或平假名 */
export type VocabScript = 'kanji' | 'hiragana';
export type SpeechRate = 0.7 | 1;

interface SettingsState {
  theme: ThemePref;
  vocabScript: VocabScript;
  showExplanation: boolean;
  autoSpeak: boolean;
  speechRate: SpeechRate;
  /** 每日新卡上限（所有資料集共用） */
  dailyNewLimit: number;
  setTheme: (theme: ThemePref) => void;
  setVocabScript: (script: VocabScript) => void;
  setShowExplanation: (show: boolean) => void;
  setAutoSpeak: (auto: boolean) => void;
  setSpeechRate: (rate: SpeechRate) => void;
  setDailyNewLimit: (limit: number) => void;
}

const ALLOWED: { [K in keyof SettingsValues]: readonly SettingsValues[K][] | 'boolean' | 'number' } = {
  theme: ['system', 'light', 'dark'],
  vocabScript: ['kanji', 'hiragana'],
  showExplanation: 'boolean',
  autoSpeak: 'boolean',
  speechRate: [0.7, 1],
  dailyNewLimit: 'number',
};

export type SettingsValues = Omit<SettingsState, `set${string}`>;

/** 匯入備份時只接受已知欄位且值合法的設定 */
export function sanitizeSettings(raw: Record<string, unknown>): Partial<SettingsValues> {
  const result: Record<string, unknown> = {};
  for (const [key, rule] of Object.entries(ALLOWED)) {
    const value = raw[key];
    const ok =
      rule === 'boolean'
        ? typeof value === 'boolean'
        : rule === 'number'
          ? typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 500
          : (rule as readonly unknown[]).includes(value);
    if (ok) result[key] = value;
  }
  return result as Partial<SettingsValues>;
}

/** 匯出備份用：只取設定值，不含函式 */
export function settingsValues(state: SettingsState): SettingsValues {
  const { theme, vocabScript, showExplanation, autoSpeak, speechRate, dailyNewLimit } = state;
  return { theme, vocabScript, showExplanation, autoSpeak, speechRate, dailyNewLimit };
}

// 鍵值需與 index.html 內預先套用主題的腳本一致
export const SETTINGS_KEY = 'jpflash:v1:settings';

// 新增欄位時，persist 會把舊資料與預設值合併，不需要 migration
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      vocabScript: 'kanji',
      showExplanation: true,
      autoSpeak: false,
      speechRate: 1,
      dailyNewLimit: 20,
      setTheme: (theme) => set({ theme }),
      setVocabScript: (vocabScript) => set({ vocabScript }),
      setShowExplanation: (showExplanation) => set({ showExplanation }),
      setAutoSpeak: (autoSpeak) => set({ autoSpeak }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setDailyNewLimit: (dailyNewLimit) => set({ dailyNewLimit }),
    }),
    { name: SETTINGS_KEY, version: 1 },
  ),
);
