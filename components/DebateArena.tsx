'use client';

import AgentBrainGraph from './AgentBrainGraph';
import { StockChart } from './StockChart';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sword, Wifi, Terminal, Users, QrCode, Brain, Flame, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ChatBubble from './ChatBubble';
import RoundIndicator from './RoundIndicator';
import { DebateGraph } from './DebateGraph';
import { PlayerInput } from './PlayerInput';
import { DownloadReportButton } from './DownloadReportButton';
import { FallacyBadge } from './FallacyBadge';
import { FactCheckBadge } from './FactCheckBadge';
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
}: AgentPanelProps) {
  const isPro  = side === 'proponent';
  const color  = isPro ? '#00d4ff' : '#ff2d55';
  const rgb    = isPro ? '0,212,255' : '255,45,85';
  
  const isStock = subject === 'stock';
  const isPersonality = subject === 'personality';
  
  const panelTitle = isStock
    ? (isPro ? '🐂 Bull Case' : '🐻 Risk Analysis')
    : isPersonality
    ? (isPro ? '⚔️ Aggressive Analyst' : '🧘 The Philosopher')
    : (isPro ? 'Proponent' : 'Opponent');
    
  const panelSubtitle = isStock
    ? (isPro ? 'Bullish Equity Analyst' : 'Risk Manager')
    : isPersonality
    ? (isPro ? 'Data-Driven & Assertive' : 'Ethics & Values-Driven')
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

  // 🔥 लेटेस्ट स्कोर और फैलेसी निकालने का लॉजिक
  const latestMsgWithFallacy = [...messages].reverse().find(m => fallacies[m.id]);
  const latestStats = latestMsgWithFallacy ? fallacies[latestMsgWithFallacy.id] : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Panel header ──────────────────────────────────────────────── */}
      <motion.div
        className="flex items-center gap-3 px-4 py-3 rounded-t-2xl border-b flex-shrink-0"
        style={{
          borderColor: `rgba(${rgb}, 0.18)`,
          background:  `rgba(${rgb}, 0.04)`,
        }}
        animate={{
          boxShadow: isActive
            ? `0 0 28px rgba(${rgb}, 0.18), inset 0 -1px 0 rgba(${rgb}, 0.3)`
            : `inset 0 -1px 0 rgba(${rgb}, 0.12)`,
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
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

        {/* Labels */}
        <div className="flex-1 min-w-0">
          <h2
            className="font-orbitron font-black text-xs tracking-[0.18em] uppercase"
            style={{ color }}
          >
            {panelTitle}
          </h2>
          <p className="text-white/25 text-[10px]">{panelSubtitle}</p>
        </div>

        {/* Message count */}
        <span
          className="text-[10px] font-orbitron font-bold tabular-nums px-2 py-0.5 rounded-full"
          style={{
            background: `rgba(${rgb}, 0.12)`,
            color:      `rgba(${rgb === '0,212,255' ? '0,212,255' : '255,45,85'}, 0.8)`,
          }}
        >
          {messages.length}
        </span>

        {/* LIVE badge */}
        <AnimatePresence>
          {isActive && (
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

      {/* ── LIVE STATS METERS (Logic, Aggression & Penalty) ────────────── */}
      {(messages.length > 0) && (
        <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex flex-col gap-2 flex-shrink-0">
          {/* Penalty Warning Banner */}
          <AnimatePresence>
            {latestStats?.hasFallacy && latestStats?.penalty > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-2 py-1.5 rounded border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider mb-1"
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Penalty: -{latestStats.penalty} pts ({latestStats.fallacyName})</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            {/* Logic Meter */}
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

            {/* Aggression Meter */}
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
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 rounded-b-2xl custom-scrollbar"
        style={{
          background: `linear-gradient(180deg, rgba(${rgb}, 0.025) 0%, rgba(5,8,16,0.75) 100%)`,
        }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => {
            const isStreamingThis = msg.id === streamingMessageId;
            return (
              <div key={msg.id}>
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

        {/* Empty state */}
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
            <p className="text-white/20 text-xs tracking-wider">Awaiting arguments…</p>
          </motion.div>
        )}
      </div>
    </div>
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
  audienceScore?:     { pro: number; opp: number };
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
    audienceScore = { pro: 50, opp: 50 },
    subject = 'topic',
    stockData = null,
    stockLoading = false,
  } = props;

  const isStock = subject === 'stock';

  const proMessages = messages.filter((m) => m.speaker === 'proponent');
  const oppMessages = messages.filter((m) => m.speaker === 'opponent');

  const activeGlowSpeaker: 'proponent' | 'opponent' | null =
    currentSpeaker === 'judge' ? null : currentSpeaker;

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = terminalContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [agentLogs]);

  const [voteUrl, setVoteUrl] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined' && status !== 'idle') {
      const url = `${window.location.origin}/vote?topic=${encodeURIComponent(topic)}&round=${currentRound}`;
      setVoteUrl(url);
    }
  }, [currentRound, topic, status]);

  return (
    <motion.div
      className="relative z-10 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Sticky HUD */}
      <RoundIndicator
        currentRound={currentRound}
        totalRounds={totalRounds}
        currentSpeaker={activeGlowSpeaker}
        status={status}
        topic={topic}
      />

      {/* PDF download — top control strip */}
      <div className="px-3 max-w-7xl mx-auto flex flex-wrap items-center justify-end gap-3 mt-3">
        <DownloadReportButton
          topic={topic}
          messages={messages}
          scores={scores}
          scoreHistory={scoreHistory}
          disabled={status !== 'finished'}
        />
      </div>

      {/* ─── NEW: Financial War-Room — Live Stock Chart ────────────────── */}
      {isStock && (status !== 'idle') && (
        <div className="px-3 max-w-7xl mx-auto mt-4">
          <StockChart data={stockData} loading={stockLoading} />
        </div>
      )}

      {/* ─── LIVE GRAPH + QR VOTING PANEL (side by side) ────────────────── */}
      {status !== 'idle' && (
        <div className="px-3 max-w-7xl mx-auto mt-4">
          <div className="flex flex-col md:flex-row gap-4">

            {/* Left: Live Score Graph */}
            <div className="flex-1">
              <DebateGraph data={scoreHistory} />
            </div>

            {/* Right: QR Code + Live Audience Sentiment */}
            <div className="w-full md:w-72 bg-[#050810] border border-blue-500/20 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(0,212,255,0.1)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-rose-500" />

              <div className="flex items-center gap-2 mb-3 text-white/80">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Live Class Vote</span>
              </div>

              {/* QR Code */}
              <div className="bg-white p-2 rounded-lg mb-3 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                {voteUrl && (
                  <QRCodeSVG value={voteUrl} size={90} bgColor={'#ffffff'} fgColor={'#000000'} />
                )}
              </div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Scan to Vote
              </p>

              {/* Audience Sentiment Bar */}
              <div className="w-full">
                <div className="flex justify-between text-[10px] font-orbitron font-bold mb-1">
                  <span className="text-cyan-400">{audienceScore.pro}% {isStock ? 'Bull' : subject === 'personality' ? 'Analyst' : 'Pro'}</span>
                  <span className="text-rose-400">{audienceScore.opp}% {isStock ? 'Bear' : subject === 'personality' ? 'Philosopher' : 'Opp'}</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
                  <motion.div
                    className="h-full bg-cyan-500"
                    animate={{ width: `${audienceScore.pro}%` }}
                    transition={{ type: 'spring', bounce: 0.2 }}
                  />
                  <motion.div
                    className="h-full bg-rose-500"
                    animate={{ width: `${audienceScore.opp}%` }}
                    transition={{ type: 'spring', bounce: 0.2 }}
                  />
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
            <div
              ref={terminalContainerRef}
              className="flex-1 overflow-y-auto space-y-1 custom-scrollbar flex flex-col pr-2"
            >
              <AnimatePresence mode="popLayout">
                {agentLogs.map((log) => {
                  let colorClass = 'text-blue-400';
                  if (log.type === 'fact') colorClass = 'text-emerald-400';
                  if (log.type === 'fallacy') colorClass = 'text-yellow-400';
                  if (log.type === 'judge') colorClass = 'text-purple-400';
                  if (log.type === 'system') colorClass = 'text-gray-400';
                  if (log.type === 'ui_render') colorClass = 'text-cyan-400';

                  return (
                    <motion.div
                      key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-2 ${colorClass}`}
                    >
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

      {/* Player argument input — shows only when it's your turn */}
      <div className="px-3 max-w-7xl mx-auto mt-4">
        <PlayerInput waiting={waitingForPlayer} onSubmit={submitPlayerArgument} />
      </div>

      {/* Split arena */}
      <div className="px-3 pb-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">

          {/* Proponent / Bull */}
          <motion.div
            className="rounded-2xl overflow-hidden flex flex-col border border-white/5"
            style={{ minHeight: '560px' }}
            animate={{
              boxShadow:
                currentSpeaker === 'proponent'
                  ? '0 0 50px rgba(0,212,255,0.2), 0 0 100px rgba(0,212,255,0.08)'
                  : '0 0 25px rgba(0,212,255,0.04)',
            }}
            transition={{ duration: 0.55 }}
          >
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
            />
          </motion.div>

          {/* Opponent / Bear */}
          <motion.div
            className="rounded-2xl overflow-hidden flex flex-col border border-white/5"
            style={{ minHeight: '560px' }}
            animate={{
              boxShadow:
                currentSpeaker === 'opponent'
                  ? '0 0 50px rgba(255,45,85,0.2), 0 0 100px rgba(255,45,85,0.08)'
                  : '0 0 25px rgba(255,45,85,0.04)',
            }}
            transition={{ duration: 0.55 }}
          >
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
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}