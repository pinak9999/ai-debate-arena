'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, AlertTriangle, Menu } from 'lucide-react'; // 🔥 Menu आइकॉन जोड़ा है साइडबार खोलने/बंद करने के लिए
import HeroSection from '@/components/HeroSection';
import DebateArena from '@/components/DebateArena';
import JudgeVerdict from '@/components/JudgeVerdict';
import ParticleBackground from '@/components/ParticleBackground';
import Sidebar from '@/components/Sidebar'; // 🔥 तुम्हारा नया साइडबार इम्पोर्ट किया
import { useDebate, DebateLanguage } from '@/hooks/useDebate'; 

export default function Home() {
  const debate = useDebate();
  const [selectedLang, setSelectedLang] = useState<DebateLanguage>('Hindi');

  // ─── 🗄️ HISTORY & SIDEBAR STATES ───
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const savedDebateRef = useRef(false); // एक ही डिबेट को दो बार सेव होने से रोकने के लिए

  // 1. डेटाबेस से पुरानी डिबेट्स मंगाना
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

  // पेज लोड होते ही डिबेट्स ले आओ
  useEffect(() => {
    fetchHistory();
  }, []);

  // 2. ऑटो-सेव लॉजिक: जब डिबेट खत्म हो और स्कोर आ जाए, तो सेव करो
  useEffect(() => {
    if (debate.status === 'finished' && debate.scores && !savedDebateRef.current) {
      savedDebateRef.current = true; // लॉक कर दो ताकि डुप्लीकेट सेव न हो
      
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
      }).then(() => fetchHistory()); // सेव होने के बाद साइडबार अपडेट करो
    }
  }, [debate.status, debate.scores, debate.topic, debate.subject, debate.language, debate.messages]);

  // ─── HANDLERS ───
  const handleStart = (
    input: string, 
    rounds: number, 
    subject: 'topic' | 'stock' | 'personality' | 'youtube' | 'document', 
    documentText?: string
  ) => {
    savedDebateRef.current = false; // नई डिबेट के लिए सेव लॉक खोल दो
    debate.startDebate({ topic: input, totalRounds: rounds, subject, language: selectedLang, documentText });
  };

  const handleNewDebate = () => {
    debate.resetDebate();
    savedDebateRef.current = false;
  };

  const handleSelectDebate = (item: any) => {
    // 🔥 अभी के लिए यह कंसोल में डेटा दिखाएगा। 
    // इसे अरीना में लोड करने के लिए हमें useDebate में एक छोटा सा बदलाव करना होगा।
    console.log("Selected Debate from History:", item);
    alert(`आपने "${item.topic}" सेलेक्ट किया है। इसे अरीना में लोड करने का लॉजिक अगले स्टेप में जोड़ेंगे!`);
  };

  const showHero    = debate.status === 'idle';
  const showArena   = debate.status !== 'idle';
  const showVerdict = debate.status === 'finished' && !!debate.scores;

  return (
    // 🔥 यहाँ हमने फ्लेक्स (flex) लेआउट का इस्तेमाल किया है ताकि साइडबार और मेन पेज साथ दिखें
    <div className="flex h-screen bg-[#08090c] overflow-hidden font-sans">
      
      {/* ─── SIDEBAR COMPONENT ─── */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        historyList={historyList} 
        onSelectDebate={handleSelectDebate} 
        onNewDebate={handleNewDebate} 
      />

      {/* ─── MAIN DEBATE AREA ─── */}
      <main className="relative flex-1 h-full overflow-y-auto">
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

        {/* Sidebar Toggle Button (अगर साइडबार बंद हो जाए तो खोलने के लिए) */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-5 left-4 z-50 p-2 text-white/50 hover:text-cyan-400 bg-white/5 rounded-lg hover:bg-white/10 transition border border-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {showHero && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3 } }}
              className="w-full min-h-screen relative z-10 flex flex-col justify-between pt-10" // pt-10 ताकि टॉगल बटन के लिए जगह रहे
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
              className="min-h-screen pt-12" // pt-12 ताकि टॉगल बटन से ना टकराए
            >
              <div className="flex items-center justify-between px-4 pb-1 max-w-7xl mx-auto relative z-20">
                <div className="ml-10"> {/* ml-10 टॉगल बटन के लिए स्पेस */}
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