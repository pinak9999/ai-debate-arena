'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { StockData } from '@/hooks/useDebate';

interface StockChartProps {
  data: StockData | null;
  loading?: boolean;
}

// 🔥 FIX: UTC टाइम को IST (Indian Standard Time) में कन्वर्ट करने का हेल्पर फंक्शन
const convertToIST = (timeStr: string) => {
  if (!timeStr) return timeStr;
  
  // अगर टाइम "03:45 am" फॉर्मेट में है, तो उसे पकड़ें
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return timeStr; // अगर फॉर्मेट अलग है, तो जैसा है वैसा ही लौटा दें

  let h = parseInt(match[1], 10);
  let m = parseInt(match[2], 10);
  const isPm = match[3].toLowerCase() === 'pm';

  if (isPm && h !== 12) h += 12;
  if (!isPm && h === 12) h = 0;

  // 5 घंटे 30 मिनट जोड़ें (UTC -> IST)
  m += 30;
  if (m >= 60) {
    m -= 60;
    h += 1;
  }
  h += 5;
  if (h >= 24) h -= 24;

  const outPm = h >= 12;
  let outH = h % 12;
  if (outH === 0) outH = 12;
  const outM = m.toString().padStart(2, '0');

  return `${outH}:${outM} ${outPm ? 'PM' : 'AM'}`;
};

export function StockChart({ data, loading }: StockChartProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-blue-500/20 bg-[#050810] p-6 flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-white/40">
          <Activity className="w-5 h-5 animate-pulse text-emerald-400" />
          <span className="text-xs tracking-widest uppercase">Fetching live market feed…</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isUp = data.change >= 0;
  const lineColor = isUp ? '#34d399' : '#ff2d55';

  // 🔥 FIX: यहाँ मैप करते समय हमने convertToIST लगा दिया है
  const mergedData = data.prices.map((p, i) => ({
    time: convertToIST(p.time),
    price: p.price,
    volume: data.volumeData[i]?.volume ?? 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-800/50 bg-[#0a0f1a] p-4 md:p-5 relative overflow-hidden shadow-lg"
    >
      <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${lineColor}, transparent)` }} />

      {/* Header: Symbol + Price + Change */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-orbitron font-black text-xl text-white tracking-wide">{data.symbol}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1.5 font-bold tracking-widest" style={{ backgroundColor: `${lineColor}15`, color: lineColor, border: `1px solid ${lineColor}30` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: lineColor }} /> LIVE
            </span>
          </div>
          {data.companyName && (
            <p className="text-gray-400 text-xs mt-1 font-medium">{data.companyName}</p>
          )}
        </div>

        <div className="text-right">
          <p className="font-orbitron font-bold text-3xl text-white tracking-tight">
            ₹{data.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center gap-1 justify-end text-sm font-bold mt-1 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{isUp ? '+' : ''}{data.change} ({isUp ? '+' : ''}{data.changePercent}%)</span>
          </div>
        </div>
      </div>

      {/* Day High/Low strip */}
      {(data.dayHigh || data.dayLow) && (
        <div className="flex gap-6 mb-4 text-[11px] text-gray-500 uppercase tracking-widest font-semibold border-b border-gray-800/50 pb-3">
          {data.dayHigh && <span>Day High: <span className="text-gray-300">₹{data.dayHigh}</span></span>}
          {data.dayLow && <span>Day Low: <span className="text-gray-300">₹{data.dayLow}</span></span>}
        </div>
      )}

      {/* Intraday Chart: Price Line + Volume Bars */}
      <div className="h-60 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {/* ग्रिड को और सटल (Subtle) बनाया है */}
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              yAxisId="price"
              domain={['auto', 'auto']}
              tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(val) => `₹${val}`}
            />
            <YAxis yAxisId="volume" orientation="right" hide />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 12,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
              }}
              labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
              itemStyle={{ fontWeight: 'bold' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Bar yAxisId="volume" dataKey="volume" fill="rgba(255,255,255,0.05)" barSize={4} radius={[2, 2, 0, 0]} />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#0a0f1a', stroke: lineColor, strokeWidth: 2 }}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}