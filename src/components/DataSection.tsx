import { useRef, useState } from 'react';
import { datasets } from '../data/loadDatasets';
import { useProgress, useStats } from '../store/progress';
import { sanitizeSettings, settingsValues, useSettings } from '../store/settings';
import { backupFileName, createBackup, parseBackup, type Backup } from '../store/backup';
import { knownKeys } from '../study/deckProgress';
import { ConfirmDialog } from './ConfirmDialog';
import styles from '../pages/Settings.module.css';

type Pending = { kind: 'import'; backup: Backup } | { kind: 'reset' } | { kind: 'cleanup'; keys: string[] } | null;

/** 設定頁的「資料」區塊：匯出、匯入、清理、重置 */
export function DataSection() {
  const progress = useProgress((s) => s.progress);
  const daily = useStats((s) => s.daily);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const keys = knownKeys(datasets);
  const orphans = Object.keys(progress).filter((k) => !keys.has(k));
  const progressCount = Object.keys(progress).length;

  const exportBackup = () => {
    const now = Date.now();
    const backup = createBackup(progress, daily, { ...settingsValues(useSettings.getState()) }, now);
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName(now);
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ text: `已匯出 ${progressCount} 筆進度` });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = parseBackup(await file.text());
    if (fileInput.current) fileInput.current.value = '';
    if (!result.ok) setMessage({ text: `匯入失敗：${result.error}`, error: true });
    else setPending({ kind: 'import', backup: result.backup });
  };

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'import') {
      const { backup } = pending;
      useProgress.getState().replaceAll(backup.progress);
      useStats.getState().replaceAll(backup.stats);
      if (backup.settings) useSettings.setState(sanitizeSettings(backup.settings));
      setMessage({ text: `已匯入 ${Object.keys(backup.progress).length} 筆進度` });
    } else if (pending.kind === 'reset') {
      useProgress.getState().replaceAll({});
      useStats.getState().replaceAll({});
      setMessage({ text: '已重置所有學習進度' });
    } else {
      useProgress.getState().removeKeys(pending.keys);
      setMessage({ text: `已清理 ${pending.keys.length} 筆進度` });
    }
    setPending(null);
  };

  return (
    <div className="card">
      <h3 className={styles.section}>資料</h3>
      <p className={styles.note}>
        學習進度只存在這個瀏覽器裡。清除瀏覽器資料或換裝置前，記得先匯出備份。目前共 {progressCount} 筆進度。
      </p>

      <div className={styles.row}>
        <span>
          備份
          <small>匯出成 JSON 檔，或從備份檔還原</small>
        </span>
        <div className={styles.inline}>
          <button type="button" className="btn btn--ghost" onClick={exportBackup}>
            匯出
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => fileInput.current?.click()}>
            匯入
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {orphans.length > 0 && (
        <div className={styles.row}>
          <span>
            清理舊進度
            <small>{orphans.length} 筆進度屬於已刪除或改名的卡片</small>
          </span>
          <button type="button" className="btn btn--ghost" onClick={() => setPending({ kind: 'cleanup', keys: orphans })}>
            清理
          </button>
        </div>
      )}

      <div className={styles.row}>
        <span>
          重置進度
          <small>刪除所有卡片的學習進度與每日紀錄</small>
        </span>
        <button
          type="button"
          className={`btn ${styles.dangerButton}`}
          onClick={() => setPending({ kind: 'reset' })}
          disabled={progressCount === 0 && Object.keys(daily).length === 0}
        >
          重置
        </button>
      </div>

      {message && (
        <p className={message.error ? `${styles.message} ${styles.messageError}` : styles.message} role="status">
          {message.text}
        </p>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === 'import' ? '要匯入這份備份嗎？' : pending?.kind === 'reset' ? '確定要重置嗎？' : '要清理舊進度嗎？'
        }
        confirmLabel={pending?.kind === 'import' ? '匯入並取代' : pending?.kind === 'reset' ? '全部重置' : '清理'}
        danger={pending?.kind !== 'cleanup'}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      >
        {pending?.kind === 'import' && (
          <>
            <p>
              備份內有 {Object.keys(pending.backup.progress).length} 筆進度、{Object.keys(pending.backup.stats).length} 天紀錄
              {pending.backup.exportedAt && `（${new Date(pending.backup.exportedAt).toLocaleString('zh-TW')} 匯出）`}。
            </p>
            <p>目前的 {progressCount} 筆進度會被取代，無法復原。</p>
          </>
        )}
        {pending?.kind === 'reset' && <p>所有卡片會回到「新卡」，每日紀錄也會清空，無法復原。建議先匯出備份。</p>}
        {pending?.kind === 'cleanup' && <p>這些進度對應的卡片已經不在學習集中，清理後不影響現有卡片。</p>}
      </ConfirmDialog>
    </div>
  );
}
