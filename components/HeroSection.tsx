'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Zap, Target, TrendingUp, Flame, Sparkles } from 'lucide-react';
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

  // Theme accent configs
  const accentColor = isStock ? 'emerald' : isPersonality ? 'amber' : 'blue';

  return (
    <motion.div
      className="w-full min-h-screen flex flex-col items-center relative z-10 overflow-hidden bg-[#08090c]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Background Glow Effects ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[80%] filter blur-[120px] opacity-20 bg-[radial-gradient(circle_at_center,#3b7bff,transparent_60%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[80%] filter blur-[120px] opacity-10 bg-[radial-gradient(circle_at_center,#ff3d5a,transparent_60%)]" />
      </div>

      {/* ── Minimal Top Bar ── */}
      <motion.div variants={itemVariants} className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between z-20 px-6 py-6 gap-4">
        <ModeToggle mode={mode} setMode={setMode} disabled={disabled} />
        
        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Language</span>
          <div className="h-4 w-px bg-white/10" />
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value as DebateLanguage)}
            className="bg-transparent text-white text-xs uppercase tracking-wider cursor-pointer outline-none font-medium appearance-none pr-2"
          >
            <option value="English" className="bg-[#08090c]">English</option>
            <option value="Hindi" className="bg-[#08090c]">Hindi</option>
            <option value="Marathi" className="bg-[#08090c]">Marathi</option>
            <option value="Gujarati" className="bg-[#08090c]">Gujarati</option>
            <option value="Punjabi" className="bg-[#08090c]">Punjabi</option>
            <option value="Bengali" className="bg-[#08090c]">Bengali</option>
            <option value="Tamil" className="bg-[#08090c]">Tamil</option>
            <option value="Telugu" className="bg-[#08090c]">Telugu</option>
            <option value="Kannada" className="bg-[#08090c]">Kannada</option>
            <option value="Malayalam" className="bg-[#08090c]">Malayalam</option>
          </select>
        </div>
      </motion.div>

      {/* ── Main Hero Content ── */}
      <div className="w-full max-w-3xl flex flex-col items-center justify-center z-10 flex-1 px-4 pb-12">
        
        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-10 mt-4">
          <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono tracking-widest uppercase mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-2 animate-pulse" />
            Live AI vs AI Engine
          </span>
          <h1 className="font-['Anton','Arial_Narrow',sans-serif] font-normal uppercase leading-[0.9] tracking-wide text-[clamp(48px,8vw,86px)]">
            <span className="text-[#eef0f3]">AI DEBATE </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              ARENA
            </span>
          </h1>
        </motion.div>

        {/* ── Ultra Clean Glassmorphism Card ── */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="relative bg-[#0d0f14]/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
            
            {/* Subject Tabs */}
            <div className="flex p-1.5 bg-black/50 border border-white/5 rounded-2xl mb-8">
              <button
                onClick={() => { setSubject('topic'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  subject === 'topic' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Target className="w-4 h-4" /> Topic
              </button>
              <button
                onClick={() => { setSubject('stock'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isStock ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Stock
              </button>
              <button
                onClick={() => { setSubject('personality'); setTopic(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isPersonality ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Flame className="w-4 h-4" /> Personality
              </button>
            </div>

            {/* Input Area */}
            <div className="mb-6">
              <textarea
                ref={textareaRef}
                value={topic}
                onChange={(e) => setTopic(isStock ? e.target.value.toUpperCase() : e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStock ? 'e.g. SUZLON.NS (Add .NS for NSE stocks)' : isPersonality ? 'Enter a philosophical or ethical topic...' : 'Enter any controversial statement or debate topic...'}
                rows={isStock ? 1 : 3}
                className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 text-sm md:text-base outline-none resize-none transition-all duration-300 focus:border-${accentColor}-500/50 focus:bg-black/60`}
              />
              {!isStock && (
                <div className="flex justify-end mt-2">
                  <span className="text-[10px] text-gray-500 font-mono">Press ⌘ + ↵ to start</span>
                </div>
              )}
            </div>

            {/* Quick Examples (Pill Tags) */}
            <div className="mb-8">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3 px-1">Quick Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className="text-xs px-4 py-2 rounded-full border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer of Card: Rounds + Start Button side-by-side */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
              
              {/* Rounds */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Rounds</span>
                <div className="flex gap-1.5 p-1 bg-black/40 border border-white/5 rounded-xl">
                  {([3, 5, 7] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRounds(r)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        rounds === r 
                          ? 'bg-white/10 text-white shadow-sm' 
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
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
                  canStart 
                    ? `bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white shadow-lg shadow-${accentColor}-500/20 cursor-pointer` 
                    : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                }`}
                style={canStart && !['emerald', 'amber', 'blue'].includes(accentColor) ? {
                   // Fallback solid gradient if tailwind dynamic class fails
                   background: isStock ? 'linear-gradient(to right, #10b981, #059669)' : isPersonality ? 'linear-gradient(to right, #f59e0b, #d97706)' : 'linear-gradient(to right, #3b82f6, #2563eb)'
                } : {}}
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
    </motion.div>
  );
}