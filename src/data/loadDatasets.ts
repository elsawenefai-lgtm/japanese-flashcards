import type { Dataset } from '../types/dataset';
import { validateDataset } from './validate';

// build 時把 data/ 底下所有 JSON 打包進來；新增檔案後需重新 build
const modules = import.meta.glob<unknown>('/data/**/*.json', {
  eager: true,
  import: 'default',
});

function toDatasetId(path: string): string {
  return path.replace(/^\/data\//, '').replace(/\.json$/, '');
}

// 驗證失敗的資料集或卡片會被略過，並在主控台列出原因（完整檢查請跑 npm run validate）
export const datasets: Dataset[] = Object.entries(modules)
  .flatMap(([path, raw]) => {
    const id = toDatasetId(path);
    const { issues, dataset } = validateDataset(raw, id);
    const errors = issues.filter((i) => i.level === 'error');
    if (errors.length > 0) {
      console.error(
        `[資料] ${id}：${errors.length} 個錯誤，已略過有問題的${dataset ? '卡片' : '資料集'}`,
        errors.map((e) => `${e.path}：${e.message}`),
      );
    }
    return dataset ? [dataset] : [];
  })
  .sort((a, b) => a.level.localeCompare(b.level) || a.name.localeCompare(b.name, 'zh-Hant'));

export function findDataset(id: string): Dataset | undefined {
  return datasets.find((d) => d.id === id);
}

/** 同分類的其他資料集，分成「同等級」與「其他等級」兩層（選擇題補干擾選項用） */
export function relatedDatasets<D extends Dataset>(dataset: D): [D[], D[]] {
  const others = datasets.filter((d) => d.category === dataset.category && d.id !== dataset.id) as D[];
  return [others.filter((d) => d.level === dataset.level), others.filter((d) => d.level !== dataset.level)];
}

/** 依 N1→N5 排序；非 N 級的放最後 */
export const levels: string[] = [...new Set(datasets.map((d) => d.level))].sort((a, b) => {
  const na = /^N\d$/.test(a);
  const nb = /^N\d$/.test(b);
  return na === nb ? a.localeCompare(b) : na ? -1 : 1;
});
