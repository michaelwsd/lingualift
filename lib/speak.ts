let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceLoaded = false;

function getAustralianVoice(): SpeechSynthesisVoice | null {
  if (voiceLoaded) return cachedVoice;

  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  voiceLoaded = true;

  // Prefer Australian male voices
  const auVoices = voices.filter(v => v.lang === 'en-AU' || v.lang.startsWith('en-AU'));
  const male = auVoices.find(v => /male|james|daniel|lee/i.test(v.name));
  cachedVoice = male || auVoices[0] || null;
  return cachedVoice;
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return;

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-AU';
  utterance.rate = 0.9;

  const voice = getAustralianVoice();
  if (voice) {
    utterance.voice = voice;
  }

  // Voices may load asynchronously on first call
  if (!voiceLoaded) {
    speechSynthesis.onvoiceschanged = () => {
      voiceLoaded = false;
      cachedVoice = null;
      const v = getAustralianVoice();
      if (v) utterance.voice = v;
      speechSynthesis.speak(utterance);
    };
    // Try speaking anyway in case voices are already loaded
    speechSynthesis.speak(utterance);
  } else {
    speechSynthesis.speak(utterance);
  }
}
