'use client';

import type { FallacyResult } from '@/hooks/useDebate';

interface FallacyBadgeProps {
  result?: FallacyResult;
}

// Drop this right under any debate message bubble - it only renders when
// the background LLM check actually found a fallacy in that statement.
export function FallacyBadge({ result }: FallacyBadgeProps) {
  if (!result || !result.hasFallacy || !result.fallacyName) return null;

  return (
    <div className="mt-1.5 flex flex-col gap-1 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs max-w-[90%]">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-amber-400 tracking-wide">
          ⚠ {result.fallacyName}
        </span>
        {/* 🔥 Penalty Points Chip */}
        {result.penalty > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] uppercase tracking-wider border border-rose-500/20">
            -{result.penalty} Penalty
          </span>
        )}
      </div>
      <span className="text-amber-400/70 leading-relaxed text-[11px]">
        {result.explanation}
      </span>
    </div>
  );
}