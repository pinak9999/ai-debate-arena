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
      // Dynamic imports for performance (avoids SSR issues in Next.js)
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = hiddenReportRef.current;
      
      // Make it temporarily visible for capture
      element.style.display = 'block';

      // Capture the HTML element as a high-res image
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for better text clarity
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Hide it back
      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const safeTopic = (topic || 'debate').slice(0, 40).replace(/[^a-z0-9]+/gi, '_');
      pdf.save(`Debate-Report_${safeTopic}.pdf`);

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("PDF generate karne mein problem aayi. Please try again.");
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
        {isGenerating ? '⏳ Generating...' : '📄 Export Premium PDF Report'}
      </button>

      {/* ─── HIDDEN HTML REPORT FOR PDF CAPTURE ─── */}
      {/* 🔥 MASTER TWEAK: The system font stack perfectly supports ALL Indian regional languages automatically */}
      <div 
        ref={hiddenReportRef} 
        style={{ 
          display: 'none', 
          width: '800px', 
          padding: '0px', 
          backgroundColor: 'white', 
          color: 'black', 
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}
      >
        {/* HEADER */}
        <div style={{ backgroundColor: '#0f172a', padding: '40px', color: 'white' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0' }}>AI DEBATE ARENA</h1>
          <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0 }}>FINANCIAL WAR-ROOM | OFFICIAL EVALUATION REPORT</p>
        </div>

        <div style={{ padding: '40px' }}>
          {/* META DATA */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#0f172a' }}>DEBATE TOPIC:</p>
            <p style={{ fontSize: '18px', color: '#333', fontWeight: '500' }}>{topic}</p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '15px' }}>
              GENERATED ON: {new Date().toLocaleString('en-IN')}
            </p>
          </div>

          {/* JUDGE VERDICT */}
          {scores && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '22px', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px', fontWeight: 'bold' }}>
                JUDGE VERDICT & SCORE BREAKDOWN
              </h2>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Metric</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#00d4ff' }}>Proponent (BULL)</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#ff2d55' }}>Opponent (BEAR)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Logic & Reasoning', pro: scores.proponent.logic, opp: scores.opponent.logic },
                    { label: 'Evidence Quality', pro: scores.proponent.evidence, opp: scores.opponent.evidence },
                    { label: 'Persuasion & Delivery', pro: scores.proponent.persuasion, opp: scores.opponent.persuasion },
                    { label: 'Creativity', pro: scores.proponent.creativity, opp: scores.opponent.creativity },
                  ].map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#334155' }}>{row.label}</td>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#0284c7' }}>{row.pro}</td>
                      <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#e11d48' }}>{row.opp}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <td style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>OVERALL SCORE</td>
                    <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#0284c7' }}>{scores.proponent.overall}</td>
                    <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#e11d48' }}>{scores.opponent.overall}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginBottom: '20px', fontSize: '18px' }}>
                <strong style={{ color: '#0f172a' }}>FINAL WINNER: </strong>
                <span style={{ 
                  color: isProWinner ? '#0284c7' : (isOppWinner ? '#e11d48' : '#64748b'),
                  fontWeight: 'bold'
                }}>
                  {scores.winner.toUpperCase()}
                </span>
              </div>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #0f172a', color: '#334155', lineHeight: '1.6' }}>
                <strong style={{ color: '#0f172a' }}>Summary: </strong> {scores.summary}
              </div>
            </div>
          )}

          {/* ROUND-BY-ROUND */}
          {scoreHistory.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '22px', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px', fontWeight: 'bold' }}>
                ROUND-BY-ROUND TRAJECTORY
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#475569', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Round</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#38bdf8' }}>Proponent Score</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#fb7185' }}>Opponent Score</th>
                    <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Remarks / Penalties</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreHistory.map((pt, i) => {
                    const remarks = getRemarksForRound(pt.round);
                    const hasPenalty = remarks.includes('Penalty');
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#334155' }}>Round {pt.round}</td>
                        <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#0284c7' }}>{pt.pro}</td>
                        <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#e11d48' }}>{pt.opp}</td>
                        <td style={{ padding: '12px', border: '1px solid #cbd5e1', fontStyle: 'italic', color: hasPenalty ? '#dc2626' : '#64748b', fontWeight: hasPenalty ? 'bold' : 'normal' }}>
                          {remarks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TRANSCRIPT */}
          <div>
            <h2 style={{ fontSize: '22px', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px', fontWeight: 'bold' }}>
              FULL DEBATE TRANSCRIPT
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: 'white', textAlign: 'left' }}>
                  <th style={{ padding: '12px', border: '1px solid #cbd5e1', width: '120px' }}>Speaker</th>
                  <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Argument / Statement</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m, i) => {
                  const isPro = m.speaker === 'proponent';
                  const isOpp = m.speaker === 'opponent';
                  const label = isPro ? 'PROPONENT' : (isOpp ? 'OPPONENT' : 'JUDGE');
                  const labelColor = isPro ? '#0284c7' : (isOpp ? '#e11d48' : '#64748b');
                  const hasPenalty = m.text.includes('SYSTEM NOTE: PENALTY APPLIED');

                  return (
                    <tr key={i} style={{ backgroundColor: hasPenalty ? '#fef2f2' : 'white' }}>
                      <td style={{ padding: '15px 12px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: labelColor, verticalAlign: 'top' }}>
                        [R{m.round}]<br/>{label}
                      </td>
                      <td style={{ padding: '15px 12px', border: '1px solid #cbd5e1', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                        {m.text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}