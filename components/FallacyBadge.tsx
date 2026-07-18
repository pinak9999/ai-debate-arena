'use client';

import type { FallacyResult } from '@/hooks/useDebate';

interface FallacyBadgeProps {
  result?: FallacyResult;
}

export function FallacyBadge({ result }: FallacyBadgeProps) {
  if (!result || !result.hasFallacy || !result.fallacyName) return null;

  // 🔥 चेक करें कि क्या AI टॉपिक से भटका है (Tangent/Off-Topic)
  const isOffTopic = 
    result.fallacyName.toLowerCase().includes('tangent') || 
    result.fallacyName.toLowerCase().includes('off-topic');

  return (
    <div className={`mt-1.5 flex flex-col gap-1 px-3 py-2 rounded-lg border text-xs max-w-[90%] ${
      isOffTopic ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'
    }`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`font-bold tracking-wide ${isOffTopic ? 'text-red-400' : 'text-amber-400'}`}>
          {isOffTopic ? '🔴 OFF-TOPIC TANGENT' : `⚠ ${result.fallacyName}`}
        </span>
        
        {/* Penalty Points Chip */}
        {result.penalty > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] uppercase tracking-wider border border-rose-500/20">
            -{result.penalty} Penalty
          </span>
        )}
      </div>
      <span className={`${isOffTopic ? 'text-red-400/80' : 'text-amber-400/70'} leading-relaxed text-[11px]`}>
        {result.explanation}
      </span>
    </div>
  );
}