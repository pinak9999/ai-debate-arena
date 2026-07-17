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
  const playTokenRef = useRef(0);

  // 🔥 FIX 1: Voices को पेज लोड होते ही प्रीलोड कर लो।
  // Chrome में अगर voices load होने से पहले speak() कॉल हो जाए,
  // तो utterance बिना किसी error के चुपचाप गायब हो जाता है।
  const voicesReadyRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) voicesReadyRef.current = true;
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // 🔥 FIX 2: Chrome का एक और मशहूर बग — 15 सेकंड की चुप्पी के बाद
    // speechSynthesis खुद-ब-खुद "pause" हो जाता है। हर 10 सेकंड पर
    // resume() कॉल करते रहना इसे ज़िंदा रखता है।
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);

    return () => {
      clearInterval(keepAlive);
    };
  }, []);

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
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    const clearWatchdog = () => {
      if (watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
      }
    };

    const speakNextChunk = () => {
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

      utterance.onstart = () => {
        clearWatchdog();
      };

      utterance.onend = () => {
        clearWatchdog();
        if (myToken !== playTokenRef.current) return;
        currentChunk++;
        speakNextChunk();
      };

      utterance.onerror = () => {
        clearWatchdog();
        if (myToken !== playTokenRef.current) return;
        currentChunk++;
        speakNextChunk();
      };

      // 🔥 FIX 3: पुराने कोड में हर chunk से पहले cancel() कॉल होता था,
      // जो Chrome में नए utterance को "silently drop" कर देता है अगर
      // ठीक उसी वक़्त कुछ चल रहा हो। अब सिर्फ तभी cancel करेंगे जब सच में
      // कुछ बोल रहा हो, और उसके बाद थोड़ा ज़्यादा गैप देंगे।
      const doSpeak = () => {
        if (myToken !== playTokenRef.current) return;
        window.speechSynthesis.speak(utterance);

        // 🔥 FIX 4: Watchdog — अगर 4 सेकंड में onstart नहीं आया (यानी Chrome
        // ने चुपचाप drop कर दिया), तो जबरदस्ती अगले chunk पर बढ़ जाओ ताकि
        // पूरी debate कभी अटके नहीं।
        watchdog = setTimeout(() => {
          if (myToken !== playTokenRef.current) return;
          console.warn('[useSpeech] Chrome dropped utterance silently, skipping chunk');
          currentChunk++;
          speakNextChunk();
        }, 4000);
      };

      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        setTimeout(doSpeak, 120);
      } else {
        doSpeak();
      }
    };

    speakNextChunk();
  };

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const item = queueRef.current.shift();
    if (!item) return;

    processingRef.current = true;
    setIsSpeaking(true);

    playTokenRef.current += 1;
    const myToken = playTokenRef.current;

    let settled = false;
    const finishItem = () => {
      if (settled) return;
      settled = true;
      currentAudioRef.current = null;
      processingRef.current = false;
      setIsSpeaking(false);
      item.resolve();
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
        const errBody = await res.json().catch(() => ({}));
        console.warn(`[useSpeech] TTS API returned error for ${item.speaker}:`, errBody);
        throw new Error('ElevenLabs API Error or Quota Exceeded');
      }
      if (!res.ok) throw new Error(`TTS fetch failed with status ${res.status}`);

      const blob = await res.blob();
      if (blob.size === 0) throw new Error('Empty audio blob');

      if (myToken !== playTokenRef.current) return;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (myToken !== playTokenRef.current) return;
        finishItem();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (myToken !== playTokenRef.current) return;
        console.warn(`[useSpeech] Audio element error for ${item.speaker}, using fallback...`);
        fallbackToBrowserVoice(item.text, item.speaker, myToken, finishItem);
      };

      await audio.play();
    } catch (err) {
      if (myToken !== playTokenRef.current) return;
      console.warn(`[useSpeech] Falling back to Browser TTS for ${item.speaker}:`, err);
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

  const stop = useCallback(() => {
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