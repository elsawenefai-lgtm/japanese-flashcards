import { useEffect, useRef, type ReactNode } from 'react';
import { Cat } from './Cat';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** 不可復原的操作（重置、取代）用陶土紅按鈕 */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 確認對話框；按 Esc 或「取消」關閉 */
export function ConfirmDialog({ open, title, children, confirmLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirm-title"
    >
      <Cat size={64} mood="confused" />
      <h3 id="confirm-title">{title}</h3>
      <div className={styles.body}>{children}</div>
      <div className={styles.actions}>
        <button type="button" className="btn btn--ghost" onClick={onCancel} autoFocus>
          取消
        </button>
        <button type="button" className={danger ? `btn ${styles.danger}` : 'btn'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
