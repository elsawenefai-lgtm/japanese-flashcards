// 選擇題：從卡片產生題目、正解與干擾選項
import { shuffle } from '../utils/shuffle';

export const MAX_OPTIONS = 4;

export interface QuizQuestion<C> {
  card: C;
  options: string[];
  answerIndex: number;
}

export interface QuestionOptions<C> {
  cards: C[];
  /** 題數；超過卡片數時用全部 */
  count: number;
  answerOf: (card: C) => string;
  /** 干擾選項候選（可包含正解或重複，會自動排除） */
  distractorsOf: (card: C) => string[];
  random?: () => number;
}

/** 從候選中挑出最多 3 個與正解不同、彼此不重複的干擾選項 */
export function pickDistractors(answer: string, pool: string[], random: () => number = Math.random): string[] {
  const unique = [...new Set(pool.map((s) => s.trim()))].filter((s) => s && s !== answer.trim());
  return shuffle(unique, random).slice(0, MAX_OPTIONS - 1);
}

/**
 * 依優先順序合併候選：前面的層級（例如同資料集）湊不滿 3 個干擾選項時，才往下一層（同等級、同分類）補。
 */
export function tieredPool(answer: string, tiers: string[][]): string[] {
  const result: string[] = [];
  for (const tier of tiers) {
    result.push(...tier);
    const unique = new Set(result.map((s) => s.trim()).filter((s) => s && s !== answer.trim()));
    if (unique.size >= MAX_OPTIONS - 1) break;
  }
  return result;
}

export function buildQuestions<C>({
  cards,
  count,
  answerOf,
  distractorsOf,
  random = Math.random,
}: QuestionOptions<C>): QuizQuestion<C>[] {
  return shuffle(cards, random)
    .slice(0, Math.max(0, count))
    .map((card) => {
      const answer = answerOf(card);
      const options = shuffle([answer, ...pickDistractors(answer, distractorsOf(card), random)], random);
      return { card, options, answerIndex: options.indexOf(answer) };
    })
    // 至少要有一個干擾選項才算選擇題
    .filter((q) => q.options.length >= 2);
}

export interface QuizAnswer<C> {
  question: QuizQuestion<C>;
  chosenIndex: number;
}

export function isCorrect<C>(answer: QuizAnswer<C>): boolean {
  return answer.chosenIndex === answer.question.answerIndex;
}

export function scoreOf<C>(answers: QuizAnswer<C>[]): { correct: number; total: number; percent: number } {
  const correct = answers.filter(isCorrect).length;
  const total = answers.length;
  return { correct, total, percent: total === 0 ? 0 : Math.round((correct / total) * 100) };
}
