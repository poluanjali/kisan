// Speech synthesis and studio audio playback utility for Indian regional languages
// Provides crystal-clear native pronunciation via Google Regional Voice / Gemini Studio TTS
// with graceful offline Web Speech fallback.

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  lang: string;
  name: string;
}

let activeAudioElement: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeSessionId = 0;

// Client-side cache to make replay instantaneous and prevent repeated network requests
const audioMemoryCache = new Map<string, string>();

// Stop all active audio playback (both HTML5 Audio elements and Web Speech Synthesis)
export function stopSpeech(): void {
  activeSessionId++;

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch (_) {}
    activeAudioElement = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
    activeUtterance = null;
  }
}

export const stopSpeaking = stopSpeech;

// Check if browser has an installed voice for the specified language
export function hasNativeVoiceForLanguage(langCode: string): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) return false;

  const langPrefix = langCode.toLowerCase().split('-')[0];
  return voices.some((v) => {
    const l = v.lang.toLowerCase();
    return (
      l.startsWith(langPrefix) ||
      (langPrefix === 'hi' && (v.name.toLowerCase().includes('hindi') || l.includes('hi'))) ||
      (langPrefix === 'te' && (v.name.toLowerCase().includes('telugu') || l.includes('te'))) ||
      (langPrefix === 'ta' && (v.name.toLowerCase().includes('tamil') || l.includes('ta'))) ||
      (langPrefix === 'mr' && (v.name.toLowerCase().includes('marathi') || l.includes('mr'))) ||
      (langPrefix === 'kn' && (v.name.toLowerCase().includes('kannada') || l.includes('kn')))
    );
  });
}

// Locate the most authentic native device voice for the given language
export function getBestVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const langPrefix = langCode.toLowerCase().split('-')[0];

  // 1. Exact match like hi-IN, te-IN, ta-IN
  const exactMatch = voices.find(
    (v) =>
      v.lang.toLowerCase() === `${langPrefix}-in` ||
      v.lang.toLowerCase().replace('_', '-') === `${langPrefix}-in`
  );
  if (exactMatch) return exactMatch;

  // 2. Prefix match like hi, te, ta, kn, mr, bn, gu, pa, ml
  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
  if (prefixMatch) return prefixMatch;

  // 3. Match by regional name in voice label
  const nameMap: Record<string, string[]> = {
    hi: ['hindi', 'हिन्दी', 'heera', 'ravi', 'kalpana', 'swara', 'madhur'],
    te: ['telugu', 'తెలుగు', 'mohan', 'shruti', 'chitra'],
    ta: ['tamil', 'தமிழ்', 'valluvar', 'pallavi', 'ananya'],
    kn: ['kannada', 'ಕನ್ನಡ', 'gagan', 'sapna'],
    mr: ['marathi', 'मराठी', 'aarohi', 'manohar'],
    bn: ['bengali', 'বাংলা', 'bashkar', 'tanishaa'],
    gu: ['gujarati', 'ગુજરાતી', 'niranjan', 'dhwani'],
    pa: ['punjabi', 'ਪੰਜਾਬੀ', 'gurpreet'],
    ml: ['malayalam', 'മലയാളം', 'midhun', 'sobha'],
    en: ['indian', 'india', 'en-in', 'prabhat', 'neerja'],
  };

  const keywords = nameMap[langPrefix] || [];
  for (const kw of keywords) {
    const found = voices.find(
      (v) => v.name.toLowerCase().includes(kw) || v.lang.toLowerCase().includes(kw)
    );
    if (found) return found;
  }

  // 4. For Indian English
  if (langPrefix === 'en') {
    const enIn = voices.find(
      (v) => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')
    );
    if (enIn) return enIn;
  }

  return null;
}

// Default natural speech rate: 1.0x (100% natural, crisp, zero phase distortion)
export const DEFAULT_SPEECH_RATE = 1.0;

