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
  
  // ElevenLabs के ऑडियो के लिए
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Native TTS (Fallback) के लिए
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

    // 🟢 Robust Native TTS Fallback Function (लंबे टेक्स्ट को टुकड़ों में तोड़ने के साथ)
    const playNativeTTS = () => {
      // टेक्स्ट को पूर्णविराम या प्रश्नचिह्न से तोड़ें
      const chunks = (item.text.match(/[^।!?.\n]+[।!?.\n]*/g) || [item.text])
                      .map(c => c.trim())
                      .filter(c => c.length > 0);
      
      let currentChunk = 0;
      window.speechSynthesis.cancel();

      const speakNext = () => {
        if (currentChunk >= chunks.length || isMuted) {
          processingRef.current = false;
          item.resolve();
          processQueue(); // अगला टर्न चलाएं
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
        currentUtteranceRef.current = utterance; // Garbage Collection से बचाने के लिए
        utterance.lang = 'hi-IN';
        
        // आवाज़ का लहज़ा
        utterance.pitch = item.speaker === 'opponent' ? 0.8 : item.speaker === 'judge' ? 0.9 : 1.1;

        utterance.onend = () => {
          currentChunk++;
          speakNext();
        };
        
        utterance.onerror = (e) => {
          console.warn("Native TTS Error:", e);
          currentChunk++;
          speakNext();
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNext();
    };

    try {
      // 1. Backend से ElevenLabs API Call
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, speaker: item.speaker }),
      });

      // 🚨 अगर ElevenLabs का कोटा खत्म है (Payment Required) या सर्वर एरर है
      if (!res.ok) {
        console.warn('ElevenLabs API failed, switching to Native TTS...');
        playNativeTTS(); // Fallback ट्रिगर करें
        return;
      }

      // अगर API सक्सेस है तो ElevenLabs का ऑडियो प्ले करें
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
        playNativeTTS(); // प्लेबैक में दिक्कत आए तो भी Fallback चलाएं
      };

      if (!isMuted) {
        await audio.play();
      } else {
        audio.onended(new Event('ended'));
      }

    } catch (error) {
      console.error('TTS Fetch Error:', error);
      playNativeTTS(); // नेटवर्क फेल होने पर भी Fallback चलेगा
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) currentAudioRef.current.pause();
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}