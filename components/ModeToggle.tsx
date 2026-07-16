'use client';

import type { DebateMode } from '../hooks/useDebate';

interface ModeToggleProps {
  mode: DebateMode;
  setMode: (m: DebateMode) => void;
  disabled?: boolean;
}

// Disable this once the debate has started (status !== 'idle') so the user
// can't flip modes mid-fight.
export function ModeToggle({ mode, setMode, disabled }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center bg-gray-800 rounded-full p-1 border border-gray-700">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setMode('spectator')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === 'spectator' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        🤖 Spectator (AI vs AI)
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setMode('player')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === 'player' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        🎮 Player (You vs AI)
      </button>
    </div>
  );
}