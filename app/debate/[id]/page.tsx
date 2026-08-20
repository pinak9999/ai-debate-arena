'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';

export default function PastDebate() {
  const { id } = useParams();
  const [debate, setDebate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // बैकएंड से डिबेट का पूरा डेटा मँगवाना
    const fetchDebate = async () => {
      try {
        const res = await fetch(`/api/history/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDebate(data);
        }
      } catch (error) {
        console.error('Error fetching debate:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchDebate();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090c] flex items-center justify-center text-white font-orbitron animate-pulse">
        Loading History...
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="min-h-screen bg-[#08090c] flex flex-col items-center justify-center text-white font-orbitron">
        <p>Debate Not Found!</p>
        <Link href="/" className="mt-4 text-blue-400 hover:text-blue-300 underline transition-colors">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#08090c] overflow-y-auto font-sans p-6">
      <ParticleBackground />
      
      <div className="max-w-4xl mx-auto relative z-10 pt-4">
        {/* बैक बटन */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors text-sm font-medium tracking-wider uppercase">
          <ArrowLeft className="w-4 h-4" />
          Back to Arena
        </Link>

        {/* डिबेट का हेडर (Topic & Details) */}
        <div className="mb-12 text-center border-b border-white/10 pb-8">
          <h1 className="text-2xl md:text-4xl font-orbitron font-bold text-white mb-4 uppercase tracking-wider leading-tight">
            {debate.topic}
          </h1>
          <div className="flex items-center justify-center gap-4 text-[10px] tracking-[0.2em] uppercase font-bold">
            <span className="text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Mode: {debate.mode}
            </span>
            <span className={debate.winner === 'proponent' ? 'text-blue-400' : debate.winner === 'opponent' ? 'text-red-400' : 'text-gray-400'}>
              Winner: {debate.winner}
            </span>
          </div>
          <p className="text-gray-600 text-xs mt-4 font-mono">
            Recorded on: {new Date(debate.createdAt).toLocaleString()}
          </p>
        </div>

        {/* चैट मैसेजेस (Chat History) */}
        <div className="space-y-6 pb-20">
          {debate.messages.map((msg: any, index: number) => (
            <div 
              key={index} 
              className={`p-5 rounded-2xl border backdrop-blur-sm shadow-2xl ${
                msg.speaker === 'proponent' 
                  ? 'bg-blue-900/10 border-blue-500/20 ml-0 mr-auto w-[90%] md:w-[80%]' 
                  : 'bg-red-900/10 border-red-500/20 ml-auto w-[90%] md:w-[80%]'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-orbitron font-bold uppercase tracking-widest ${
                  msg.speaker === 'proponent' ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {msg.speaker === 'proponent' ? '🛡️ Proponent' : '⚔️ Opponent'}
                </span>
                <span className="text-white/20 text-[10px] ml-auto font-mono bg-white/5 px-2 py-0.5 rounded">
                  Round {msg.round}
                </span>
              </div>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}