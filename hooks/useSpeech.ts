'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

export type SpeakerType = 'proponent' | 'opponent' | 'judge';

interface QueueItem {
  text: string;
  speaker: SpeakerType;
  language: string;
  resolve: () => void;
}

// FIX: पहले सिर्फ 5 भाषाएँ mapped थीं (Hindi/English/Gujarati/Marathi/Punjabi),
// बाकी सब (Bengali, Tamil, Telugu, Kannada, Malayalam) default में जाकर
// चुपचाप hi-IN बन जाती थीं। अब सभी 10 सपोर्टेड भाषाओं के सही BCP-47 codes हैं।
const getLangCode = (langName: string = 'Hindi') => {
  switch (langName.toLowerCase()) {
    case 'english':   return 'en-IN';
    case 'gujarati':  return 'gu-IN';
    case 'marathi':   return 'mr-IN';
    case 'punjabi':   return 'pa-IN';
    case 'bengali':   return 'bn-IN';
    case 'tamil':     return 'ta-IN';
    case 'telugu':    return 'te-IN';
    case 'kannada':   return 'kn-IN';
    case 'malayalam': return 'ml-IN';
    case 'hindi':
    default: return 'hi-IN';
  }
};

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const queueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const item = queueRef.current.shift();

    if (!item) {
      setIsSpeaking(false);
      return;
    }

    processingRef.current = true;
    setIsSpeaking(true);

    const playNativeTTS = () => {
      const cleanText = item.text.replace(/[*#_`~[\]]/g, '').trim();

      const chunks = (cleanText.match(/[^।!?.\n]+[।!?.\n]*/g) || [cleanText])
        .map(c => c.trim())
        .filter(c => c.length > 0);

      let currentChunk = 0;
      window.speechSynthesis.cancel();

      const speakNext = () => {
        if (currentChunk >= chunks.length || isMuted) {
          processingRef.current = false;
          item.resolve();
          processQueue();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
        currentUtteranceRef.current = utterance;

        const targetLangCode = getLangCode(item.language);
        utterance.lang = targetLangCode;

        utterance.pitch = item.speaker === 'opponent' ? 0.8 : item.speaker === 'judge' ? 0.9 : 1.1;

        const setVoiceAndSpeak = () => {
          const voices = window.speechSynthesis.getVoices();

          let selectedVoice = voices.find(v => v.lang === targetLangCode);
          if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes(targetLangCode.split('-')[0]));
          }

          if (selectedVoice) {
            utterance.voice = selectedVoice;
          } else {
            // FIX: अगर device पर उस भाषा की voice ही install नहीं है (जैसे Kannada/Malayalam
            // अक्सर Windows/Chrome पर missing होती हैं), तो पुरानी code silently गलत भाषा में
            // बोल देता था। अब console warning देंगे ताकि debugging आसान हो — TTS फिर भी
            // चलेगी (browser अपनी default voice से try करेगा) बजाय हैंग होने के।
            console.warn(`No native voice found for lang "${targetLangCode}". Falling back to browser default voice.`);
          }

          utterance.onend = () => {
            currentChunk++;
            speakNext();
          };

          utterance.onerror = (e) => {
            console.warn(`Native TTS Error on chunk ${currentChunk}:`, e);
            currentChunk++;
            speakNext();
          };

          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            setVoiceAndSpeak();
            window.speechSynthesis.onvoiceschanged = null;
          };
        } else {
          setVoiceAndSpeak();
        }
      };

      speakNext();
    };

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.text,
          speaker: item.speaker,
          language: item.language,
        }),
      });

      if (!res.ok) {
        console.warn('ElevenLabs API failed, switching to Native TTS...');
        playNativeTTS();
        return;
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        processingRef.current = false;
        item.resolve();
        processQueue();
      };

      audio.onerror = () => {
        console.warn('Audio play error, switching to Native TTS...');
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        playNativeTTS();
      };

      if (!isMuted) {
        await audio.play();
      } else {
        // FIX: पहले यहाँ `audio.onended(new Event('ended'))` लिखा था — ये गलत तरीका है,
        // event handler को function की तरह call नहीं करते और इससे runtime error/silent
        // hang हो सकता था जब muted state में queue आगे ही नहीं बढ़ती थी। अब सीधा resolve करके
        // queue आगे बढ़ा रहे हैं जैसे बाकी जगह होता है।
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        processingRef.current = false;
        item.resolve();
        processQueue();
      }

    } catch (error) {
      console.error('TTS Fetch Error:', error);
      playNativeTTS();
    }
  }, [isMuted]);

  const speak = useCallback((text: string, speaker: SpeakerType = 'proponent', language: string = 'Hindi'): Promise<void> => {
    return new Promise((resolve) => {
      if (isMuted || !text.trim()) {
        resolve();
        return;
      }
      queueRef.current.push({ text, speaker, language, resolve });
      processQueue();
    });
  }, [processQueue, isMuted]);

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    queueRef.current = [];
    processingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMutedState = !prev;
      if (newMutedState) {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
        }
        window.speechSynthesis.cancel();
        queueRef.current = [];
        processingRef.current = false;
        setIsSpeaking(false);
      }
      return newMutedState;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) currentAudioRef.current.pause();
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}