'use client';

import { motion } from 'framer-motion';
import {
  Trophy, Star, Brain, Lightbulb, MessageSquare,
  BookOpen, Target, Crown,
} from 'lucide-react';
import type { JudgeScores } from '@/hooks/useDebate';

// ─── ScoreBar ────────────────────────────────────────────────────────────────

interface ScoreBarProps {
  label:          string;
  icon:           React.ReactNode;
  proScore:       number;
  oppScore:       number;
  delay:          number;
}

function ScoreBar({ label, icon, proScore, oppScore, delay }: ScoreBarProps) {
  const proWins = proScore > oppScore;
  const oppWins = oppScore > proScore;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.45, ease: 'easeOut' }}
      className="mb-5"
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-white/30">{icon}</span>
          <span className="text-white/50 text-[10px] font-semibold tracking-[0.18em] uppercase">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2.5 font-orbitron font-bold text-xs tabular-nums">
          <span style={{ color: proWins ? '#00d4ff' : 'rgba(255,255,255,0.25)' }}>{proScore}</span>
          <span className="text-white/15">—</span>
          <span style={{ color: oppWins ? '#ff2d55' : 'rgba(255,255,255,0.25)' }}>{oppScore}</span>
        </div>
      </div>

      {/* Bar track */}
      <div className="relative h-2.5 rounded-full overflow-hidden bg-white/[0.05]">
        {/* Centre marker */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/15 z-10" />

        {/* Proponent (grows left → centre) */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-l-full"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,212,255,0.25) 0%, rgba(0,212,255,0.85) 100%)',
            boxShadow: '0 0 8px rgba(0,212,255,0.55)',
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${(proScore / 100) * 50}%` }}
          transition={{ delay: delay + 0.15, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Opponent (grows right → centre) */}
        <motion.div
          className="absolute inset-y-0 right-0 rounded-r-full"
          style={{
            background:
              'linear-gradient(270deg, rgba(255,45,85,0.25) 0%, rgba(255,45,85,0.85) 100%)',
            boxShadow: '0 0 8px rgba(255,45,85,0.55)',
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${(oppScore / 100) * 50}%` }}
          transition={{ delay: delay + 0.15, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}

// ─── JudgeVerdict ─────────────────────────────────────────────────────────────

interface JudgeVerdictProps {
  scores: JudgeScores;
  topic:  string;
}

const CATEGORIES: Array<{
  key: keyof JudgeScores['proponent'];
  label: string;
  icon: React.ReactNode;
}> = [
  { key: 'logic',      label: 'Logic & Reasoning', icon: <Brain         className="w-3.5 h-3.5" /> },
  { key: 'creativity', label: 'Creativity',         icon: <Lightbulb    className="w-3.5 h-3.5" /> },
  { key: 'persuasion', label: 'Persuasion',         icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { key: 'evidence',   label: 'Evidence Quality',  icon: <BookOpen      className="w-3.5 h-3.5" /> },
  { key: 'overall',    label: 'Overall Score',     icon: <Target        className="w-3.5 h-3.5" /> },
];

export default function JudgeVerdict({ scores, topic }: JudgeVerdictProps) {
  const isTie  = scores.winner === 'tie';
  const isPro  = scores.winner === 'proponent';
  const isOpp  = scores.winner === 'opponent';

  const winnerColor = isTie ? '#bf5af2' : isPro ? '#00d4ff' : '#ff2d55';
  const winnerRgb   = isTie ? '191,90,242' : isPro ? '0,212,255' : '255,45,85';
  const winnerLabel = isTie ? 'TIE GAME' : isPro ? 'PROPONENT WINS' : 'OPPONENT WINS';

  return (
    <motion.section
      id="judge-verdict"
      className="relative z-10 w-full px-3 pb-20 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 70 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Section header ─────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.65, type: 'spring', bounce: 0.45 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
          style={{
            background: 'linear-gradient(135deg, rgba(191,90,242,0.25) 0%, rgba(255,214,10,0.25) 100%)',
            border:     '2px solid rgba(191,90,242,0.4)',
            boxShadow:  '0 0 40px rgba(191,90,242,0.45), 0 0 80px rgba(255,214,10,0.15)',
          }}
        >
          <Trophy className="w-7 h-7 text-yellow-400" />
        </motion.div>

        <h2 className="font-orbitron font-black text-3xl md:text-4xl text-white tracking-wider mb-1">
          JUDGE'S VERDICT
        </h2>
        <p className="text-white/30 text-xs tracking-[0.25em] uppercase">Debate concluded · AI evaluation</p>
      </div>

      {/* ── Winner banner ──────────────────────────────────────────────── */}
      <motion.div
        className="relative rounded-2xl p-6 mb-6 text-center overflow-hidden"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.55 }}
        style={{
          background: `linear-gradient(135deg, rgba(${winnerRgb},0.12) 0%, rgba(${winnerRgb},0.04) 100%)`,
          border:     `1px solid rgba(${winnerRgb},0.35)`,
          boxShadow:  `0 0 60px rgba(${winnerRgb},0.18), 0 0 120px rgba(${winnerRgb},0.06)`,
        }}
      >
        {/* Scanline texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px)',
          }}
        />

        <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span
            className="font-orbitron font-black text-2xl md:text-3xl tracking-wider"
            style={{
              color:      winnerColor,
              textShadow: `0 0 20px rgba(${winnerRgb},0.85)`,
            }}
          >
            {winnerLabel}
          </span>
          <Crown className="w-5 h-5 text-yellow-400" />
        </div>

        {/* Summary */}
        {scores.summary && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-white/45 text-sm leading-relaxed max-w-2xl mx-auto mt-3 relative z-10"
          >
            {scores.summary}
          </motion.p>
        )}
      </motion.div>

      {/* ── Score breakdown ────────────────────────────────────────────── */}
      <div
        className="glass rounded-2xl p-6 md:p-8"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 0 80px rgba(0,0,0,0.6)' }}
      >
        {/* Column labels */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full bg-neon-blue"
              style={{ boxShadow: '0 0 8px rgba(0,212,255,1)' }}
            />
            <span className="text-neon-blue text-[10px] font-bold tracking-[0.2em] uppercase">
              Proponent
            </span>
          </div>
          <span className="text-white/20 text-[10px] font-orbitron tracking-wider uppercase">
            Score Breakdown
          </span>
          <div className="flex items-center gap-2">
            <span className="text-neon-red text-[10px] font-bold tracking-[0.2em] uppercase">
              Opponent
            </span>
            <div
              className="w-2.5 h-2.5 rounded-full bg-neon-red"
              style={{ boxShadow: '0 0 8px rgba(255,45,85,1)' }}
            />
          </div>
        </div>

        {/* Bars */}
        {CATEGORIES.map((cat, i) => (
          <ScoreBar
            key={cat.key}
            label={cat.label}
            icon={cat.icon}
            proScore={scores.proponent[cat.key]}
            oppScore={scores.opponent[cat.key]}
            delay={0.5 + i * 0.1}
          />
        ))}

        {/* ── Final score display ──────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-7 pt-7 border-t border-white/[0.07]">
          {/* Proponent total */}
          <div className="text-center">
            <motion.div
              className="font-orbitron font-black tabular-nums leading-none"
              style={{
                fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
                color: '#00d4ff',
                textShadow: '0 0 30px rgba(0,212,255,0.65)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, type: 'spring', bounce: 0.5 }}
            >
              {scores.proponent.overall}
            </motion.div>
            <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mt-1">Proponent</p>
          </div>

          {/* VS */}
          <div className="text-center flex flex-col items-center gap-1.5">
            <span className="font-orbitron text-white/15 text-xl tracking-widest">VS</span>
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-yellow-400/60" />
              <span className="text-white/20 text-[10px] tracking-wider uppercase">Final</span>
              <Star className="w-3.5 h-3.5 text-yellow-400/60" />
            </div>
          </div>

          {/* Opponent total */}
          <div className="text-center">
            <motion.div
              className="font-orbitron font-black tabular-nums leading-none"
              style={{
                fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
                color: '#ff2d55',
                textShadow: '0 0 30px rgba(255,45,85,0.65)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: 'spring', bounce: 0.5 }}
            >
              {scores.opponent.overall}
            </motion.div>
            <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mt-1">Opponent</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
