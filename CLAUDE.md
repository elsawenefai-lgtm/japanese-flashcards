# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # validate data → tsc --noEmit → vite build (dist/)
npm run validate     # node scripts/validate-data.ts (checks every JSON under data/)
npm test             # vitest run
```

- Node.js is installed at `C:\Program Files\nodejs` and may not be on the Bash PATH; prefix with `export PATH="/c/Program Files/nodejs:$PATH"`.
- On this Windows machine parallel Vitest workers sometimes fail with `UNKNOWN: unknown error, open ...\Temp\...\ssr\...`. Re-run with `npx vitest run --no-file-parallelism`; CI (Linux) is unaffected.
- `scripts/validate-data.ts` runs directly with Node's TypeScript type stripping, so `src/data/validate.ts` and what it imports must use `import type` for types and explicit `.ts` extensions.

Unit tests live next to the code as `src/**/*.test.ts`. There is no linter or e2e suite.

## Architecture

**React 18 + TypeScript + Vite 5** static app, deployed to GitHub Pages via `.github/workflows/deploy.yml` (push to `main` → test → build → deploy). UI text and code comments are in Traditional Chinese.

### Routing (React Router 6, `HashRouter`, `base: './'`)

- `/` Home — dashboard (due, new today, streak, decks with due cards) and, below it, the deck list「學習集」(`components/DeckList.tsx`) with category/level filters (filter state in URL params)
- `/decks` — legacy route, redirects to `/` keeping the filter params
- `/deck/*` — dataset detail: choose direction/modes and counts, start review / free practice / quiz, collapsible card list (collapsed by default), reset deck
- `/study/*?dir=…|modes=…&count=…&mode=free` — flashcard session (`StudySession`); `count` caps the queue, missing = all
- `/quiz/*?…&count=10|20|30|all` — multiple-choice quiz (`QuizSession`); missing = 10. Count options and parsing live in `study/sessionCount.ts`
- `/stats` — statistics; `/settings` — settings and data (backup/import/reset/cleanup)

Dataset IDs contain slashes (they are the file path under `data/` without `.json`), hence the `*` routes.

### Data Flow

- `src/data/loadDatasets.ts` loads `data/**/*.json` with eager `import.meta.glob`, validates each file with `validateDataset()` and drops invalid items (errors are logged). Adding data requires a rebuild.
- Progress key format: `${datasetId}:${itemId}:${direction|mode}` — each vocab direction and grammar mode is scheduled separately.
- Persistence (Zustand `persist`, localStorage): `jpflash:v1:settings`, `jpflash:v1:progress`, `jpflash:v1:stats`. `index.html` reads the settings key before React loads to apply the theme.

### Core Modules

- `srs/scheduler.ts` — SM-2 variant: `review()`, `isDue()` (due before end of today), `mastery()`, `formatInterval()`
- `srs/queue.ts` — `buildReviewQueue()` (due cards chunk-shuffled + new cards interleaved), `newCardsRemaining()` (global daily limit), `requeue()`
- `study/vocabCards.ts`, `study/grammarCards.ts` — build cards per direction/mode, answers and distractors for quizzes, speech text
- `quiz/grammarSentence.ts` — parses example markup (see Data Format)
- `quiz/multipleChoice.ts` — question building, tiered distractor pools, scoring
- `components/StudySession.tsx`, `components/QuizSession.tsx` — generic sessions; vocab/grammar differences are supplied through a config object from `pages/Study.tsx` / `pages/Quiz.tsx`
- `store/backup.ts` — backup format and validation; `store/settings.ts` `sanitizeSettings()` filters imported settings

### Data Format

`category` is `"vocabulary"` or `"grammar"`. Vocabulary items: `id`, `japanese`, `hiragana`, `simple_chinese`, `full_explanation?` (Markdown). Grammar items: `id`, `japanese`, `simple_chinese`, `full_explanation?`, `examples?: { sentence, chinese }[]`.

Example sentence markup:
- `【…】` grammar part (highlight / cloze target); several groups per sentence allowed
- `{漢字|かな}` furigana, allowed inside and outside `【】`
- the last `【…】` after sentence-final punctuation (。？！) is a note label such as `【自動詞】`, not a target

The N3–N5 datasets (`data/vocabulary/n*-vocabulary.json`, `data/grammar/n*-grammar.json`) come from tigercosmos/japanese-learner. The author granted use under the MIT License by email; keep the notice in `THIRD_PARTY_NOTICES.md` and the attribution in README and the Settings page.

### Styling

- Design tokens (Morandi palette, light/dark) in `src/styles/tokens.css`; components use CSS Modules.
- `src/main.tsx` must import `styles/global.css` first so CSS Modules can override shared classes like `.btn` at equal specificity.
- Mastery colors use the single-hue `--seq-1..3` ramp (validated as an ordinal ramp for both themes); "new" is the empty track.
- Every animation needs a `prefers-reduced-motion` fallback.

## Document

The system design should be in `plan.md`, always update it when there is big features or big refactoring.

Update README.md if there is any changes that may affect the users or developers.