// Farmer speech text normalizer: strips symbols, cleans slashes, and expands technical terms
export function cleanSpeechForFarmer(text: string, langCode: string = 'hi'): string {
  if (!text) return '';
  let clean = text.trim();
  const langPrefix = langCode.toLowerCase().split('-')[0];

  // If text contains multiline or multi-item "English / Regional" format, extract target language clause per line
  const lines = clean.split('\n').map((l) => {
    let line = l.trim();
    if (line.includes(' / ') && !line.includes('km / h')) {
      const parts = line.split(' / ');
      line = (langPrefix !== 'en' ? parts[parts.length - 1] : parts[0]) || line;
    }
    return line;
  });
  clean = lines.join('. ');

  // Strip markdown styling (bold, italic, backticks, quotes)
  clean = clean.replace(/[*_#~`"']/g, '');

  // Strip bullet markers and list symbols
  clean = clean.replace(/^[•\-\*✓✕]\s*/gm, '');

  // Convert raw GPS coordinates to natural spoken regional phrasing
  clean = clean.replace(/Farm GPS\s*\([^)]+\)/gi, () => {
    if (langPrefix === 'te') return 'మీ పొలం ప్రాంతంలో';
    if (langPrefix === 'ta') return 'உங்கள் பண்ணை பகுதியில்';
    if (langPrefix === 'hi') return 'आपके खेत के क्षेत्र में';
    return 'in your farm area';
  });

  // Convert parenthetical text into smooth spoken pause
  clean = clean.replace(/\(([^)]+)\)/g, ', $1, ');

  // Strip colons following alert headers like "चेतावनी:", "హెచ్చరిక:", "Warning:"
  clean = clean.replace(/^(चेतावनी|सावधानी|सूचना|హెచ్చరిక|గమనిక|ఎచ్చரிக்கை|அறிவிப்பு|Warning|Advisory|Alert):\s*/gi, '$1, ');

  // Replace percentage with regional spoken word
  const percentMap: Record<string, string> = {
    hi: ' प्रतिशत ',
    te: ' శాతం ',
    ta: ' சதவீதம் ',
    kn: ' ಶೇಕಡಾ ',
    mr: ' टक्के ',
    bn: ' শতাংশ ',
    gu: ' ટકા ',
    pa: ' ਪ੍ਰਤੀਸ਼ਤ ',
    ml: ' ശതമാനം ',
    en: ' percent ',
  };
  const pWord = percentMap[langPrefix] || ' percent ';
  clean = clean.replace(/%/g, pWord);

  // Replace rupee symbols with spoken regional words
  const rupeeMap: Record<string, string> = {
    hi: ' रुपये ',
    te: ' రూపాయలు ',
    ta: ' ரூபாய் ',
    kn: ' ರೂಪಾಯಿಗಳು ',
    mr: ' रुपये ',
    bn: ' টাকা ',
    gu: ' રૂપિયા ',
    pa: ' ਰੁਪਏ ',
    ml: ' രൂപ ',
    en: ' Rupees ',
  };
  const rWord = rupeeMap[langPrefix] || ' Rupees ';
  clean = clean.replace(/(?:₹|Rs\.?|INR)/gi, rWord);

  // Replace speed & weather units for natural articulation
  if (langPrefix === 'te') {
    clean = clean.replace(/\b(?:km\/h|kmph|kmh)\b|\bకి\.?మీ\.?\b/gi, 'కిలోమీటర్ల వేగం');
    clean = clean.replace(/°C/gi, 'డిగ్రీల సెల్సియస్');
    clean = clean.replace(/\bmm\b/gi, 'మిల్లీమీటర్లు');
  } else if (langPrefix === 'ta') {
    clean = clean.replace(/\b(?:km\/h|kmph|kmh)\b|\bகி\.?மீ\.?\b/gi, 'கிலோமீட்டர் வேகம்');
    clean = clean.replace(/°C/gi, 'டிகிரி செல்சியஸ்');
    clean = clean.replace(/\bmm\b/gi, 'மில்லிமீட்டர்');
  } else if (langPrefix === 'hi') {
    clean = clean.replace(/\b(?:km\/h|kmph|kmh)\b|\bकि\.?मी\.?\b/gi, 'किलोमीटर प्रति घंटा');
    clean = clean.replace(/°C/gi, 'डिग्री सेल्सियस');
    clean = clean.replace(/\bmm\b/gi, 'मिलीमीटर');
  } else if (langPrefix === 'mr') {
    clean = clean.replace(/\b(?:km\/h|kmph|kmh)\b|\bकि\.?मी\.?\b/gi, 'किलोमीटर प्रति तास');
    clean = clean.replace(/°C/gi, 'अंश सेल्सियस');
    clean = clean.replace(/\bmm\b/gi, 'मिलीमीटर');
  } else if (langPrefix === 'en') {
    clean = clean.replace(/\b(?:km\/h|kmph|kmh)\b/gi, 'kilometers per hour');
    clean = clean.replace(/°C/gi, 'degrees Celsius');
    clean = clean.replace(/\bmm\b/gi, 'millimeters');
  } else {
    clean = clean.replace(/\b(?:km\/h|kmph|kmh)\b/gi, 'किलोमीटर प्रति घंटा');
    clean = clean.replace(/°C/gi, 'डिग्री सेल्सियस');
    clean = clean.replace(/\bmm\b/gi, 'मिलीमीटर');
  }

  // Replace remaining slashes with natural comma pause
  clean = clean.replace(/\s*\/\s*/g, ', ');

  // Clarify common agricultural formulation acronyms in regional dialects
  if (langPrefix === 'te') {
    clean = clean.replace(/\bWP\b/gi, 'పౌడర్ మందు');
    clean = clean.replace(/\bEC\b/gi, 'ద్రవ మందు');
    clean = clean.replace(/\bml\/L\b/gi, 'మిల్లీ లీటర్లు ప్రతి లీటరు నీటికి');
    clean = clean.replace(/\bg\/L\b/gi, 'గ్రాములు ప్రతి లీటరు నీటికి');
    clean = clean.replace(/\bkg\/acre\b/gi, 'కిలోలు ప్రతి ఎకరాకు');
    clean = clean.replace(/\bha\b/gi, 'హెక్టారు');
  } else if (langPrefix === 'ta') {
    clean = clean.replace(/\bWP\b/gi, 'தூள் மருந்து');
    clean = clean.replace(/\bEC\b/gi, 'திரவ மருந்து');
    clean = clean.replace(/\bml\/L\b/gi, 'மில்லிலிட்டர் ஒரு லிட்டர் தண்ணீருக்கு');
    clean = clean.replace(/\bg\/L\b/gi, 'கிராம் ஒரு லிட்டர் தண்ணீருக்கு');
    clean = clean.replace(/\bkg\/acre\b/gi, 'கிலோ ஒரு ஏக்கருக்கு');
  } else if (langPrefix === 'en') {
    clean = clean.replace(/\bWP\b/gi, 'wettable powder');
    clean = clean.replace(/\bEC\b/gi, 'liquid formulation');
    clean = clean.replace(/\bml\/L\b/gi, 'milliliters per liter of water');
    clean = clean.replace(/\bg\/L\b/gi, 'grams per liter of water');
    clean = clean.replace(/\bkg\/acre\b/gi, 'kilograms per acre');
  } else {
    clean = clean.replace(/\bWP\b/gi, 'घुलनशील पाउडर');
    clean = clean.replace(/\bEC\b/gi, 'तरल दवा');
    clean = clean.replace(/\bml\/L\b/gi, 'मिलीलीटर प्रति लीटर पानी में');
    clean = clean.replace(/\bg\/L\b/gi, 'ग्राम प्रति लीटर पानी में');
    clean = clean.replace(/\bkg\/acre\b/gi, 'किलो प्रति एकड़');
  }

  // Clarify time ranges like "6:30 - 10:00"
  if (langPrefix === 'te') {
    clean = clean.replace(/6:30\s*(?:-|నుండి|to)\s*10:00\s*(?:AM|గంటల?)/gi, 'ఉదయం ఆరున్నర నుండి పది గంటల');
  } else if (langPrefix === 'hi') {
    clean = clean.replace(/6:30\s*(?:-|से|to)\s*10:00\s*(?:AM|बजे)?/gi, 'सुबह छह बजकर तीस मिनट से दस बजे');
  } else if (langPrefix === 'ta') {
    clean = clean.replace(/6:30\s*(?:-|முதல்|to)\s*10:00\s*(?:AM|மணி)?/gi, 'காலை ஆறு முப்பது முதல் பத்து மணி');
  }

  // Strip excessive punctuation and ensure natural rhythmic pauses
  clean = clean.replace(/[|।]/g, '.');
  clean = clean.replace(/,+/g, ',');
  clean = clean.replace(/\.+/g, '. ');
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}

