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
  /** 文法例句的漢字上方顯示 {漢字|かな} 標注的讀音 */
  showFurigana: boolean;
  autoSpeak: boolean;
  speechRate: SpeechRate;
  /** 指定的日文語音（voiceURI）；空字串為自動選擇品質最好的 */
  voiceURI: string;
  /** 每日新卡上限（所有資料集共用） */
  dailyNewLimit: number;
  setTheme: (theme: ThemePref) => void;
  setVocabScript: (script: VocabScript) => void;
  setShowExplanation: (show: boolean) => void;
  setShowFurigana: (show: boolean) => void;
  setAutoSpeak: (auto: boolean) => void;
  setSpeechRate: (rate: SpeechRate) => void;
  setVoiceURI: (uri: string) => void;
  setDailyNewLimit: (limit: number) => void;
}

const ALLOWED: { [K in keyof SettingsValues]: readonly SettingsValues[K][] | 'boolean' | 'number' | 'string' } = {
  theme: ['system', 'light', 'dark'],
  vocabScript: ['kanji', 'hiragana'],
  showExplanation: 'boolean',
  showFurigana: 'boolean',
  autoSpeak: 'boolean',
  speechRate: [0.7, 1],
  voiceURI: 'string',
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
          : rule === 'string'
            ? typeof value === 'string' && value.length <= 300
            : (rule as readonly unknown[]).includes(value);
    if (ok) result[key] = value;
  }
  return result as Partial<SettingsValues>;
}

/** 匯出備份用：只取設定值，不含函式 */
export function settingsValues(state: SettingsState): SettingsValues {
  const { theme, vocabScript, showExplanation, showFurigana, autoSpeak, speechRate, voiceURI, dailyNewLimit } =
    state;
  return { theme, vocabScript, showExplanation, showFurigana, autoSpeak, speechRate, voiceURI, dailyNewLimit };
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
      showFurigana: true,
      autoSpeak: false,
      speechRate: 1,
      voiceURI: '',
      dailyNewLimit: 20,
      setTheme: (theme) => set({ theme }),
      setVocabScript: (vocabScript) => set({ vocabScript }),
      setShowExplanation: (showExplanation) => set({ showExplanation }),
      setShowFurigana: (showFurigana) => set({ showFurigana }),
      setAutoSpeak: (autoSpeak) => set({ autoSpeak }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setVoiceURI: (voiceURI) => set({ voiceURI }),
      setDailyNewLimit: (dailyNewLimit) => set({ dailyNewLimit }),
    }),
    { name: SETTINGS_KEY, version: 1 },
  ),
);
