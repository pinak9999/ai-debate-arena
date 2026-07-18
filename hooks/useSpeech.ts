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

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const item = queueRef.current.shift();
    
    if (!item) {
      setIsSpeaking(false);
      return;
    }

    processingRef.current = true;
    setIsSpeaking(true);

    try {
      // 1. Backend से ElevenLabs का Audio Fetch करें
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, speaker: item.speaker }),
      });

      if (!res.ok) throw new Error('Failed to fetch audio from TTS API');

      // 2. Audio को Blob में कन्वर्ट करके URL बनाएँ
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      // 3. Audio खत्म होने पर अगला टर्न चलाएँ
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl); // Memory clean up
        currentAudioRef.current = null;
        processingRef.current = false;
        item.resolve();
        processQueue(); // Queue का अगला आइटम चेक करें
      };

      audio.onerror = (e) => {
        console.error('Audio Playback Error:', e);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        processingRef.current = false;
        item.resolve();
        processQueue();
      };

      // 4. अगर म्यूट नहीं है तो प्ले करें
      if (!isMuted) {
        await audio.play();
      } else {
        // अगर म्यूट है, तो बिना प्ले किए तुरंत रिज़ॉल्व कर दें
        audio.onended(new Event('ended'));
      }

    } catch (error) {
      console.error('TTS Processing Error:', error);
      processingRef.current = false;
      item.resolve();
      processQueue();
    }
  }, [isMuted]);

  const speak = useCallback((text: string, speaker: SpeakerType = 'proponent'): Promise<void> => {
    return new Promise((resolve) => {
      if (isMuted || !text.trim()) {
        resolve();
        return;
      }
      queueRef.current.push({ text, speaker, resolve });
      processQueue();
    });
  }, [processQueue, isMuted]);

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    queueRef.current = [];
    processingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMutedState = !prev;
      if (newMutedState && currentAudioRef.current) {
        // म्यूट करते ही करंट ऑडियो रोक दें
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        queueRef.current = [];
        processingRef.current = false;
        setIsSpeaking(false);
      }
      return newMutedState;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}