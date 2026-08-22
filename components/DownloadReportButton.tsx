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
      // 🔥 html2pdf library with TypeScript fix
      const html2pdf = (await import('html2pdf.js')).default as any;

      const element = hiddenReportRef.current;
      element.style.display = 'block';

      const safeTopic = (topic || 'debate').slice(0, 40).replace(/[^a-z0-9]+/gi, '_');

      const opt = {
        margin:       [40, 40, 40, 40], // Professional margins for white formal document
        filename:     `Debate-Report_${safeTopic}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
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
        {isGenerating ? '⏳ Generating PDF...' : '📄 Export PDF Report'}
      </button>

      {/* ─── HIDDEN WHITE FORMAL HTML REPORT (EXACT MATCH) ─── */}
      <div 
        ref={hiddenReportRef} 
        style={{ 
          display: 'none', 
          width: '800px', 
          padding: '0', 
          backgroundColor: '#ffffff', // White formal theme
          color: '#000000', 
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0' }}>AI DEBATE ARENA</h1>
          <p style={{ fontSize: '12px', color: '#333', margin: '0 0 15px 0' }}>FINANCIAL WAR-ROOM | OFFICIAL EVALUATION REPORT</p>
          
          <p style={{ fontSize: '12px', margin: '0 0 5px 0', lineHeight: '1.5' }}>
            <strong>DEBATE TOPIC:</strong> {topic}
          </p>
          <p style={{ fontSize: '12px', margin: '0 0 20px 0' }}>
            <strong>GENERATED ON:</strong> {new Date().toLocaleString('en-IN')}
          </p>
        </div>

        {/* SCORE BREAKDOWN */}
        {scores && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase' }}>
              JUDGE VERDICT & SCORE BREAKDOWN
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '8px 4px', textAlign: 'left' }}>Metric</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Proponent (BULL)</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Opponent (BEAR)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Logic & Reasoning', pro: scores.proponent.logic, opp: scores.opponent.logic },
                  { label: 'Evidence Quality', pro: scores.proponent.evidence, opp: scores.opponent.evidence },
                  { label: 'Persuasion & Delivery', pro: scores.proponent.persuasion, opp: scores.opponent.persuasion },
                  { label: 'Creativity', pro: scores.proponent.creativity, opp: scores.opponent.creativity },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 4px' }}>{row.label}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>{row.pro}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>{row.opp}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold' }}>
                  <td style={{ padding: '8px 4px' }}>OVERALL SCORE</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center' }}>{scores.proponent.overall}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center' }}>{scores.opponent.overall}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              <strong>FINAL WINNER: </strong> {scores.winner.toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.5', textAlign: 'justify' }}>
              <strong>Summary: </strong> {scores.summary}
            </div>
          </div>
        )}

        {/* ROUND-BY-ROUND */}
        {scoreHistory.length > 0 && (
          <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase' }}>
              ROUND-BY-ROUND TRAJECTORY
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '8px 4px', textAlign: 'left' }}>Round</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Proponent Score</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Opponent Score</th>
                  <th style={{ padding: '8px 4px', textAlign: 'left' }}>Remarks/Penalties</th>
                </tr>
              </thead>
              <tbody>
                {scoreHistory.map((pt, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 4px' }}>Round {pt.round}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>{pt.pro}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>{pt.opp}</td>
                    <td style={{ padding: '8px 4px' }}>{getRemarksForRound(pt.round)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TRANSCRIPT */}
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase' }}>
            FULL DEBATE TRANSCRIPT
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ padding: '8px 4px', textAlign: 'left', width: '20%' }}>Speaker</th>
                <th style={{ padding: '8px 4px', textAlign: 'left', width: '80%' }}>Argument / Statement</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m, i) => {
                const isPro = m.speaker === 'proponent';
                const isOpp = m.speaker === 'opponent';
                const label = isPro ? 'PROPONENT' : (isOpp ? 'OPPONENT' : 'JUDGE');

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '12px 4px', verticalAlign: 'top', fontWeight: 'bold' }}>
                      [R{m.round}]<br/>{label}
                    </td>
                    <td style={{ padding: '12px 4px', verticalAlign: 'top', whiteSpace: 'pre-wrap', lineHeight: '1.5', textAlign: 'justify' }}>
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