# 日文單字卡 App 開發計畫（plan.md）

> 類似 Quizlet 的日文學習單字卡 Web App，可愛風 × 莫蘭迪色系。
> 狀態：**P0–P7 完成，已上線** → https://elsawenefai-lgtm.github.io/japanese-flashcards/（決議見文末 §10）

---

## 1. 目標與範圍

| 項目 | 內容 |
|---|---|
| 平台 | 純前端 Web App（無後端），桌機與手機瀏覽器皆可使用 |
| 技術 | React + TypeScript + Vite |
| 資料來源 | 專案內 `data/` 目錄的 JSON 檔 |
| 學習內容 | 日文單字（vocabulary）、文法（grammar） |
| 進度儲存 | 瀏覽器 `localStorage`（可匯出／匯入備份） |
| 核心功能 | 資料集篩選（category / level）、單字卡翻面、測驗、記憶演算法、洗牌 |
| 附加功能 | 日文語音朗讀、深色模式 |
| 介面語言 | 繁體中文 |

**不在第一版範圍（MVP 之外）**：帳號登入、雲端同步、線上編輯資料集、多人分享。

---

## 2. 技術選型

| 用途 | 選擇 | 理由 |
|---|---|---|
| 建置工具 | Vite | 快、設定少，`import.meta.glob` 可自動載入 `data/` 下所有 JSON |
| 語言 | TypeScript | 資料格式固定，型別可避免欄位打錯 |
| 路由 | React Router | 首頁 / 資料集 / 學習 / 測驗 / 統計 分頁 |
| 狀態管理 | Zustand（含 `persist` middleware） | 輕量，內建 localStorage 持久化 |
| 樣式 | CSS Modules + CSS 變數（設計 token） | 莫蘭迪色票集中管理，未來可加深色模式 |
| 動畫 | CSS 3D transform（翻卡）+ Framer Motion（滑動、彈跳） | 可愛感來自細緻動畫 |
| 字型 | Zen Maru Gothic（日文圓體）、Noto Sans TC / jf-openhuninn（中文） | 圓體字型是「可愛風」的關鍵 |
| 語音 | Web Speech API（`speechSynthesis`，`lang="ja-JP"`） | 瀏覽器內建、免費、免網路 API |
| Markdown | react-markdown | `full_explanation` 支援簡易 Markdown |
| 測試 | Vitest（演算法、洗牌、資料驗證） | 與 Vite 整合 |
| 部署 | GitHub Pages / Netlify / Vercel 靜態託管 | 純靜態網站即可 |

---

## 3. 專案結構

```
japanese-app/
├─ data/                         # 所有資料集 JSON（依需求放在這裡）
│  ├─ vocabulary/
│  │  ├─ n3-business.json
│  │  └─ n4-daily.json
│  └─ grammar/
│     └─ n3-grammar-01.json
├─ scripts/
│  └─ validate-data.ts           # 檢查 JSON 格式、id 重複、文法例句標記
├─ src/
│  ├─ main.tsx / App.tsx
│  ├─ types/                     # Dataset、VocabItem、GrammarItem、CardProgress…
│  ├─ data/loadDatasets.ts       # import.meta.glob 載入 + 驗證 + 建立索引
│  ├─ srs/
│  │  ├─ scheduler.ts            # 記憶演算法（SM-2 簡化版）
│  │  └─ queue.ts                # 學習佇列組成 + 洗牌
│  ├─ utils/shuffle.ts           # Fisher–Yates 洗牌
│  ├─ quiz/
│  │  ├─ modes.ts                # 各測驗模式定義（題目／答案如何產生）
│  │  └─ grammarSentence.ts      # 例句解析：高亮、挖空
│  ├─ store/                     # Zustand：progress、settings、session
│  ├─ components/                # Flashcard、DeckCard、FilterBar、RatingButtons…
│  ├─ pages/                     # Home（含學習集列表 DeckList）、DeckDetail、Study、Quiz、Stats、Settings
│  └─ styles/tokens.css          # 色票、圓角、陰影、字型
├─ public/                       # favicon、吉祥物插圖
└─ plan.md
```

---

## 4. 資料格式