// Play audio data URI (MP3 or WAV) with calibrated, non-distorted playback speed
export function playWavAudio(
  audioDataUri: string,
  rate: number = DEFAULT_SPEECH_RATE,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): HTMLAudioElement {
  stopSpeech();

  const currentSession = activeSessionId;
  const audio = new Audio(audioDataUri);

  // Calibrate playbackRate: between 0.8x and 1.3x
  const safeRate = Math.max(0.8, Math.min(1.3, rate || DEFAULT_SPEECH_RATE));
  audio.playbackRate = safeRate;

  audio.onplay = () => {
    if (activeSessionId === currentSession && onStart) {
      onStart();
    }
  };

  audio.onended = () => {
    if (activeSessionId === currentSession) {
      activeAudioElement = null;
      if (onEnd) onEnd();
    }
  };

  audio.onerror = (e) => {
    if (activeSessionId === currentSession) {
      activeAudioElement = null;
      if (onError) onError(e);
    }
  };

  activeAudioElement = audio;
  audio.play().catch((err) => {
    if (activeSessionId === currentSession && onError) {
      onError(err);
    }
  });

  return audio;
}

export const playAudioUri = playWavAudio;

// Speak regional text with maximum phonetic clarity
// 1. Tries server-side native studio regional audio first (/api/synthesize-speech)
// 2. Caches audio in-memory for instant playback
// 3. Gracefully falls back to client Web Speech API if offline
export function speakRegionalText(
  text: string,
  langCode: string,
  rate = DEFAULT_SPEECH_RATE,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): { cancel: () => void } {
  stopSpeech();

  const currentSession = ++activeSessionId;
  const cleaned = cleanSpeechForFarmer(text, langCode);

  if (!cleaned) {
    if (onEnd) onEnd();
    return { cancel: () => {} };
  }

  const cacheKey = `${langCode.toLowerCase()}_${cleaned}`;
  const cachedAudio = audioMemoryCache.get(cacheKey);

  // If already in memory cache, play instantly!
  if (cachedAudio) {
    playWavAudio(cachedAudio, rate, onStart, onEnd, onError);
    return {
      cancel: () => {
        if (activeSessionId === currentSession) stopSpeech();
      },
    };
  }

  // Attempt server-side studio audio synthesis for crystal-clear native pronunciation
  let canceled = false;
  fetch('/api/synthesize-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: cleaned,
      languageCode: langCode,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (canceled || activeSessionId !== currentSession) return;

      if (data.success && data.audioData) {
        audioMemoryCache.set(cacheKey, data.audioData);
        playWavAudio(data.audioData, rate, onStart, onEnd, onError);
      } else {
        // Fallback to client-side device speech
        fallbackDeviceSpeech(cleaned, langCode, rate, currentSession, onStart, onEnd, onError);
      }
    })
    .catch((fetchErr) => {
      if (canceled || activeSessionId !== currentSession) return;
      console.warn('Studio voice fetch failed, falling back to device speech:', fetchErr);
      fallbackDeviceSpeech(cleaned, langCode, rate, currentSession, onStart, onEnd, onError);
    });

  return {
    cancel: () => {
      canceled = true;
      if (activeSessionId === currentSession) {
        stopSpeech();
      }
    },
  };
}

