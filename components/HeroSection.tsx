'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Zap, Brain, Swords, ChevronDown, TrendingUp, Target, Flame, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onStart: (input: string, rounds: number, subject: 'topic' | 'stock' | 'personality') => void;
}

const EXAMPLE_TOPICS = [
  'AI will replace human creativity entirely',
  'Universal Basic Income is net positive',
  'Social media does more harm than good',
  'Space colonisation should be humanity\'s top priority',
  'Nuclear energy is key to solving climate change',
];

const EXAMPLE_TICKERS = [
  'SUZLON.NS',
  'TATAMOTORS.NS',
  'RELIANCE.NS',
  'IRFC.NS',
  'INFY.NS',
  'ZOMATO.NS',
];

const EXAMPLE_PERSONALITY_TOPICS = [
  'Should the death penalty be abolished worldwide?',
  'Is capitalism the best economic system for humanity?',
  'Should AI be allowed to make life-or-death medical decisions?',
  'Is space exploration justified while poverty exists on Earth?',
  'Should social media be banned for under-18s?',
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.35 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function HeroSection({ onStart }: HeroSectionProps) {
  const [subject, setSubject] = useState<'topic' | 'stock' | 'personality'>('topic');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);
  const [launching, setLaunching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStock = subject === 'stock';
  const isPersonality = subject === 'personality';
  const examples = isStock ? EXAMPLE_TICKERS : isPersonality ? EXAMPLE_PERSONALITY_TOPICS : EXAMPLE_TOPICS;

  const handleStart = () => {
    if (!topic.trim() || launching) return;
    setLaunching(true);
    setTimeout(() => onStart(topic.trim(), rounds, subject), 400);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStart();
  };

  const canStart = topic.trim().length > 0 && !launching;

  // Dynamic colors based on mode
  const themeColors = isStock 
    ? { border: 'border-emerald-500/30', glow: 'from-emerald-500 to-teal-600', text: 'text-emerald-400', shadow: 'shadow-[0_0_30px_rgba(52,211,153,0.15)]' }
    : isPersonality 
    ? { border: 'border-amber-500/30', glow: 'from-amber-500 to-orange-600', text: 'text-amber-400', shadow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]' }
    : { border: 'border-cyan-500/30', glow: 'from-cyan-400 to-purple-600', text: 'text-cyan-400', shadow: 'shadow-[0_0_30px_rgba(0,212,255,0.15)]' };

  return (
    <>
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
      `}} />

      <motion.div
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 z-10 overflow-hidden bg-[#030712]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* ── Animated Background Glow Orbs ── */}
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
        <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse delay-1000 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[40%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse delay-500 pointer-events-none" />

        {/* ── Top Badge ── */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
          <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-gray-300 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase">
            AI · Real-Time · Streaming
          </span>
          <Swords className="w-4 h-4 text-purple-400" />
        </motion.div>

        {/* ── Main Title ── */}
        <motion.div variants={itemVariants} className="text-center mb-8 relative z-10">
          <h1 className="font-orbitron font-black leading-[1] tracking-tighter text-6xl md:text-8xl lg:text-[7.5rem] uppercase">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-gradient-x block drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]">
              AI DEBATE
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient-x block drop-shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              ARENA
            </span>
          </h1>
          <p className="text-gray-400 mt-6 text-xs md:text-sm tracking-[0.3em] uppercase font-semibold">
            Two AI Agents <span className="text-gray-600 mx-2">•</span> Structured Rounds <span className="text-gray-600 mx-2">•</span> Live Judge Scoring
          </p>
        </motion.div>

        {/* ── Mode Selection Toggles ── */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3 mb-8 relative z-10">
          <button
            onClick={() => { setSubject('topic'); setTopic(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
              subject === 'topic' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,212,255,0.3)]' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" /> Topic Debate
          </button>
          <button
            onClick={() => { setSubject('stock'); setTopic(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
              isStock ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Stock War-Room
          </button>
          <button
            onClick={() => { setSubject('personality'); setTopic(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
              isPersonality ? 'bg-amber-500/20 text-amber-400 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" /> Personality Clash
          </button>
        </motion.div>

        {/* ── Glassmorphism Input Card ── */}
        <motion.div variants={itemVariants} className="w-full max-w-2xl relative z-10">
          <div className={`bg-white/5 border backdrop-blur-xl rounded-3xl p-6 md:p-10 transition-all duration-500 ${themeColors.border} ${themeColors.shadow}`}>
            
            {/* Topic Input */}
            <div className="mb-8">
              <label className="block text-xs font-bold text-gray-400 tracking-widest uppercase mb-3 flex justify-between items-end">
                <span>{isStock ? '📈 Stock Ticker (NSE)' : isPersonality ? '🎭 Topic (Analyst vs Philosopher)' : 'Debate Topic'}</span>
                {!isStock && !isPersonality && <span className="text-[9px] opacity-50 lowercase tracking-normal font-normal">⌘↵ to start • {topic.length} chars</span>}
              </label>
              <div className="relative group">
                {/* Glowing border behind textarea */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${themeColors.glow} rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500`} />
                <textarea
                  ref={textareaRef}
                  value={topic}
                  onChange={(e) => setTopic(isStock ? e.target.value.toUpperCase() : e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isStock ? 'e.g. SUZLON.NS or RELIANCE.NS' : isPersonality ? 'Enter a philosophical or ethical topic...' : 'Enter a controversial statement...'}
                  rows={isStock ? 1 : 3}
                  className="relative w-full bg-[#0a0f1a]/90 border border-gray-700/50 rounded-xl px-5 py-4 text-white placeholder-gray-500 text-sm md:text-base outline-none resize-none z-10 transition-colors focus:border-white/20"
                />
              </div>
              {isStock && <p className="text-gray-500 text-[10px] mt-2 font-medium">⚠️ NSE Stocks only. Don't forget the ".NS" suffix.</p>}
            </div>

            {/* Quick Examples */}
            <div className="mb-8">
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">
                {isStock ? 'Popular Tickers' : isPersonality ? 'Clash-Worthy Topics' : 'Quick Examples'}
              </p>
              <div className="flex flex-wrap gap-2">
                {examples.map((t) => (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    key={t}
                    onClick={() => setTopic(t)}
                    className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all text-left leading-tight"
                  >
                    {t}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Rounds Selector */}
            <div className="mb-8">
              <label className="block text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">
                Number of Rounds
              </label>
              <div className="flex gap-3">
                {([3, 5, 7] as const).map((r) => {
                  const active = rounds === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRounds(r)}
                      className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all duration-300 ${
                        active 
                          ? `bg-white/10 border-white/40 ${themeColors.text} shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]` 
                          : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300'
                      }`}
                    >
                      {r} Rounds
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <motion.button
              onClick={handleStart}
              disabled={!canStart}
              whileHover={canStart ? { scale: 1.02 } : {}}
              whileTap={canStart ? { scale: 0.98 } : {}}
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all duration-500 ${
                canStart 
                  ? `bg-gradient-to-r ${themeColors.glow} text-white shadow-lg cursor-pointer` 
                  : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              {launching ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <Brain className="w-5 h-5" /> Initializing Arena...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> 
                  {isStock ? 'Launch War-Room' : isPersonality ? 'Start the Clash' : 'Start Debate'}
                </span>
              )}
            </motion.button>

          </div>
        </motion.div>

        {/* ── Scroll Cue ── */}
        <motion.div
          variants={itemVariants}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-cyan-400 to-transparent" />
          <ChevronDown className="w-5 h-5 text-cyan-400 animate-bounce" />
        </motion.div>
      </motion.div>
    </>
  );
}