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
      const html2pdf = (await import('html2pdf.js')).default as any;

      const element = hiddenReportRef.current;
      element.style.display = 'block';

      const safeTopic = (topic || 'debate').slice(0, 40).replace(/[^a-z0-9]+/gi, '_');

      const opt = {
        margin:       [40, 40, 40, 40], 
        filename:     `Debate-Report_${safeTopic}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0B1121' }, // 🔥 Dark Background
        jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] } // 🔥 FIXES PAGE CUTTING FOR TABLES
      };

      await html2pdf().set(opt).from(element).save();

      element.style.display = 'none';

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("PDF generate karne mein problem aayi. Please try again.");
      if (hiddenReportRef.current) hiddenReportRef.current.style.display = 'none';
    } finally {
      setIsGenerating(false);
    }
  };

  const getRemarksForRound = (roundNum: number) => {
    const roundMsgs = messages.filter(m => m.round === roundNum);
    let remarks: string[] = [];
    roundMsgs.forEach(m => {
      if (m.text.includes('SYSTEM NOTE: PENALTY APPLIED')) {
        remarks.push(`${m.speaker.toUpperCase()}: Penalty!`);
      }
    });
    return remarks.length > 0 ? remarks.join(', ') : 'Clean Round';
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled || isGenerating}
        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold tracking-wide inline-flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
      >
        {isGenerating ? '⏳ Generating PDF...' : '📄 Export Premium PDF Report'}
      </button>

      {/* ─── HIDDEN DARK FORMAL HTML REPORT (EXACT MATCH) ─── */}
      <div 
        ref={hiddenReportRef} 
        style={{ 
          display: 'none', 
          width: '800px', 
          padding: '0', 
          backgroundColor: '#0B1121', // Dark formal theme
          color: '#F1F5F9', 
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#FFFFFF' }}>AI DEBATE ARENA</h1>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 15px 0' }}>FINANCIAL WAR-ROOM | OFFICIAL EVALUATION REPORT</p>
          
          <p style={{ fontSize: '12px', margin: '0 0 5px 0', lineHeight: '1.5', color: '#E2E8F0' }}>
            <strong style={{ color: '#94A3B8' }}>DEBATE TOPIC:</strong> <span style={{ color: '#00D4FF' }}>{topic}</span>
          </p>
          <p style={{ fontSize: '12px', margin: '0 0 20px 0', color: '#E2E8F0' }}>
            <strong style={{ color: '#94A3B8' }}>GENERATED ON:</strong> {new Date().toLocaleString('en-IN')}
          </p>
        </div>

        {/* SCORE BREAKDOWN */}
        {scores && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #1E293B', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', color: '#FFFFFF' }}>
              JUDGE VERDICT & SCORE BREAKDOWN
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  <th style={{ padding: '8px 4px', textAlign: 'left', color: '#94A3B8' }}>Metric</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', color: '#00D4FF' }}>Proponent (BULL)</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', color: '#FF2D55' }}>Opponent (BEAR)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Logic & Reasoning', pro: scores.proponent.logic, opp: scores.opponent.logic },
                  { label: 'Evidence Quality', pro: scores.proponent.evidence, opp: scores.opponent.evidence },
                  { label: 'Persuasion & Delivery', pro: scores.proponent.persuasion, opp: scores.opponent.persuasion },
                  { label: 'Creativity', pro: scores.proponent.creativity, opp: scores.opponent.creativity },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 4px', color: '#E2E8F0' }}>{row.label}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#00D4FF' }}>{row.pro}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#FF2D55' }}>{row.opp}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #334155', fontWeight: 'bold' }}>
                  <td style={{ padding: '8px 4px', color: '#FFFFFF' }}>OVERALL SCORE</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center', color: '#00D4FF' }}>{scores.proponent.overall}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center', color: '#FF2D55' }}>{scores.opponent.overall}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: '13px', marginBottom: '8px', color: '#E2E8F0' }}>
              <strong style={{ color: '#94A3B8' }}>FINAL WINNER: </strong> 
              <span style={{ color: scores.winner === 'proponent' ? '#00D4FF' : (scores.winner === 'opponent' ? '#FF2D55' : '#CBD5E1') }}>
                {scores.winner.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.5', textAlign: 'justify', color: '#CBD5E1' }}>
              <strong style={{ color: '#FFFFFF' }}>Summary: </strong> {scores.summary}
            </div>
          </div>
        )}

        {/* ROUND-BY-ROUND */}
        {scoreHistory.length > 0 && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #1E293B', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', color: '#FFFFFF' }}>
              ROUND-BY-ROUND TRAJECTORY
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  <th style={{ padding: '8px 4px', textAlign: 'left', color: '#94A3B8' }}>Round</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', color: '#00D4FF' }}>Proponent Score</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', color: '#FF2D55' }}>Opponent Score</th>
                  <th style={{ padding: '8px 4px', textAlign: 'left', color: '#94A3B8' }}>Remarks/Penalties</th>
                </tr>
              </thead>
              <tbody>
                {scoreHistory.map((pt, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 4px', color: '#E2E8F0' }}>Round {pt.round}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#00D4FF' }}>{pt.pro}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#FF2D55' }}>{pt.opp}</td>
                    <td style={{ padding: '8px 4px', color: '#94A3B8' }}>{getRemarksForRound(pt.round)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TRANSCRIPT */}
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #1E293B', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', color: '#FFFFFF' }}>
            FULL DEBATE TRANSCRIPT
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B' }}>
                <th style={{ padding: '8px 4px', textAlign: 'left', width: '20%', color: '#94A3B8' }}>Speaker</th>
                <th style={{ padding: '8px 4px', textAlign: 'left', width: '80%', color: '#94A3B8' }}>Argument / Statement</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m, i) => {
                const isPro = m.speaker === 'proponent';
                const isOpp = m.speaker === 'opponent';
                const label = isPro ? 'PROPONENT' : (isOpp ? 'OPPONENT' : 'JUDGE');
                const accentColor = isPro ? '#00D4FF' : (isOpp ? '#FF2D55' : '#94A3B8');
                const hasPenalty = m.text.includes('SYSTEM NOTE: PENALTY APPLIED');

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1E293B', pageBreakInside: 'avoid', backgroundColor: hasPenalty ? '#2A131A' : 'transparent' }}>
                    <td style={{ padding: '12px 4px', verticalAlign: 'top', fontWeight: 'bold', color: accentColor }}>
                      [R{m.round}]<br/>{label}
                    </td>
                    <td style={{ padding: '12px 4px', verticalAlign: 'top', whiteSpace: 'pre-wrap', lineHeight: '1.5', textAlign: 'justify', color: '#E2E8F0' }}>
                      {m.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}