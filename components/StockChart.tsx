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

  // Price और Volume को merge करना ताकि एक ही ChartData array से दोनों रेंडर हों
  const mergedData = data.prices.map((p, i) => ({
    time: p.time,
    price: p.price,
    volume: data.volumeData[i]?.volume ?? 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-blue-500/20 bg-[#050810] p-4 md:p-5 relative overflow-hidden shadow-[0_0_25px_rgba(0,212,255,0.08)]"
    >
      <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${lineColor}, transparent)` }} />

      {/* Header: Symbol + Price + Change */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-orbitron font-black text-lg text-white tracking-wide">{data.symbol}</h3>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-widest font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
            </span>
          </div>
          {data.companyName && (
            <p className="text-white/30 text-[11px] mt-0.5">{data.companyName}</p>
          )}
        </div>

        <div className="text-right">
          <p className="font-orbitron font-bold text-2xl text-white">
            ₹{data.currentPrice.toLocaleString('en-IN')}
          </p>
          <div className={`flex items-center gap-1 justify-end text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{isUp ? '+' : ''}{data.change} ({isUp ? '+' : ''}{data.changePercent}%)</span>
          </div>
        </div>
      </div>

      {/* Day High/Low strip */}
      {(data.dayHigh || data.dayLow) && (
        <div className="flex gap-4 mb-3 text-[10px] text-white/35 uppercase tracking-wider">
          {data.dayHigh && <span>Day High: <span className="text-white/60 font-semibold">₹{data.dayHigh}</span></span>}
          {data.dayLow && <span>Day Low: <span className="text-white/60 font-semibold">₹{data.dayLow}</span></span>}
        </div>
      )}

      {/* Intraday Chart: Price Line + Volume Bars */}
      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mergedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              domain={['auto', 'auto']}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <YAxis yAxisId="volume" orientation="right" hide />
            <Tooltip
              contentStyle={{
                background: '#0a0f1a',
                border: '1px solid rgba(0,212,255,0.25)',
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: '#00d4ff' }}
            />
            <Bar yAxisId="volume" dataKey="volume" fill="rgba(0,212,255,0.12)" barSize={3} />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}