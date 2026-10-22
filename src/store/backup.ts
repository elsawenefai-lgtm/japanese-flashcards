// 進度備份：匯出成 JSON 檔、從 JSON 檔還原
import type { CardProgress } from '../srs/scheduler';
import type { ProgressMap } from '../srs/queue';
import type { DailyMap } from '../stats/summary';

export const BACKUP_APP = 'jpflash';
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  progress: ProgressMap;
  stats: DailyMap;
  /** 設定為選填；舊備份或手動編輯的檔案可能沒有 */
  settings?: Record<string, unknown>;
}

export function createBackup(progress: ProgressMap, stats: DailyMap, settings: Record<string, unknown>, now: number): Backup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date(now).toISOString(),
    progress,
    stats,
    settings,
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const PROGRESS_NUMBERS: (keyof CardProgress)[] = ['ease', 'interval', 'reps', 'lapses', 'due', 'lastReviewed', 'created'];

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

/** 解析並檢查備份檔；任何一筆格式錯誤就整個拒絕，避免匯入一半 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: '檔案不是有效的 JSON' };
  }
  if (!isObject(raw) || raw.app !== BACKUP_APP) return { ok: false, error: '這不是にゃん単的備份檔' };
  if (!isNumber(raw.version) || raw.version > BACKUP_VERSION) {
    return { ok: false, error: '備份檔版本比目前的 App 新，請先更新 App' };
  }
  if (!isObject(raw.progress) || !isObject(raw.stats)) return { ok: false, error: '備份檔缺少進度或統計資料' };

  for (const [key, p] of Object.entries(raw.progress)) {
    if (!isObject(p) || p.key !== key || PROGRESS_NUMBERS.some((f) => !isNumber(p[f]))) {
      return { ok: false, error: `進度資料格式錯誤：${key}` };
    }
  }
  for (const [date, d] of Object.entries(raw.stats)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isObject(d) || !isNumber(d.reviewed) || !isNumber(d.correct) || !isNumber(d.newCards)) {
      return { ok: false, error: `統計資料格式錯誤：${date}` };
    }
  }

  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: raw.version,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      progress: raw.progress as ProgressMap,
      stats: raw.stats as DailyMap,
      settings: isObject(raw.settings) ? raw.settings : undefined,
    },
  };
}

/** 下載檔名，例如 nyantan-backup-2026-10-22.json */
export function backupFileName(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `nyantan-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}
