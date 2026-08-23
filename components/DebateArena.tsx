'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 🔥 Gavel (हथौड़ा) और Loader2 नए इम्पोर्ट किए हैं 3D जज इफ़ेक्ट के लिए
import { Shield, Sword, Wifi, Terminal, Users, QrCode, Brain, Flame, AlertTriangle, Gavel, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Components
import AgentBrainGraph from './AgentBrainGraph';
import { StockChart } from './StockChart';
import ChatBubble from './ChatBubble';
import RoundIndicator from './RoundIndicator';
import { DebateGraph } from './DebateGraph';
import { PlayerInput } from './PlayerInput';
import { DownloadReportButton } from './DownloadReportButton';
import { FallacyBadge } from './FallacyBadge';
import { FactCheckBadge } from './FactCheckBadge';

// Sound Engine
import { soundEngine } from './utils/soundEngine';

import type {
  DebateMessage,
  DebateStatus,
  ScorePoint,
  FallacyResult,
  FactCheckResult,
  JudgeScores,
  AgentLog,
  DebateSubject,
  StockData,
} from '@/hooks/useDebate';

// ─── AgentPanel ─────────────────────────────────────────────────────────────

interface AgentPanelProps {
  side:               'proponent' | 'opponent';
  messages:           DebateMessage[];
  streamingText:      string;
  streamingMessageId: string | null;
  isActive:           boolean;
  fallacies:          Record<string, FallacyResult>;
  factChecks:         Record<string, FactCheckResult>;
  factCheckLoading:   Record<string, boolean>;
  subject?:           DebateSubject;
  status:             DebateStatus; // 🔥 Status जोड़ दिया ताकि डिबेट खत्म होने पर ब्लर हट सके
}

function AgentPanel({
  side,
  messages,
  streamingText,
  streamingMessageId,
  isActive,
  fallacies = {},
  factChecks = {},
  factCheckLoading = {},
  subject = 'topic',
  status,
}: AgentPanelProps) {
  const isPro  = side === 'proponent';
  const color  = isPro ? '#00d4ff' : '#ff2d55';
  const rgb    = isPro ? '0,212,255' : '255,45,85';
  
  const isStock = subject === 'stock';
  const isPersonality = subject === 'personality';
  const isDocument = subject === 'document';
  const isYoutube = subject === 'youtube';
  
  const panelTitle = isStock
    ? (isPro ? '🐂 Bull Case' : '🐻 Risk Analysis')
    : isPersonality
    ? (isPro ? '⚔️ Aggressive Analyst' : '🧘 The Philosopher')
    : isDocument
    ? (isPro ? '👨‍💻 Lead Developer' : '🕵️‍♂️ Senior Auditor')
    : isYoutube
    ? (isPro ? '👍 Loyal Defender' : '👎 Fact-Checker')
    : (isPro ? 'Proponent' : 'Opponent');
    
  const panelSubtitle = isStock
    ? (isPro ? 'Bullish Equity Analyst' : 'Risk Manager')
    : isPersonality
    ? (isPro ? 'Data-Driven & Assertive' : 'Ethics & Values-Driven')
    : isDocument
    ? (isPro ? 'Code Architect' : 'Vulnerability Hunter')
    : isYoutube
    ? (isPro ? 'Video Supporter' : 'Skeptical Critic')
    : `AI Agent #${isPro ? '001' : '002'}`;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamingText]);

  const latestMsgWithFallacy = [...messages].reverse().find(m => fallacies[m.id]);
  const latestStats = latestMsgWithFallacy ? fallacies[latestMsgWithFallacy.id] : null;

  // 🔥 FIX: डिबेट खत्म होने के बाद दोनों पैनल्स 100% विज़िबल रहेंगे (No Blur)
  const isDebateOver = status === 'judging' || status === 'finished';
  const isFocused = isActive || isDebateOver;

  return (
    <motion.div 
      className="flex flex-col h-full min-h-0 rounded-2xl overflow-hidden border relative"
      style={{
        borderColor: `rgba(${rgb}, ${isFocused ? 0.3 : 0.05})`,
        boxShadow: isActive ? `0 0 50px rgba(${rgb}, 0.15), 0 0 100px rgba(${rgb}, 0.05)` : 'none',
      }}
      animate={{
        scale: isFocused ? (isActive && !isDebateOver ? 1.02 : 1) : 0.95,
        filter: isFocused ? 'blur(0px)' : 'blur(4px)',
        opacity: isFocused ? 1 : 0.4,
        rotateX: isFocused ? 0 : 2,
      }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      {/* ── Panel header ──────────────────────────────────────────────── */}
      <motion.div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 relative z-10"
        style={{
          borderColor: `rgba(${rgb}, 0.18)`,
          background:  `linear-gradient(90deg, rgba(${rgb}, ${isActive ? 0.15 : 0.04}) 0%, rgba(5,8,16,0.9) 100%)`,
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="p-2 rounded-xl shrink-0"
          style={{
            background: `rgba(${rgb}, 0.15)`,
            border:     `1px solid rgba(${rgb}, 0.35)`,
          }}
          animate={{
            boxShadow: isActive ? `0 0 14px rgba(${rgb}, 0.65)` : 'none',
          }}
          transition={{ duration: 0.4 }}
        >
          {isPro
            ? <Shield className="w-4 h-4 text-neon-blue" />
            : <Sword  className="w-4 h-4 text-neon-red"  />
          }
        </motion.div>

        <div className="flex-1 min-w-0">
          <h2
            className="font-orbitron font-black text-xs tracking-[0.18em] uppercase"
            style={{ color }}
          >
            {panelTitle}
          </h2>
          <p className="text-white/25 text-[10px]">{panelSubtitle}</p>
        </div>

        <span
          className="text-[10px] font-orbitron font-bold tabular-nums px-2 py-0.5 rounded-full"
          style={{
            background: `rgba(${rgb}, 0.12)`,
            color:      `rgba(${rgb === '0,212,255' ? '0,212,255' : '255,45,85'}, 0.8)`,
          }}
        >
          {messages.length}
        </span>

        <AnimatePresence>
          {isActive && !isDebateOver && (
            <motion.div
              key="live"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                background: `rgba(${rgb}, 0.12)`,
                border:     `1px solid rgba(${rgb}, 0.35)`,
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 0.75, repeat: Infinity }}
              />
              <Wifi className="w-3 h-3" style={{ color }} />
              <span className="text-[9px] font-bold tracking-wider" style={{ color }}>LIVE</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── LIVE STATS METERS ────────────── */}
      {(messages.length > 0) && (
        <div className="px-4 py-2 bg-black/60 border-b border-white/5 flex flex-col gap-2 flex-shrink-0 relative z-10 backdrop-blur-md">
          <AnimatePresence>
            {latestStats?.hasFallacy && latestStats?.penalty > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onAnimationStart={() => soundEngine.playGlitch()}
                className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-2 py-1.5 rounded border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider mb-1 animate-[shake_0.5s_ease-in-out]"
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Penalty: -{latestStats.penalty} pts ({latestStats.fallacyName})</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-[9px] font-orbitron mb-1 text-emerald-400">
                <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> Logic</span>
                <span>{latestStats?.logicScore ?? '--'}%</span>
              </div>
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                <motion.div
                  className="h-full bg-emerald-400"
                  style={{ boxShadow: '0 0 10px rgba(52,211,153,0.5)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${latestStats?.logicScore ?? 0}%` }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 1 }}
                />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between text-[9px] font-orbitron mb-1 text-orange-400">
                <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Aggression</span>
                <span>{latestStats?.aggressionScore ?? '--'}%</span>
              </div>
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                <motion.div
                  className="h-full bg-orange-500"
                  style={{ boxShadow: '0 0 10px rgba(249,115,22,0.5)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${latestStats?.aggressionScore ?? 0}%` }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 1 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages scroll area ───────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-black/60 custom-scrollbar relative z-0"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
          {isPro ? <Shield className="w-64 h-64 text-cyan-500" /> : <Sword className="w-64 h-64 text-rose-500" />}
        </div>

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => {
            const isStreamingThis = msg.id === streamingMessageId;
            return (
              <div key={msg.id} className="relative z-10">
                <ChatBubble
                  message={msg}
                  streamingText={isStreamingThis ? streamingText : undefined}
                  isActiveStreaming={isStreamingThis}
                />
                {msg.isComplete && (
                  <div className="flex flex-wrap gap-2 mt-1 ml-1">
                    <FallacyBadge result={fallacies?.[msg.id]} />
                    <FactCheckBadge result={factChecks?.[msg.id]} loading={factCheckLoading?.[msg.id] || false} />
                  </div>
                )}
              </div>
            );
          })}
        </AnimatePresence>

        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-32 gap-2"
          >
            <div
              className="w-8 h-8 rounded-full opacity-20"
              style={{ background: `radial-gradient(circle, ${color}, transparent)` }}
            />
            <p className="text-white/20 text-xs tracking-wider font-orbitron uppercase">Awaiting Systems...</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── DebateArena ─────────────────────────────────────────────────────────────

interface DebateArenaProps {
  messages:           DebateMessage[];
  streamingText:      string;
  streamingMessageId: string | null;
  currentRound:       number;
  totalRounds:        number;
  currentSpeaker:     'proponent' | 'opponent' | 'judge' | null;
  status:             DebateStatus;
  topic:              string;
  scoreHistory:       ScorePoint[];
  waitingForPlayer:   boolean;
  submitPlayerArgument: (text: string) => void;
  fallacies:          Record<string, FallacyResult>;
  factChecks:         Record<string, FactCheckResult>;
  factCheckLoading:   Record<string, boolean>;
  scores:             JudgeScores | null;
  agentLogs?:         AgentLog[];
  audienceScore?:     { pro: number; opp: number; total: number };
  subject?:           DebateSubject;
  stockData?:         StockData | null;
  stockLoading?:      boolean;
}

export default function DebateArena(props: DebateArenaProps) {
  const {
    messages = [],
    streamingText,
    streamingMessageId,
    currentRound,
    totalRounds,
    currentSpeaker,
    status,
    topic,
    scoreHistory = [],
    waitingForPlayer,
    submitPlayerArgument,
    fallacies = {},
    factChecks = {},
    factCheckLoading = {},
    scores,
    agentLogs = [],
    audienceScore = { pro: 50, opp: 50, total: 0 },
    subject = 'topic',
    stockData = null,
    stockLoading = false,
  } = props;

  const isStock = subject === 'stock';

  const proMessages = messages.filter((m) => m.speaker === 'proponent');
  const oppMessages = messages.filter((m) => m.speaker === 'opponent');

  const activeGlowSpeaker: 'proponent' | 'opponent' | null =
    currentSpeaker === 'judge' ? null : currentSpeaker;

  // 🎬 SOUND TRIGGERS
  useEffect(() => {
    if (currentRound > 1 && currentRound <= totalRounds && currentSpeaker === 'proponent') {
      soundEngine.playBell(); 
    }
  }, [currentRound, currentSpeaker, totalRounds]);

  useEffect(() => {
    if (status === 'judging') {
      soundEngine.playJudge(); 
    }
  }, [status]);

  const previousTextLength = useRef(0);
  useEffect(() => {
    if (streamingText && streamingText.length > previousTextLength.current) {
      if (Math.random() > 0.6) {
         soundEngine.playType();
      }
    }
    previousTextLength.current = streamingText.length;
  }, [streamingText]);

  const [voteUrl, setVoteUrl] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined' && status !== 'idle') {
      const url = `${window.location.origin}/vote?topic=${encodeURIComponent(topic)}&round=${currentRound}`;
      setVoteUrl(url);
    }
  }, [currentRound, topic, status]);

  // 🎬 DYNAMIC THEATER LIGHTING
  const getTheaterLighting = () => {
    if (status === 'judging') return 'bg-purple-900/20 shadow-[inset_0_0_500px_rgba(168,85,247,0.15)]';
    if (currentSpeaker === 'proponent') return 'bg-cyan-900/20 shadow-[inset_0_0_500px_rgba(6,182,212,0.15)]';
    if (currentSpeaker === 'opponent') return 'bg-rose-900/20 shadow-[inset_0_0_500px_rgba(239,68,68,0.15)]';
    return 'bg-transparent';
  };

  return (
    <motion.div
      className="relative z-10 w-full min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-1deg); }
          50% { transform: translateX(5px) rotate(1deg); }
          75% { transform: translateX(-5px) rotate(-1deg); }
        }
      `}} />

      {/* ─── ⚖️ 3D MASSIVE JUDGE HOLOGRAM (EVALUATING PHASE) ─── */}
      <AnimatePresence>
        {status === 'judging' && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)", scale: 1.5 }}
            transition={{ duration: 0.8 }}
          >
            {/* Dark background overlay with heavy blur to create dramatic tension */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            
            <motion.div 
              className="relative flex flex-col items-center z-10"
              initial={{ scale: 0, rotateY: 90 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 100, duration: 1 }}
            >
              {/* Glowing Aura */}
              <div className="absolute w-[600px] h-[600px] bg-purple-600/30 blur-[150px] rounded-full animate-pulse" />
              
              {/* 3D Gavel Animation */}
              <motion.div 
                animate={{ y: [0, -20, 0], rotateZ: [0, 5, -5, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Gavel className="w-40 h-40 md:w-56 md:h-56 text-purple-400 drop-shadow-[0_0_80px_rgba(168,85,247,1)]" />
              </motion.div>
              
              <h1 className="mt-8 text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-300 to-purple-700 drop-shadow-[0_0_40px_rgba(168,85,247,0.8)] tracking-[0.2em] uppercase text-center leading-tight">
                The Judge <br/> Is Evaluating
              </h1>
              
              <div className="mt-8 flex items-center gap-3 bg-purple-900/30 px-6 py-3 rounded-full border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                 <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                 <p className="text-purple-300 tracking-[0.3em] font-mono text-[10px] md:text-xs uppercase font-bold">
                   Analyzing Logic, Evidence & Fallacies...
                 </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 THEATER SPOTLIGHT OVERLAY */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-1000 ease-in-out z-[-1] ${getTheaterLighting()}`} />

      <RoundIndicator
        currentRound={currentRound}
        totalRounds={totalRounds}
        currentSpeaker={activeGlowSpeaker}
        status={status}
        topic={topic}
      />

      <div className="px-3 max-w-7xl mx-auto flex flex-wrap items-center justify-end gap-3 mt-3">
        <DownloadReportButton
          topic={topic}
          messages={messages}
          scores={scores}
          scoreHistory={scoreHistory}
          disabled={status !== 'finished'}
        />
      </div>

      {isStock && (status !== 'idle') && (
        <div className="px-3 max-w-7xl mx-auto mt-4">
          <StockChart data={stockData} loading={stockLoading} />
        </div>
      )}

      {/* ─── LIVE GRAPH + QR VOTING PANEL ────────────────── */}
      {status !== 'idle' && (
        <div className="px-3 max-w-7xl mx-auto mt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <DebateGraph data={scoreHistory} />
            </div>

            <div className="w-full md:w-72 bg-[#050810]/80 backdrop-blur-xl border border-blue-500/20 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(0,212,255,0.1)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-rose-500" />
              <div className="flex items-center gap-2 mb-3 text-white/80">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  Live Class Vote {audienceScore.total > 0 ? `(${audienceScore.total} Votes)` : ''}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg mb-3 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {voteUrl && <QRCodeSVG value={voteUrl} size={90} bgColor={'#ffffff'} fgColor={'#000000'} />}
              </div>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Scan to Vote
              </p>
              <div className="w-full">
                <div className="flex justify-between text-[10px] font-orbitron font-bold mb-1">
                  <span className="text-cyan-400">{audienceScore.pro}% Pro</span>
                  <span className="text-rose-400">{audienceScore.opp}% Opp</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
                  <motion.div className="h-full bg-cyan-500" animate={{ width: `${audienceScore.pro}%` }} transition={{ type: 'spring' }} />
                  <motion.div className="h-full bg-rose-500" animate={{ width: `${audienceScore.opp}%` }} transition={{ type: 'spring' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Agent Brain Visual Flowchart ────────────────────────── */}
      {status !== 'idle' && (
        <div className="px-3 max-w-7xl mx-auto mt-4">
          <div className="h-32 md:h-40 rounded-xl border border-gray-800/50 bg-[#050505]/80 backdrop-blur-xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <AgentBrainGraph currentSpeaker={currentSpeaker} status={status} />
          </div>
        </div>
      )}

      <div className="px-3 max-w-7xl mx-auto mt-4">
        <PlayerInput waiting={waitingForPlayer} onSubmit={submitPlayerArgument} />
      </div>

      {/* ─── 🎥 CINEMATIC SPLIT ARENA ────────────────────────── */}
      <div className="px-3 pb-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 perspective-[1000px]">
          <div style={{ minHeight: '560px' }}>
            <AgentPanel
              side="proponent"
              messages={proMessages}
              streamingText={streamingText}
              streamingMessageId={streamingMessageId}
              isActive={currentSpeaker === 'proponent'}
              fallacies={fallacies}
              factChecks={factChecks}
              factCheckLoading={factCheckLoading}
              subject={subject}
              status={status} // 🔥 Passed status
            />
          </div>
          <div style={{ minHeight: '560px' }}>
            <AgentPanel
              side="opponent"
              messages={oppMessages}
              streamingText={streamingText}
              streamingMessageId={streamingMessageId}
              isActive={currentSpeaker === 'opponent'}
              fallacies={fallacies}
              factChecks={factChecks}
              factCheckLoading={factCheckLoading}
              subject={subject}
              status={status} // 🔥 Passed status
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}