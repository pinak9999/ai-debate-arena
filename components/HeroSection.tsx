'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { motion, type Variants } from 'framer-motion';
// 🔥 Bot और Gamepad2 आइकॉन के साथ यहाँ नया इम्पॉर्ट जोड़ा गया है
import { Zap, Brain, TrendingUp, Target, Flame, Sparkles, PlaySquare, FileCode, Bot, Gamepad2 } from 'lucide-react';
import { DebateLanguage } from '@/hooks/useDebate';

interface HeroSectionProps {
  onStart: (
    input: string, 
    rounds: number, 
    subject: 'topic' | 'stock' | 'personality' | 'youtube' | 'document', 
    documentText?: string
  ) => void;
  mode: 'spectator' | 'player';
  setMode: (mode: 'spectator' | 'player') => void;
  selectedLang: DebateLanguage;
  setSelectedLang: (lang: DebateLanguage) => void;
  disabled?: boolean;
}

const EXAMPLES = {
  topic: [
    'AI will replace human creativity',
    'Universal Basic Income is net positive',
    'Social media does more harm than good',
  ],
  stock: ['SUZLON.NS', 'TATAMOTORS.NS', 'RELIANCE.NS', 'IRFC.NS'],
  personality: [
    'Should the death penalty be abolished?',
    'Is capitalism the best economic system?',
  ],
  youtube: [
    'Paste any Dhruv Rathee video link...',
    'Paste any Nitish Rajput video link...',
  ]
};

