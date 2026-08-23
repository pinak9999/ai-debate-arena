'use client';

import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Shield, Sword, Scale, BarChart2, Brain, Flame } from 'lucide-react';
import { useTypewriter } from '@/hooks/useTypewriter';
import type { DebateMessage, UIArtifact, FallacyResult } from '@/hooks/useDebate';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface ChatBubbleProps {
  message:           DebateMessage;
  streamingText?:    string;
  isActiveStreaming?: boolean;
  fallacyResult?:    FallacyResult; 
}

// 🚀 ORIGINAL TYPING + 100% ZERO-LAG HIGHLIGHT SYNC
function TypewriterText({ text, side }: { text: string; side: 'proponent' | 'opponent' | 'judge' }) {
  // 1. तुम्हारा ओरिजिनल हुक बिना किसी बदलाव के
  const { displayText, isComplete } = useTypewriter(text, { speed: 14 });
  
  // 2. डायरेक्ट DOM अपडेट के लिए Ref (इससे रेंडर लैग नहीं होगा)
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // जब टाइपिंग पूरी होगी, तभी बोलना चालू होगा
    if (isComplete && text && typeof window !== 'undefined') {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.lang = 'hi-IN';
      
      if (side === 'proponent') {
        utterance.pitch = 0.8;
        utterance.rate = 1.05;
      } else if (side === 'opponent') {
        utterance.pitch = 1.3;
        utterance.rate = 1.1;
      } else {
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
      }
      
      const highlightColor = side === 'proponent' ? '#00d4ff' : side === 'opponent' ? '#ff2d55' : '#ffd60a';
      const glow = `0 0 12px ${highlightColor}`;
      
      utterance.onstart = () => {
         if (textRef.current) textRef.current.style.opacity = '0.7';
      };
      
      // 🔥 MAGIC: डायरेक्ट DOM मैनिपुलेशन (बिना React State के 100% एक्यूरेट सिंक)
      utterance.onboundary = (e) => {
        if (e.name === 'word' && textRef.current) {
          const charIndex = e.charIndex;
          
          // हिंदी और अंग्रेजी दोनों के वर्ड बाउंड्री (Space, Purna Viram, etc.) ढूँढना
          let endIdx = text.substring(charIndex).search(/[\s,।?!.]/);
          endIdx = endIdx === -1 ? text.length : charIndex + endIdx;
          
          const before = text.substring(0, charIndex);
          const current = text.substring(charIndex, endIdx);
          const after = text.substring(endIdx);
          
          // बिना री-रेंडर किए सीधा HTML अपडेट
          textRef.current.innerHTML = 
            `<span>${before}</span>` + 
            `<span style="color: ${highlightColor}; text-shadow: ${glow}; font-weight: 900; font-size: 1.08em; transition: all 0.05s ease-out;">${current}</span>` + 
            `<span>${after}</span>`;
        }
      };
      
      utterance.onend = () => {
        if (textRef.current) {
           textRef.current.innerHTML = text;
           textRef.current.style.opacity = '1';
        }
      };

      synth.cancel(); 
      synth.speak(utterance);
      
      return () => { synth.cancel(); };
    }
  }, [isComplete, text, side]);

  // जब तक टाइपिंग चल रही है, तुम्हारा ओरिजिनल लॉजिक दिखेगा
  if (!isComplete) {
    return (
      <span className={side === 'opponent' ? 'cursor-blink-red' : 'cursor-blink'}>
        {displayText}
      </span>
    );
  }

  // टाइपिंग पूरी होने के बाद यह स्पैन रेंडर होगा, जिसमें लाइव आवाज़ के साथ वर्ड्स चमकेंगे
  return <span ref={textRef} className="transition-opacity duration-300">{text}</span>;
}

// बाकी का तुम्हारा सारा कोड 1% भी चेंज नहीं किया गया है ⬇️

