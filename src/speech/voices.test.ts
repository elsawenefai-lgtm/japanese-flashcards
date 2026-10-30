import { describe, expect, it } from 'vitest';
import { japaneseVoices, pickVoice, type VoiceInfo } from './voices';

const voice = (name: string, lang = 'ja-JP', localService = true): VoiceInfo => ({
  name,
  lang,
  localService,
  voiceURI: name,
});

const voices = [
  voice('Microsoft Haruka - Japanese (Japan)'),
  voice('Microsoft Zira - English (United States)', 'en-US'),
  voice('Google 日本語', 'ja-JP', false),
  voice('Microsoft Nanami Online (Natural) - Japanese (Japan)', 'ja-JP', false),
];

describe('japaneseVoices', () => {
  it('只留日文語音，神經語音優先、舊式語音最後', () => {
    expect(japaneseVoices(voices).map((v) => v.name)).toEqual([
      'Microsoft Nanami Online (Natural) - Japanese (Japan)',
      'Google 日本語',
      'Microsoft Haruka - Japanese (Japan)',
    ]);
  });

  it('接受 ja_JP 這種寫法', () => {
    expect(japaneseVoices([voice('Kyoko', 'ja_JP')])).toHaveLength(1);
  });
});

describe('pickVoice', () => {
  it('沒有指定時選品質最好的', () => {
    expect(pickVoice(voices, '')?.name).toContain('Nanami');
  });

  it('使用指定的語音', () => {
    expect(pickVoice(voices, 'Microsoft Haruka - Japanese (Japan)')?.name).toContain('Haruka');
  });

  it('指定的語音不存在（換了裝置）時自動選', () => {
    expect(pickVoice(voices, 'Kyoko')?.name).toContain('Nanami');
  });

  it('沒有日文語音時回傳 null', () => {
    expect(pickVoice([voices[1]], '')).toBeNull();
  });
});
