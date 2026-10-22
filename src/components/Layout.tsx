import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Cat } from './Cat';
import { useApplyTheme } from '../hooks/useApplyTheme';
import styles from './Layout.module.css';

const navItems = [
  { to: '/', label: '首頁', end: true, also: [] },
  // 資料集詳情與學習頁也算在「資料集」底下
  { to: '/decks', label: '資料集', also: ['/deck/', '/study/', '/quiz/'] },
  { to: '/stats', label: '統計', also: [] },
  { to: '/settings', label: '設定', also: [] },
];

export function Layout() {
  useApplyTheme();
  const { pathname } = useLocation();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand}>
          <Cat size={40} />
          <span>にゃん単</span>
        </NavLink>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive || item.also.some((p) => pathname.startsWith(p))
                  ? `${styles.link} ${styles.active}`
                  : styles.link
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      {/* 以路徑為 key：換頁時重新播放淡入動畫（只改篩選等網址參數時不會） */}
      <main key={pathname} className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
