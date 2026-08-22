'use client';

import type { DebateMessage, JudgeScores, ScorePoint } from '../hooks/useDebate';
import { useRef, useState } from 'react';

interface DownloadReportButtonProps {
  topic: string;
  messages: DebateMessage[];
  scores: JudgeScores | null;
  scoreHistory: ScorePoint[];
  disabled?: boolean;
}

export function DownloadReportButton({
  topic,
  messages,
  scores,
  scoreHistory,
  disabled,
}: DownloadReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const hiddenReportRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!hiddenReportRef.current) return;
    setIsGenerating(true);

    try {
      // 🔥 THE FIX: 'as any' लगाकर TypeScript का एरर बाईपास कर दिया
      const html2pdf = (await import('html2pdf.js')).default as any;

      const element = hiddenReportRef.current;
      element.style.display = 'block';

      const safeTopic = (topic || 'debate').slice(0, 40).replace(/[^a-z0-9]+/gi, '_');

      const opt = {
        margin:       [30, 0, 30, 0], // टॉप और बॉटम मार्जिन
        filename:     `Debate-Report_${safeTopic}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0B1121' },
        jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] } // CSS पेज ब्रेक
      };

      await html2pdf().set(opt).from(element).save();

      element.style.display = 'none';

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("PDF generate करने में प्रॉब्लम आयी. Please try again.");
      if (hiddenReportRef.current) hiddenReportRef.current.style.display = 'none';
    } finally {
      setIsGenerating(false);
    }
  };

  const isProWinner = scores?.winner === 'proponent';
  const isOppWinner = scores?.winner === 'opponent';

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled || isGenerating}
        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold tracking-wide inline-flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
      >
        {isGenerating ? '⏳ Generating Pro PDF...' : '📄 Export Premium PDF'}
      </button>

      {/* ─── HIDDEN PREMIUM DARK HTML REPORT ─── */}
      <div 
        ref={hiddenReportRef} 
        style={{ 
          display: 'none', 
          width: '800px', 
          padding: '40px', 
          backgroundColor: '#0B1121', // Dark Theme
          color: '#F1F5F9', // Light Slate Text
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '25px', borderBottom: '1px solid #1E293B', paddingBottom: '15px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 5px 0', letterSpacing: '1px', color: '#FFFFFF' }}>
            AI DEBATE ARENA
          </h1>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
            FINANCIAL WAR-ROOM | OFFICIAL EVALUATION REPORT
          </p>
        </div>

        {/* META DATA */}
        <div style={{ marginBottom: '35px', pageBreakInside: 'avoid' }}>
          <p style={{ fontSize: '14px', margin: '0 0 5px 0' }}>
            <strong style={{ color: '#94A3B8' }}>DEBATE TOPIC:</strong> <span style={{ color: '#00D4FF', fontWeight: 'bold' }}>{topic}</span>
          </p>
          <p style={{ fontSize: '14px', margin: 0 }}>
            <strong style={{ color: '#94A3B8' }}>GENERATED ON:</strong> <span style={{ color: '#E2E8F0' }}>{new Date().toLocaleString('en-IN')}</span>
          </p>
        </div>

        {/* JUDGE VERDICT & SCORE BREAKDOWN */}
        {scores && (
          <div style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #1E293B', paddingBottom: '8px', marginBottom: '15px', color: '#FFFFFF' }}>
              JUDGE VERDICT & SCORE BREAKDOWN
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0F172A', borderTop: '2px solid #1E293B', borderBottom: '2px solid #1E293B' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderRight: '1px solid #1E293B', color: '#94A3B8' }}>Metric</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid #1E293B', color: '#00D4FF' }}>Proponent (BULL)</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#FF2D55' }}>Opponent (BEAR)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Logic & Reasoning', pro: scores.proponent.logic, opp: scores.opponent.logic },
                  { label: 'Evidence Quality', pro: scores.proponent.evidence, opp: scores.opponent.evidence },
                  { label: 'Persuasion & Delivery', pro: scores.proponent.persuasion, opp: scores.opponent.persuasion },
                  { label: 'Creativity', pro: scores.proponent.creativity, opp: scores.opponent.creativity },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1E293B', backgroundColor: i % 2 === 0 ? '#0B1121' : '#131C31' }}>
                    <td style={{ padding: '12px', borderRight: '1px solid #1E293B', color: '#E2E8F0', fontWeight: '500' }}>{row.label}</td>
                    <td style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid #1E293B', color: '#00D4FF', fontWeight: 'bold' }}>{row.pro}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#FF2D55', fontWeight: 'bold' }}>{row.opp}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#0F172A', borderBottom: '2px solid #1E293B', fontWeight: '900' }}>
                  <td style={{ padding: '12px', borderRight: '1px solid #1E293B', color: '#FFFFFF' }}>OVERALL SCORE</td>
                  <td style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid #1E293B', color: '#00D4FF', fontSize: '16px' }}>{scores.proponent.overall}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#FF2D55', fontSize: '16px' }}>{scores.opponent.overall}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginBottom: '15px', fontSize: '16px' }}>
              <strong style={{ color: '#94A3B8' }}>FINAL WINNER: </strong>
              <span style={{ fontWeight: '900', color: isProWinner ? '#00D4FF' : (isOppWinner ? '#FF2D55' : '#CBD5E1') }}>
                {scores.winner.toUpperCase()}
              </span>
            </div>
            <div style={{ lineHeight: '1.6', fontSize: '14px', textAlign: 'justify', color: '#CBD5E1', backgroundColor: '#131C31', padding: '15px', borderRadius: '8px' }}>
              <strong style={{ color: '#FFFFFF' }}>Summary: </strong> {scores.summary}
            </div>
          </div>
        )}

        {/* FULL DEBATE TRANSCRIPT */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #1E293B', paddingBottom: '8px', marginBottom: '15px', color: '#FFFFFF' }}>
            FULL DEBATE TRANSCRIPT
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map((m, i) => {
              const isPro = m.speaker === 'proponent';
              const isOpp = m.speaker === 'opponent';
              const label = isPro ? 'PROPONENT' : (isOpp ? 'OPPONENT' : 'JUDGE');
              const accentColor = isPro ? '#00D4FF' : (isOpp ? '#FF2D55' : '#94A3B8');
              const hasPenalty = m.text.includes('SYSTEM NOTE: PENALTY APPLIED');

              return (
                <div key={i} style={{ 
                  pageBreakInside: 'avoid', // 🔥 THIS PREVENTS THE BOX FROM CUTTING IN HALF 🔥
                  backgroundColor: hasPenalty ? '#2A131A' : (i % 2 === 0 ? '#0B1121' : '#131C31'),
                  borderLeft: `4px solid ${hasPenalty ? '#FF2D55' : accentColor}`,
                  border: `1px solid ${hasPenalty ? '#4c0519' : '#1E293B'}`,
                  borderLeftWidth: '4px',
                  padding: '20px',
                  borderRadius: '8px'
                }}>
                  <div style={{ color: accentColor, fontWeight: '900', fontSize: '13px', marginBottom: '10px', letterSpacing: '1px' }}>
                    [ROUND {m.round}] {label}
                  </div>
                  <div style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}