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
        backgroundColor: '#0B1121', // Dark Theme
      });

      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate full image height based on PDF width
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // 🔥 MULTI-PAGE FIX: Handles long debates properly by splitting them across A4 pages
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
        {isGenerating ? '⏳ Generating...' : '📄 Export Premium PDF Report'}
      </button>

      {/* ─── HIDDEN ULTRA-PREMIUM HTML REPORT ─── */}
      <div 
        ref={hiddenReportRef} 
        style={{ 
          display: 'none', 
          width: '850px', 
          padding: '50px', 
          backgroundColor: '#0B1121', 
          color: '#F1F5F9', 
          // 🔥 FONT FIX: Ensures regional languages like Gujarati, Hindi, etc., print perfectly
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}
      >
        {/* HEADER */}
        <div style={{ borderBottom: '1px solid #1E293B', paddingBottom: '25px', marginBottom: '35px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '2px', color: '#FFFFFF' }}>
            AI DEBATE ARENA
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Financial War-Room | Official Evaluation Report
          </p>
        </div>

        {/* META DATA */}
        <div style={{ marginBottom: '40px', backgroundColor: '#131C31', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3B82F6' }}>
          <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#94A3B8' }}>DEBATE TOPIC:</p>
          <p style={{ fontSize: '20px', color: '#FFFFFF', fontWeight: 'bold', margin: '0 0 15px 0' }}>{topic}</p>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            GENERATED ON: {new Date().toLocaleString('en-IN')}
          </p>
        </div>

        {/* SCORE BREAKDOWN */}
        {scores && (
          <div style={{ marginBottom: '50px' }}>
            <h2 style={{ fontSize: '20px', color: '#FFFFFF', paddingBottom: '15px', marginBottom: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Judge Verdict & Score Breakdown
            </h2>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
              {/* Proponent Card */}
              <div style={{ flex: 1, backgroundColor: '#131C31', padding: '25px', borderRadius: '16px', borderTop: '5px solid #00D4FF', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <h3 style={{ color: '#00D4FF', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>PROPONENT (BULL)</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}><span>Logic:</span> <strong>{scores.proponent.logic}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}><span>Evidence:</span> <strong>{scores.proponent.evidence}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}><span>Persuasion:</span> <strong>{scores.proponent.persuasion}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><span>Creativity:</span> <strong>{scores.proponent.creativity}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0B1121', padding: '15px', borderRadius: '8px' }}>
                  <span style={{ color: '#00D4FF', fontWeight: 'bold' }}>OVERALL</span> 
                  <strong style={{ fontSize: '28px', color: '#00D4FF' }}>{scores.proponent.overall}</strong>
                </div>
              </div>

              {/* Opponent Card */}
              <div style={{ flex: 1, backgroundColor: '#131C31', padding: '25px', borderRadius: '16px', borderTop: '5px solid #FF2D55', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <h3 style={{ color: '#FF2D55', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>OPPONENT (BEAR)</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}><span>Logic:</span> <strong>{scores.opponent.logic}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}><span>Evidence:</span> <strong>{scores.opponent.evidence}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}><span>Persuasion:</span> <strong>{scores.opponent.persuasion}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><span>Creativity:</span> <strong>{scores.opponent.creativity}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0B1121', padding: '15px', borderRadius: '8px' }}>
                  <span style={{ color: '#FF2D55', fontWeight: 'bold' }}>OVERALL</span> 
                  <strong style={{ fontSize: '28px', color: '#FF2D55' }}>{scores.opponent.overall}</strong>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#131C31', padding: '20px', borderRadius: '12px' }}>
              <div style={{ marginBottom: '15px', fontSize: '18px' }}>
                <strong style={{ color: '#94A3B8' }}>FINAL WINNER: </strong>
                <span style={{ color: isProWinner ? '#00D4FF' : (isOppWinner ? '#FF2D55' : '#CBD5E1'), fontWeight: '900', letterSpacing: '1px' }}>
                  {scores.winner.toUpperCase()}
                </span>
              </div>
              <div style={{ color: '#CBD5E1', lineHeight: '1.7', fontSize: '15px' }}>
                <strong style={{ color: '#FFFFFF' }}>Summary: </strong> {scores.summary}
              </div>
            </div>
          </div>
        )}

        {/* TRANSCRIPT */}
        <div>
          <h2 style={{ fontSize: '20px', color: '#FFFFFF', paddingBottom: '15px', marginBottom: '25px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #1E293B' }}>
            Full Debate Transcript
          </h2>
          
          <div>
            {messages.map((m, i) => {
              const isPro = m.speaker === 'proponent';
              const isOpp = m.speaker === 'opponent';
              const accentColor = isPro ? '#00D4FF' : (isOpp ? '#FF2D55' : '#94A3B8');
              const label = isPro ? 'PROPONENT' : (isOpp ? 'OPPONENT' : 'JUDGE');
              const hasPenalty = m.text.includes('SYSTEM NOTE: PENALTY APPLIED');

              return (
                <div key={i} style={{ 
                  backgroundColor: hasPenalty ? '#2A131A' : '#131C31', 
                  borderLeft: `5px solid ${hasPenalty ? '#FF2D55' : accentColor}`,
                  padding: '25px',
                  marginBottom: '20px',
                  borderRadius: '0 12px 12px 0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ color: hasPenalty ? '#FF2D55' : accentColor, fontWeight: '900', fontSize: '14px', letterSpacing: '1px' }}>
                      [ROUND {m.round}] {label}
                    </span>
                    {hasPenalty && <span style={{ backgroundColor: '#FF2D55', color: '#FFF', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>PENALTY APPLIED</span>}
                  </div>
                  
                  <div style={{ color: '#E2E8F0', fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
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