### 4.1 單字（使用者提供的格式）

```json
{
  "name": "N3 商業單字",
  "category": "vocabulary",
  "level": "N3",
  "data": [
    {
      "id": "n3-biz-001",
      "japanese": "株式",
      "hiragana": "かぶしき",
      "simple_chinese": "股份",
      "full_explanation": "...."
    }
  ]
}
```

> `simple_chinese` 的意思是「簡短的中文意思」，內容一律使用**繁體中文**（欄位名稱沿用，不代表簡體）。
> `full_explanation` 支援簡易 Markdown（粗體、換行、列表）。

### 4.2 文法（使用者提供的格式）

```json
{
  "name": "N3 文法 01",
  "category": "grammar",
  "level": "N3",
  "data": [
    {
      "id": "n3-gr-001",
      "japanese": "うちに",
      "simple_chinese": "在～過程中／趁～",
      "full_explanation": "some example sentences..."
    }
  ]
}
```

### 4.3 擴充：文法例句結構化（✅ 已確認採用，2026-10-27 改為 【】 標記）

文法測驗需要「高亮文法」與「挖空文法」，但自由文字的 `full_explanation` 無法可靠判斷哪一段是文法部分（文法常會變形，例如「若い**うちに**」「暗く**ならないうちに**」）。因此新增選填的 `examples` 欄位，並在例句中標記：

```json
{
  "id": "grammar-n3-001",
  "japanese": "うちに",
  "simple_chinese": "在～過程中／趁～",
  "full_explanation": "表示在某狀態持續期間做某事……",
  "examples": [
    {
      "sentence": "{日本|にほん}にいる【うちに】、{富士山|ふじさん}に{登|のぼ}りたい。",
      "chinese": "趁還在日本的時候，想去爬富士山。"
    }
  ]
}
```

| 標記 | 用途 |
|---|---|
| `【…】` | 文法部分：高亮模式以螢光筆效果顯示；填空模式整組換成一個空格，答案為 `【】` 內文字。一句可以有多組 |
| `{漢字\|かな}` | 讀音標注：顯示成振假名（設定可關閉）；朗讀時改念假名。`【】` 內外都可以用 |
| 句末的 `【…】` | 句末標點（。？！」等）之後的最後一組 `【】` 視為註記標籤（例如 `【自動詞】`），顯示成小標籤、不出題；若整句只有這一組則仍是文法部分 |

- `examples` 為選填；沒有例句的文法條目會自動略過「例句類」測驗模式
- 最初版本用 `{…}` 標記文法部分；匯入 N3–N5 資料集時改成與其一致的 `【】` ＋ `{漢字|かな}`，範例資料也一併轉換

### 4.4 資料集識別

- 資料集 ID = 檔案路徑（如 `vocabulary/n3-business`），不需另填
- 卡片全域 ID = `資料集ID + ":" + item.id`，避免不同檔案的 `id` 撞號
- 篩選：依 `category`、`level` 篩選；可同時勾選多個資料集合併學習

---

## 5. 功能規劃

### 5.1 頁面

| 頁面 | 功能 |
|---|---|
| 首頁 | 今日待複習數、新卡數、連續學習天數、快速開始 |
| 資料集列表 | category / level 篩選標籤、每個資料集的卡數與熟練度進度條 |
| 資料集詳情 | 卡片清單瀏覽（可搜尋）、選擇學習模式、開始學習／測驗 |
| 學習（Flashcard） | 翻卡 → 自評（忘記／困難／記得／簡單）→ 更新記憶排程 |
| 測驗（Quiz） | 選擇題或拼寫題、計分、結束後顯示錯題回顧 |
| 統計 | 每日學習量、各資料集熟練度分布 |
| 設定 | 每日新卡上限、單字題面顯示漢字或平假名、是否顯示完整解釋、例句顯示讀音、語音（自動朗讀、語速）、主題（淺色／深色／跟隨系統）、匯出／匯入進度、重置進度 |

### 5.1.1 日文語音朗讀

