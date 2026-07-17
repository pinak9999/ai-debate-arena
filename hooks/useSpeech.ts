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

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const item = queueRef.current.shift();
    if (!item) return;

    processingRef.current = true;
    setIsSpeaking(true);

    try {
      // 🚀 Backend API को कॉल करें जहाँ से असली आवाज़ आएगी
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, speaker: item.speaker })
      });

      if (!res.ok) throw new Error('TTS fetch failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      // ऑडियो खत्म होने पर अगला प्रोसेस करें
      audio.onended = () => {
        URL.revokeObjectURL(url);
        finishItem();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        finishItem();
      };

      if (!isMutedRef.current) {
        await audio.play();
      } else {
        finishItem();
      }

    } catch (err) {
      console.error('[useSpeech] Error playing ElevenLabs audio:', err);
      finishItem();
    }

    function finishItem() {
      currentAudioRef.current = null;
      processingRef.current = false;
      setIsSpeaking(false);
      item.resolve();
      processQueue(); // कतार (Queue) में अगला मैसेज चेक करें
    }
  }, []);

  const speak = useCallback((text: string, speaker: SpeakerType = 'proponent'): Promise<void> => {
    if (isMutedRef.current || !text?.trim()) return Promise.resolve();

    return new Promise<void>((resolve) => {
      queueRef.current.push({ text, speaker, resolve });
      processQueue();
    });
  }, [processQueue]);

  // 🛑 AI को तुरंत चुप कराने के लिए (Interrupt)
  const stop = useCallback(() => {
    queueRef.current.forEach(item => item.resolve());
    queueRef.current = [];
    processingRef.current = false;
    setIsSpeaking(false);
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
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
    return () => stop(); // कंपोनेंट अनमाउंट होने पर ऑडियो रोकें
  }, [stop]);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}