const TICKER_ITEMS = [
  'Round-based scoring', 'Live AI judge', 'Elo-style ratings', 
  'NSE stock debates', 'YouTube Clash Mode', 'Enterprise Code Audit', 'Real-time streaming'
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function HeroSection({ onStart, mode, setMode, selectedLang, setSelectedLang, disabled }: HeroSectionProps) {
  const [subject, setSubject] = useState<'topic' | 'stock' | 'personality' | 'youtube' | 'document'>('topic');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);
  const [launching, setLaunching] = useState(false);
  
  // Document Mode के लिए States
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStock = subject === 'stock';
  const isPersonality = subject === 'personality';
  const isYoutube = subject === 'youtube';
  const isDocument = subject === 'document';
  
  const examples = !isDocument ? EXAMPLES[subject as keyof typeof EXAMPLES] : [];

  // फाइल अपलोड हैंडल करने का लॉजिक
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadError('');

    const validExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'txt', 'json', 'html', 'css', 'md'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(fileExtension)) {
      setUploadError('Only Code or Text files (.js, .py, .txt, etc) are supported right now.');
      setDocumentText('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        setDocumentText(evt.target.result);
        setTopic(file.name);
      }
    };
    reader.onerror = () => setUploadError('Error reading the file.');
    reader.readAsText(file);
  };

  const handleStart = async () => {
    if (launching) return;
    
    if (!isDocument && !topic.trim()) return;
    if (isDocument && !documentText.trim()) return;

    setLaunching(true);

    if (isYoutube) {
      try {
        const res = await fetch('/api/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: topic.trim() })
        });
        const data = await res.json();

        if (data.error) {
          alert('Error: ' + data.error);
          setLaunching(false);
          return;
        }

        const debatePrompt = `[YOUTUBE CONTEXT] Video Topic: ${data.topic} | Creator's Main Claims: ${data.claims}`;
        setTimeout(() => onStart(debatePrompt, rounds, 'youtube'), 500);

      } catch (err) {
        alert('Failed to fetch video transcript. Make sure the link is valid.');
        setLaunching(false);
      }
    } else if (isDocument) {
      setTimeout(() => onStart(topic || 'Uploaded Document', rounds, 'document', documentText), 400);
    } else {
      setTimeout(() => onStart(topic.trim(), rounds, subject), 400);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStart();
  };

  const canStart = isDocument 
    ? documentText.trim().length > 0 && !launching && !uploadError
    : topic.trim().length > 0 && !launching;

  const themeColors = isStock 
    ? { glow: 'from-emerald-400 to-teal-600', border: 'border-emerald-500/50', bg: 'bg-emerald-500', text: 'text-emerald-400', shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.25)]' }
    : isPersonality 
    ? { glow: 'from-amber-400 to-orange-600', border: 'border-amber-500/50', bg: 'bg-amber-500', text: 'text-amber-400', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]' }
    : isYoutube
    ? { glow: 'from-red-500 to-rose-600', border: 'border-red-500/50', bg: 'bg-red-600', text: 'text-red-400', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.25)]' }
    : isDocument
    ? { glow: 'from-purple-500 to-indigo-600', border: 'border-purple-500/50', bg: 'bg-purple-600', text: 'text-purple-400', shadow: 'shadow-[0_0_15px_rgba(147,51,234,0.25)]' }
    : { glow: 'from-cyan-400 to-blue-600', border: 'border-cyan-500/50', bg: 'bg-blue-600', text: 'text-cyan-400', shadow: 'shadow-[0_0_15px_rgba(0,212,255,0.25)]' };

  return (
    <motion.div
      className="w-full h-[100dvh] flex flex-col bg-[#050810] relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ── Background Glow ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[0%] left-[20%] w-[30vw] h-[30vh] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[0%] right-[20%] w-[30vw] h-[30vh] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse delay-1000" />
      </div>

      {/* ── Header ── */}
      <header className="shrink-0 h-[8vh] min-h-[50px] flex items-center justify-between px-4 sm:px-6 z-20">
        
        {/* 🔥 HIGH-CONTRAST INLINE MODE TOGGLE (100% Guaranteed Visual Selection) */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {/* SPECTATOR MODE BUTTON */}
          <button
            type="button"
            onClick={() => setMode('spectator')}
            disabled={disabled}
            className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-[11px] font-orbitron font-black tracking-wider uppercase transition-all duration-300 ${
              mode === 'spectator'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.7)] border border-cyan-200 scale-[1.03]'
                : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Bot className={`w-4 h-4 shrink-0 ${mode === 'spectator' ? 'text-black fill-black/20' : 'text-cyan-400'}`} />
            <span>Spectator <span className="hidden md:inline text-[9px] opacity-80">(AI vs AI)</span></span>
            {mode === 'spectator' && (
              <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-black/30 text-black text-[8px] font-bold border border-black/20">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                ON
              </span>
            )}
          </button>

          {/* PLAYER MODE BUTTON */}
          <button
            type="button"
            onClick={() => setMode('player')}
            disabled={disabled}
            className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-[11px] font-orbitron font-black tracking-wider uppercase transition-all duration-300 ${
              mode === 'player'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] border border-purple-300 scale-[1.03]'
                : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Gamepad2 className={`w-4 h-4 shrink-0 ${mode === 'player' ? 'text-white' : 'text-purple-400'}`} />
            <span>Player <span className="hidden md:inline text-[9px] opacity-80">(You vs AI)</span></span>
            {mode === 'player' && (
              <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-black/40 text-purple-200 text-[8px] font-bold border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-ping" />
                ON
              </span>
            )}
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Language</span>
          <div className="h-3 w-px bg-white/20 hidden sm:block" />
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value as DebateLanguage)}
            className="bg-transparent text-white text-[10px] uppercase tracking-widest cursor-pointer outline-none font-bold appearance-none"
          >
            <option value="English" className="bg-[#0a0f1a]">ENGLISH</option>
            <option value="Hindi" className="bg-[#0a0f1a]">HINDI (हिंदी)</option>
            <option value="Marathi" className="bg-[#0a0f1a]">MARATHI</option>
            <option value="Gujarati" className="bg-[#0a0f1a]">GUJARATI</option>
            <option value="Punjabi" className="bg-[#0a0f1a]">PUNJABI</option>
            <option value="Bengali" className="bg-[#0a0f1a]">BENGALI</option>
            <option value="Tamil" className="bg-[#0a0f1a]">TAMIL</option>
            <option value="Telugu" className="bg-[#0a0f1a]">TELUGU</option>
            <option value="Kannada" className="bg-[#0a0f1a]">KANNADA</option>
            <option value="Malayalam" className="bg-[#0a0f1a]">MALAYALAM</option>
          </select>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 z-10 w-full max-w-4xl mx-auto py-2">
        
        <motion.div variants={itemVariants} className="text-center mb-[2vh] shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold tracking-widest uppercase border border-blue-500/20 mb-2">
            <Brain className="w-3 h-3 animate-pulse" /> Live AI Engine
          </span>
          <h1 className="font-orbitron font-black uppercase leading-[0.9] tracking-tighter text-[clamp(28px,7vh,70px)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-gradient-x block">
              AI DEBATE
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient-x block">
              ARENA
            </span>
          </h1>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full shrink">
          <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl flex flex-col gap-[1.5vh]">
            
            {/* Tabs */}
            <div className="flex p-1 bg-black/40 border border-white/5 rounded-xl shrink-0 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => { setSubject('topic'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
                  subject === 'topic' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Target className="w-3 h-3" /> Topic
              </button>
              <button
                onClick={() => { setSubject('stock'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
                  isStock ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <TrendingUp className="w-3 h-3" /> Stock
              </button>
              <button
                onClick={() => { setSubject('personality'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
                  isPersonality ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Flame className="w-3 h-3" /> Clash
              </button>
              <button
                onClick={() => { setSubject('youtube'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
                  isYoutube ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <PlaySquare className="w-3 h-3" /> YouTube
              </button>
              <button
                onClick={() => { setSubject('document'); setTopic(''); setDocumentText(''); setFileName(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
                  isDocument ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <FileCode className="w-3 h-3" /> Audit
              </button>
            </div>

            {/* Input Area (Textarea OR File Uploader) */}
            <div className="relative group shrink-0">
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${themeColors.glow} rounded-xl blur opacity-20 transition duration-500`} />
              
              {isDocument ? (
                <div className="relative w-full h-[80px] bg-[#0a0f1a] border border-dashed border-white/20 hover:border-purple-500/50 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden">
                  <input 
                    type="file" 
                    accept=".js,.ts,.jsx,.tsx,.py,.txt,.json,.md,.css,.html" 
                    onChange={handleFileUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  />
                  <div className="flex items-center gap-3 z-0">
                    <FileCode className={`w-6 h-6 ${fileName ? 'text-purple-400' : 'text-gray-500'}`} />
                    <div className="flex flex-col text-left">
                      <span className={`text-[12px] font-bold tracking-wider ${fileName ? 'text-white' : 'text-gray-400 uppercase'}`}>
                        {fileName ? fileName : 'Upload Code / Text File'}
                      </span>
                      {uploadError ? (
                        <span className="text-[9px] text-red-400 mt-0.5">{uploadError}</span>
                      ) : (
                        <span className="text-[9px] text-gray-500">Supports .js, .py, .txt, .json etc</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={topic}
                  onChange={(e) => setTopic(isStock ? e.target.value.toUpperCase() : e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isYoutube ? 'Paste a YouTube video link here...' : isStock ? 'e.g. SUZLON.NS' : isPersonality ? 'Enter a philosophical topic...' : 'Enter a debate topic...'}
                  rows={1}
                  className={`relative w-full bg-[#0a0f1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-[12px] sm:text-[13px] outline-none resize-none transition-all duration-300 focus:${themeColors.border} overflow-hidden`}
                />
              )}
            </div>

            {/* Quick Examples */}
            {!isDocument && (
              <div className="overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide shrink-0">
                <div className="flex gap-2">
                  {examples.map((t) => (
                    <button
                      key={t}
                      onClick={() => { if(!isYoutube) setTopic(t); }}
                      className="inline-block text-[9px] sm:text-[10px] px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer font-medium"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 shrink-0">
              <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/5 shrink-0">
                {([3, 5, 7] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRounds(r)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-orbitron transition-all ${
                      rounds === r ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {r} R
                  </button>
                ))}
              </div>

              <motion.button
                onClick={handleStart}
                disabled={!canStart}
                whileHover={canStart ? { scale: 1.02 } : {}}
                whileTap={canStart ? { scale: 0.98 } : {}}
                className={`flex-1 py-2.5 rounded-xl font-orbitron font-bold text-[10px] sm:text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
                  canStart 
                    ? `${themeColors.bg} text-white ${themeColors.shadow} cursor-pointer` 
                    : 'bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed'
                }`}
              >
                {launching ? (
                  <span className="flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> {isYoutube ? 'Analyzing Video...' : isDocument ? 'Reading Code...' : 'Launching...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isYoutube ? <PlaySquare className="w-3.5 h-3.5 fill-current" /> : isDocument ? <FileCode className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                    {isYoutube ? 'Start Creator Clash' : isStock ? 'War-Room' : isDocument ? 'Audit Code' : 'Start'}
                  </span>
                )}
              </motion.button>
            </div>

          </div>
        </motion.div>
      </main>

      {/* ── Footer Ticker ── */}
      <footer className="shrink-0 h-[4vh] min-h-[25px] w-full overflow-hidden border-t border-white/10 relative z-10 bg-black/20 flex items-center [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex w-max gap-8 animate-[marquee_20s_linear_infinite]">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <span key={idx} className="font-mono text-[9px] tracking-widest uppercase text-gray-500 whitespace-nowrap flex items-center gap-2">
              <b className={themeColors.text}>◆</b> {item}
            </span>
          ))}
        </div>
      </footer>
    </motion.div>
  );
}