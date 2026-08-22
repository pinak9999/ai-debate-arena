'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, AlertTriangle, Menu, History } from 'lucide-react'; 
import HeroSection from '@/components/HeroSection';
import DebateArena from '@/components/DebateArena';
import JudgeVerdict from '@/components/JudgeVerdict';
import ParticleBackground from '@/components/ParticleBackground';
import Sidebar from '@/components/Sidebar';
import { useDebate, DebateLanguage } from '@/hooks/useDebate'; 

export default function Home() {
  const debate = useDebate();
  const [selectedLang, setSelectedLang] = useState<DebateLanguage>('Hindi');

  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const savedDebateRef = useRef(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/debate-history');
      const data = await res.json();
      if (data.success) {
        setHistoryList(data.debates);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (debate.status === 'finished' && debate.scores && !savedDebateRef.current) {
      savedDebateRef.current = true;
      
      fetch('/api/debate-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: debate.topic,
          mode: debate.subject,
          language: debate.language,
          messages: debate.messages,
          winner: debate.scores.winner
        })
      }).then(() => fetchHistory());
    }
  }, [debate.status, debate.scores, debate.topic, debate.subject, debate.language, debate.messages]);

  const handleStart = (
    input: string, 
    rounds: number, 
    subject: 'topic' | 'stock' | 'personality' | 'youtube' | 'document', 
    documentText?: string
  ) => {
    savedDebateRef.current = false;
    debate.startDebate({ topic: input, totalRounds: rounds, subject, language: selectedLang, documentText });
  };

  const handleNewDebate = () => {
    debate.resetDebate();
    savedDebateRef.current = false;
    setIsSidebarOpen(false); 
  };

  const handleSelectDebate = (item: any) => {
    // 🔥 यही वो जादुई लाइन है जो डुप्लीकेट डिबेट बनने से रोकेगी!
    savedDebateRef.current = true; 
    
    debate.loadPastDebate(item);
    setIsSidebarOpen(false); 
  };

  const showHero    = debate.status === 'idle';
  const showArena   = debate.status !== 'idle';
  const showVerdict = debate.status === 'finished' && !!debate.scores;

  return (
    <div className="relative min-h-screen bg-[#08090c] overflow-hidden font-sans">
      
      {/* ─── SIDEBAR OVERLAY COMPONENT ─── */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        historyList={historyList} 
        onSelectDebate={handleSelectDebate} 
        onNewDebate={handleNewDebate}
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* ─── 🔥 CREATIVE VERTICAL SIDE-TAB (EDGE HANDLE) ─── */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-1/2 left-0 -translate-y-1/2 z-[40] flex flex-col items-center gap-3 py-5 px-1.5 bg-[#05070a]/90 backdrop-blur-xl border border-l-0 border-cyan-500/40 rounded-r-xl hover:bg-cyan-900/50 hover:px-2.5 transition-all duration-300 shadow-[0_0_20px_rgba(0,212,255,0.15)] group"
      >
        <Menu className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors drop-shadow-md" />
        <span 
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} 
          className="text-[9px] font-orbitron font-bold text-cyan-400 group-hover:text-white tracking-[0.25em] uppercase transition-colors"
        >
          Archives
        </span>
      </button>

      {/* ─── MAIN DEBATE AREA ─── */}
      <main className="relative h-screen overflow-y-auto w-full">
        <ParticleBackground />

        {/* Cyber Grid Pattern */}
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.25]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '40px 48px',
          }}
        />

        <AnimatePresence mode="wait">
          {showHero && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3 } }}
              className="w-full min-h-screen relative z-10 flex flex-col justify-between" 
            >
              <HeroSection 
                onStart={handleStart} 
                mode={debate.mode} 
                setMode={debate.setMode} 
                selectedLang={selectedLang} 
                setSelectedLang={setSelectedLang} 
              />
            </motion.div>
          )}

          {showArena && (
            <motion.div
              key="arena"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55 }}
              className="min-h-screen pt-4"
            >
              <div className="flex items-center justify-between px-4 pt-5 pb-1 max-w-7xl mx-auto relative z-20">
                <div> 
                  <h1 className="font-orbitron font-black text-base text-white tracking-[0.18em] uppercase">
                    {debate.subject === 'stock' ? 'Financial War-Room' : 
                     debate.subject === 'personality' ? 'Personality Clash Arena' : 
                     debate.subject === 'youtube' ? 'YouTube Creator Clash' : 
                     debate.subject === 'document' ? 'Enterprise Code Audit' : 
                     'AI Debate Arena'}
                  </h1>
                  <p className="text-white/25 text-[10px] tracking-[0.25em] uppercase">
                    {debate.status === 'judging' ? 'Evaluating…' : 'Live Session'} | Language: {debate.language}
                  </p>
                </div>
                <button
                  id="new-debate-btn"
                  onClick={handleNewDebate}
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
                    className="mx-4 mt-2 max-w-7xl px-4 py-3 rounded-xl border border-red-500/35 bg-red-500/8 flex items-start gap-3 relative z-20"
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
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                      <span className="text-purple-400 text-[10px] font-orbitron font-bold tracking-[0.25em] uppercase">
                        ⚖️ Judge's Decision
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                    </div>
                    <JudgeVerdict scores={debate.scores} topic={debate.topic} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}