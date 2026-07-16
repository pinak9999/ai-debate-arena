'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

// 🔥 FIX: 'judge' को SpeakerType में ऐड कर दिया गया है
export type SpeakerType = 'proponent' | 'opponent' | 'judge';

interface QueueItem {
  text: string;
  pitch: number;
  resolve: () => void;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const queueRef = useRef<QueueItem[]>([]);
  const isMutedRef = useRef(false);
  const processingRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  // 🔧 Chrome garbage-collects the utterance mid-speech if there's no
  // strong reference kept outside the closure — this ref prevents that.
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // 🔧 Chrome bug: utterances longer than ~15s silently stop.
  // A periodic pause/resume "kick" keeps it alive.
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const v = window.speechSynthesis.getVoices();
    if (v.length) voicesRef.current = v;
  }, []);

  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    const item = queueRef.current.shift();
    if (!item) return;

    processingRef.current = true;

    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.pitch = item.pitch;
    utterance.rate = 1;

    const voices = voicesRef.current.length
      ? voicesRef.current
      : window.speechSynthesis.getVoices();

    const hindiVoice =
      voices.find((v) => v.lang === 'hi-IN') ||
      voices.find((v) => v.lang.startsWith('hi'));

    if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
    } else {
      // ⚠️ No Hindi voice installed on this system.
      console.warn(
        '[useSpeech] No hi-IN voice found on this system. ' +
        'Falling back to default voice. Install a Hindi voice via ' +
        'Windows Settings > Time & Language > Speech > Add voices.'
      );
    }

    currentUtteranceRef.current = utterance;

    const clearResumeHack = () => {
      if (resumeIntervalRef.current) {
        clearInterval(resumeIntervalRef.current);
        resumeIntervalRef.current = null;
      }
    };

    const finish = () => {
      clearResumeHack();
      currentUtteranceRef.current = null;
      setIsSpeaking(false);
      processingRef.current = false;
      item.resolve();
      processQueue();
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      // Chrome long-utterance keep-alive hack
      resumeIntervalRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    };
    utterance.onend = finish;
    utterance.onerror = (e) => {
      console.error('[useSpeech] SpeechSynthesis error:', e.error);
      finish();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    // 🔥 FIX: यहाँ SpeakerType का इस्तेमाल किया गया है
    (text: string, speaker?: SpeakerType): Promise<void> => {
      if (isMutedRef.current || !text?.trim()) return Promise.resolve();
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn('[useSpeech] speechSynthesis not supported in this browser.');
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        queueRef.current.push({
          text,
          // 🔥 FIX: Judge के लिए अलग न्यूट्रल आवाज़ (Pitch 1.0)
          pitch: speaker === 'opponent' ? 0.85 : speaker === 'judge' ? 1.0 : 1.15,
          resolve,
        });
        processQueue();
      });
    },
    [processQueue]
  );

  // 🛑 AI को तुरंत चुप कराने के लिए (Interrupt)
  const stop = useCallback(() => {
    queueRef.current.forEach((item) => item.resolve());
    queueRef.current = [];
    processingRef.current = false;
    currentUtteranceRef.current = null;
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // ग्लोबल स्टॉप
    }
    setIsSpeaking(false);
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      // Debug: log what's actually available on this machine
      setTimeout(() => {
        const list = window.speechSynthesis.getVoices();
        console.log(
          `[useSpeech] ${list.length} voices available:`,
          list.map((v) => `${v.name} (${v.lang})`)
        );
        if (!list.some((v) => v.lang.startsWith('hi'))) {
          console.warn(
            '[useSpeech] ⚠️ No Hindi voice installed — install one from ' +
            'Windows Settings > Time & Language > Speech > Add voices > Hindi.'
          );
        }
      }, 500);
    } else {
      console.warn('[useSpeech] window.speechSynthesis not available.');
    }
    return () => stop();
  }, [stop, loadVoices]);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}