'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

export type SpeakerType = 'proponent' | 'opponent' | 'judge';

interface QueueItem {
  text: string;
  speaker: SpeakerType;
  language: string; // 🔥 मल्टी-लैंग्वेज सपोर्ट के लिए
  resolve: () => void;
}

// ─── लैंग्वेज कोड मैपर ───
const getLangCode = (langName: string = 'Hindi') => {
  switch(langName.toLowerCase()) {
    case 'english': return 'en-IN'; // या 'en-US'
    case 'gujarati': return 'gu-IN';
    case 'marathi': return 'mr-IN';
    case 'punjabi': return 'pa-IN';
    case 'hindi':
    default: return 'hi-IN';
  }
};

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

    // 🟢 Robust Native TTS Fallback Function (Multi-Language)
    const playNativeTTS = () => {
      // 1. Markdown और स्पेशल कैरेक्टर्स को हटाएं ताकि ब्राउज़र की आवाज़ अटके नहीं
      const cleanText = item.text.replace(/[*#_`~[\]]/g, '').trim();

      // 2. टेक्स्ट को पूर्णविराम या प्रश्नचिह्न से छोटे हिस्सों में तोड़ें
      const chunks = (cleanText.match(/[^।!?.\n]+[।!?.\n]*/g) || [cleanText])
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
        
        // 🔥 डायनामिक लैंग्वेज सेट करें
        const targetLangCode = getLangCode(item.language);
        utterance.lang = targetLangCode;
        
        // आवाज़ का लहज़ा (Pitch)
        utterance.pitch = item.speaker === 'opponent' ? 0.8 : item.speaker === 'judge' ? 0.9 : 1.1;

        // 🔥 Browser Voice Load Fix: सही भाषा की आवाज़ ढूंढें
        const setVoiceAndSpeak = () => {
          const voices = window.speechSynthesis.getVoices();
          
          // चुनी हुई भाषा से मैच करने वाली आवाज़ ढूंढें
          let selectedVoice = voices.find(v => v.lang === targetLangCode);
          if (!selectedVoice) {
            // अगर सटीक मैच न मिले, तो उस भाषा के परिवार की कोई भी आवाज़ ढूंढें
            selectedVoice = voices.find(v => v.lang.includes(targetLangCode.split('-')[0]));
          }
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
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

          // क्रोम बग फिक्स: कभी-कभी TTS पॉज़ रह जाता है, उसे रिज़्यूम करें
          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        };

        // अगर ब्राउज़र में आवाज़ें लोड नहीं हुई हैं, तो इंतज़ार करें
        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            setVoiceAndSpeak();
            window.speechSynthesis.onvoiceschanged = null; // एक बार चलने के बाद हटा दें
          };
        } else {
          setVoiceAndSpeak();
        }
      };

      speakNext();
    };

    try {
      // 1. Backend से ElevenLabs API Call (भाषा का डेटा भी भेज रहे हैं)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: item.text, 
          speaker: item.speaker,
          language: item.language // 🔥 Backend को भी भाषा का पता रहे
        }),
      });

      // 🚨 अगर ElevenLabs का कोटा खत्म है या सर्वर एरर है
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

  // 🔥 speak फंक्शन में language पैरामीटर जोड़ा गया
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) currentAudioRef.current.pause();
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, stop, isSpeaking, isMuted, toggleMute };
}