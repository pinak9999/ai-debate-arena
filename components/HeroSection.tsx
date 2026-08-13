'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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
    'AI will replace human creativity entirely',
    'Universal Basic Income is net positive',
    'Social media does more harm than good',
    'Space colonisation is humanity\'s priority',
  ],
  stock: ['SUZLON.NS', 'TATAMOTORS.NS', 'RELIANCE.NS', 'IRFC.NS', 'ZOMATO.NS'],
  personality: [
    'Should the death penalty be abolished?',
    'Is capitalism the best economic system?',
    'Should AI make life-or-death decisions?',
  ],
};

const TICKER_ITEMS = [
  'Round-based scoring', 'Live AI judge', 'Elo-style ratings', 
  'NSE stock debates', 'Multilingual support', 'Real-time streaming'
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
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

  // Theme dynamic colors
  const themeColors = isStock 
    ? { glow: 'from-emerald-400 to-teal-600', border: 'border-emerald-500/50', bg: 'bg-emerald-500', shadow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]' }
    : isPersonality 
    ? { glow: 'from-amber-400 to-orange-600', border: 'border-amber-500/50', bg: 'bg-amber-500', shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' }
    : { glow: 'from-cyan-400 to-blue-600', border: 'border-cyan-500/50', bg: 'bg-blue-600', shadow: 'shadow-[0_0_20px_rgba(0,212,255,0.3)]' };

  return (
    <motion.div
      className="w-full h-screen flex flex-col justify-between items-center relative z-10 overflow-hidden bg-[#050810]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── CSS for Gradient Animation ── */}
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
      `}} />

      {/* ── Background Glow Effects ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse delay-1000" />
      </div>

      {/* ── Top Bar (Spectator & Language) ── */}
      <motion.div variants={itemVariants} className="w-full max-w-7xl flex items-center justify-between z-20 px-6 pt-6">
        <ModeToggle mode={mode} setMode={setMode} disabled={disabled} />
        
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 backdrop-blur-md">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Language</span>
          <div className="h-3 w-px bg-white/20 hidden sm:block" />
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value as DebateLanguage)}
            className="bg-transparent text-white text-xs uppercase tracking-widest cursor-pointer outline-none font-bold appearance-none"
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
      </motion.div>

      {/* ── Main Hero Content ── */}
      <div className="w-full max-w-3xl flex flex-col items-center justify-center z-10 flex-1 px-4">
        
        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-widest uppercase border border-blue-500/20 mb-4">
            <Brain className="w-3 h-3 animate-pulse" /> Live AI Engine
          </span>
          <h1 className="font-orbitron font-black uppercase leading-[0.9] tracking-tighter text-[clamp(40px,8vw,80px)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-gradient-x block drop-shadow-[0_0_15px_rgba(0,212,255,0.3)]">
              AI DEBATE
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient-x block drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              ARENA
            </span>
          </h1>
        </motion.div>

        {/* ── Ultra Clean Cyberpunk Card ── */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="relative bg-white/[0.03] border border-white/10 rounded-[24px] p-6 md:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            
            {/* Subject Tabs */}
            <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl mb-6">
              <button
                onClick={() => { setSubject('topic'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${
                  subject === 'topic' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Target className="w-4 h-4" /> Topic
              </button>
              <button
                onClick={() => { setSubject('stock'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${
                  isStock ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Stock
              </button>
              <button
                onClick={() => { setSubject('personality'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${
                  isPersonality ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Flame className="w-4 h-4" /> Personality
              </button>
            </div>

            {/* Input Area */}
            <div className="mb-6 relative group">
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${themeColors.glow} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
              <textarea
                ref={textareaRef}
                value={topic}
                onChange={(e) => setTopic(isStock ? e.target.value.toUpperCase() : e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStock ? 'e.g. SUZLON.NS (Add .NS for NSE)' : isPersonality ? 'Enter a philosophical or ethical topic...' : 'Enter any controversial statement or debate topic...'}
                rows={isStock ? 1 : 2}
                className={`relative w-full bg-[#0a0f1a] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 text-sm outline-none resize-none transition-all duration-300 focus:${themeColors.border}`}
              />
              {!isStock && (
                <div className="absolute bottom-3 right-4 text-[10px] text-gray-600 font-mono hidden sm:block">
                  Press ⌘ + ↵ to start
                </div>
              )}
            </div>

            {/* Quick Examples */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {examples.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer font-medium tracking-wide"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer: Rounds + Start Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
              
              {/* Rounds */}
              <div className="flex items-center gap-3 w-full sm:w-auto bg-black/30 p-1.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Rounds:</span>
                <div className="flex gap-1">
                  {([3, 5, 7] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRounds(r)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold font-orbitron transition-all ${
                        rounds === r 
                          ? 'bg-white/15 text-white' 
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <motion.button
                onClick={handleStart}
                disabled={!canStart}
                whileHover={canStart ? { scale: 1.02 } : {}}
                whileTap={canStart ? { scale: 0.98 } : {}}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-orbitron font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
                  canStart 
                    ? `${themeColors.bg} text-white ${themeColors.shadow} cursor-pointer` 
                    : 'bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed'
                }`}
              >
                {launching ? (
                  <span className="flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4" /> Initializing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-current" />
                    {isStock ? 'Launch War-Room' : 'Start Debate'}
                  </span>
                )}
              </motion.button>
            </div>

          </div>
        </motion.div>

      </div>

      {/* ── Marquee Ticker Tape at Bottom ── */}
      <motion.div variants={itemVariants} className="w-full overflow-hidden border-t border-b border-white/10 py-2.5 relative z-10 bg-black/20 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex w-max gap-8 animate-[marquee_20s_linear_infinite]">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <span key={idx} className="font-mono text-[10px] tracking-widest uppercase text-gray-500 whitespace-nowrap flex items-center gap-2">
              <b className="text-blue-500">◆</b> {item}
            </span>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}