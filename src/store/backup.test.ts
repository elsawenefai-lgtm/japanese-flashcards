import { describe, expect, it } from 'vitest';
import { backupFileName, createBackup, parseBackup } from './backup';
import { review } from '../srs/scheduler';
import { sanitizeSettings } from './settings';

const NOW = new Date(2026, 9, 22, 9, 0).getTime();
const progress = { 'v/a:1:jp-zh': review(undefined, 'v/a:1:jp-zh', 'good', NOW) };
const stats = { '2026-10-22': { reviewed: 1, correct: 1, newCards: 1 } };

describe('備份', () => {
  it('匯出後可以原樣匯入', () => {
    const backup = createBackup(progress, stats, { theme: 'dark' }, NOW);
    const result = parseBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.progress).toEqual(progress);
      expect(result.backup.stats).toEqual(stats);
      expect(result.backup.settings).toEqual({ theme: 'dark' });
    }
  });

  it('拒絕各種錯誤的檔案', () => {
    const base = createBackup(progress, stats, {}, NOW);
    const cases: [unknown, string][] = [
      ['not json', '不是有效的 JSON'],
      [{ ...base, app: 'other' }, '不是にゃん単的備份檔'],
      [{ ...base, version: 99 }, '版本比目前的 App 新'],
      [{ ...base, progress: undefined }, '缺少進度或統計'],
      [{ ...base, progress: { x: { ...progress['v/a:1:jp-zh'] } } }, '進度資料格式錯誤：x'],
      [{ ...base, progress: { 'v/a:1:jp-zh': { ...progress['v/a:1:jp-zh'], due: 'tomorrow' } } }, '進度資料格式錯誤'],
      [{ ...base, stats: { yesterday: stats['2026-10-22'] } }, '統計資料格式錯誤'],
    ];
    for (const [input, message] of cases) {
      const result = parseBackup(typeof input === 'string' ? input : JSON.stringify(input));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain(message);
    }
  });

  it('匯入的設定只保留合法值', () => {
    expect(
      sanitizeSettings({ theme: 'dark', vocabScript: 'romaji', autoSpeak: 'yes', dailyNewLimit: 30, speechRate: 2, evil: 1 }),
    ).toEqual({ theme: 'dark', dailyNewLimit: 30 });
  });

  it('檔名包含日期', () => {
    expect(backupFileName(NOW)).toBe('nyantan-backup-2026-10-22.json');
  });
});
