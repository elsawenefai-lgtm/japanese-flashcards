export type Category = 'vocabulary' | 'grammar';

export interface VocabItem {
  id: string;
  japanese: string;
  hiragana: string;
  /** 簡短中文意思（繁體），欄位名稱沿用原格式 */
  simple_chinese: string;
  /** 支援簡易 Markdown */
  full_explanation?: string;
}

export interface GrammarExample {
  /** 例句：【】 標出文法部分、{漢字|かな} 標注讀音，例如「{日本|にほん}にいる【うちに】、…」 */
  sentence: string;
  chinese: string;
}

export interface GrammarItem {
  id: string;
  japanese: string;
  simple_chinese: string;
  full_explanation?: string;
  examples?: GrammarExample[];
}

interface DatasetBase {
  /** 由檔案路徑產生，例如 vocabulary/n3-business */
  id: string;
  name: string;
  level: string;
}

export interface VocabDataset extends DatasetBase {
  category: 'vocabulary';
  data: VocabItem[];
}

export interface GrammarDataset extends DatasetBase {
  category: 'grammar';
  data: GrammarItem[];
}

export type Dataset = VocabDataset | GrammarDataset;
