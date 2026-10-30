// 日文語音的挑選：神經網路語音的音調（高低重音）與音量明顯比舊式語音自然

/** 只需要 SpeechSynthesisVoice 的這幾個欄位，方便測試 */
export type VoiceInfo = Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'localService' | 'voiceURI'>;

export function isJapaneseVoice(v: VoiceInfo): boolean {
  return v.lang.replace('_', '-').toLowerCase().startsWith('ja');
}

/**
 * 語音品質分數（越高越好）：
 * Edge 的 Natural／Online 神經語音 > Chrome 的 Google 日本語 > Apple 的強化語音 > 其他。
 * Windows 內建的 Haruka、Ayumi、Ichiro、Sayaka 是舊式語音，音調平、音量小，排最後。
 */
export function voiceScore(v: VoiceInfo): number {
  const name = v.name.toLowerCase();
  if (name.includes('natural') || name.includes('online')) return 50;
  if (name.includes('google')) return 40;
  if (/enhanced|premium|siri|kyoko|o-ren|otoya|hattori/.test(name)) return 30;
  if (/haruka|ayumi|ichiro|sayaka/.test(name)) return 0;
  return 10;
}

/** 依品質排序的日文語音 */
export function japaneseVoices<V extends VoiceInfo>(voices: V[]): V[] {
  return voices.filter(isJapaneseVoice).sort((a, b) => voiceScore(b) - voiceScore(a));
}

/** 使用者指定的語音（找不到就自動選最好的） */
export function pickVoice<V extends VoiceInfo>(voices: V[], preferredURI: string): V | null {
  const ranked = japaneseVoices(voices);
  return ranked.find((v) => v.voiceURI === preferredURI) ?? ranked[0] ?? null;
}
