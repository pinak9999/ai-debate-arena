'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Zap, Brain, TrendingUp, Target, Flame, Sparkles } from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';
import { DebateLanguage } from '@/hooks/useDebate';

interface HeroSectionProps {
  onStart: (input: string, rounds: number, subject: 'topic' | 'stock' | 'personality') => void;
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
};

const TICKER_ITEMS = [
  'Round-based scoring', 'Live AI judge', 'Elo-style ratings', 
  'NSE stock debates', 'Multilingual support', 'Real-time streaming'
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
  const [subject, setSubject] = useState<'topic' | 'stock' | 'personality'>('topic');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);
  const [launching, setLaunching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStock = subject === 'stock';
  const isPersonality = subject === 'personality';
  const examples = EXAMPLES[subject];

  const handleStart = () => {
    if (!topic.trim() || launching) return;
    setLaunching(true);
    setTimeout(() => onStart(topic.trim(), rounds, subject), 400);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStart();
  };

  const canStart = topic.trim().length > 0 && !launching;

  const themeColors = isStock 
    ? { glow: 'from-emerald-400 to-teal-600', border: 'border-emerald-500/50', bg: 'bg-emerald-500', text: 'text-emerald-400', shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.25)]' }
    : isPersonality 
    ? { glow: 'from-amber-400 to-orange-600', border: 'border-amber-500/50', bg: 'bg-amber-500', text: 'text-amber-400', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]' }
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
        /* Hide scrollbar strictly */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ── Background Glow ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[0%] left-[20%] w-[30vw] h-[30vh] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[0%] right-[20%] w-[30vw] h-[30vh] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse delay-1000" />
      </div>

      {/* ── Header (Fixed Height) ── */}
      <header className="shrink-0 h-[8vh] min-h-[50px] flex items-center justify-between px-4 sm:px-6 z-20">
        <ModeToggle mode={mode} setMode={setMode} disabled={disabled} />
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md">
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

      {/* ── Main Content (Flexible Center, Shrinks to fit) ── */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 z-10 w-full max-w-3xl mx-auto py-2">
        
        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-[2vh] shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold tracking-widest uppercase border border-blue-500/20 mb-2">
            <Brain className="w-3 h-3 animate-pulse" /> Live AI Engine
          </span>
          {/* font size clamps based on Viewport Height (vh) to prevent pushing card down */}
          <h1 className="font-orbitron font-black uppercase leading-[0.9] tracking-tighter text-[clamp(28px,7vh,70px)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-gradient-x block">
              AI DEBATE
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient-x block">
              ARENA
            </span>
          </h1>
        </motion.div>

        {/* ── Ultra Compact Card ── */}
        <motion.div variants={itemVariants} className="w-full shrink">
          <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl flex flex-col gap-[1.5vh]">
            
            {/* Tabs */}
            <div className="flex p-1 bg-black/40 border border-white/5 rounded-xl shrink-0">
              <button
                onClick={() => { setSubject('topic'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all ${
                  subject === 'topic' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Target className="w-3 h-3" /> Topic
              </button>
              <button
                onClick={() => { setSubject('stock'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all ${
                  isStock ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <TrendingUp className="w-3 h-3" /> Stock
              </button>
              <button
                onClick={() => { setSubject('personality'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all ${
                  isPersonality ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Flame className="w-3 h-3" /> Personality
              </button>
            </div>

            {/* Input - Strictly 1 Row */}
            <div className="relative group shrink-0">
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${themeColors.glow} rounded-xl blur opacity-20 transition duration-500`} />
              <textarea
                ref={textareaRef}
                value={topic}
                onChange={(e) => setTopic(isStock ? e.target.value.toUpperCase() : e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStock ? 'e.g. SUZLON.NS' : isPersonality ? 'Enter a philosophical topic...' : 'Enter a debate topic...'}
                rows={1}
                className={`relative w-full bg-[#0a0f1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-[12px] sm:text-[13px] outline-none resize-none transition-all duration-300 focus:${themeColors.border} overflow-hidden`}
              />
            </div>

            {/* Quick Examples (Single Line Horizontal Scroll) */}
            <div className="overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide shrink-0">
              <div className="flex gap-2">
                {examples.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="inline-block text-[9px] sm:text-[10px] px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer font-medium"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer: Rounds + Start Button */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 shrink-0">
              
              {/* Rounds */}
              <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/5 shrink-0">
                {([3, 5, 7] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRounds(r)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-orbitron transition-all ${
                      rounds === r 
                        ? 'bg-white/15 text-white' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {r} R
                  </button>
                ))}
              </div>

              {/* Start Button */}
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
                    <Sparkles className="w-3.5 h-3.5" /> Launching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    {isStock ? 'War-Room' : 'Start'}
                  </span>
                )}
              </motion.button>
            </div>

          </div>
        </motion.div>
      </main>

      {/* ── Footer Ticker (Fixed Height) ── */}
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