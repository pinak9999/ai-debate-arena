'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import DebateArena from '@/components/DebateArena';
import JudgeVerdict from '@/components/JudgeVerdict';
import ParticleBackground from '@/components/ParticleBackground';
import { useDebate, DebateLanguage } from '@/hooks/useDebate'; // DebateLanguage टाइप इम्पोर्ट किया
import { ModeToggle } from '@/components/ModeToggle';

export default function Home() {
  const debate = useDebate();
  
  // 🔥 भाषा स्टेट
  const [selectedLang, setSelectedLang] = useState<DebateLanguage>('Hindi');

  const handleStart = (input: string, rounds: number, subject: 'topic' | 'stock' | 'personality') => {
    // 🔥 यहाँ भाषा पास की जा रही है
    debate.startDebate({ topic: input, totalRounds: rounds, subject, language: selectedLang });
  };

  const showHero   = debate.status === 'idle';
  const showArena  = debate.status !== 'idle';
  const showVerdict = debate.status === 'finished' && !!debate.scores;

  return (
    <main className="relative min-h-screen bg-cyber-dark overflow-x-hidden">
      {/* ── Ambient layers ────────────────────────────────────────────── */}
      <ParticleBackground />

      {/* Subtle cyber grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.28]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.008) 3px, rgba(0,212,255,0.008) 4px)',
        }}
        aria-hidden="true"
      />

      {/* ── Pages ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {showHero && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3 } }}
            className="flex flex-col items-center justify-center min-h-screen relative z-10"
          >
            {/* ── MODE & LANGUAGE SELECTOR ────────────────────────── */}
            <div className="mb-8 flex flex-col items-center gap-6">
              <div className="flex flex-col items-center">
                <p className="text-gray-400 text-xs mb-3 uppercase tracking-widest font-bold">Select Game Mode</p>
                <ModeToggle
                  mode={debate.mode}
                  setMode={debate.setMode}
                  disabled={debate.status !== 'idle'}
                />
              </div>

              {/* 🔥 नया लैंग्वेज सेलेक्टर */}
              <div className="flex flex-col items-center">
                 <p className="text-gray-400 text-xs mb-3 uppercase tracking-widest font-bold">Select Language</p>
                 <select 
                  value={selectedLang} 
                  onChange={(e) => setSelectedLang(e.target.value as DebateLanguage)}
                  className="bg-black/40 border border-white/10 text-white text-xs uppercase tracking-widest px-6 py-2 rounded-full cursor-pointer hover:border-blue-500/50 transition-all outline-none"
                >
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="English">English</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                </select>
              </div>
            </div>

            <HeroSection onStart={handleStart} />
          </motion.div>
        )}

        {showArena && (
          <motion.div
            key="arena"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55 }}
            className="min-h-screen"
          >
            <div className="flex items-center justify-between px-4 pt-5 pb-1 max-w-7xl mx-auto relative z-20">
              <div>
                <h1 className="font-orbitron font-black text-base text-white tracking-[0.18em] uppercase">
                  {debate.subject === 'stock' ? 'Financial War-Room' : debate.subject === 'personality' ? 'Personality Clash Arena' : 'AI Debate Arena'}
                </h1>
                <p className="text-white/25 text-[10px] tracking-[0.25em] uppercase">
                  {debate.status === 'judging' ? 'Evaluating…' : 'Live Session'} | Language: {debate.language}
                </p>
              </div>
              <button
                id="new-debate-btn"
                onClick={debate.resetDebate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/35 hover:text-white/70 hover:border-white/25 text-[10px] font-semibold tracking-wider transition-all duration-200 bg-white/[0.03] hover:bg-white/[0.07]"
              >
                <RotateCcw className="w-3 h-3" />
                New Debate
              </button>
            </div>

            <AnimatePresence>
              {debate.status === 'error' && debate.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mx-4 mt-2 max-w-7xl mx-auto px-4 py-3 rounded-xl border border-red-500/35 bg-red-500/8 flex items-start gap-3 relative z-20"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-xs font-semibold mb-0.5">API Error</p>
                    <p className="text-red-300/70 text-xs">{debate.error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <DebateArena
              messages={debate.messages}
              streamingText={debate.streamingText}
              streamingMessageId={debate.streamingMessageId}
              currentRound={debate.currentRound}
              totalRounds={debate.totalRounds}
              currentSpeaker={debate.currentSpeaker}
              status={debate.status}
              topic={debate.topic}
              scoreHistory={debate.scoreHistory}
              waitingForPlayer={debate.waitingForPlayer}
              submitPlayerArgument={debate.submitPlayerArgument}
              fallacies={debate.fallacies}
              factChecks={debate.factChecks}
              factCheckLoading={debate.factCheckLoading}
              scores={debate.scores}
              agentLogs={debate.agentLogs}
              audienceScore={debate.audienceScore}
              subject={debate.subject}
              stockData={debate.stockData}
              stockLoading={debate.stockLoading}
            />

            <AnimatePresence>
              {showVerdict && debate.scores && (
                <motion.div
                  key="verdict"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-4 px-4 max-w-7xl mx-auto mb-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-purple/40 to-transparent" />
                    <span className="text-neon-purple text-[10px] font-orbitron font-bold tracking-[0.25em] uppercase">
                      ⚖️ Judge's Decision
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-purple/40 to-transparent" />
                  </div>
                  <JudgeVerdict scores={debate.scores} topic={debate.topic} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}