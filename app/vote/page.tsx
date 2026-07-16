// app/vote/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Sword, CheckCircle } from 'lucide-react';

function VotingComponent() {
  const searchParams = useSearchParams();
  const round = parseInt(searchParams.get('round') || '1', 10);
  const topic = searchParams.get('topic') || 'the ongoing debate';

  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVote = async (side: 'proponent' | 'opponent') => {
    setLoading(false);
    setLoading(true);
    
    const { error } = await supabase
      .from('votes')
      .insert([{ side, round_number: round }]);

    if (!error) {
      setVoted(true);
    } else {
      console.error('Vote submission failed:', error);
      alert('Vote submit nahi ho paya, please try again.');
    }
    setLoading(false);
  };

  if (voted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050810] text-white p-6 text-center">
        <CheckCircle className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
        <h1 className="text-xl font-bold tracking-wider uppercase font-orbitron text-emerald-400">Vote Registered!</h1>
        <p className="text-gray-400 text-sm mt-2">आपका वोट लाइव स्क्रीन पर भेज दिया गया है। अगले राउंड का इंतज़ार करें!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050810] text-white p-4 font-sans">
      {/* Header */}
      <div className="text-center my-6 border-b border-gray-800 pb-4">
        <span className="text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full font-bold">
          Live Student Voting
        </span>
        <h1 className="text-sm font-semibold text-gray-400 mt-3 px-4 italic">"{topic}"</h1>
        <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-2">Round {round}</p>
      </div>

      {/* Voting Cards */}
      <div className="flex-1 flex flex-col justify-center gap-4 max-w-md mx-auto w-full px-2">
        <p className="text-center text-xs text-gray-500 uppercase tracking-wider mb-2">किसका आर्ग्युमेंट बेहतर लगा?</p>
        
        {/* Proponent Button */}
        <button
          disabled={loading}
          onClick={() => handleVote('proponent')}
          className="flex items-center gap-4 p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 active:bg-cyan-500/20 transition-all text-left group"
        >
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-cyan-400 font-orbitron tracking-wider text-sm uppercase">Proponent</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Supporting the topic</p>
          </div>
        </button>

        {/* Opponent Button */}
        <button
          disabled={loading}
          onClick={() => handleVote('opponent')}
          className="flex items-center gap-4 p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 active:bg-rose-500/20 transition-all text-left group"
        >
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Sword className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-rose-400 font-orbitron tracking-wider text-sm uppercase">Opponent</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Opposing the topic</p>
          </div>
        </button>
      </div>

      <div className="text-center py-4 text-[9px] text-gray-600 tracking-widest uppercase">
        AI Debate Arena • Built by Pinak
      </div>
    </div>
  );
}

export default function StudentVotePage() {
  return (
    <Suspense fallback={<div className="text-white text-center p-10">Loading Voting Panel...</div>}>
      <VotingComponent />
    </Suspense>
  );
}