function GenerativeChart({ artifact, color }: { artifact: UIArtifact; color: string }) {
  if (!artifact || !artifact.data || artifact.data.length === 0) return null;

  const isBar = artifact.type === 'bar_chart' || artifact.type === 'ev_comparison';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
      className="mt-4 p-4 rounded-xl bg-[#050505]/80 border border-white/10 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
        <BarChart2 className="w-4 h-4" style={{ color }} />
        <span className="text-[10px] font-orbitron font-bold tracking-widest uppercase text-white/70">
          {artifact.title || 'Live Data Analysis'}
        </span>
      </div>
      
      <div className="h-40 w-full text-[10px] font-mono">
        <ResponsiveContainer width="100%" height="100%">
          {isBar ? (
            <BarChart data={artifact.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#777" tick={{ fill: '#777' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#777" tick={{ fill: '#777' }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: color, fontWeight: 'bold' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={artifact.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#777" tick={{ fill: '#777' }} axisLine={false} tickLine={false} />
              <YAxis stroke="#777" tick={{ fill: '#777' }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: color, fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#111', stroke: color, strokeWidth: 2 }} 
                activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

const bubbleVariants: Variants = {
  hidden: { opacity: 0, y: 30, rotateX: -25, scale: 0.92 },
  visible: {
    opacity: 1, y: 0, rotateX: 0, scale: 1,
    transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function ChatBubble({ message, streamingText, isActiveStreaming, fallacyResult }: ChatBubbleProps) {
  const isPro   = message.speaker === 'proponent';
  const isJudge = message.speaker === 'judge';

  const color = isPro ? '#00d4ff' : isJudge ? '#ffd60a' : '#ff2d55';
  const rgb   = isPro ? '0,212,255' : isJudge ? '255,214,10' : '255,45,85';

  const glassClass = isPro || isJudge ? 'glass-blue' : 'glass-red';
  const label = isPro ? 'Proponent' : isJudge ? 'Judge' : 'Opponent';

  return (
    <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="w-full perspective-1000" layout>
      <div
        className={`relative rounded-2xl p-4 overflow-hidden ${glassClass}`}
        style={{ boxShadow: `0 0 18px rgba(${rgb}, 0.07), inset 0 0 30px rgba(${rgb}, 0.03)` }}
      >
        <div
          className="absolute top-0 right-0 w-14 h-14 rounded-bl-[50px] opacity-15 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }}
        />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: `rgba(${rgb}, 0.15)`, border: `1px solid rgba(${rgb}, 0.3)` }}>
              {isPro && <Shield className="w-3 h-3 text-neon-blue" />}
              {isJudge && <Scale className="w-3 h-3" style={{ color }} />}
              {!isPro && !isJudge && <Sword className="w-3 h-3 text-neon-red" />}
            </div>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color }}>{label}</span>
          </div>
          <span className="text-white/20 text-[10px] font-orbitron tabular-nums">R{message.round}</span>
        </div>

        <div className="text-white/82 text-[0.82rem] leading-[1.7] relative z-10 min-h-[1.4rem]">
          {isActiveStreaming ? (
            streamingText ? (
              <span className={message.speaker === 'opponent' ? 'cursor-blink-red' : 'cursor-blink'}>
                {streamingText}
              </span>
            ) : (
              <span className="flex gap-1.5 py-1 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: color }}
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.7, 1, 0.7] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.22 }}
                  />
                ))}
              </span>
            )
          ) : (
            <>
              <TypewriterText text={message.text} side={message.speaker} />
              
              {/* 🚀 Render Chart if UI Artifact exists */}
              {message.isComplete && message.uiArtifact && (
                <GenerativeChart artifact={message.uiArtifact} color={color} />
              )}

              {/* 🔥 NEW: Individual Logic & Aggression Scores for this specific message */}
              {message.isComplete && fallacyResult && (
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-orbitron font-bold text-emerald-400">
                    <Brain className="w-3 h-3" />
                    <span>Logic: {fallacyResult.logicScore ?? '--'}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-orbitron font-bold text-orange-400">
                    <Flame className="w-3 h-3" />
                    <span>Aggression: {fallacyResult.aggressionScore ?? '--'}%</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}