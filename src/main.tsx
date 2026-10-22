// 全域樣式要最先載入，元件的 CSS Module 才能以相同權重覆寫 .btn 等共用樣式
import './styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
