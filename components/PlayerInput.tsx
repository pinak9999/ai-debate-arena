'use client';

import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Camera, CameraOff, Activity } from 'lucide-react';
import Webcam from 'react-webcam';

interface PlayerInputProps {
  waiting: boolean;
  onSubmit: (text: string) => void;
}

export function PlayerInput({ waiting, onSubmit }: PlayerInputProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // 🔥 FIX: माइक चालू करने से पहले का टेक्स्ट और फाइनल स्पीच को सेव रखने के लिए
  const initialTextRef = useRef('');
  const finalTranscriptRef = useRef('');

  // ─── Computer Vision (Webcam & AI) States ───
  const webcamRef = useRef<Webcam>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState<number>(100);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceapi = await import('@vladmandic/face-api');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (err) {
        console.error("Face API Load Error: ", err);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWebcamActive && modelsLoaded) {
      interval = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          const faceapi = await import('@vladmandic/face-api');
          const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
          
          if (detections) {
            const expr = detections.expressions;
            const positive = (expr.neutral || 0) + (expr.happy || 0);
            const negative = (expr.fearful || 0) + (expr.sad || 0) + (expr.surprised || 0) + (expr.angry || 0);
            
            let score = Math.round((positive / (positive + negative)) * 100);
            if (isNaN(score)) score = 50;
            setConfidenceScore(prev => Math.round((prev + score) / 2));
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWebcamActive, modelsLoaded]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN'; // आप इसे डायनामिक भी कर सकते हैं

        recognition.onstart = () => {
          // जब रिकॉग्निशन स्टार्ट हो, तो फाइनल ट्रांसक्रिप्ट को रीसेट करें
          finalTranscriptRef.current = '';
        };

        recognition.onresult = (event: any) => {
          // 🔥 100% ACCURATE FIX: Final और Interim रिजल्ट्स को अलग-अलग प्रोसेस करें
          let interimTranscript = '';
          let newFinalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              newFinalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          // अगर कोई नया फाइनल वर्ड आया है, तो उसे Ref में सेव कर लें
          if (newFinalTranscript) {
            finalTranscriptRef.current += newFinalTranscript;
          }

          // UI (Input Box) में = (माइक से पहले का टेक्स्ट) + (पक्के शब्द) + (कच्चे/interim शब्द)
          const currentText = initialTextRef.current + finalTranscriptRef.current + interimTranscript;
          setValue(currentText);
        };

        recognition.onerror = (e: any) => {
          console.error("Speech recognition error", e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          // जब माइक बंद हो, तो जो भी टेक्स्ट बना है, उसे फाइनल मान लें
          initialTextRef.current = value.trim() ? value.trim() + ' ' : '';
        };

        recognitionRef.current = recognition;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!waiting && !isListening) return null;

  const handleToggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel(); 
      }
      // माइक चालू करते समय इनपुट बॉक्स के मौजूदा टेक्स्ट को सेव कर लें
      initialTextRef.current = value.trim() ? value.trim() + ' ' : '';
      finalTranscriptRef.current = ''; // नया सेशन, इसलिए इसे खाली करें
      
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Recognition already started", e);
      }
    }
  };

  const handleToggleWebcam = () => {
    setIsWebcamActive(!isWebcamActive);
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    let finalArgument = value.trim();
    if (isWebcamActive) {
      const tauntInstruction = confidenceScore < 50 
        ? `[SYSTEM NOTE: The human opponent's facial tracking shows a Confidence Score of only ${confidenceScore}%. They look visibly nervous, stressed, or are breaking eye contact. Subtly taunt their lack of confidence in your response.]` 
        : `[SYSTEM NOTE: The human looks highly confident (Score: ${confidenceScore}%). Acknowledge their boldness.]`;
      
      finalArgument = `${finalArgument}\n\n${tauntInstruction}`;
    }

    onSubmit(finalArgument);
    setValue('');
    initialTextRef.current = '';
    finalTranscriptRef.current = '';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`mt-3 p-4 rounded-xl border-2 transition-all duration-300 ${isListening ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-blue-500 bg-[#050505] shadow-[0_0_15px_rgba(0,212,255,0.1)]'}`}>
      
      <div className="flex justify-between items-center mb-3">
        <p className={`text-xs font-semibold flex items-center gap-2 ${isListening ? 'text-red-400' : 'text-blue-400'}`}>
          {isListening ? (
            <> <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span> Listening (Interrupt Mode)... Speak now!</>
          ) : (
            '🎤 Your turn! Type or Speak your argument:'
          )}
        </p>

        {isWebcamActive && (
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${confidenceScore > 60 ? 'text-emerald-400' : 'text-rose-400'}`} />
            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${confidenceScore > 60 ? 'bg-emerald-400' : 'bg-rose-500'}`} 
                style={{ width: `${confidenceScore}%` }} 
              />
            </div>
            <span className={`text-[10px] font-orbitron font-bold ${confidenceScore > 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {confidenceScore}% CONF
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3 items-end">
        <button
          type="button"
          onClick={handleToggleWebcam}
          className={`p-3 rounded-lg flex-shrink-0 transition-all duration-300 ${isWebcamActive ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}
          title="Toggle Computer Vision (Expression Analysis)"
        >
          {isWebcamActive ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={handleToggleMic}
          className={`p-3 rounded-lg flex-shrink-0 transition-all duration-300 ${isListening ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]' : 'bg-gray-800 hover:bg-gray-700 text-blue-400 border border-blue-500/30'}`}
          title={isListening ? "Stop Listening" : "Start Voice Typing & Interrupt AI"}
        >
          {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
        </button>

        {isWebcamActive && (
          <div className="relative w-16 h-14 rounded-lg overflow-hidden border border-white/20 shrink-0 bg-black">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover"
            />
            {!modelsLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <span className="text-[8px] text-white animate-pulse">Loading AI...</span>
              </div>
            )}
          </div>
        )}

        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            // मैन्युअली टाइप करने पर भी initialTextRef को अपडेट करें ताकि माइक चालू करने पर टेक्स्ट न उड़े
            if (!isListening) initialTextRef.current = e.target.value; 
          }}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening to your voice..." : "Type your point here..."}
          rows={2}
          className="flex-1 resize-none rounded-lg bg-[#0a0f18] border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="px-4 py-2 h-[52px] rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium self-end flex items-center justify-center transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}