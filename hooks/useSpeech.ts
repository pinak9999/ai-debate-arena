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
  
  // 🔥 FIX 1: Chrome Garbage Collection Bug से बचने के लिए Utterance का Ref बनाना ज़रूरी है
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // टेक्स्ट को छोटे टुकड़ों में तोड़ना ताकि ब्राउज़र क्रैश न हो
  const splitTextIntoChunks = (str: string) => {
    if (!str) return [];
    // 🔥 FIX 2: बेहतर Regex जो हर स्थिति में टेक्स्ट को सही से काटेगा
    const chunks = str.match(/[^।!?.\n]+[।!?.\n]*/g) || [str];
    return chunks.map(c => c.trim()).filter(c => c.length > 0);
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

    const chunks = splitTextIntoChunks(item.text);
    let currentChunk = 0;

    // 🔥 FIX 3: Cancel को सिर्फ नई आवाज़ शुरू होने पर कॉल करें, हर चंक के अंदर नहीं
    window.speechSynthesis.cancel(); 

    const speakNext = () => {
      if (currentChunk >= chunks.length || isMuted) {
        setIsSpeaking(false);
        processingRef.current = false;
        item.resolve(); // ऑडियो खत्म होने पर ही resolve होगा
        processQueue();
        return;
      }

      const textToSpeak = chunks[currentChunk];
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      currentUtteranceRef.current = utterance; // इसे Ref में सेव करें
      utterance.lang = 'hi-IN';
      
      // आवाज़ का लहज़ा (Pitch)
      utterance.pitch = item.speaker === 'opponent' ? 0.8 : item.speaker === 'judge' ? 0.9 : 1.1;
      utterance.rate = 1.0;

      utterance.onend = () => {
        currentChunk++;
        speakNext();
      };

      // 🔥 FIX 4: अगर किसी एक चंक में कोई Error आए, तो डिबेट न अटके
      utterance.onerror = (e) => {
        console.warn("Speech Synthesis Error:", e);
        currentChunk++;
        speakNext();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  }, [isMuted]);

  const speak = useCallback((text: string, speaker: SpeakerType = 'proponent'): Promise<void> => {
    return new Promise((resolve) => {
      // अगर म्यूट है या टेक्स्ट खाली है, तो तुरंत रिज़ॉल्व कर दें
      if (isMuted || !text) {
         resolve();
         return;
      }
      queueRef.current.push({ text, speaker, resolve });
      processQueue();
    });
  }, [processQueue, isMuted]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    queueRef.current = [];
    processingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        window.speechSynthesis.cancel();
        queueRef.current = [];
        processingRef.current = false;
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}