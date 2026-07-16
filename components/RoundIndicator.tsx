'use client';

import { motion } from 'framer-motion';
import { Shield, Sword, Radio } from 'lucide-react';
import type { DebateStatus } from '@/hooks/useDebate';

interface RoundIndicatorProps {
  currentRound:   number;
  totalRounds:    number;
  currentSpeaker: 'proponent' | 'opponent' | null;
  status:         DebateStatus;
  topic:          string;
}

export default function RoundIndicator({
  currentRound,
  totalRounds,
  currentSpeaker,
  status,
  topic,
}: RoundIndicatorProps) {
  const isProActive = currentSpeaker === 'proponent';
  const isOppActive = currentSpeaker === 'opponent';

  return (
    <div className="sticky top-0 z-30 w-full px-3 py-3">
      <div
        className="glass rounded-2xl px-5 py-3.5 max-w-6xl mx-auto"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">

          {/* Topic */}
          <div className="flex-1 min-w-0 hidden sm:block">
            <p className="text-[9px] font-semibold tracking-[0.2em] text-white/25 uppercase mb-0.5">Topic</p>
            <p className="text-white/65 text-xs font-medium truncate">{topic}</p>
          </div>

          {/* Round pips */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] tracking-[0.2em] text-white/25 uppercase mr-1 hidden md:block">Round</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalRounds }).map((_, i) => {
                const done    = i + 1 < currentRound;
                const current = i + 1 === currentRound;
                return (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    animate={{
                      width:       current ? 20 : 8,
                      height:      8,
                      backgroundColor: done || current ? '#00d4ff' : 'rgba(255,255,255,0.1)',
                      boxShadow:   current ? '0 0 10px rgba(0,212,255,0.9)' : 'none',
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                );
              })}
            </div>
            <span className="text-white/50 text-xs font-orbitron font-bold ml-1 tabular-nums">
              {currentRound}/{totalRounds}
            </span>
          </div>

          {/* Speaker indicators */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Proponent */}
            <motion.div
              animate={{ opacity: isProActive ? 1 : 0.28, scale: isProActive ? 1.04 : 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neon-blue/30 bg-neon-blue/[0.08]"
              style={isProActive ? { boxShadow: '0 0 16px rgba(0,212,255,0.3)' } : {}}
            >
              {isProActive && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-neon-blue shrink-0"
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  style={{ boxShadow: '0 0 8px rgba(0,212,255,1)' }}
                />
              )}
              <Shield className="w-3 h-3 text-neon-blue" />
              <span className="text-neon-blue text-[10px] font-bold tracking-wider">PRO</span>
            </motion.div>

            <span className="text-white/15 text-[10px] font-orbitron">VS</span>

            {/* Opponent */}
            <motion.div
              animate={{ opacity: isOppActive ? 1 : 0.28, scale: isOppActive ? 1.04 : 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neon-red/30 bg-neon-red/[0.08]"
              style={isOppActive ? { boxShadow: '0 0 16px rgba(255,45,85,0.3)' } : {}}
            >
              {isOppActive && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-neon-red shrink-0"
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  style={{ boxShadow: '0 0 8px rgba(255,45,85,1)' }}
                />
              )}
              <Sword className="w-3 h-3 text-neon-red" />
              <span className="text-neon-red text-[10px] font-bold tracking-wider">OPP</span>
            </motion.div>
          </div>

          {/* Status badge */}
          <div className="shrink-0">
            {status === 'debating' && currentSpeaker && (
              <motion.div
                key="debating"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neon-green/35 bg-neon-green/[0.08]"
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-neon-green"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
                <Radio className="w-3 h-3 text-neon-green" />
                <span className="text-neon-green text-[10px] font-bold tracking-wider">LIVE</span>
              </motion.div>
            )}
            {status === 'judging' && (
              <motion.div
                key="judging"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: [1, 0.6, 1], scale: 1 }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neon-purple/35 bg-neon-purple/[0.08]"
              >
                <span className="text-neon-purple text-[10px] font-bold tracking-wider">⚖️ JUDGING</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