- 卡片上的 🔊 按鈕朗讀日文（單字讀 `hiragana`；文法讀例句時去掉標記，並把 `{漢字|かな}` 改念假名）
- 設定可開啟「翻到日文面時自動朗讀」，可調語速（0.7×／1×）
- 使用 `speechSynthesis`，優先挑選 `ja-JP` 語音；裝置沒有日文語音時隱藏按鈕並在設定頁提示

### 5.2 單字測驗模式

| 模式 | 題面 | 答案面 |
|---|---|---|
| V1 漢字 → 中文 | `japanese`（漢字） | `simple_chinese`（＋選填 `full_explanation`） |
| V2 平假名 → 中文 | `hiragana` | `simple_chinese`（＋選填 `full_explanation`） |
| V3 中文 → 日文 | `simple_chinese` | `japanese` + `hiragana`（＋選填 `full_explanation`） |

- 使用者可在開始前選擇「題面用漢字」或「題面用平假名」（V1 / V2 切換）
- 答案面一律同時顯示漢字與讀音（可用 `<ruby>` 振假名）
- 特殊情況：無漢字的單字（如外來語、`japanese === hiragana`）在 V1 模式下自動以原字顯示

### 5.3 文法測驗模式

| 模式 | 題面 | 答案面 |
|---|---|---|
| G1 文法 → 中文 | `japanese` | `simple_chinese` |
| G2 高亮例句 → 中文 | 例句（文法部分高亮） | `simple_chinese`（＋例句翻譯） |
| G3 中文 → 文法 | `simple_chinese` | `japanese`（＋選填 `full_explanation`） |
| G4 挖空例句＋中文翻譯 → 文法 | 挖空例句 + 例句中文翻譯 | 挖空部分的日文（＋選填完整內容） |

- G2 / G4 每次從 `examples` 隨機挑一句
- 可勾選多個模式混合出題

### 5.4 作答方式

| 方式 | 說明 | 版本 |
|---|---|---|
| 翻卡自評 | 看題 → 點擊翻面 → 自評 4 級 | MVP |
| 選擇題 | 4 選 1，干擾選項從同資料集（同 level）隨機抽取 | MVP |
| 拼寫題 | 輸入平假名作答（V3、G4 適用），容許全形／半形差異 | 第二版 |

---

## 6. 記憶演算法與洗牌

### 6.1 記憶演算法：SM-2 簡化版

每張卡、每個測驗方向各自記錄一筆進度（中→日 與 日→中 難度不同）：

```ts
interface CardProgress {
  key: string;          // `${datasetId}:${itemId}:${direction}`
  ease: number;         // 難易度係數，初始 2.5，下限 1.3
  interval: number;     // 下次複習間隔（天）
  reps: number;         // 連續答對次數
  lapses: number;       // 遺忘次數
  due: number;          // 下次到期時間（timestamp）
  lastReviewed: number;
}
```

自評 4 級的處理：

| 評分 | 行為 |
|---|---|
| 忘記（Again） | `reps = 0`、`lapses++`、`ease -= 0.2`；本輪稍後（約 3–5 張後）再出現一次 |
| 困難（Hard） | `interval × 1.2`、`ease -= 0.15` |
| 記得（Good） | 第 1 次 1 天、第 2 次 3 天，之後 `interval × ease` |
| 簡單（Easy） | `interval × ease × 1.3`、`ease += 0.15` |

- 選擇題答對 = Good、答錯 = Again
- 熟練度分類：新卡（未學）／學習中（interval < 7 天）／熟悉（7–21 天）／精通（> 21 天）

### 6.2 學習佇列與洗牌

1. 取出所選資料集中「已到期」的卡 → 依逾期程度排序後**分段洗牌**（避免每次順序相同，又保留急迫性）
2. 加入新卡，數量受「每日新卡上限」限制（預設 20）
3. 到期卡與新卡穿插（例如每 3–4 張複習卡插 1 張新卡）
4. 洗牌使用 **Fisher–Yates**，並避免同一張卡的不同方向連續出現
5. 另提供「自由練習模式」：不看到期日、整副洗牌，不影響（或可選擇影響）記憶排程

---

## 7. 進度儲存

