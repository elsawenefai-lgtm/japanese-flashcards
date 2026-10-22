import { describe, expect, it } from 'vitest';
import { buildQuestions, isCorrect, pickDistractors, scoreOf, tieredPool } from './multipleChoice';

interface Card {
  id: string;
  answer: string;
}

const cards: Card[] = ['股份', '會議', '截止期限', '估價', '行程'].map((answer, i) => ({ id: String(i), answer }));
const pool = cards.map((c) => c.answer);

describe('pickDistractors', () => {
  it('排除正解、空白與重複，最多 3 個', () => {
    const result = pickDistractors('股份', ['股份', '會議', '會議', ' ', '估價', '行程', '截止期限']);
    expect(result).toHaveLength(3);
    expect(result).not.toContain('股份');
    expect(new Set(result).size).toBe(3);
  });

  it('候選不足時有幾個給幾個', () => {
    expect(pickDistractors('A', ['A', 'B'])).toEqual(['B']);
  });
});

describe('tieredPool', () => {
  it('前一層夠用就不往下取', () => {
    expect(tieredPool('A', [['A', 'B', 'C', 'D'], ['X']])).toEqual(['A', 'B', 'C', 'D']);
  });

  it('不夠時往下一層補', () => {
    expect(tieredPool('A', [['A', 'B'], ['C'], ['D', 'E'], ['Z']])).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});

describe('buildQuestions', () => {
  const build = (count: number) =>
    buildQuestions({ cards, count, answerOf: (c) => c.answer, distractorsOf: () => pool });

  it('依題數出題，每題 4 個選項且正解位置正確', () => {
    const questions = build(3);
    expect(questions).toHaveLength(3);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(q.options[q.answerIndex]).toBe(q.card.answer);
    }
  });

  it('題數超過卡片數時用全部卡片，且不重複', () => {
    const questions = build(99);
    expect(questions.map((q) => q.card.id).sort()).toEqual(['0', '1', '2', '3', '4']);
  });

  it('沒有干擾選項的題目會略過', () => {
    const questions = buildQuestions({ cards, count: 5, answerOf: (c) => c.answer, distractorsOf: () => [] });
    expect(questions).toEqual([]);
  });

  it('正解在各個位置都會出現', () => {
    const positions = new Set<number>();
    for (let n = 0; n < 100; n++) build(1).forEach((q) => positions.add(q.answerIndex));
    expect(positions.size).toBe(4);
  });
});

describe('計分', () => {
  it('計算答對數與百分比', () => {
    const [q1, q2, q3] = buildQuestions({ cards, count: 3, answerOf: (c) => c.answer, distractorsOf: () => pool });
    const answers = [
      { question: q1, chosenIndex: q1.answerIndex },
      { question: q2, chosenIndex: (q2.answerIndex + 1) % 4 },
      { question: q3, chosenIndex: q3.answerIndex },
    ];
    expect(answers.map(isCorrect)).toEqual([true, false, true]);
    expect(scoreOf(answers)).toEqual({ correct: 2, total: 3, percent: 67 });
    expect(scoreOf([])).toEqual({ correct: 0, total: 0, percent: 0 });
  });
});
