# にゃん単 日文單字卡

可愛風 × 莫蘭迪色系的日文學習單字卡 Web App。支援單字與文法、記憶排程（SM-2 簡化版）、選擇題測驗、日文語音朗讀與深色模式。學習進度存在瀏覽器裡，可以匯出／匯入備份。

**線上版：https://elsawenefai-lgtm.github.io/japanese-flashcards/**

開發計畫與設計決策請見 [plan.md](plan.md)。

## 開發

需要 Node.js 20 以上（建議 24 LTS）。

```bash
npm install
npm run dev        # 開發伺服器 http://localhost:5173
npm test           # 單元測試
npm run validate   # 檢查 data/ 底下的 JSON
npm run build      # 驗證資料 → 型別檢查 → 建置到 dist/
```

## 新增資料

把 JSON 檔放進 `data/` 底下任意子目錄，重新 build 即可。資料集 ID 就是檔案路徑（例如 `data/vocabulary/n3-business.json` → `vocabulary/n3-business`），**改檔名或搬移會讓舊進度對不上**，可在「設定 → 資料 → 清理舊進度」清掉。

### 單字

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
      "full_explanation": "**株式会社**＝股份有限公司"
    }
  ]
}
```

### 文法

例句中用 `{}` 標出文法部分（可以是變形後的形態），用於高亮與填空題；`examples` 為選填。

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
      "full_explanation": "表示在某狀態持續期間做某事。",
      "examples": [
        { "sentence": "暗く{ならないうちに}帰りましょう。", "chinese": "趁天還沒黑回家吧。" }
      ]
    }
  ]
}
```

- `id` 在同一個檔案內不可重複
- `simple_chinese` 是簡短中文意思（繁體），`full_explanation` 支援簡易 Markdown
- `npm run validate` 會列出錯誤（擋下 build）與警告（例如拼錯的欄位名稱）

## 部署到 GitHub Pages

1. 在 GitHub 建立 repo，把專案推上 `main` 分支
2. 到 repo 的 **Settings → Pages**，Source 選 **GitHub Actions**
3. 之後每次推送到 `main`，`.github/workflows/deploy.yml` 會自動跑測試、建置並部署

網址會是 `https://<帳號>.github.io/<repo 名稱>/`。App 使用相對路徑與 HashRouter，不需要另外設定 base path。

## 快捷鍵

| 畫面 | 按鍵 |
|---|---|
| 翻卡 | 空白鍵翻面、`S` 朗讀；複習 `1`–`4` 自評；自由練習 `←` `→` 換卡 |
| 測驗 | `1`–`4` 作答、`Enter` 下一題、`S` 朗讀 |

手機上可以左右滑動卡片：複習時翻面後左滑「忘記」、右滑「記得」；自由練習時左滑下一張、右滑上一張。
