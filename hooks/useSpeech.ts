'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

export type SpeakerType = 'proponent' | 'opponent' | 'judge';

interface QueueItem {
  text: string;
  speaker: SpeakerType;
  resolve: () => void;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const queueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);

  // 🔥 FIX: हर नए item को एक यूनीक टोकन मिलेगा।
  // पुराने (stale) audio/utterance का कोई भी late event (onerror/onend)
  // इस टोकन के मैच न होने पर पूरी तरह IGNORE हो जाएगा।
  const playTokenRef = useRef(0);

  // ─── टेक्स्ट को सुरक्षित टुकड़ों (Chunks) में तोड़ना (सिर्फ Browser Fallback Voice के लिए) ───
  const splitTextIntoChunks = (str: string, maxLength: number = 150) => {
    const result: string[] = [];
    let current = '';
    const words = str.split(' ');

    for (const word of words) {
      if ((current + word).length > maxLength) {
        result.push(current.trim());
        current = word + ' ';
      } else {
        current += word + ' ';
      }
    }
    if (current.trim()) result.push(current.trim());
    return result;
  };

  const fallbackToBrowserVoice = (
    text: string,
    speaker: SpeakerType,
    myToken: number,
    onEnd: () => void
  ) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setTimeout(onEnd, 800);
      return;
    }

    const chunks = splitTextIntoChunks(text, 150);
    let currentChunk = 0;

    const speakNextChunk = () => {
      // 🔥 अगर इस बीच कोई नया item queue में आ गया है (टोकन बदल गया), तो यह पुराना
      // प्लेबैक तुरंत रुक जाएगा और दोबारा finishItem को कॉल नहीं करेगा।
      if (myToken !== playTokenRef.current) return;

      if (currentChunk >= chunks.length || isMutedRef.current) {
        onEnd();
        return;
      }

      const chunkText = chunks[currentChunk];
      if (!chunkText) {
        currentChunk++;
        speakNextChunk();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunkText);
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find((v) => v.lang.toLowerCase().includes('hi'));
      if (hindiVoice) utterance.voice = hindiVoice;

      utterance.lang = 'hi-IN';
      utterance.pitch = speaker === 'opponent' ? 0.8 : speaker === 'judge' ? 0.9 : 1.1;
      utterance.rate = 1.0;

      utterance.onend = () => {
        if (myToken !== playTokenRef.current) return; // stale — ignore
        currentChunk++;
        speakNextChunk();
      };

      utterance.onerror = () => {
        if (myToken !== playTokenRef.current) return; // stale — ignore
        currentChunk++;
        speakNextChunk();
      };

      window.speechSynthesis.cancel();
      setTimeout(() => {
        if (myToken !== playTokenRef.current) return;
        window.speechSynthesis.speak(utterance);
      }, 50);
    };

    speakNextChunk();
  };

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const item = queueRef.current.shift();
    if (!item) return;

    processingRef.current = true;
    setIsSpeaking(true);

    // 🔥 इस item के लिए नया यूनीक टोकन जनरेट करो
    playTokenRef.current += 1;
    const myToken = playTokenRef.current;

    // 🔥 FIX (सबसे ज़रूरी): finishItem सिर्फ एक बार ही चलेगा,
    // चाहे onended, onerror, या fallback — कोई भी उसे कितनी भी बार क्यों न बुलाए।
    let settled = false;
    const finishItem = () => {
      if (settled) return;
      settled = true;
      currentAudioRef.current = null;
      processingRef.current = false;
      setIsSpeaking(false);
      item.resolve(); // तभी अगला स्पीकर शुरू होगा
      processQueue();
    };

    if (isMutedRef.current) {
      finishItem();
      return;
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, speaker: item.speaker }),
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        throw new Error('ElevenLabs API Error or Quota Exceeded');
      }
      if (!res.ok) throw new Error('TTS fetch failed');

      const blob = await res.blob();
      if (blob.size === 0) throw new Error('Empty audio blob');

      // 🔥 अगर इस बीच queue रीसेट/नया item आ गया है, तो यह पुराना ऑडियो बजाना ही नहीं
      if (myToken !== playTokenRef.current) return;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (myToken !== playTokenRef.current) return; // stale event — ignore
        finishItem();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (myToken !== playTokenRef.current) return; // stale event — ignore
        console.warn('Audio element error, using fallback...');
        fallbackToBrowserVoice(item.text, item.speaker, myToken, finishItem);
      };

      await audio.play();
      // ⚠️ ध्यान दें: audio.play() सिर्फ तभी resolve होता है जब playback SHURU होता है,
      // यह audio खत्म होने का इंतज़ार नहीं करता। असली "खत्म होने" का सिग्नल
      // ऊपर वाला audio.onended ही है — इसलिए यहाँ कुछ भी extra नहीं करना।
    } catch (err) {
      if (myToken !== playTokenRef.current) return; // stale — ignore
      console.warn('[useSpeech] Falling back to Browser TTS:', err);
      fallbackToBrowserVoice(item.text, item.speaker, myToken, finishItem);
    }
  }, []);

  const speak = useCallback(
    (text: string, speaker: SpeakerType = 'proponent'): Promise<void> => {
      if (isMutedRef.current || !text?.trim()) return Promise.resolve();

      return new Promise<void>((resolve) => {
        queueRef.current.push({ text, speaker, resolve });
        processQueue();
      });
    },
    [processQueue]
  );

  // 🛑 AI को तुरंत चुप कराने के लिए (Interrupt / Reset)
  const stop = useCallback(() => {
    // टोकन बढ़ा दो ताकि किसी भी चल रहे audio/utterance के late events ignore हो जाएँ
    playTokenRef.current += 1;

    queueRef.current.forEach((item) => item.resolve());
    queueRef.current = [];
    processingRef.current = false;
    setIsSpeaking(false);

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) stop();
      return next;
    });
  }, [stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}