// Fallback to Web Speech API with native voice validation
function fallbackDeviceSpeech(
  cleanedText: string,
  langCode: string,
  rate: number,
  sessionId: number,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onError) onError(new Error('Speech synthesis not supported on this device.'));
    return;
  }

  if (activeSessionId !== sessionId) return;

  const langPrefix = langCode.toLowerCase().split('-')[0];
  const matchedVoice = getBestVoiceForLanguage(langCode);

  // If device has NO voice for this Indian language (common on devices without Indic packs),
  // do not speak unicode characters with an English voice (which sounds like garbled buzzing).
  let textToSpeak = cleanedText;
  let targetLang = langCode.includes('-') ? langCode : `${langCode}-IN`;

  if (!matchedVoice && langPrefix !== 'en') {
    // Announce a clean, clear message rather than unintelligible gibberish
    textToSpeak = `Kisan Mitra Advisory: ${cleanedText.replace(/[\u0900-\u0DFF]/g, '')}`;
    targetLang = 'en-IN';
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = targetLang;
  utterance.rate = Math.max(0.85, Math.min(1.05, rate || 0.95)); // Slower, crisp rate for device speech
  utterance.pitch = 1.0;

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => {
    if (activeSessionId === sessionId && onStart) {
      onStart();
    }
  };

  utterance.onend = () => {
    if (activeSessionId === sessionId) {
      activeUtterance = null;
      if (onEnd) onEnd();
    }
  };

  utterance.onerror = (e) => {
    if (activeSessionId === sessionId) {
      activeUtterance = null;
      if (onError) onError(e);
    }
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

// Convenience wrapper for speaking advisories with language object or code
export function speakAdvisory(
  text: string,
  lang: { code: string } | string,
  onEnd?: () => void,
  onStart?: () => void
): { cancel: () => void } {
  const langCode = typeof lang === 'string' ? lang : lang.code;
  return speakRegionalText(text, langCode, DEFAULT_SPEECH_RATE, onStart, onEnd);
}

