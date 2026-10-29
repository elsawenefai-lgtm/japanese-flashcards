# にゃん単 日文單字卡

可愛風 × 莫蘭迪色系的日文學習單字卡 Web App，給以繁體中文學習日文的人使用。支援單字與文法、記憶排程（SM-2 簡化版）、選擇題測驗、日文語音朗讀與深色模式；學習進度存在瀏覽器裡，不需要後端。

**線上版：https://elsawenefai-lgtm.github.io/japanese-flashcards/**

開發計畫與設計決策請見 [plan.md](plan.md)。

## 功能

- **記憶排程** — SM-2 簡化版，依自評（忘記／困難／記得／簡單）安排下次複習；忘記的卡會在本輪稍後再出現
- **學習佇列** — 到期卡依逾期程度分段洗牌、新卡穿插其中，每日新卡上限可調（所有資料集合計）
- **單字三種方向** — 日 → 中（題面可選漢字或平假名）、中 → 日、混合
- **文法四種模式（可複選）** — 文法 → 中、高亮例句 → 中、中 → 文法、例句填空
- **例句讀音** — 例句中有 `{漢字|かな}` 標注時顯示振假名（可在設定關閉）
- **自由練習** — 整副洗牌、不影響進度
- **題數選擇** — 複習／自由練習與選擇題測驗都可選 10、20、30 題或全部
- **選擇題測驗** — 干擾選項優先從同學習集取，不足時從同等級、同分類補；計分、錯題回顧、只練錯題
- **卡片列表** — 學習集頁面底部的卡片列表預設收合，避免先看到答案；展開後可搜尋
- **滑動手勢** — 複習時翻面後左滑「忘記」、右滑「記得」；自由練習時左右滑動換卡
- **日文語音朗讀** — Web Speech API，可自動朗讀、調整語速
- **首頁儀表與統計** — 待複習、今日新卡、連續學習天數、近 14 天作答、未來 7 天到期、各學習集熟練度
- **資料管理** — 匯出／匯入備份、重置全部或單一資料集、清理已刪除卡片的進度
- **學習集** — 列在首頁下方，可依分類（單字／文法）與 JLPT 等級篩選，條件保存在網址上
- **深色模式** — 跟隨系統或手動切換
- **貓咪吉祥物** — 會依情境開心、眨眼、歪頭、想睡

## 技術

React 18 · TypeScript · Vite 5 · React Router 6（HashRouter）· Zustand（localStorage 持久化）· react-markdown · CSS Modules · Vitest

## 開發

需要 Node.js 20 以上（建議 24 LTS）。

```bash
npm install
npm run dev        # 開發伺服器 http://localhost:5173
npm test           # 單元測試（Vitest）
npm run validate   # 檢查 data/ 底下的 JSON
npm run build      # 驗證資料 → 型別檢查 → 建置到 dist/
```

> Windows 上若 `npm test` 出現 `UNKNOWN: unknown error, open ...Temp...ssr...`，是平行執行時暫存檔被鎖住，改用 `npx vitest run --no-file-parallelism` 即可。

## 專案結構

```
data/                 資料集 JSON（資料集 ID = 相對路徑，例如 vocabulary/n3-business）
scripts/              validate-data.ts（資料驗證，build 前自動執行）
src/
  components/         共用元件（Flashcard、StudySession、QuizSession、Sentence、Cat…）
  pages/              頁面（Home（含學習集列表）、DeckDetail、Study、Quiz、Stats、Settings）
  data/               資料載入、驗證、篩選
  srs/                記憶排程（scheduler）、學習佇列（queue）、時間工具
  study/              單字／文法卡片產生、進度統計
  quiz/               例句解析（grammarSentence）、選擇題（multipleChoice）
  store/              Zustand store：設定、進度、每日統計、備份
  stats/              統計計算
  styles/             設計 token（莫蘭迪色票、深色模式）與全域樣式
.github/workflows/    推送到 main 時自動測試、建置並部署到 GitHub Pages
```

## 資料格式

