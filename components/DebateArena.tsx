'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sword, Wifi, Terminal, Users, QrCode, Brain, Flame, AlertTriangle, Gavel, Loader2, ScanLine } from 'lucide-react';
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

// ─── 🎥 CINEMATIC AGENT PANEL WITH LASER SCANNER & CROWD ──────────────────────────

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
  status:             DebateStatus;
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
  
  const panelTitle = isStock ? (isPro ? '🐂 Bull Case' : '🐻 Risk Analysis') : isPersonality ? (isPro ? '⚔️ Aggressive Analyst' : '🧘 The Philosopher') : (isPro ? 'Proponent' : 'Opponent');
  const panelSubtitle = isStock ? (isPro ? 'Bullish Equity Analyst' : 'Risk Manager') : isPersonality ? (isPro ? 'Data-Driven & Assertive' : 'Ethics & Values-Driven') : `AI Agent #${isPro ? '001' : '002'}`;

  const containerRef = useRef<HTMLDivElement>(null);

  // ऑटो-स्क्रॉल के लिए
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamingText]);

  // 🔥 NEW: APPLAUSE EFFECT LOGIC (तालियों की आवाज़)
  const applaudedMessages = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      // Check if message is complete and has fallacies data
      if (latestMessage.isComplete && fallacies[latestMessage.id]) {
        // यह चेक करेगा कि क्या इस मैसेज पर पहले ही तालियां बज चुकी हैं
        if (!applaudedMessages.current.has(latestMessage.id)) {
          const stats = fallacies[latestMessage.id];
          // अगर लॉजिक 90% या उससे ऊपर है और कोई पेनल्टी नहीं है, तो तालियां बजेंगी!
          if (stats.logicScore >= 90 && stats.penalty === 0) {
            soundEngine.playApplause();
            applaudedMessages.current.add(latestMessage.id);
          }
        }
      }
    }
  }, [messages, fallacies]);

  const latestMsgWithFallacy = [...messages].reverse().find(m => fallacies[m.id]);
  const latestStats = latestMsgWithFallacy ? fallacies[latestMsgWithFallacy.id] : null;

  const isDebateOver = status === 'judging' || status === 'finished';
  const cinematicScale = isDebateOver ? 1 : (isActive ? 1.02 : 0.95);
  const cinematicBlur = isDebateOver ? 'blur(0px)' : (isActive ? 'blur(0px)' : 'blur(5px)');
  const cinematicOpacity = isDebateOver ? 1 : (isActive ? 1 : 0.5);

  return (
    <motion.div 
      className="flex flex-col h-full min-h-0 rounded-2xl overflow-hidden border relative z-10 bg-[#02050A]"
      style={{
        borderColor: `rgba(${rgb}, ${isActive || isDebateOver ? 0.3 : 0.05})`,
        boxShadow: isActive && !isDebateOver ? `0 0 50px rgba(${rgb}, 0.15), 0 0 100px rgba(${rgb}, 0.05)` : 'none',
      }}
      animate={{
        scale: cinematicScale,
        filter: cinematicBlur,
        opacity: cinematicOpacity,
        rotateX: (isActive && !isDebateOver) ? 0 : 2, 
      }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      
      {/* 🔥 HOLOGRAPHIC LASER SCANNER (जब एजेंट चुप है) 🔥 */}
      {!isActive && !isDebateOver && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-2xl">
          <motion.div 
            className="w-full h-[2px]"
            style={{ 
              background: color, 
              boxShadow: `0 0 20px 3px ${color}` 
            }}
            animate={{ y: ['0%', '560px', '0%'] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 opacity-10 animate-pulse" style={{ background: `linear-gradient(180deg, transparent, ${color}, transparent)` }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 bg-black/50 p-4 rounded-xl backdrop-blur-md border" style={{ borderColor: `rgba(${rgb}, 0.2)` }}>
             <ScanLine className="w-8 h-8 animate-pulse" style={{ color }} />
             <span className="text-[10px] font-orbitron tracking-[0.3em] uppercase font-bold" style={{ color }}>
               Scanning Patterns...
             </span>
          </div>
        </div>
      )}

      {/* ── Panel header ── */}
      <motion.div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 backdrop-blur-md relative z-40"
        style={{
          borderColor: `rgba(${rgb}, 0.18)`,
          background:  `linear-gradient(90deg, rgba(${rgb}, ${isActive ? 0.15 : 0.04}) 0%, rgba(5,8,16,0.9) 100%)`,
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="p-2 rounded-xl shrink-0"
          style={{ background: `rgba(${rgb}, 0.15)`, border: `1px solid rgba(${rgb}, 0.35)` }}
          animate={{ boxShadow: isActive ? `0 0 14px rgba(${rgb}, 0.65)` : 'none' }}
        >
          {isPro ? <Shield className="w-4 h-4 text-neon-blue" /> : <Sword className="w-4 h-4 text-neon-red" />}
        </motion.div>

        <div className="flex-1 min-w-0">
          <h2 className="font-orbitron font-black text-xs tracking-[0.18em] uppercase" style={{ color }}>{panelTitle}</h2>
          <p className="text-white/25 text-[10px]">{panelSubtitle}</p>
        </div>

        <span className="text-[10px] font-orbitron font-bold tabular-nums px-2 py-0.5 rounded-full" style={{ background: `rgba(${rgb}, 0.12)`, color: `rgba(${rgb === '0,212,255' ? '0,212,255' : '255,45,85'}, 0.8)` }}>
          {messages.length}
        </span>

        <AnimatePresence>
          {isActive && !isDebateOver && (
            <motion.div
              key="live"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: `rgba(${rgb}, 0.12)`, border: `1px solid rgba(${rgb}, 0.35)` }}
            >
              <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 0.75, repeat: Infinity }} />
              <Wifi className="w-3 h-3" style={{ color }} />
              <span className="text-[9px] font-bold tracking-wider" style={{ color }}>LIVE</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── LIVE STATS METERS ── */}
      {(messages.length > 0) && (
        <div className="px-4 py-2 bg-black/60 border-b border-white/5 flex flex-col gap-2 flex-shrink-0 backdrop-blur-md relative z-40">
          <AnimatePresence>
            {latestStats?.hasFallacy && latestStats?.penalty > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                // 🔥 NEW: PENALTY PAR GLITCH OR BOOING (हूटिंग) DONO SOUND
                onAnimationStart={() => {
                  soundEngine.playGlitch();
                  soundEngine.playBoo(); 
                }}
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
                <motion.div className="h-full bg-emerald-400" style={{ boxShadow: '0 0 10px rgba(52,211,153,0.5)' }} initial={{ width: 0 }} animate={{ width: `${latestStats?.logicScore ?? 0}%` }} transition={{ type: 'spring' }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[9px] font-orbitron mb-1 text-orange-400">
                <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Aggression</span>
                <span>{latestStats?.aggressionScore ?? '--'}%</span>
              </div>
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                <motion.div className="h-full bg-orange-500" style={{ boxShadow: '0 0 10px rgba(249,115,22,0.5)' }} initial={{ width: 0 }} animate={{ width: `${latestStats?.aggressionScore ?? 0}%` }} transition={{ type: 'spring' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages scroll area ── */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-[#02050A]/80 custom-scrollbar relative z-30">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => {
            const isStreamingThis = msg.id === streamingMessageId;
            return (
              <div key={msg.id}>
                <ChatBubble message={msg} streamingText={isStreamingThis ? streamingText : undefined} isActiveStreaming={isStreamingThis} />
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="w-8 h-8 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
            <p className="text-white/20 text-xs tracking-wider">Awaiting arguments…</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 🎥 CINEMATIC MAIN ARENA ──────────────────────────────────────────

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
  const activeGlowSpeaker: 'proponent' | 'opponent' | null = currentSpeaker === 'judge' ? null : currentSpeaker;

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = terminalContainerRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) el.scrollTop = el.scrollHeight;
  }, [agentLogs]);

  const [voteUrl, setVoteUrl] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined' && status !== 'idle') {
      setVoteUrl(`${window.location.origin}/vote?topic=${encodeURIComponent(topic)}&round=${currentRound}`);
    }
  }, [currentRound, topic, status]);

  // 🎵 PREMIUM MOVIE SOUND SYSTEM 🎵
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
      if (Math.random() > 0.6) soundEngine.playType(); // Typewriter effect
    }
    previousTextLength.current = streamingText.length;
  }, [streamingText]);

  // 🔥 THEATER SPOTLIGHT GLOW BACKGROUND
  const getTheaterLighting = () => {
    if (status === 'judging' || status === 'finished') return 'bg-purple-900/10 shadow-[inset_0_0_500px_rgba(168,85,247,0.2)]';
    if (currentSpeaker === 'proponent') return 'bg-cyan-900/10 shadow-[inset_0_0_500px_rgba(6,182,212,0.15)]';
    if (currentSpeaker === 'opponent') return 'bg-rose-900/10 shadow-[inset_0_0_500px_rgba(239,68,68,0.15)]';
    return 'bg-transparent';
  };

  return (
    <motion.div className="relative z-10 w-full min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      
      {/* GLOBAL CSS FOR SCREEN SHAKE */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-1deg); }
          50% { transform: translateX(5px) rotate(1deg); }
          75% { transform: translateX(-5px) rotate(-1deg); }
        }
      `}} />

      {/* 🎬 DYNAMIC THEATER LIGHTING (AMBIENT GLOW) */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-1000 ease-in-out z-[-1] ${getTheaterLighting()}`} />

      {/* ─── ⚖️ 3D MASSIVE JUDGE HOLOGRAM ─── */}
      <AnimatePresence>
        {status === 'judging' && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(20px)", scale: 1.5 }} transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" />
            
            <motion.div 
              className="relative flex flex-col items-center z-10"
              initial={{ scale: 0, rotateY: 90 }} animate={{ scale: 1, rotateY: 0 }} exit={{ scale: 2, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 100, duration: 1 }}
            >
              <div className="absolute w-[600px] h-[600px] bg-purple-600/30 blur-[150px] rounded-full animate-pulse" />
              <motion.div animate={{ y: [0, -20, 0], rotateZ: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                <Gavel className="w-40 h-40 md:w-56 md:h-56 text-purple-400 drop-shadow-[0_0_80px_rgba(168,85,247,1)]" />
              </motion.div>
              <h1 className="mt-8 text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-300 to-purple-700 drop-shadow-[0_0_40px_rgba(168,85,247,0.8)] tracking-[0.2em] uppercase text-center leading-tight">
                The Judge <br/> Is Evaluating
              </h1>
              <div className="mt-8 flex items-center gap-3 bg-purple-900/30 px-6 py-3 rounded-full border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                 <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                 <p className="text-purple-300 tracking-[0.3em] font-mono text-[10px] md:text-xs uppercase font-bold">Analyzing Logic, Evidence & Fallacies...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky HUD */}
      <RoundIndicator currentRound={currentRound} totalRounds={totalRounds} currentSpeaker={activeGlowSpeaker} status={status} topic={topic} />

      <div className="px-3 max-w-7xl mx-auto flex flex-wrap items-center justify-end gap-3 mt-3">
        <DownloadReportButton topic={topic} messages={messages} scores={scores} scoreHistory={scoreHistory} disabled={status !== 'finished'} />
      </div>

      {isStock && (status !== 'idle') && (
        <div className="px-3 max-w-7xl mx-auto mt-4"><StockChart data={stockData} loading={stockLoading} /></div>
      )}

      {/* ─── LIVE GRAPH + QR VOTING PANEL ────────────────── */}
      {status !== 'idle' && (
        <div className="px-3 max-w-7xl mx-auto mt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1"><DebateGraph data={scoreHistory} /></div>

            <div className="w-full md:w-72 bg-[#050810] border border-blue-500/20 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(0,212,255,0.1)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-rose-500" />
              <div className="flex items-center gap-2 mb-3 text-white/80">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Live Class Vote {audienceScore.total > 0 ? `(${audienceScore.total} Votes)` : ''}</span>
              </div>
              <div className="bg-white p-2 rounded-lg mb-3 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                {voteUrl && <QRCodeSVG value={voteUrl} size={90} bgColor={'#ffffff'} fgColor={'#000000'} />}
              </div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1"><QrCode className="w-3 h-3" /> Scan to Vote</p>
              <div className="w-full">
                <div className="flex justify-between text-[10px] font-orbitron font-bold mb-1">
                  <span className="text-cyan-400">{audienceScore.pro}% Pro</span>
                  <span className="text-rose-400">{audienceScore.opp}% Opp</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
                  <motion.div className="h-full bg-cyan-500" animate={{ width: `${audienceScore.pro}%` }} transition={{ type: 'spring', bounce: 0.2 }} />
                  <motion.div className="h-full bg-rose-500" animate={{ width: `${audienceScore.opp}%` }} transition={{ type: 'spring', bounce: 0.2 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Agent Brain Visual Flowchart ────────────────────────── */}
      {status !== 'idle' && (
        <div className="px-3 max-w-7xl mx-auto mt-4">
          <div className="h-32 md:h-40 rounded-xl border border-gray-800 bg-[#050505] overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
            <AgentBrainGraph currentSpeaker={currentSpeaker} status={status} />
          </div>
        </div>
      )}

      {/* ─── Agent Trace Panel (Terminal UI) ────────────────────────── */}
      {status !== 'idle' && agentLogs.length > 0 && (
        <div className="px-3 max-w-7xl mx-auto mt-4">
          <div className="rounded-xl border border-gray-800 bg-[#050505] p-3 font-mono text-[10px] sm:text-xs overflow-hidden flex flex-col h-32 md:h-40 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2 text-gray-500 border-b border-gray-800 pb-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span className="uppercase tracking-widest font-bold text-gray-400">Agent Trace (Live System Logs)</span>
            </div>
            <div ref={terminalContainerRef} className="flex-1 overflow-y-auto space-y-1 custom-scrollbar flex flex-col pr-2">
              <AnimatePresence mode="popLayout">
                {agentLogs.map((log) => {
                  let colorClass = 'text-blue-400';
                  if (log.type === 'fact') colorClass = 'text-emerald-400';
                  if (log.type === 'fallacy') colorClass = 'text-yellow-400';
                  if (log.type === 'judge') colorClass = 'text-purple-400';
                  if (log.type === 'system') colorClass = 'text-gray-400';
                  if (log.type === 'ui_render') colorClass = 'text-cyan-400';
                  return (
                    <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex gap-2 ${colorClass}`}>
                      <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span>{log.text}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      <div className="px-3 max-w-7xl mx-auto mt-4"><PlayerInput waiting={waitingForPlayer} onSubmit={submitPlayerArgument} /></div>

      {/* ─── 🎥 CINEMATIC SPLIT ARENA (WITH CAMERA FOCUS) ────────────────────────── */}
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
              status={status}
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
              status={status}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}