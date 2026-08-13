'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Zap, Brain, Swords, TrendingUp, Target, Flame, Sparkles } from 'lucide-react';
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
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function HeroSection({ onStart, mode, setMode, selectedLang, setSelectedLang, disabled }: HeroSectionProps) {
  const [subject, setSubject] = useState<'topic' | 'stock' | 'personality'>('topic');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);
  const [launching, setLaunching] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStock = subject === 'stock';
  const isPersonality = subject === 'personality';
  const examples = EXAMPLES[subject];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleStart = () => {
    if (!topic.trim() || launching) return;
    setLaunching(true);
    setTimeout(() => onStart(topic.trim(), rounds, subject), 400);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStart();
  };

  const canStart = topic.trim().length > 0 && !launching;

  const accentColor = isStock ? '#22e0a0' : isPersonality ? '#f2b705' : '#3b7bff';
  const accentDim = isStock ? '#22e0a033' : isPersonality ? '#f2b70533' : '#3b7bff33';

  return (
    <motion.div
      className="w-full h-screen flex flex-col justify-between items-center px-4 py-3 relative z-10 overflow-hidden bg-[#08090c]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ '--accent': accentColor, '--accent-dim': accentDim } as any}
    >
      {/* ── Background Glow Effects ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[100%] filter blur-[100px] opacity-20 bg-[radial-gradient(circle_at_30%_30%,#3b7bff,transparent_70%)]" />
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[100%] filter blur-[100px] opacity-20 bg-[radial-gradient(circle_at_70%_60%,#ff3d5a,transparent_70%)]" />
        <div 
          className="fixed z-2 w-[400px] h-[400px] rounded-full pointer-events-none transition-opacity duration-300 hidden md:block"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.05), transparent 70%)',
            transform: 'translate(-50%, -50%)',
            left: mousePos.x,
            top: mousePos.y,
          }}
        />
      </div>

      {/* ── Top Bar: Game Mode & Language (Super Compact) ── */}
      <motion.div variants={itemVariants} className="w-full max-w-4xl flex items-center justify-between z-20 pt-1">
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} setMode={setMode} disabled={disabled} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest hidden sm:inline">Language:</span>
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value as DebateLanguage)}
            className="bg-black/60 border border-white/10 text-white text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full cursor-pointer hover:border-blue-500/50 transition-all outline-none"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="Marathi">Marathi (मराठी)</option>
            <option value="Gujarati">Gujarati (ગુજરાતી)</option>
            <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="Bengali">Bengali (বাংলা)</option>
            <option value="Tamil">Tamil (தமிழ்)</option>
            <option value="Telugu">Telugu (తెలుగు)</option>
            <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
            <option value="Malayalam">Malayalam (മലയാളം)</option>
          </select>
        </div>
      </motion.div>

      {/* ── Main Hero Content Box (Screen Height Locked) ── */}
      <div className="w-full max-w-xl flex flex-col items-center justify-center z-10 my-auto">
        
        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-3">
          <h1 className="font-['Anton','Arial_Narrow',sans-serif] font-normal uppercase leading-[0.9] tracking-normal text-[clamp(36px,6vw,68px)]">
            <span className="text-[#eef0f3]">AI Debate </span>
            <span className="bg-gradient-to-r from-[#3b7bff] via-[#b06bff] to-[#ff3d5a] bg-clip-text text-transparent bg-[length:200%_100%] animate-[sheen_6s_ease-in-out_infinite]">
              Arena
            </span>
          </h1>
          <p className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase text-gray-400">
            Two AI Agents <span className="text-gray-600 mx-1">•</span> Structured Rounds <span className="text-gray-600 mx-1">•</span> Live Score
          </p>
        </motion.div>

        {/* Mini Duel Emblem */}
        <motion.div variants={itemVariants} className="flex items-center justify-center mb-3 w-full opacity-90">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-['Anton'] text-xs border border-[#3b7bff] text-[#3b7bff]">A</div>
            <span className="font-mono text-[9px] uppercase text-gray-400">Blue</span>
          </div>
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-2" />
          <div className="w-6 h-6 rounded-full border border-purple-500/50 flex items-center justify-center font-['Anton'] text-[10px] text-white bg-black">VS</div>
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-2" />
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase text-gray-400">Red</span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-['Anton'] text-xs border border-[#ff3d5a] text-[#ff3d5a]">B</div>
          </div>
        </motion.div>

        {/* Mode Toggles (Topic / Stock / Personality) */}
        <motion.div variants={itemVariants} className="flex justify-center gap-1.5 mb-3">
          <button
            onClick={() => { setSubject('topic'); setTopic(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] font-semibold tracking-wider uppercase border transition-all cursor-pointer ${
              subject === 'topic' ? 'text-white border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] shadow-[0_0_12px_var(--accent-dim)]' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
            }`}
          >
            <Target className="w-3 h-3" /> Topic
          </button>
          <button
            onClick={() => { setSubject('stock'); setTopic(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] font-semibold tracking-wider uppercase border transition-all cursor-pointer ${
              isStock ? 'text-white border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] shadow-[0_0_12px_var(--accent-dim)]' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Stock
          </button>
          <button
            onClick={() => { setSubject('personality'); setTopic(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] font-semibold tracking-wider uppercase border transition-all cursor-pointer ${
              isPersonality ? 'text-white border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] shadow-[0_0_12px_var(--accent-dim)]' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
            }`}
          >
            <Flame className="w-3 h-3" /> Personality
          </button>
        </motion.div>

        {/* Main Glassmorphism Card */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="relative bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-xl shadow-2xl">
            
            {/* Field Label */}
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-gray-300">
                {isStock ? '📈 Stock Ticker (NSE)' : isPersonality ? '🎭 Topic (Analyst vs Philosopher)' : 'Debate Topic'}
              </span>
              {!isStock && (
                <span className="font-mono text-[8.5px] text-gray-500">⌘ + ↵ to start</span>
              )}
            </div>

            {/* Textarea Input */}
            <div className="relative mb-2.5">
              <textarea
                ref={textareaRef}
                value={topic}
                onChange={(e) => setTopic(isStock ? e.target.value.toUpperCase() : e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStock ? 'e.g. SUZLON.NS' : isPersonality ? 'Enter a philosophical topic…' : 'Enter a controversial statement…'}
                rows={isStock ? 1 : 2}
                className="w-full bg-[#040508]/80 border border-white/10 rounded-lg p-2.5 text-white placeholder-gray-500 text-xs resize-none outline-none transition-all duration-200 focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_var(--accent-dim)] font-sans"
              />
            </div>

            {/* Example Chips */}
            <div className="flex flex-wrap gap-1 mb-3">
              {examples.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="font-sans text-[10px] px-2 py-1 rounded border border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Rounds Selector */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-[9.5px] font-semibold tracking-wider uppercase text-gray-400">Rounds:</span>
              <div className="flex gap-1.5 flex-1 max-w-[200px]">
                {([3, 5, 7] as const).map((r) => {
                  const active = rounds === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRounds(r)}
                      className={`flex-1 py-1 rounded-lg border text-center cursor-pointer font-mono text-[10px] font-semibold transition-all ${
                        active 
                          ? 'text-white border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] shadow-[0_0_8px_var(--accent-dim)]' 
                          : 'border-white/10 bg-black/40 text-gray-500 hover:bg-white/5'
                      }`}
                    >
                      {r} R
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <motion.button
              onClick={handleStart}
              disabled={!canStart}
              whileHover={canStart ? { scale: 1.01 } : {}}
              whileTap={canStart ? { scale: 0.99 } : {}}
              className={`w-full py-2.5 rounded-lg font-mono font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 text-[#08090c] transition-all duration-300 ${
                canStart ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed'
              }`}
              style={{
                background: canStart ? 'linear-gradient(100deg, #3b7bff, #b06bff, #ff3d5a)' : 'rgba(255,255,255,0.1)',
                backgroundSize: '220% 100%',
                boxShadow: canStart ? '0 8px 20px -6px var(--accent-dim)' : 'none',
              }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{launching ? 'Initializing…' : isStock ? 'Launch War-Room' : isPersonality ? 'Start Clash' : 'Start Debate'}</span>
            </motion.button>

          </div>
        </motion.div>

      </div>

      {/* ── Marquee Ticker Tape at Bottom ── */}
      <motion.div variants={itemVariants} className="w-full overflow-hidden border-t border-b border-white/10 py-1.5 relative z-10 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex w-max gap-8 animate-[marquee_26s_linear_infinite]">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <span key={idx} className="font-mono text-[10px] tracking-wider uppercase text-gray-500 whitespace-nowrap flex items-center gap-2">
              <b className="text-[#f2b705]">◆</b> {item}
            </span>
          ))}
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes sheen {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
      `}</style>
    </motion.div>
  );
}