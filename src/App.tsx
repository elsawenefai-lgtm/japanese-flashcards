import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Decks } from './pages/Decks';
import { Settings } from './pages/Settings';
import { DeckDetail } from './pages/DeckDetail';
import { Study } from './pages/Study';
import { Quiz } from './pages/Quiz';
import { Stats } from './pages/Stats';

// 使用 HashRouter：部署到 GitHub Pages 時重新整理不會 404
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="decks" element={<Decks />} />
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
