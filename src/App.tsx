import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { DeckDetail } from './pages/DeckDetail';
import { Study } from './pages/Study';
import { Quiz } from './pages/Quiz';
import { Stats } from './pages/Stats';

// 舊的 /decks 頁已併入首頁：保留篩選參數導回首頁，讓舊連結和書籤仍可用
function DecksRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
}

// 使用 HashRouter：部署到 GitHub Pages 時重新整理不會 404
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="decks" element={<DecksRedirect />} />
          {/* 資料集 id 含斜線（如 vocabulary/n3-business），用 * 接收 */}
          <Route path="deck/*" element={<DeckDetail />} />
          <Route path="study/*" element={<Study />} />
          <Route path="quiz/*" element={<Quiz />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
