'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// डिबेट हिस्ट्री का टाइप
interface DebateHistory {
  _id: string;
  topic: string;
  mode: string;
  createdAt: string;
}

export default function Sidebar() {
  const [history, setHistory] = useState<DebateHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // बैकएंड से पुरानी डिबेट्स फेच करना
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="w-64 h-screen bg-[#0f111a] border-r border-gray-800 flex flex-col text-gray-300">
      {/* New Debate Button */}
      <div className="p-4">
        <Link 
          href="/"
          className="flex items-center gap-2 w-full p-3 bg-[#1e2130] hover:bg-[#2a2d3e] rounded-lg transition-colors border border-gray-700 font-medium text-sm"
        >
          <span className="text-xl">+</span> New Debate
        </Link>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        <div className="text-xs font-semibold text-gray-500 mb-3 px-2 mt-2">
          PREVIOUS DEBATES
        </div>
        
        {loading ? (
          <div className="text-center text-sm text-gray-500 mt-5 animate-pulse">
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-sm text-gray-600 mt-5">
            No debates yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {history.map((item) => (
              <Link 
                key={item._id}
                href={`/debate/${item._id}`} 
                className="truncate w-full text-left p-3 rounded-md hover:bg-[#1e2130] transition-colors text-sm flex flex-col gap-1"
              >
                <span className="truncate text-gray-200 font-medium">
                  {item.topic}
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {item.mode} • {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* User Profile / Footer area */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        AI Debate Arena v2.0
      </div>
    </div>
  );
}