'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

export type SpeakerType = 'proponent' | 'opponent' | 'judge';

interface QueueItem {
  text: string;
  speaker: SpeakerType;
  language: string;
  resolve: () => void;
}

// BCP-47 Language Codes for Native TTS
const getLangCode = (langName: string = 'Hindi') => {
  switch (langName.toLowerCase()) {
    case 'english':   return 'en-IN'; // or 'en-US'
    case 'gujarati':  return 'gu-IN';
    case 'marathi':   return 'mr-IN';
    case 'punjabi':   return 'pa-IN';
    case 'bengali':   return 'bn-IN';
    case 'tamil':     return 'ta-IN';
    case 'telugu':    return 'te-IN';
    case 'kannada':   return 'kn-IN';
    case 'malayalam': return 'ml-IN';
    case 'french':    return 'fr-FR';
    case 'spanish':   return 'es-ES';
    case 'german':    return 'de-DE';
    case 'japanese':  return 'ja-JP';
    case 'korean':    return 'ko-KR';
    case 'arabic':    return 'ar-SA';
    case 'hindi':
    default: return 'hi-IN';
  }
};

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const isMutedRef = useRef(isMuted);
  const queueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Timer to prevent Chrome TTS from stopping mid-speech
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const clearKeepAlive = () => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  };

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
      if (isMutedRef.current) {
        processingRef.current = false;
        item.resolve();
        processQueue();
        return;
      }

      // Read the complete text at once so the flow doesn't break
      const cleanText = item.text.replace(/[*#_`~[\]]/g, '').trim();
      window.speechSynthesis.cancel();
      clearKeepAlive();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      currentUtteranceRef.current = utterance;

      const targetLangCode = getLangCode(item.language);
      utterance.lang = targetLangCode;

      utterance.pitch = 1.0;
      utterance.rate = 1.0;

      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.lang === targetLangCode);

        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.includes(targetLangCode.split('-')[0]));
        }

        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onstart = () => {
          keepAliveIntervalRef.current = setInterval(() => {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }, 10000);
        };

        utterance.onend = () => {
          clearKeepAlive();
          processingRef.current = false;
          item.resolve();
          processQueue();
        };

        utterance.onerror = (e) => {
          clearKeepAlive();
          if (e.error !== 'canceled') {
            console.warn(`Native TTS Error:`, e);
          }
          processingRef.current = false;
          item.resolve();
          processQueue();
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

    // 🔥 ELEVENLABS MULTILINGUAL V2 SUPPORTED LANGUAGES
    // These are the 29 languages perfectly supported by ElevenLabs
    const elevenLabsSupported = [
      'english', 'japanese', 'chinese', 'german', 'hindi', 'french', 
      'korean', 'portuguese', 'italian', 'spanish', 'indonesian', 
      'dutch', 'turkish', 'filipino', 'polish', 'swedish', 'bulgarian', 
      'romanian', 'arabic', 'czech', 'greek', 'finnish', 'croatian', 
      'malay', 'slovak', 'danish', 'tamil', 'ukrainian', 'russian'
    ];

    const isSupportedByElevenLabs = elevenLabsSupported.includes(item.language.toLowerCase());

    if (!isSupportedByElevenLabs) {
      // If the language is not in the list (e.g., Punjabi, Marathi, Bengali), route directly to Native TTS
      console.log(`ElevenLabs doesn't perfectly support ${item.language}, routing to Native TTS...`);
      playNativeTTS();
      return;
    }

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
        throw new Error('ElevenLabs API Failed');
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
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        playNativeTTS();
      };

      if (!isMutedRef.current) {
        await audio.play();
      } else {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        processingRef.current = false;
        item.resolve();
        processQueue();
      }
    } catch (error) {
      console.warn('Fallback to Native TTS due to API error:', error);
      playNativeTTS();
    }
  }, []);

  const speak = useCallback((text: string, speaker: SpeakerType = 'proponent', language: string = 'Hindi'): Promise<void> => {
    return new Promise((resolve) => {
      if (isMutedRef.current || !text.trim()) {
        resolve();
        return;
      }
      queueRef.current.push({ text, speaker, language, resolve });
      processQueue();
    });
  }, [processQueue]);

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    clearKeepAlive();
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
        clearKeepAlive();
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
      clearKeepAlive();
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}