| 鍵值 | 內容 |
|---|---|
| `jpflash:v1:progress` | 所有 `CardProgress`（以 key 為索引的物件） |
| `jpflash:v1:settings` | 使用者設定 |
| `jpflash:v1:stats` | 每日學習紀錄（日期 → 學習數、正確率） |

- 加上版本號 `v1`，日後格式變更可做遷移（migration）
- **匯出／匯入 JSON 備份**：避免清除瀏覽器資料、換裝置時進度遺失
- 資料集中刪除的卡片：其進度保留但不顯示（孤兒資料可在設定頁清理）
- 容量估算：每筆進度約 150 bytes，1 萬筆 ≈ 1.5 MB，遠低於 localStorage 5 MB 上限

---

## 8. 視覺設計：可愛風 × 莫蘭迪色系

### 8.1 色票（設計 token）

| Token | 色碼 | 用途 |
|---|---|---|
| `--bg` | `#F2EDE7` | 頁面背景（奶茶米白） |
| `--surface` | `#FBF8F4` | 卡片底色 |
| `--text` | `#5B5450` | 主要文字（暖灰褐） |
| `--text-muted` | `#9A918B` | 次要文字 |
| `--rose` | `#C9A9A6` | 主色：按鈕、強調（乾燥玫瑰） |
| `--sage` | `#A3B1A0` | 正確／記得（鼠尾草綠） |
| `--blue` | `#9AAAB9` | 單字分類（霧霾藍） |
| `--lavender` | `#B5A8C0` | 文法分類（灰紫） |
| `--sand` | `#D8C3A5` | 困難／提示（奶茶黃） |
| `--clay` | `#C2948A` | 忘記／錯誤（陶土紅，不刺眼） |

### 8.2 深色模式

同一組 token 在深色主題下改值，保持莫蘭迪的低彩度感（不用純黑）：

| Token | 深色色碼 |
|---|---|
| `--bg` | `#2B2826` |
| `--surface` | `#36322F` |
| `--text` | `#ECE5DE` |
| `--text-muted` | `#A89F98` |
| `--rose` | `#D3B3AF` |
| `--sage` | `#AEBCAB` |
| `--blue` | `#A9B8C6` |
| `--lavender` | `#C1B5CB` |
| `--sand` | `#DCC9AD` |
| `--clay` | `#CFA197` |

- 預設跟隨系統（`prefers-color-scheme`），設定頁可手動切換，選擇存在 localStorage
- 以 `<html data-theme="light|dark">` 切換

### 8.3 可愛風元素

- 大圓角（卡片 20–24px、按鈕全圓角 pill）、柔和低對比陰影
- 圓體字型（Zen Maru Gothic）
- 吉祥物：**貓咪**（SVG），出現在頁首、空狀態、完成畫面、連續學習提示；答對時會開心、答錯時歪頭
- 翻卡 3D 動畫、答對時小彈跳＋小星星、完成一輪時撒花（低調款）
- 熟練度以小花朵／小圓點進度呈現
- 手機支援左右滑動卡片、桌機支援鍵盤快捷鍵（空白鍵翻面、1–4 評分）

---

## 9. 開發階段（里程碑）