把 JSON 檔放進 `data/` 底下（可以有子目錄），重新 build 即可。**改檔名或搬移會讓舊進度對不上**，可在「設定 → 資料 → 清理舊進度」清掉。

### 單字（`category: "vocabulary"`）

```json
{
  "name": "N3 詞彙",
  "category": "vocabulary",
  "level": "N3",
  "data": [
    {
      "id": "words-n3-0001",
      "japanese": "株式",
      "hiragana": "かぶしき",
      "simple_chinese": "股份",
      "full_explanation": "**株式会社**（かぶしきがいしゃ）＝股份有限公司"
    }
  ]
}
```

### 文法（`category: "grammar"`）

```json
{
  "name": "N3 文法",
  "category": "grammar",
  "level": "N3",
  "data": [
    {
      "id": "grammar-n3-001",
      "japanese": "うちに",
      "simple_chinese": "在～過程中／趁～",
      "full_explanation": "表示在某狀態持續期間做某事。",
      "examples": [
        { "sentence": "{暗|くら}く【ならないうちに】{帰|かえ}りましょう。", "chinese": "趁天還沒黑回家吧。" }
      ]
    }
  ]
}
```

例句標記：

| 標記 | 意思 | 範例 |
|---|---|---|
| `【…】` | 文法部分（可以是變形後的形態），用於高亮與填空；一句可以有多組 | `暗く【ならないうちに】帰る` |
| `{漢字\|かな}` | 讀音標注，顯示成振假名；`【】` 內外都可以用 | `{帰\|かえ}る` |
| 句末的 `【…】` | 句末標點（。？！）之後的最後一組，視為註記標籤（例如詞性），不出題 | `…ました。【自動詞】` |

其他規則：

- `id` 在同一個檔案內不可重複
- `simple_chinese` 是簡短中文意思（繁體），`full_explanation` 支援簡易 Markdown
- `examples` 為選填；沒有例句的文法不會出現在例句類模式
- `npm run validate` 會列出錯誤（擋下 build）與警告（例如拼錯的欄位名稱）

## 資料集

| 檔案 | 內容 | 是否公開 |
|---|---|---|
| 檔案 | 內容 | 來源 |
|---|---|---|
| `data/vocabulary/n3-vocabulary.json`、`n4-vocabulary.json`、`n5-vocabulary.json` | N3–N5 詞彙 | [tigercosmos/japanese-learner](https://github.com/tigercosmos/japanese-learner)（MIT） |
| `data/grammar/n3-grammar.json`、`n4-grammar.json`、`n5-grammar.json` | N3–N5 文法 | [tigercosmos/japanese-learner](https://github.com/tigercosmos/japanese-learner)（MIT） |
| `data/vocabulary/n3-business.json`、`n4-daily.json`、`data/grammar/n3-grammar-01.json` | 範例資料 | 本專案自行撰寫 |

N3–N5 詞彙與文法資料由 Liu, An-Chi（[tigercosmos](https://github.com/tigercosmos)）製作，經作者同意以 MIT License 使用；本專案只更改了檔名與 ID。授權全文見 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 部署到 GitHub Pages

1. 把專案推上 GitHub 的 `main` 分支
2. 到 repo 的 **Settings → Pages**，**Source** 選 **GitHub Actions**
3. 之後每次推送到 `main`，`.github/workflows/deploy.yml` 會自動驗證資料、跑測試、建置並部署

App 使用相對路徑與 HashRouter，部署在任何子路徑都不需要另外設定。

## 快捷鍵與手勢

| 畫面 | 操作 |
|---|---|
| 翻卡 | 空白鍵翻面、`S` 朗讀；複習 `1`–`4` 自評；自由練習 `←` `→` 換卡 |
| 測驗 | `1`–`4` 作答、`Enter` 下一題、`S` 朗讀 |
| 手機 | 複習時翻面後左滑「忘記」、右滑「記得」；自由練習時左滑下一張、右滑上一張 |

## 學習進度

進度只存在目前這個瀏覽器（localStorage），不同裝置之間不會同步。清除瀏覽器資料或換裝置前，請到「設定 → 資料」匯出備份，再到新裝置匯入。
