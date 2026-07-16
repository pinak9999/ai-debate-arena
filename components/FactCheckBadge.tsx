'use client';

import type { FactCheckResult } from '../hooks/useDebate';

interface FactCheckBadgeProps {
  result?: FactCheckResult;
  loading?: boolean;
}

// Drop this right under any debate message bubble alongside FallacyBadge.
export function FactCheckBadge({ result, loading }: FactCheckBadgeProps) {
  if (loading) {
    return (
      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-700/30 border border-gray-600/40 text-gray-400 text-xs animate-pulse">
        🔍 Fact-checking...
      </div>
    );
  }

  if (!result) return null;

  if (!result.found) {
    return (
      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-700/20 border border-gray-600/30 text-gray-500 text-xs">
        🔍 No source found
      </div>
    );
  }

  return (
    <a
      href={result.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 inline-flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs max-w-md hover:bg-emerald-500/20 transition-colors"
    >
      <span className="font-semibold">✓ Source: {result.title}</span>
      <span className="text-emerald-400/70 line-clamp-2">{result.snippet}</span>
    </a>
  );
}