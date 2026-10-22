import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '../store/settings';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function findJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const japanese = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
  // 優先使用裝置內建（不需網路）的語音
  return japanese.find((v) => v.localService) ?? japanese[0] ?? null;
}

/** 日文語音朗讀；裝置沒有日文語音時 available 為 false */
export function useSpeech() {
  const rate = useSettings((s) => s.speechRate);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(() =>
    supported ? findJapaneseVoice() : null,
  );

  useEffect(() => {
    if (!supported) return;
    // 部分瀏覽器的語音清單是非同步載入
    const update = () => setVoice(findJapaneseVoice());
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!voice) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    },
    [voice, rate],
  );

  return { available: voice !== null, speak };
}
