'use client';
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  historyList: any[];
  onSelectDebate: (debate: any) => void;
  onNewDebate: () => void;
}

export default function Sidebar({ isOpen, historyList, onSelectDebate, onNewDebate }: SidebarProps) {
  return (
    <div className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col z-20 overflow-hidden shrink-0`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <span className="font-bold text-xs tracking-wider text-cyan-400 uppercase">चैट इतिहास (History)</span>
        <button 
          onClick={onNewDebate}
          className="text-xs bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1.5 rounded text-white font-medium transition shadow-sm"
        >
          + नई डिबेट
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {historyList.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-8 px-4">
            कोई पुरानी डिबेट सेव नहीं है।
          </div>
        ) : (
          historyList.map((item) => (
            <div 
              key={item._id}
              onClick={() => onSelectDebate(item)}
              className="p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer text-xs transition border border-transparent hover:border-slate-700"
            >
              <p className="font-medium text-slate-200 truncate">{item.topic}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-cyan-500 uppercase">{item.mode}</span>
                <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}