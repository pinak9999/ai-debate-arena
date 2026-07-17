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

  // ─── SUPER FIX: टेक्स्ट को सुरक्षित टुकड़ों (Chunks) में तोड़ना ───
  const splitTextIntoChunks = (str: string, maxLength: number = 150) => {
    const result = [];
    let current = '';
    const words = str.split(' '); // शब्दों के आधार पर तोड़ें
    
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

  const fallbackToBrowserVoice = (text: string, speaker: SpeakerType, onEnd: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setTimeout(onEnd, 1000); 
      return;
    }

    // 🔥 Chrome क्रैश बग को रोकने के लिए स्मार्ट चंकिंग (150 अक्षरों की लिमिट)
    const chunks = splitTextIntoChunks(text, 150);
    let currentChunk = 0;

    const speakNextChunk = () => {
      if (currentChunk >= chunks.length || isMutedRef.current) {
        onEnd(); // सारे हिस्से खत्म होने पर ही अगली बारी आएगी!
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
      
      // हिंदी आवाज़ को खोजना
      const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('HI') || v.lang === 'hi-IN');
      if (hindiVoice) utterance.voice = hindiVoice;
      
      utterance.lang = 'hi-IN';
      utterance.pitch = speaker === 'opponent' ? 0.8 : speaker === 'judge' ? 0.9 : 1.1; 
      utterance.rate = 1.0;

      utterance.onend = () => {
        currentChunk++;
        speakNextChunk(); // एक वाक्य खत्म होने पर दूसरा शुरू
      };

      utterance.onerror = (e) => {
        console.warn("Browser TTS chunk error, skipping to next...", e);
        currentChunk++;
        speakNextChunk(); // एरर आने पर अटकेगा नहीं
      };

      // 🔥 Chrome Bug Fix: बोलने से पहले पुरानी आवाज़ को कैंसिल करना ज़रूरी है
      window.speechSynthesis.cancel();
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50); // छोटा सा डिले ताकि ब्राउज़र तैयार हो सके
    };

    speakNextChunk();
  };

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const item = queueRef.current.shift();
    if (!item) return;

    processingRef.current = true;
    setIsSpeaking(true);

    const finishItem = () => {
      currentAudioRef.current = null;
      processingRef.current = false;
      setIsSpeaking(false);
      item.resolve(); // 🔥 यह कॉल होने पर ही अगला एजेंट चालू होगा!
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
        body: JSON.stringify({ text: item.text, speaker: item.speaker })
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        throw new Error('ElevenLabs API Error or Quota Exceeded');
      }

      if (!res.ok) throw new Error('TTS fetch failed');

      const blob = await res.blob();
      if (blob.size === 0) throw new Error('Empty audio blob');

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        finishItem(); 
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        console.warn('Audio element error, using fallback...');
        fallbackToBrowserVoice(item.text, item.speaker, finishItem);
      };

      await audio.play();

    } catch (err) {
      console.warn('[useSpeech] Falling back to Browser TTS:', err);
      fallbackToBrowserVoice(item.text, item.speaker, finishItem);
    }
  }, []);

  const speak = useCallback((text: string, speaker: SpeakerType = 'proponent'): Promise<void> => {
    if (isMutedRef.current || !text?.trim()) return Promise.resolve();

    return new Promise<void>((resolve) => {
      queueRef.current.push({ text, speaker, resolve });
      processQueue();
    });
  }, [processQueue]);

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