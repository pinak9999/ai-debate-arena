'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { ScorePoint } from '@/hooks/useDebate';

interface DebateGraphProps {
  data: ScorePoint[];
}

export function DebateGraph({ data = [] }: DebateGraphProps) {
  if (data.length === 0) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-700 rounded-lg">
        Live score graph round 1 ke baad yahan dikhega...
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900/40 rounded-lg p-3 border border-gray-800">
      <p className="text-xs text-gray-400 mb-2 font-medium">Live Round-by-Round Score</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="round" tick={{ fill: '#aaa', fontSize: 12 }} label={{ value: 'Round', position: 'insideBottom', offset: -3, fill: '#aaa', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#aaa', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="pro" name="Proponent" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="opp" name="Opponent" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}