'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AgentBrainGraphProps {
  currentSpeaker: 'proponent' | 'opponent' | 'judge' | null;
  status: string;
}

// हर नोड की पोजीशन (Flowchart Layout)
const NODES = [
  { id: 'proponent', label: 'Proponent', x: 60,  y: 70 },
  { id: 'factcheck', label: 'Fact-Check', x: 220, y: 30 },
  { id: 'fallacy',   label: 'Fallacy-Check', x: 220, y: 110 },
  { id: 'judge',     label: 'Judge', x: 380, y: 70 },
  { id: 'opponent',  label: 'Opponent', x: 540, y: 70 },
];

const EDGES = [
  { from: 'proponent', to: 'factcheck' },
  { from: 'proponent', to: 'fallacy' },
  { from: 'factcheck', to: 'judge' },
  { from: 'fallacy', to: 'judge' },
  { from: 'judge', to: 'opponent' },
  { from: 'opponent', to: 'judge' },
];

export default function AgentBrainGraph({ currentSpeaker, status }: AgentBrainGraphProps) {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // करंट स्पीकर के हिसाब से सही नोड को ग्लो करना
  useEffect(() => {
    if (status === 'debating' && currentSpeaker) {
      setActiveNode(currentSpeaker);

      // थोड़ी देर बाद Fact-check/Fallacy नोड्स को भी हल्का सा चमकाओ (सिमुलेशन इफ़ेक्ट)
      if (currentSpeaker === 'proponent' || currentSpeaker === 'opponent') {
        const t1 = setTimeout(() => setActiveNode('factcheck'), 900);
        const t2 = setTimeout(() => setActiveNode('fallacy'), 1400);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    } else if (status === 'judging') {
      setActiveNode('judge');
    } else {
      setActiveNode(null);
    }
  }, [currentSpeaker, status]);

  const getNode = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 pt-2 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
        <span>🧠 Agent Brain — Live Flow</span>
      </div>
      <svg viewBox="0 0 620 150" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* ── Edges (लाइनें) ── */}
        {EDGES.map((edge, i) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          const isEdgeActive =
            activeNode === edge.from || activeNode === edge.to;

          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isEdgeActive ? '#00d4ff' : 'rgba(255,255,255,0.08)'}
              strokeWidth={isEdgeActive ? 2 : 1}
              strokeDasharray={isEdgeActive ? '0' : '4 4'}
            />
          );
        })}

        {/* ── Nodes (गोले) ── */}
        {NODES.map((node) => {
          const isActive = activeNode === node.id;
          const isJudge = node.id === 'judge';
          const color = isJudge ? '#c084fc' : node.id === 'proponent' ? '#00d4ff' : node.id === 'opponent' ? '#ff2d55' : '#34d399';

          return (
            <g key={node.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={isActive ? 20 : 14}
                fill={isActive ? color : 'rgba(255,255,255,0.05)'}
                stroke={color}
                strokeWidth={isActive ? 2 : 1}
                animate={{
                  r: isActive ? [16, 22, 16] : 14,
                  opacity: isActive ? 1 : 0.5,
                }}
                transition={{
                  duration: 0.8,
                  repeat: isActive ? Infinity : 0,
                }}
              />
              <text
                x={node.x}
                y={node.y + 32}
                textAnchor="middle"
                fill={isActive ? color : 'rgba(255,255,255,0.35)'}
                fontSize="9"
                fontWeight={isActive ? 'bold' : 'normal'}
                className="uppercase tracking-wider"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}