| 階段 | 內容 | 產出 |
|---|---|---|
| **P0 專案骨架** ✅ | Vite + React + TS、路由、設計 token（含深色模式）、字型、貓咪吉祥物、範例資料各 1 份 | 可啟動的空殼 |
| **P1 資料層** ✅ | `import.meta.glob` 載入、型別、驗證腳本（`npm run validate`，build 前自動執行）、category/level 篩選（條件存在網址上） | 資料集列表頁 |
| **P2 單字卡學習** ✅ | Flashcard 元件、翻卡動畫、單字 V1–V3（日→中／中→日／混合）、漢字／平假名切換、日文語音朗讀（含自動朗讀）、資料集詳情頁、鍵盤快捷鍵 | 可以翻卡學習 |
| **P3 記憶演算法** ✅ | SM-2、學習佇列（到期卡分段洗牌＋新卡穿插、忘記的卡本輪重出）、自評 4 級（含間隔預覽、1–4 快捷鍵）、localStorage 持久化（進度＋每日統計）、熟練度進度條、每日新卡上限、自由練習模式 | 可跨次保留進度 |
| **P4 文法模式** ✅ | 例句解析（高亮、挖空）、G1–G4（可複選混合出題，沒有例句的條目自動略過例句類模式）、文法進度與熟練度、學習頁抽成單字／文法共用的 StudySession | 文法可學習 |
| **P5 測驗模式** ✅ | 選擇題（干擾選項依同資料集 → 同等級 → 同分類補足，填空題用實際變形）、計分、錯題回顧、只練錯題、詳解；答錯記為忘記，答對只在新卡或到期時計入排程 | Quiz 頁面 |
| **P6 統計與設定** ✅ | 首頁儀表（待複習、今日新卡、今天已學、連續天數、待複習資料集）、統計頁（近 14 天作答、未來 7 天到期、各資料集熟練度，附表格檢視）、匯出／匯入備份（格式驗證、設定只套用合法值）、重置全部／單一資料集、清理已刪除卡片的進度；熟練度改用通過驗證的單色相漸層 | 完整 MVP |
| **P7 打磨** ✅ | 滑動手勢（複習：左滑忘記／右滑記得；自由練習：左右換卡）、貓咪表情（開心、眨眼、歪頭、想睡）、換頁／換卡動畫與完成撒花、GitHub Actions 部署與 README；已上線：https://elsawenefai-lgtm.github.io/japanese-flashcards/ | 可上線版本 |
| 後續（選做） | 拼寫題、PWA 離線、收藏／錯題本 | — |

---

## 10. 決議紀錄（2026-10-22）

| # | 問題 | 決議 |
|---|---|---|
| Q1 | 文法資料加入 `examples`（`【】` 標記＋例句翻譯；原為 `{}`） | ✅ 採用，`examples` 為選填 |
| Q2 | `simple_chinese` 的意思 | 欄位名稱是誤植，內容為簡短中文意思；**介面與內容皆用繁體中文** |
| Q3 | 作答方式 | MVP：翻卡自評＋選擇題；打字輸入放第二版 |
| Q4 | 日→中、中→日進度是否分開 | 分開記錄 |
| Q5 | `full_explanation` 格式 | 支援簡易 Markdown |
| Q6 | 新增資料需重新 build | 可接受（使用 `import.meta.glob`） |
| Q7 | 部署方式 | GitHub Pages；PWA 離線放後續 |
| Q8 | 日文語音朗讀 | ✅ **要**，納入 P2（Web Speech API） |
| Q9 | 介面語言 | 繁體中文 |
| Q10 | 吉祥物 | ✅ **貓咪** |
| Q11 | 深色模式 | ✅ **要**，納入 P0（設計 token 同時定義淺色與深色） |
| Q12 | 現有資料量 | 2026-10-27 取得 N3–N5 詞彙與文法共 2,738 筆（6 個檔案），列表頁已有搜尋 |
| Q13 | N3–N5 資料集來源 | 來自 tigercosmos/japanese-learner。原 repo 無授權條款，2026-10 作者以 email 同意以 MIT License 使用，因此改為公開發佈；授權全文在 `THIRD_PARTY_NOTICES.md`，README 與設定頁註明來源 |
| Q14 | 例句讀音顯示 | 新增設定「例句顯示讀音」，預設開啟 |
| Q15 | 資料集列表位置與名稱 | 介面上「資料集」改稱「學習集」；列表（含篩選）併入首頁下方，導覽只剩首頁／統計／設定；舊的 `/decks` 連結導回首頁並保留篩選參數 |
| Q16 | 題數與卡片列表 | 複習／自由練習新增題數選擇（10／20／30／全部，預設全部，網址 `count`）；測驗增加 30 題選項（預設仍為 10）；學習集頁面的卡片列表預設收合 |

### 仍需注意的設計前提

- 不同資料集的 `id` 可能重複 → 進度鍵值使用「資料集路徑 + id」
- 無漢字的單字在「只顯示漢字」模式下直接顯示原字
- 進度只存在瀏覽器 → 提供匯出／匯入備份
- 資料驗證腳本會檢查欄位、id 重複、`【】` 是否成對、`{漢字|かな}` 格式是否正確
