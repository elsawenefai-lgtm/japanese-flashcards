import { useEffect } from 'react';
import { useSettings } from '../store/settings';

const darkQuery = '(prefers-color-scheme: dark)';

/** 依設定把 data-theme 套到 <html>；「跟隨系統」時同步監聽系統切換 */
export function useApplyTheme() {
  const theme = useSettings((s) => s.theme);

  useEffect(() => {
    const media = window.matchMedia(darkQuery);
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    if (theme !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
