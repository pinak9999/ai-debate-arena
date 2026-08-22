'use client';

import React from 'react';
import { Plus, Trash2, Activity, Zap, PlaySquare, FileText, MessageSquare, History } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  historyList: any[];
  onSelectDebate: (debate: any) => void;
  onNewDebate: () => void;
  // अगर तुमने डिलीट फंक्शन बैकएंड में नहीं बनाया है, तो अभी के लिए इसे ऑप्शनल रख सकते हो
  onDeleteDebate?: (id: string, e: React.MouseEvent) => void; 
}

// हर मोड के लिए अलग आइकॉन और कलर 
const getModeIcon = (mode: string) => {
  switch (mode?.toLowerCase()) {
    case 'stock': return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
    case 'youtube': return <PlaySquare className="w-3.5 h-3.5 text-red-500" />;
    case 'personality': return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
    case 'document': return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    default: return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
  }
};

export default function Sidebar({ isOpen, historyList, onSelectDebate, onNewDebate, onDeleteDebate }: SidebarProps) {
  return (
    <div 
      className={`${isOpen ? 'w-[280px]' : 'w-0'} 
      transition-all duration-500 ease-in-out shrink-0 flex flex-col z-20 h-full
      bg-[#05070a]/80 backdrop-blur-xl border-r border-cyan-900/40 shadow-[4px_0_24px_rgba(0,212,255,0.03)]`}
    >
      {/* ─── 3D NEON HEADER ─── */}
      <div className="p-5 border-b border-cyan-900/50 bg-gradient-to-b from-cyan-950/20 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-500 drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
          <span className="font-orbitron font-bold text-[11px] tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase">
            Data Logs
          </span>
        </div>
        
        <button 
          onClick={onNewDebate}
          className="group relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg overflow-hidden bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:bg-cyan-500/30 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">New</span>
        </button>
      </div>

      {/* ─── 3D HISTORY CARDS LIST ─── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {historyList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-40">
            <MessageSquare className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-xs text-slate-400 font-orbitron tracking-wider">No Archives Found</p>
          </div>
        ) : (
          historyList.map((item) => (
            <div 
              key={item._id || item.id}
              onClick={() => onSelectDebate(item)}
              className="group relative flex flex-col p-3.5 rounded-xl cursor-pointer transition-all duration-300 bg-white/[0.02] border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-950/30 hover:shadow-[inset_0_0_20px_rgba(0,212,255,0.05),0_4_12px_rgba(0,0,0,0.5)] hover:scale-[1.02]"
            >
              {/* Left Glowing Accent Line */}
              <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_8px_rgba(0,212,255,0.8)]"></div>

              <div className="flex justify-between items-start gap-3">
                <p className="font-medium text-slate-300 group-hover:text-white text-sm line-clamp-2 leading-snug transition-colors drop-shadow-md">
                  {item.topic}
                </p>
                {/* Delete Button (Optional) */}
                {onDeleteDebate && (
                  <button 
                    onClick={(e) => onDeleteDebate(item._id || item.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-all rounded-md hover:bg-red-500/10 shrink-0"
                    title="Delete Archive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 group-hover:border-cyan-500/20 transition-colors">
                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-white/5 group-hover:border-cyan-500/20">
                  {getModeIcon(item.mode)}
                  <span className="text-[9px] text-slate-300 uppercase tracking-widest font-semibold font-orbitron drop-shadow-sm">
                    {item.mode || 'Topic'}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono tracking-tighter group-hover:text-cyan-400/60 transition-colors">
                  {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}