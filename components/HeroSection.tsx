'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Zap, Brain, Swords, ChevronDown, TrendingUp, Target, Flame } from 'lucide-react';

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
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.35 } },
};

const itemVariants: Variants = {
  hidden:   { opacity: 0, y: 28 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export default function HeroSection({ onStart }: HeroSectionProps) {
  const [subject,    setSubject]    = useState<'topic' | 'stock' | 'personality'>('topic');
  const [topic,      setTopic]      = useState('');
  const [rounds,     setRounds]     = useState(3);
  const [launching,  setLaunching]  = useState(false);
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

  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 z-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* ── Badge row ───────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-neon-blue/25 bg-neon-blue/8 backdrop-blur-sm">
          <Brain  className="w-4 h-4 text-neon-blue animate-float" />
          <span className="text-neon-blue text-xs font-semibold tracking-[0.25em] uppercase">
            AI · Real-Time · Streaming
          </span>
          <Swords className="w-4 h-4 text-neon-purple" />
        </div>
      </motion.div>

      {/* ── Main title ──────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="text-center mb-5">
        <h1
          className="font-orbitron font-black leading-[0.9] tracking-tighter"
          style={{ fontSize: 'clamp(3rem, 10vw, 7.5rem)' }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 45%, #bf5af2 75%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 28px rgba(0,212,255,0.35))',
              display: 'block',
            }}
          >
            AI DEBATE
          </span>
          <span
            style={{
              background: 'linear-gradient(135deg, #ff2d55 0%, #bf5af2 45%, #00d4ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 28px rgba(191,90,242,0.35))',
              display: 'block',
            }}
          >
            ARENA
          </span>
        </h1>
      </motion.div>

      {/* ── Subtitle ────────────────────────────────────────────────────── */}
      <motion.p
        variants={itemVariants}
        className="text-white/35 text-center text-xs md:text-sm tracking-[0.22em] uppercase font-light mb-8 max-w-md"
      >
        Two AI agents · Structured rounds · Live SSE streaming · Judge scoring
      </motion.p>

      {/* ── Subject toggle: Topic / Stock / Personality ─────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 mb-6 p-1 rounded-full border border-white/10 bg-white/[0.03]">
        <button
          onClick={() => { setSubject('topic'); setTopic(''); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-200 ${
            subject === 'topic' ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/40' : 'text-white/35 hover:text-white/60'
          }`}
        >
          <Target className="w-3.5 h-3.5" /> Topic Debate
        </button>
        <button
          onClick={() => { setSubject('stock'); setTopic(''); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-200 ${
            isStock ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40' : 'text-white/35 hover:text-white/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Stock War-Room
        </button>
        <button
          onClick={() => { setSubject('personality'); setTopic(''); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-200 ${
            isPersonality ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40' : 'text-white/35 hover:text-white/60'
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Personality Clash
        </button>
      </motion.div>

      {/* ── Main card ───────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="w-full max-w-lg">
        <div
          className="glass rounded-2xl p-7 md:p-9 relative overflow-hidden"
          style={{
            boxShadow: isStock
              ? '0 0 0 1px rgba(52,211,153,0.08), 0 0 80px rgba(52,211,153,0.06), 0 0 140px rgba(255,45,85,0.04)'
              : isPersonality
              ? '0 0 0 1px rgba(245,158,11,0.08), 0 0 80px rgba(245,158,11,0.06), 0 0 140px rgba(239,68,68,0.04)'
              : '0 0 0 1px rgba(255,255,255,0.05), 0 0 80px rgba(0,212,255,0.06), 0 0 140px rgba(191,90,242,0.04)',
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: isStock
                ? 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, transparent 45%, rgba(255,45,85,0.06) 100%)'
                : isPersonality
                ? 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, transparent 45%, rgba(239,68,68,0.06) 100%)'
                : 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, transparent 45%, rgba(191,90,242,0.06) 100%)',
            }}
          />

          {/* ── Topic / Ticker input ────────────────────────────────────── */}
          <div className="mb-5 relative z-10">
            <label
              htmlFor="debate-topic-input"
              className="block text-[10px] font-semibold tracking-[0.22em] text-white/40 uppercase mb-2.5"
            >
              {isStock ? '📈 Stock Ticker (NSE)' : isPersonality ? '🎭 Topic — Analyst vs Philosopher' : 'Debate Topic'}
            </label>
            <textarea
              ref={textareaRef}
              id="debate-topic-input"
              value={topic}
              onChange={(e) => setTopic(isStock ? e.target.value.toUpperCase() : e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStock ? 'e.g. SUZLON.NS' : isPersonality ? 'Enter a topic for the Analyst vs Philosopher clash…' : 'Enter a controversial statement or topic…'}
              rows={isStock ? 1 : 3}
              className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-white/90 placeholder-white/18 text-sm resize-none outline-none transition-all duration-300 leading-relaxed"
              style={{ caretColor: isStock ? '#34d399' : isPersonality ? '#f59e0b' : 'var(--neon-blue)' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = isStock ? 'rgba(52,211,153,0.45)' : isPersonality ? 'rgba(245,158,11,0.45)' : 'rgba(0,212,255,0.45)';
                e.currentTarget.style.boxShadow = isStock
                  ? '0 0 0 3px rgba(52,211,153,0.08), 0 0 25px rgba(52,211,153,0.12)'
                  : isPersonality
                  ? '0 0 0 3px rgba(245,158,11,0.08), 0 0 25px rgba(245,158,11,0.12)'
                  : '0 0 0 3px rgba(0,212,255,0.08), 0 0 25px rgba(0,212,255,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {isStock ? (
              <p className="text-white/20 text-[10px] mt-1.5">NSE स्टॉक्स के लिए ".NS" ज़रूर लगाएं</p>
            ) : isPersonality ? (
              <p className="text-white/20 text-[10px] mt-1.5">⚔️ Aggressive Analyst बनाम 🧘 The Philosopher — लाइव वेब रिसर्च के साथ</p>
            ) : (
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-white/20 text-[10px] tracking-wider">⌘↵ to start</p>
                <p className="text-white/20 text-[10px]">{topic.length} chars</p>
              </div>
            )}
          </div>

          {/* ── Example chips ───────────────────────────────────────────── */}
          <div className="mb-6 relative z-10">
            <p className="text-[10px] text-white/25 mb-2 tracking-wider uppercase">
              {isStock ? 'Popular tickers' : isPersonality ? 'Clash-worthy topics' : 'Quick examples'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {examples.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`text-[10px] px-2.5 py-1.5 rounded-full border border-white/[0.08] text-white/35 transition-all duration-200 bg-white/[0.03] leading-none ${
                    isStock
                      ? 'hover:text-emerald-400 hover:border-emerald-400/35 hover:bg-emerald-400/[0.06]'
                      : isPersonality
                      ? 'hover:text-amber-400 hover:border-amber-400/35 hover:bg-amber-400/[0.06]'
                      : 'hover:text-neon-blue hover:border-neon-blue/35 hover:bg-neon-blue/[0.06]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── Rounds selector ─────────────────────────────────────────── */}
          <div className="mb-7 relative z-10">
            <label className="block text-[10px] font-semibold tracking-[0.22em] text-white/40 uppercase mb-2.5">
              Number of Rounds
            </label>
            <div className="flex gap-2.5">
              {([3, 5, 7] as const).map((r) => {
                const active = rounds === r;
                return (
                  <button
                    key={r}
                    id={`rounds-selector-${r}`}
                    onClick={() => setRounds(r)}
                    className={`flex-1 py-3 rounded-xl border text-xs font-bold font-orbitron transition-all duration-300 ${
                      active
                        ? isStock
                          ? 'border-emerald-500/60 bg-emerald-500/12 text-emerald-400'
                          : isPersonality
                          ? 'border-amber-500/60 bg-amber-500/12 text-amber-400'
                          : 'border-neon-blue/60 bg-neon-blue/12 text-neon-blue'
                        : 'border-white/[0.08] text-white/35 hover:border-white/20 hover:text-white/60 bg-white/[0.03]'
                    }`}
                    style={active ? { boxShadow: isStock ? '0 0 18px rgba(52,211,153,0.28)' : isPersonality ? '0 0 18px rgba(245,158,11,0.28)' : '0 0 18px rgba(0,212,255,0.28)' } : {}}
                  >
                    {r} Rounds
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Start button ────────────────────────────────────────────── */}
          <div className="relative z-10">
            <motion.button
              id="start-debate-btn"
              onClick={handleStart}
              disabled={!canStart}
              whileHover={canStart ? { scale: 1.018 } : {}}
              whileTap={canStart  ? { scale: 0.982 } : {}}
              className={`w-full py-4 rounded-xl font-orbitron font-bold text-xs tracking-[0.22em] uppercase transition-all duration-300 relative overflow-hidden ${
                canStart ? 'btn-shimmer cursor-pointer' : 'cursor-not-allowed opacity-30'
              }`}
              style={
                canStart
                  ? {
                      background: isStock
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 50%, #e6174a 100%)'
                        : isPersonality
                        ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #00b8d9 0%, #9645e0 50%, #e6174a 100%)',
                      boxShadow: isStock
                        ? '0 0 28px rgba(52,211,153,0.45), 0 0 60px rgba(255,45,85,0.25), 0 4px 20px rgba(0,0,0,0.4)'
                        : isPersonality
                        ? '0 0 28px rgba(245,158,11,0.45), 0 0 60px rgba(239,68,68,0.25), 0 4px 20px rgba(0,0,0,0.4)'
                        : '0 0 28px rgba(0,212,255,0.45), 0 0 60px rgba(191,90,242,0.25), 0 4px 20px rgba(0,0,0,0.4)',
                      color: '#ffffff',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.2)',
                    }
              }
            >
              <span className="relative flex items-center justify-center gap-2.5">
                <Zap className="w-3.5 h-3.5" />
                {launching ? 'Initializing Arena…' : isStock ? 'Launch War-Room' : isPersonality ? 'Start the Clash' : 'Start Debate'}
                <Zap className="w-3.5 h-3.5" />
              </span>
            </motion.button>

            <AnimatePresence>
              {launching && (
                <motion.div
                  className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Scroll cue ──────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30"
      >
        <div className="w-px h-10 bg-gradient-to-b from-neon-blue/60 to-transparent" />
        <ChevronDown className="w-4 h-4 text-white animate-bounce" />
      </motion.div>
    </motion.div>
  );
}