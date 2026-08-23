'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, AlertTriangle, Menu, History, Terminal as TerminalIcon } from 'lucide-react'; 
import HeroSection from '@/components/HeroSection';
import DebateArena from '@/components/DebateArena';
import JudgeVerdict from '@/components/JudgeVerdict';
import ParticleBackground from '@/components/ParticleBackground';
import Sidebar from '@/components/Sidebar';
import { useDebate, DebateLanguage } from '@/hooks/useDebate'; 
import { ArgumentDAG } from '@/components/ArgumentDAG'; 

export default function Home() {
  const debate = useDebate();
  const [selectedLang, setSelectedLang] = useState<DebateLanguage>('Hindi');

  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const savedDebateRef = useRef(false);

  // 🔥 NEW: Boot-up Sequence States
  const [isBooting, setIsBooting] = useState(false);
  const [bootText, setBootText] = useState<string[]>([]);

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

  // 🔥 NEW: Intercepted Handle Start for Boot Sequence
  const handleStart = (
    input: string, 
    rounds: number, 
    subject: 'topic' | 'stock' | 'personality' | 'youtube' | 'document', 
    documentText?: string
  ) => {
    savedDebateRef.current = false;
    
    // 1. Start the Boot Sequence
    setIsBooting(true);
    setBootText([]);

    const sequence = [
      "> ESTABLISHING SECURE NEURAL LINK...",
      "> LOADING RAG KNOWLEDGE BASE...",
      "> BYPASSING STANDARD PROTOCOLS...",
      "> INJECTING FALLACY MIDDLEWARE...",
      "> AGENTS ONLINE. PREPARING ARENA..."
    ];

    let step = 0;
    
    // 2. Typewriter effect for terminal
    const interval = setInterval(() => {
      if (step < sequence.length) {
        setBootText(prev => [...prev, sequence[step]]);
        step++;
      } else {
        clearInterval(interval);
        // 3. After boot sequence finishes, launch the actual debate
        setTimeout(() => {
          setIsBooting(false);
          debate.startDebate({ topic: input, totalRounds: rounds, subject, language: selectedLang, documentText });
        }, 1200); // Hold final text for a moment
      }
    }, 600); // 600ms gap between each line
  };

  const handleNewDebate = () => {
    debate.resetDebate();
    savedDebateRef.current = false;
    setIsSidebarOpen(false); 
  };

  const handleSelectDebate = (item: any) => {
    savedDebateRef.current = true; 
    debate.loadPastDebate(item);
    setIsSidebarOpen(false); 
  };

  const handleDeleteDebate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    setHistoryList(prev => prev.filter(item => item._id !== id && item.id !== id));
    
    try {
      await fetch(`/api/debate-history?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const showHero    = debate.status === 'idle' && !isBooting;
  const showArena   = debate.status !== 'idle' && !isBooting;
  const showVerdict = debate.status === 'finished' && !!debate.scores && !isBooting;

  return (
    <div className="relative min-h-screen bg-[#08090c] overflow-hidden font-sans">
      
      {/* ─── 🔥 CYBERPUNK BOOT-UP OVERLAY 🔥 ─── */}
      <AnimatePresence>
        {isBooting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black backdrop-blur-3xl font-mono overflow-hidden"
          >
            {/* Background Cyber Grid */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,212,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.2)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            
            <div className="w-full max-w-3xl p-8 rounded-xl border border-cyan-500/20 bg-cyan-950/10 shadow-[0_0_80px_rgba(0,212,255,0.05)] relative">
              
              <div className="flex items-center gap-3 mb-6 border-b border-cyan-500/30 pb-3">
                <TerminalIcon className="w-6 h-6 text-cyan-400 animate-pulse" />
                <span className="text-cyan-500 text-xs tracking-[0.3em] font-bold uppercase">System Terminal // Root Access</span>
              </div>

              <div className="space-y-4">
                {bootText.map((text, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-cyan-400 text-sm md:text-lg font-bold tracking-widest uppercase text-shadow-glow"
                    style={{ textShadow: '0 0 10px rgba(0,212,255,0.8)' }}
                  >
                    {text}
                  </motion.div>
                ))}
                
                {/* Blinking Cursor */}
                {bootText.length < 5 && (
                  <motion.div 
                     animate={{ opacity: [1, 0, 1] }} 
                     transition={{ repeat: Infinity, duration: 0.8 }}
                     className="w-4 h-6 bg-cyan-400 mt-2 shadow-[0_0_10px_rgba(0,212,255,1)]"
                  />
                )}
              </div>

              {/* Final Flash Warning */}
              <AnimatePresence>
                {bootText.length === 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl border-2 border-red-500/50"
                  >
                    <h1 className="text-red-500 text-4xl md:text-6xl font-orbitron font-black tracking-[0.2em] uppercase drop-shadow-[0_0_30px_rgba(239,68,68,1)] animate-pulse">
                      FIGHT!
                    </h1>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ─── BOOT OVERLAY END ─── */}


      {/* ─── SIDEBAR OVERLAY COMPONENT ─── */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        historyList={historyList} 
        onSelectDebate={handleSelectDebate} 
        onNewDebate={handleNewDebate}
        onDeleteDebate={handleDeleteDebate} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* ─── CREATIVE VERTICAL SIDE-TAB (EDGE HANDLE) ─── */}
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
              initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }} // 🔥 Arena opens with an epic zoom out
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="min-h-screen pt-4 pb-20"
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

              <div className="mt-8 max-w-7xl mx-auto px-4 w-full relative z-20">
                <ArgumentDAG messages={debate.messages} />
              </div>

              <AnimatePresence>
                {showVerdict && debate.scores && (
                  <motion.div
                    key="verdict"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mt-8"
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