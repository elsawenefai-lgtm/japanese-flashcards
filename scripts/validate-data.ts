// 驗證 data/ 底下所有資料集 JSON
// 用法：npm run validate [-- 其他目錄]
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { validateDataset } from '../src/data/validate.ts';

const dataDir = resolve(process.argv[2] ?? 'data');
const files = readdirSync(dataDir, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replaceAll('\\', '/'))
  .sort();

let errorCount = 0;
let warningCount = 0;
let cardCount = 0;

for (const file of files) {
  const datasetId = file.replace(/\.json$/, '');
  const fullPath = join(dataDir, file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch (e) {
    errorCount++;
    console.log(`✗ ${file}\n    [錯誤] JSON 格式錯誤：${(e as Error).message}`);
    continue;
  }

  const { issues, dataset } = validateDataset(raw, datasetId);
  const errors = issues.filter((i) => i.level === 'error').length;
  errorCount += errors;
  warningCount += issues.length - errors;
  cardCount += dataset?.data.length ?? 0;

  const mark = errors > 0 ? '✗' : issues.length > 0 ? '△' : '✓';
  const summary = dataset ? `${dataset.data.length} 張卡片` : '無法載入';
  console.log(`${mark} ${file}（${summary}）`);
  for (const issue of issues) {
    const tag = issue.level === 'error' ? '錯誤' : '警告';
    console.log(`    [${tag}] ${issue.path || '(根)'}：${issue.message}`);
  }
}

console.log(
  `\n共 ${files.length} 個檔案、${cardCount} 張可用卡片；${errorCount} 個錯誤、${warningCount} 個警告` +
    `（目錄：${relative(process.cwd(), dataDir) || '.'}）`,
);
process.exit(errorCount > 0 ? 1 : 0);
