import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '../store/settings';
import { japaneseVoices, pickVoice } from './voices';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

const loadVoices = () => (supported ? japaneseVoices(window.speechSynthesis.getVoices()) : []);

/** 日文語音朗讀；裝置沒有日文語音時 available 為 false */
export function useSpeech() {
  const rate = useSettings((s) => s.speechRate);
  const voiceURI = useSettings((s) => s.voiceURI);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(loadVoices);
  const voice = pickVoice(voices, voiceURI);

  useEffect(() => {
    if (!supported) return;
    // 部分瀏覽器的語音清單是非同步載入
    const update = () => setVoices(loadVoices());
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
      // Web Speech API 的音量上限就是 1
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    },
    [voice, rate],
  );

  return { available: voice !== null, speak, voices, voice };
}
