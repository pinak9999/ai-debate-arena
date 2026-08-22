'use client';

import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import type { DebateMessage } from '../hooks/useDebate'; 

interface ArgumentDAGProps {
  messages: DebateMessage[];
}

export function ArgumentDAG({ messages = [] }: ArgumentDAGProps) {
  const { nodes, edges } = useMemo(() => {
    const newNodes: any[] = [];
    const newEdges: any[] = [];

    messages.forEach((msg, index) => {
      const xPos = msg.round * 350; 
      let yPos = 150; 
      let bgColor = '#1E293B'; 
      let borderColor = '#94A3B8';

      if (msg.speaker === 'proponent') {
        yPos = 50; 
        bgColor = '#082f49'; 
        borderColor = '#0ea5e9'; 
      } else if (msg.speaker === 'opponent') {
        yPos = 250; 
        bgColor = '#4c0519'; 
        borderColor = '#e11d48'; 
      }

      newNodes.push({
        id: `node-${index}`,
        position: { x: xPos, y: yPos },
        data: {
          label: (
            <div className="p-2 w-[250px] text-left">
              <strong style={{ color: borderColor }} className="block mb-1 text-xs uppercase tracking-wider">
                [Round {msg.round}] {msg.speaker}
              </strong>
              <span className="text-xs text-slate-300 leading-tight line-clamp-4">
                {msg.text}
              </span>
            </div>
          ),
        },
        style: {
          background: bgColor,
          border: `2px solid ${borderColor}`,
          borderRadius: '8px',
          color: '#fff',
          width: 280,
        },
      });

      if (index > 0) {
        const isCounterAttack = msg.speaker === 'opponent';
        let edgeColor = isCounterAttack ? '#e11d48' : '#0ea5e9'; 

        newEdges.push({
          id: `edge-${index - 1}-to-${index}`,
          source: `node-${index - 1}`,
          target: `node-${index}`,
          animated: true, 
          style: { stroke: edgeColor, strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
          },
        });
      }
    });

    return { nodes: newNodes, edges: newEdges };
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-700 rounded-lg bg-gray-900/40 mt-6">
        Debate शुरू होने के बाद लॉजिक ट्री यहाँ बनेगा...
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900/40 rounded-lg p-3 border border-gray-800 mt-6">
      <p className="text-xs text-gray-400 mb-2 font-medium">Live Semantic Argument DAG (Logic Tree)</p>
      <div className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-700">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          fitView 
          attributionPosition="bottom-right"
        >
          <Background color="#334155" gap={20} />
          <Controls className="bg-slate-800 fill-slate-300 border-slate-700" />
          <MiniMap 
            nodeColor={(node) => node.style?.borderColor as string || '#ccc'} 
            maskColor="rgba(15, 23, 42, 0.7)" 
            className="bg-slate-900"
          />
        </ReactFlow>
      </div>
    </div>
  );
}