import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { review, type CardProgress, type Rating } from '../srs/scheduler';
import type { ProgressMap } from '../srs/queue';
import { dateKey } from '../srs/time';

interface ProgressState {
  progress: ProgressMap;
  /** 記錄一次自評，回傳更新後的進度 */
  rate: (key: string, rating: Rating, now?: number) => CardProgress;
  /** 刪除指定卡片的進度（重置單一資料集、清理已刪除卡片） */
  removeKeys: (keys: string[]) => void;
  /** 匯入備份時整份取代 */
  replaceAll: (progress: ProgressMap) => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      rate: (key, rating, now = Date.now()) => {
        const prev = get().progress[key];
        const next = review(prev, key, rating, now);
        set((s) => ({ progress: { ...s.progress, [key]: next } }));
        useStats.getState().record(rating, !prev, now);
        return next;
      },
      removeKeys: (keys) =>
        set((s) => {
          const progress = { ...s.progress };
          for (const key of keys) delete progress[key];
          return { progress };
        }),
      replaceAll: (progress) => set({ progress }),
    }),
    { name: 'jpflash:v1:progress', version: 1 },
  ),
);

export interface DailyStats {
  reviewed: number;
  /** 記得＋簡單＋困難（非「忘記」）的次數 */
  correct: number;
  newCards: number;
}

interface StatsState {
  daily: Record<string, DailyStats>;
  record: (rating: Rating, isNew: boolean, now: number) => void;
  replaceAll: (daily: Record<string, DailyStats>) => void;
}

// 每日學習紀錄，P6 統計頁使用
export const useStats = create<StatsState>()(
  persist(
    (set) => ({
      daily: {},
      record: (rating, isNew, now) =>
        set((s) => {
          const key = dateKey(now);
          const day = s.daily[key] ?? { reviewed: 0, correct: 0, newCards: 0 };
          return {
            daily: {
              ...s.daily,
              [key]: {
                reviewed: day.reviewed + 1,
                correct: day.correct + (rating === 'again' ? 0 : 1),
                newCards: day.newCards + (isNew ? 1 : 0),
              },
            },
          };
        }),
      replaceAll: (daily) => set({ daily }),
    }),
    { name: 'jpflash:v1:stats', version: 1 },
  ),
);
