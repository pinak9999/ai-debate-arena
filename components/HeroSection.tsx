'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Zap, Brain, Swords, ChevronDown, TrendingUp, Target, Flame } from 'lucide-react';

interface HeroSectionProps {
  onStart: (input: string, rounds: number, subject: 'topic' | 'stock' | 'personality') => void;
}

const EXAMPLES = {
  topic: [
    'AI will replace human creativity entirely',
    'Universal Basic Income is net positive',
    'Social media does more harm than good',
    'Space colonisation should be humanity\'s top priority',
    'Nuclear energy is key to solving climate change',
  ],
  stock: ['SUZLON.NS', 'TATAMOTORS.NS', 'RELIANCE.NS', 'IRFC.NS', 'INFY.NS', 'ZOMATO.NS'],
  personality: [
    'Should the death penalty be abolished worldwide?',
    'Is capitalism the best economic system for humanity?',
    'Should AI be allowed to make life-or-death medical decisions?',
    'Is space exploration justified while poverty exists on Earth?',
    'Should social media be banned for under-18s?',
  ],
};

const TICKER_ITEMS = [
  'Round-based scoring', 'Live AI judge', 'Elo-style ratings', 
  'NSE stock debates', 'Multilingual support', 'Spectator & player modes', 'Real-time streaming responses'
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.35 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function HeroSection({ onStart }: HeroSectionProps) {
  const [subject, setSubject] = useState<'topic' | 'stock' | 'personality'>('topic');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);
  const [launching, setLaunching] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStock = subject === 'stock';
  const isPersonality = subject === 'personality';
  const examples = EXAMPLES[subject];

  // Mouse spotlight tracker
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
    setTimeout(() => onStart(topic.trim(), rounds, subject), 500);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleStart();
  };

  const canStart = topic.trim().length > 0 && !launching;

  // Theme accent configs
  const accentColor = isStock ? '#22e0a0' : isPersonality ? '#f2b705' : '#3b7bff';
  const accentDim = isStock ? '#22e0a033' : isPersonality ? '#f2b70533' : '#3b7bff33';

  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-between px-4 pt-12 pb-6 z-10 overflow-hidden bg-[#08090c]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ '--accent': accentColor, '--accent-dim': accentDim } as any}
    >
      {/* ── Ambient Duel Backdrop & Scanlines ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[140%] filter blur-[90px] opacity-22 bg-[radial-gradient(circle_at_30%_30%,#3b7bff,transparent_70%)]" />
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[140%] filter blur-[90px] opacity-22 bg-[radial-gradient(circle_at_70%_60%,#ff3d5a,transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22120%22%20height=%22120%22%3E%3Cfilter%20id=%22n%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.9%22%20numOctaves=%222%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23n)%22/%3E%3C/svg%3E')] pointer-events-none" />
        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[repeating-linear-gradient(to_bottom,transparent_0_3px,rgba(255,255,255,0.012)_3px_4px)]" />
        <div 
          className="fixed z-2 w-[520px] h-[520px] rounded-full pointer-events-none transition-opacity duration-300 hidden md:block"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)',
            transform: 'translate(-50%, -50%)',
            left: mousePos.x,
            top: mousePos.y,
          }}
        />
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center my-auto z-10">
        
        {/* ── Eyebrow Badge ── */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22e0a0] shadow-[0_0_10px_#22e0a0] animate-pulse" />
          <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#9ba1ad]">
            Live &nbsp;·&nbsp; AI vs AI &nbsp;·&nbsp; Real-Time Judging
          </span>
        </motion.div>

        {/* ── Headline Title ── */}
        <motion.div variants={itemVariants} className="text-center mb-6">
          <h1 className="font-['Anton','Arial_Narrow',sans-serif] font-normal uppercase leading-[0.86] tracking-[0.01em] text-[clamp(52px,12vw,120px)]">
            <span className="block text-[#eef0f3]">AI Debate</span>
            <span className="block bg-gradient-to-r from-[#3b7bff] via-[#b06bff] to-[#ff3d5a] bg-clip-text text-transparent bg-[length:200%_100%] animate-[sheen_6s_ease-in-out_infinite]">
              Arena
            </span>
          </h1>
          <p className="mt-4 font-mono text-[12px] tracking-[0.24em] uppercase text-[#5b616e]">
            <strong className="text-[#9ba1ad] font-semibold">Two Agents</strong>
            <span className="mx-3 text-[#333844]">/</span>
            <strong className="text-[#9ba1ad] font-semibold">Structured Rounds</strong>
            <span className="mx-3 text-[#333844]">/</span>
            <strong className="text-[#9ba1ad] font-semibold">Live Judge Score</strong>
          </p>
        </motion.div>

        {/* ── Tale-of-the-tape Duel Emblem ── */}
        <motion.div variants={itemVariants} className="flex items-center justify-center my-4 w-full">
          <div className="flex flex-col items-center gap-1.5 w-[118px]">
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center font-['Anton'] text-xl border-2 border-[#3b7bff] text-[#3b7bff] shadow-[0_0_20px_rgba(59,123,255,0.3)]">A</div>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#5b616e]">Agent <strong className="text-[#9ba1ad]">Blue</strong></span>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
          <div className="relative w-[56px] h-[56px] mx-[-4px] flex items-center justify-center flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#3b7bff,#f2b705,#ff3d5a,#f2b705,#3b7bff)] animate-[spin_5s_linear_infinite]" style={{ mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))', WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))' }} />
            <span className="relative font-['Anton'] text-base text-[#eef0f3] bg-[#08090c] w-[46px] h-[46px] rounded-full flex items-center justify-center">VS</span>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/10" />
          <div className="flex flex-col items-center gap-1.5 w-[118px]">
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center font-['Anton'] text-xl border-2 border-[#ff3d5a] text-[#ff3d5a] shadow-[0_0_20px_rgba(255,61,90,0.3)]">B</div>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#5b616e]">Agent <strong className="text-[#9ba1ad]">Red</strong></span>
          </div>
        </motion.div>

        {/* ── Mode Selection Buttons ── */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2.5 my-6">
          <button
            onClick={() => { setSubject('topic'); setTopic(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-[11px] font-semibold tracking-[0.14em] uppercase border transition-all duration-200 cursor-pointer ${
              subject === 'topic' ? 'text-[#eef0f3] border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] shadow-[0_0_22px_var(--accent-dim)]' : 'border-white/10 bg-white/[0.03] text-[#5b616e] hover:bg-white/[0.06] hover:text-[#9ba1ad]'
            }`}
          >
            <Target className="w-3.5 h-3.5 opacity-80" /> Topic Debate
          </button>
          <button
            onClick={() => { setSubject('stock'); setTopic(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-[11px] font-semibold tracking-[0.14em] uppercase border transition-all duration-200 cursor-pointer ${
              isStock ? 'text-[#eef0f3] border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] shadow-[0_0_22px_var(--accent-dim)]' : 'border-white/10 bg-white/[0.03] text-[#5b616e] hover:bg-white/[0.06] hover:text-[#9ba1ad]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 opacity-80" /> Stock War-Room
          </button>
          <button
            onClick={() => { setSubject('personality'); setTopic(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-[11px] font-semibold tracking-[0.14em] uppercase border transition-all duration-200 cursor-pointer ${
              isPersonality ? 'text-[#eef0f3] border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] shadow-[0_0_22px_var(--accent-dim)]' : 'border-white/10 bg-white/[0.03] text-[#5b616e] hover:bg-white/[0.06] hover:text-[#9ba1ad]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 opacity-80" /> Personality Clash
          </button>
        </motion.div>

        {/* ── Glassmorphism Input Card ── */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="relative bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 rounded-[20px] p-7 md:p-8 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
            
            {/* Field Label */}
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="font-mono text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[#9ba1ad]">
                {isStock ? '📈 Stock Ticker (NSE)' : isPersonality ? '🎭 Topic (Analyst vs Philosopher)' : 'Debate Topic'}
              </span>
              {!isStock && (
                <span className="font-mono text-[9.5px] text-[#5b616e]">⌘ + ↵ to start · {topic.length} chars</span>
              )}
            </div>

            {/* Input area */}
            <div className="relative mb-5">
              <textarea
                ref={textareaRef}
                value={topic}
                onChange={(e) => setTopic(isStock ? e.target.value.toUpperCase() : e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStock ? 'e.g. SUZLON.NS or RELIANCE.NS' : isPersonality ? 'Enter a philosophical or ethical topic…' : 'Enter a controversial statement…'}
                rows={isStock ? 1 : 3}
                className="w-full bg-[#040508]/70 border border-white/10 rounded-xl p-4 text-[#eef0f3] placeholder-[#5b616e] text-sm md:text-[14.5px] resize-none outline-none transition-all duration-200 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] font-sans"
              />
            </div>

            {/* Chips / Quick Examples */}
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[#9ba1ad] mb-3">
              {isStock ? 'Popular Tickers' : isPersonality ? 'Clash-Worthy Topics' : 'Quick Examples'}
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {examples.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="font-sans text-xs px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-[#9ba1ad] hover:bg-white/[0.07] hover:text-[#eef0f3] hover:border-white/20 transition-all cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Rounds Selector */}
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[#9ba1ad] mb-2.5">Rounds</div>
            <div className="flex gap-2.5 mb-7">
              {([3, 5, 7] as const).map((r) => {
                const active = rounds === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRounds(r)}
                    className={`flex-1 py-3.5 rounded-xl border text-center cursor-pointer font-mono text-[13px] font-semibold tracking-[0.040em] transition-all duration-200 ${
                      active 
                        ? 'text-[#eef0f3] border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] shadow-[0_0_0_1px_var(--accent)_inset]' 
                        : 'border-white/10 bg-[#040508]/50 text-[#5b616e] hover:bg-white/[0.05] hover:text-[#9ba1ad]'
                    }`}
                  >
                    <span className="block font-['Anton'] text-xl text-inherit mb-0.5">{r}</span>
                    Rounds
                  </button>
                );
              })}
            </div>

            {/* Start Button */}
            <motion.button
              onClick={handleStart}
              disabled={!canStart}
              whileHover={canStart ? { y: -1 } : {}}
              whileTap={canStart ? { y: 0 } : {}}
              className={`w-full py-4 rounded-xl font-mono font-bold text-xs tracking-[0.18em] uppercase flex items-center justify-center gap-2.5 text-[#08090c] transition-all duration-300 ${
                canStart ? 'cursor-pointer' : 'opacity-35 cursor-not-allowed'
              }`}
              style={{
                background: canStart ? 'linear-gradient(100deg, #3b7bff, #b06bff, #ff3d5a)' : 'rgba(255,255,255,0.1)',
                backgroundSize: '220% 100%',
                boxShadow: canStart ? '0 12px 30px -10px var(--accent-dim)' : 'none',
              }}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{launching ? 'Initializing Arena…' : isStock ? 'Launch War-Room' : isPersonality ? 'Start the Clash' : 'Start Debate'}</span>
            </motion.button>

          </div>
        </motion.div>

      </div>

      {/* ── Marquee Ticker Tape ── */}
      <motion.div variants={itemVariants} className="w-full mt-8 overflow-hidden border-t border-b border-white/10 py-3 relative z-10 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex w-max gap-10 animate-[marquee_26s_linear_infinite]">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <span key={idx} className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#5b616e] whitespace-nowrap flex items-center gap-3">
              <b className="text-[#f2b705]">◆</b> {item}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Global CSS for custom animations used by Claude's design */}
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