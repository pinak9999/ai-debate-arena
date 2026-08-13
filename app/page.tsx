'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Globe2, RotateCcw, Sparkles } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import DebateArena from '@/components/DebateArena';
import JudgeVerdict from '@/components/JudgeVerdict';
import ParticleBackground from '@/components/ParticleBackground';
import { useDebate, DebateLanguage } from '@/hooks/useDebate';
import { ModeToggle } from '@/components/ModeToggle';

export default function Home() {
  const debate = useDebate();
  const [selectedLang, setSelectedLang] = useState<DebateLanguage>('Hindi');

  const handleStart = (
    input: string,
    rounds: number,
    subject: 'topic' | 'stock' | 'personality'
  ) => {
    debate.startDebate({
      topic: input,
      totalRounds: rounds,
      subject,
      language: selectedLang,
    });
  };

  const showHero = debate.status === 'idle';
  const showArena = debate.status !== 'idle';
  const showVerdict = debate.status === 'finished' && !!debate.scores;

  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 0%, rgba(84,220,255,.07), transparent 28%), radial-gradient(circle at 10% 70%, rgba(154,108,255,.06), transparent 25%), #03060d',
      }}
    >
      <ParticleBackground />

      {/* Clean ambient grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          opacity: 0.2,
          backgroundImage:
            'linear-gradient(rgba(84,220,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(84,220,255,.035) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 92%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 92%)',
        }}
      />

      <AnimatePresence mode="wait">
        {showHero && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.25 } }}
            style={{
              position: 'relative',
              zIndex: 10,
              minHeight: '100dvh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Compact top control dock.
                IMPORTANT: it is NOT a separate full-height section anymore. */}
            <header
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px clamp(14px, 3vw, 34px)',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 1180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 6,
                  borderRadius: 17,
                  background: 'rgba(8,13,26,.72)',
                  border: '1px solid rgba(255,255,255,.075)',
                  boxShadow: '0 12px 40px rgba(0,0,0,.24)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    paddingLeft: 8,
                    color: 'rgba(255,255,255,.55)',
                    fontSize: 8,
                    fontWeight: 900,
                    letterSpacing: '.14em',
                  }}
                >
                  <Sparkles size={13} style={{ color: '#55dcff' }} />
                  ARENA CONTROL
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 5px',
                      borderRadius: 11,
                      background: 'rgba(255,255,255,.035)',
                    }}
                  >
                    <ModeToggle
                      mode={debate.mode}
                      setMode={debate.setMode}
                      disabled={debate.status !== 'idle'}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 10px',
                      borderRadius: 11,
                      border: '1px solid rgba(255,255,255,.065)',
                      background: 'rgba(255,255,255,.025)',
                    }}
                  >
                    <Globe2 size={12} style={{ color: '#9a6cff' }} />
                    <select
                      aria-label="Select debate language"
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value as DebateLanguage)}
                      style={{
                        border: 0,
                        outline: 0,
                        background: 'transparent',
                        color: 'rgba(255,255,255,.65)',
                        fontSize: 9,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <option style={{ background: '#090d18' }} value="Hindi">Hindi</option>
                      <option style={{ background: '#090d18' }} value="English">English</option>
                      <option style={{ background: '#090d18' }} value="Gujarati">Gujarati</option>
                      <option style={{ background: '#090d18' }} value="Marathi">Marathi</option>
                      <option style={{ background: '#090d18' }} value="Punjabi">Punjabi</option>
                    </select>
                  </div>
                </div>
              </div>
            </header>

            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
              <HeroSection onStart={handleStart} />
            </div>
          </motion.div>
        )}

        {showArena && (
          <motion.div
            key="arena"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="min-h-screen"
            style={{ position: 'relative', zIndex: 10 }}
          >
            <div
              className="flex items-center justify-between px-4 pt-4 pb-1 max-w-7xl mx-auto"
              style={{ position: 'relative', zIndex: 20 }}
            >
              <div>
                <h1 className="font-orbitron font-black text-base text-white tracking-[0.18em] uppercase">
                  {debate.subject === 'stock'
                    ? 'Financial War-Room'
                    : debate.subject === 'personality'
                      ? 'Personality Clash Arena'
                      : 'AI Debate Arena'}
                </h1>
                <p className="text-white/25 text-[10px] tracking-[0.25em] uppercase">
                  {debate.status === 'judging' ? 'Evaluating…' : 'Live Session'} | Language:{' '}
                  {debate.language}
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