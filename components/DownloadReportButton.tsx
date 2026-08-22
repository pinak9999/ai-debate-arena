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
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = hiddenReportRef.current;
      
      // Make element temporarily visible for capture
      element.style.display = 'block';

      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // 🔥 White Background for formal report
      });

      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
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
        {isGenerating ? '⏳ Generating PDF...' : '📄 Export PDF Report'}
      </button>

      {/* ─── HIDDEN FORMAL HTML REPORT ─── */}
      <div 
        ref={hiddenReportRef} 
        style={{ 
          display: 'none', 
          width: '800px', 
          padding: '40px', 
          backgroundColor: '#ffffff', 
          color: '#000000', 
          // Universal Font Fix for Regional Languages
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 5px 0', letterSpacing: '1px' }}>
            AI DEBATE ARENA
          </h1>
          <p style={{ fontSize: '14px', color: '#555', margin: 0, letterSpacing: '0.5px' }}>
            FINANCIAL WAR-ROOM | OFFICIAL EVALUATION REPORT
          </p>
        </div>

        {/* META DATA */}
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '14px', margin: '0 0 5px 0' }}>
            <strong>DEBATE TOPIC:</strong> {topic}
          </p>
          <p style={{ fontSize: '14px', color: '#555', margin: 0 }}>
            <strong>GENERATED ON:</strong> {new Date().toLocaleString('en-IN')}
          </p>
        </div>

        {/* JUDGE VERDICT & SCORE BREAKDOWN */}
        {scores && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
              JUDGE VERDICT & SCORE BREAKDOWN
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Metric</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #ccc' }}>Proponent (BULL)</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Opponent (BEAR)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Logic & Reasoning', pro: scores.proponent.logic, opp: scores.opponent.logic },
                  { label: 'Evidence Quality', pro: scores.proponent.evidence, opp: scores.opponent.evidence },
                  { label: 'Persuasion & Delivery', pro: scores.proponent.persuasion, opp: scores.opponent.persuasion },
                  { label: 'Creativity', pro: scores.proponent.creativity, opp: scores.opponent.creativity },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px', borderRight: '1px solid #ccc' }}>{row.label}</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #ccc' }}>{row.pro}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.opp}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #000', fontWeight: 'bold' }}>
                  <td style={{ padding: '10px', borderRight: '1px solid #ccc' }}>OVERALL SCORE</td>
                  <td style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #ccc' }}>{scores.proponent.overall}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{scores.opponent.overall}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginBottom: '15px', fontSize: '15px' }}>
              <strong>FINAL WINNER: </strong>
              <span style={{ fontWeight: 'bold' }}>
                {scores.winner.toUpperCase()}
              </span>
            </div>
            <div style={{ lineHeight: '1.6', fontSize: '14px', textAlign: 'justify' }}>
              <strong>Summary: </strong> {scores.summary}
            </div>
          </div>
        )}

        {/* ROUND-BY-ROUND TRAJECTORY */}
        {scoreHistory.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
              ROUND-BY-ROUND TRAJECTORY
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Round</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #ccc' }}>Proponent Score</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #ccc' }}>Opponent Score</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Remarks / Penalties</th>
                </tr>
              </thead>
              <tbody>
                {scoreHistory.map((pt, i) => {
                  const remarks = getRemarksForRound(pt.round);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px', borderRight: '1px solid #ccc' }}>Round {pt.round}</td>
                      <td style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #ccc' }}>{pt.pro}</td>
                      <td style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #ccc' }}>{pt.opp}</td>
                      <td style={{ padding: '10px' }}>{remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FULL DEBATE TRANSCRIPT */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
            FULL DEBATE TRANSCRIPT
          </h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                <th style={{ padding: '10px', textAlign: 'left', width: '20%', borderRight: '1px solid #ccc' }}>Speaker</th>
                <th style={{ padding: '10px', textAlign: 'left', width: '80%' }}>Argument / Statement</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m, i) => {
                const isPro = m.speaker === 'proponent';
                const isOpp = m.speaker === 'opponent';
                const label = isPro ? 'PROPONENT' : (isOpp ? 'OPPONENT' : 'JUDGE');

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '15px 10px', verticalAlign: 'top', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>
                      [R{m.round}]<br/>{label}
                    </td>
                    <td style={{ padding: '15px 10px', verticalAlign: 'top', whiteSpace: 'pre-wrap', lineHeight: '1.6', textAlign: 'justify' }}>
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