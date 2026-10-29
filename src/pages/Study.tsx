import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { findDataset } from '../data/loadDatasets';
import type { GrammarDataset, VocabDataset } from '../types/dataset';
import { buildVocabCards, buildVocabSession, parseDirection, speechText, type VocabCard } from '../study/vocabCards';
import {
  buildGrammarCards,
  buildGrammarSession,
  grammarFrontIsJapanese,
  grammarSpeechText,
  parseGrammarModes,
  type GrammarCard,
} from '../study/grammarCards';
import { useSettings } from '../store/settings';
import { StudySession, type StudyConfig, type StudyMode } from '../components/StudySession';
import { VocabCardFace } from '../components/VocabCardFace';
import { GrammarCardFace } from '../components/GrammarCardFace';
import { Segmented } from '../components/Segmented';
import { Cat } from '../components/Cat';
import styles from '../components/StudySession.module.css';

export function Study() {
  const id = useParams()['*'] ?? '';
  const dataset = findDataset(id);
  const [params] = useSearchParams();

  if (!dataset) {
    return (
      <div className={styles.message}>
        <Cat size={96} mood="confused" />
        <p>找不到這個學習集</p>
        <Link to="/" className="btn">
          回首頁
        </Link>
      </div>
    );
  }

  // 方向、模式改變（例如從複習切到自由練習）時重新建立學習佇列
  const key = `${dataset.id}?${params.toString()}`;
  const mode: StudyMode = params.get('mode') === 'free' ? 'free' : 'review';
  return dataset.category === 'vocabulary' ? (
    <VocabStudy key={key} dataset={dataset} params={params} mode={mode} />
  ) : (
    <GrammarStudy key={key} dataset={dataset} params={params} mode={mode} />
  );
}

interface StudyProps<D> {
  dataset: D;
  params: URLSearchParams;
  mode: StudyMode;
}

function VocabStudy({ dataset, params, mode }: StudyProps<VocabDataset>) {
  const direction = parseDirection(params.get('dir'));
  const { vocabScript, setVocabScript, showExplanation } = useSettings();

  const config = useMemo<StudyConfig<VocabCard>>(
    () => ({
      buildCards: () => buildVocabCards(dataset.id, dataset.data, direction),
      buildFreeSession: () => buildVocabSession(dataset.id, dataset.data, direction),
      groupOf: (c) => c.item.id,
      renderFace: (card, side, onSpeak) => (
        <VocabCardFace card={card} side={side} script={vocabScript} showExplanation={showExplanation} onSpeak={onSpeak} />
      ),
      speechText: (c) => speechText(c.item),
      frontIsJapanese: (c) => c.direction === 'jp-zh',
    }),
    [dataset, direction, vocabScript, showExplanation],
  );

  return (
    <StudySession
      config={config}
      mode={mode}
      deckName={dataset.name}
      deckLink={`/deck/${dataset.id}`}
      freeLink={`/study/${dataset.id}?dir=${direction}&mode=free`}
      toolbarExtra={
        direction !== 'zh-jp' && (
          <Segmented
            size="small"
            label="日文題面"
            options={[
              { value: 'kanji', label: '漢字' },
              { value: 'hiragana', label: 'かな' },
            ]}
            value={vocabScript}
            onChange={setVocabScript}
          />
        )
      }
    />
  );
}

function GrammarStudy({ dataset, params, mode }: StudyProps<GrammarDataset>) {
  const modes = parseGrammarModes(params.get('modes'));
  const modesKey = modes.join(',');
  const showExplanation = useSettings((s) => s.showExplanation);

  const config = useMemo<StudyConfig<GrammarCard>>(
    () => ({
      buildCards: () => buildGrammarCards(dataset.id, dataset.data, modes),
      buildFreeSession: () => buildGrammarSession(dataset.id, dataset.data, modes),
      groupOf: (c) => c.item.id,
      renderFace: (card, side, onSpeak) => (
        <GrammarCardFace card={card} side={side} showExplanation={showExplanation} onSpeak={onSpeak} />
      ),
      speechText: grammarSpeechText,
      frontIsJapanese: grammarFrontIsJapanese,
    }),
    // modes 每次 render 都是新陣列，用字串 modesKey 當依賴
    [dataset, modesKey, showExplanation],
  );

  return (
    <StudySession
      config={config}
      mode={mode}
      deckName={dataset.name}
      deckLink={`/deck/${dataset.id}`}
      freeLink={`/study/${dataset.id}?modes=${modesKey}&mode=free`}
    />
  );
}
