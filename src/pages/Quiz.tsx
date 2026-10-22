import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { findDataset, relatedDatasets } from '../data/loadDatasets';
import type { GrammarDataset, VocabDataset } from '../types/dataset';
import { buildVocabCards, parseDirection, speechText, vocabAnswer, type VocabCard } from '../study/vocabCards';
import {
  buildGrammarCards,
  grammarAnswer,
  grammarDistractors,
  grammarFrontIsJapanese,
  grammarSpeechText,
  parseGrammarModes,
  type GrammarCard,
} from '../study/grammarCards';
import { parseSentence, plainSentence } from '../quiz/grammarSentence';
import { tieredPool } from '../quiz/multipleChoice';
import { useSettings } from '../store/settings';
import { QuizSession, type QuizConfig } from '../components/QuizSession';
import { VocabCardFace } from '../components/VocabCardFace';
import { GrammarCardFace } from '../components/GrammarCardFace';
import { Cat } from '../components/Cat';
import styles from '../components/QuizSession.module.css';

/** count=10|20|all；預設 10 */
function parseCount(value: string | null): number {
  if (value === 'all') return Infinity;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 10;
}

export function Quiz() {
  const id = useParams()['*'] ?? '';
  const dataset = findDataset(id);
  const [params] = useSearchParams();

  if (!dataset) {
    return (
      <section className={styles.page}>
        <div className={`card ${styles.result}`}>
          <Cat size={96} mood="confused" />
          <p>找不到這個資料集</p>
          <Link to="/decks" className="btn">
            回資料集列表
          </Link>
        </div>
      </section>
    );
  }

  const key = `${dataset.id}?${params.toString()}`;
  const count = parseCount(params.get('count'));
  return dataset.category === 'vocabulary' ? (
    <VocabQuiz key={key} dataset={dataset} params={params} count={count} />
  ) : (
    <GrammarQuiz key={key} dataset={dataset} params={params} count={count} />
  );
}

interface QuizProps<D> {
  dataset: D;
  params: URLSearchParams;
  count: number;
}

function VocabQuiz({ dataset, params, count }: QuizProps<VocabDataset>) {
  const direction = parseDirection(params.get('dir'));
  const { vocabScript, showExplanation } = useSettings();

  const config = useMemo<QuizConfig<VocabCard>>(() => {
    // 干擾選項：同資料集 → 同等級 → 其他等級
    const [sameLevel, otherLevels] = relatedDatasets(dataset);
    const tiers = [dataset.data, sameLevel.flatMap((d) => d.data), otherLevels.flatMap((d) => d.data)];
    return {
      buildCards: () => buildVocabCards(dataset.id, dataset.data, direction),
      answerOf: (c) => vocabAnswer(c.item, c.direction),
      distractorsOf: (c) =>
        tieredPool(
          vocabAnswer(c.item, c.direction),
          tiers.map((items) => items.filter((i) => i.id !== c.item.id).map((i) => vocabAnswer(i, c.direction))),
        ),
      renderFace: (card, side, hint, onSpeak) => (
        <VocabCardFace
          card={card}
          side={side}
          script={vocabScript}
          showExplanation={showExplanation}
          onSpeak={onSpeak}
          hint={hint}
        />
      ),
      promptText: (c) =>
        c.direction === 'zh-jp' ? c.item.simple_chinese : vocabScript === 'hiragana' ? c.item.hiragana : c.item.japanese,
      speechText: (c) => speechText(c.item),
      frontIsJapanese: (c) => c.direction === 'jp-zh',
    };
  }, [dataset, direction, vocabScript, showExplanation]);

  return <QuizSession config={config} count={count} deckName={dataset.name} deckLink={`/deck/${dataset.id}`} />;
}

/** 錯題回顧用：填空題把文法部分換成底線 */
function clozeText(sentence: string): string {
  return parseSentence(sentence)
    .map((s) => (s.target ? '＿＿＿' : s.text))
    .join('');
}

function GrammarQuiz({ dataset, params, count }: QuizProps<GrammarDataset>) {
  const modes = parseGrammarModes(params.get('modes'));
  const modesKey = modes.join(',');
  const showExplanation = useSettings((s) => s.showExplanation);

  const config = useMemo<QuizConfig<GrammarCard>>(
    () => {
      const [sameLevel, otherLevels] = relatedDatasets(dataset);
      const tiers = [dataset.data, sameLevel.flatMap((d) => d.data), otherLevels.flatMap((d) => d.data)];
      return {
        buildCards: () => buildGrammarCards(dataset.id, dataset.data, modes),
        answerOf: grammarAnswer,
        distractorsOf: (c) => tieredPool(grammarAnswer(c), tiers.map((items) => grammarDistractors(c, items))),
        renderFace: (card, side, hint, onSpeak) => (
          <GrammarCardFace card={card} side={side} showExplanation={showExplanation} onSpeak={onSpeak} hint={hint} />
        ),
        promptText: (c) => {
          if (c.mode === 'g-zh') return c.item.japanese;
          if (c.mode === 'zh-g') return c.item.simple_chinese;
          if (c.mode === 'cloze' && c.example) return `${clozeText(c.example.sentence)}（${c.example.chinese}）`;
          return c.example ? plainSentence(c.example.sentence) : c.item.japanese;
        },
        speechText: grammarSpeechText,
        frontIsJapanese: grammarFrontIsJapanese,
      };
    },
    // modes 每次 render 都是新陣列，用字串 modesKey 當依賴
    [dataset, modesKey, showExplanation],
  );

  return <QuizSession config={config} count={count} deckName={dataset.name} deckLink={`/deck/${dataset.id}`} />;
}
