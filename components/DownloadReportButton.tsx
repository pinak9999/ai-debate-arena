'use client';

import type { DebateMessage, JudgeScores, ScorePoint } from '../hooks/useDebate';

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
  const handleDownload = async () => {
    // Dynamic imports to prevent SSR issues
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    
    // ─── THEME COLORS ───
    const colors = {
      primary: [15, 23, 42] as [number, number, number], // Dark Slate
      cyan: [0, 212, 255] as [number, number, number],    // Proponent
      red: [255, 45, 85] as [number, number, number],     // Opponent
      gray: [100, 116, 139] as [number, number, number],  // Neutral
    };

    let y = 50;

    // ─── HEADER SECTION ───
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 80, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('AI DEBATE ARENA', 40, 40);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text('FINANCIAL WAR-ROOM | OFFICIAL EVALUATION REPORT', 40, 60);

    y = 110;

    // ─── META DATA ───
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DEBATE TOPIC:', 40, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const topicLines = doc.splitTextToSize(topic || 'N/A', doc.internal.pageSize.getWidth() - 150);
    doc.text(topicLines, 140, y);
    
    y += topicLines.length * 15 + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`GENERATED ON: ${new Date().toLocaleString('en-IN')}`, 40, y);
    y += 40;

    // ─── JUDGE VERDICT TABLE ───
    if (scores) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...colors.primary);
      doc.text('JUDGE VERDICT & SCORE BREAKDOWN', 40, y);
      y += 15;

      const isProWinner = scores.winner === 'proponent';
      const isOppWinner = scores.winner === 'opponent';
      
      const winnerText = scores.winner.toUpperCase();
      const winnerColor = isProWinner ? colors.cyan : (isOppWinner ? colors.red : colors.gray);

      // Score Breakdown Table
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Proponent (BULL)', 'Opponent (BEAR)']],
        body: [
          ['Logic & Reasoning', scores.proponent.logic, scores.opponent.logic],
          ['Evidence Quality', scores.proponent.evidence, scores.opponent.evidence],
          ['Persuasion & Delivery', scores.proponent.persuasion, scores.opponent.persuasion],
          ['Creativity', scores.proponent.creativity, scores.opponent.creativity],
          ['OVERALL SCORE', scores.proponent.overall, scores.opponent.overall],
        ],
        theme: 'grid',
        headStyles: { fillColor: colors.primary, textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 150 },
          1: { halign: 'center', textColor: colors.cyan, fontStyle: 'bold' },
          2: { halign: 'center', textColor: colors.red, fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 40, right: 40 },
        willDrawCell: function(data) {
          // Highlight the Overall Score row
          if (data.row.index === 4) {
            doc.setFillColor(241, 245, 249);
          }
        }
      });

      y = (doc as any).lastAutoTable.finalY + 20;

      // Winner Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('FINAL WINNER: ', 40, y);
      doc.setTextColor(...winnerColor);
      doc.text(winnerText, 130, y);
      
      y += 20;

      // Summary
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      const summaryLines = doc.splitTextToSize(`Summary: ${scores.summary}`, doc.internal.pageSize.getWidth() - 80);
      doc.text(summaryLines, 40, y);
      y += summaryLines.length * 15 + 40;
    }

    // ─── ROUND-BY-ROUND PERFORMANCE ───
    if (scoreHistory.length > 0) {
      // Logic to extract penalties for remarks
      const getRemarksForRound = (roundNum: number) => {
        const roundMsgs = messages.filter(m => m.round === roundNum);
        let remarks: string[] = [];
        roundMsgs.forEach(m => {
          const penaltyMatch = m.text.match(/\[SYSTEM NOTE: PENALTY APPLIED.*?\]/i);
          if (penaltyMatch) {
            remarks.push(`${m.speaker.toUpperCase()}: Penalty!`);
          }
        });
        return remarks.length > 0 ? remarks.join(', ') : 'Clean Round';
      };

      const roundBody = scoreHistory.map((pt) => [
        `Round ${pt.round}`,
        pt.pro,
        pt.opp,
        getRemarksForRound(pt.round)
      ]);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...colors.primary);
      doc.text('ROUND-BY-ROUND TRAJECTORY', 40, y);
      y += 15;

      autoTable(doc, {
        startY: y,
        head: [['Round', 'Proponent Score', 'Opponent Score', 'Remarks / Penalties']],
        body: roundBody,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], textColor: 255 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'center', textColor: colors.cyan, fontStyle: 'bold' },
          2: { halign: 'center', textColor: colors.red, fontStyle: 'bold' },
          3: { fontStyle: 'italic', textColor: colors.gray }
        },
        willDrawCell: function(data) {
          if (data.column.index === 3 && typeof data.cell.raw === 'string' && data.cell.raw.includes('Penalty')) {
            doc.setTextColor(220, 38, 38); // Dark Red for penalties
            doc.setFont('helvetica', 'bolditalic');
          }
        },
        margin: { left: 40, right: 40 },
      });

      y = (doc as any).lastAutoTable.finalY + 40;
    }

    // ─── FULL TRANSCRIPT TABLE ───
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...colors.primary);
    doc.text('FULL DEBATE TRANSCRIPT', 40, y);
    y += 15;

    const transcriptBody = messages.map(m => {
      const isPro = m.speaker === 'proponent';
      const isOpp = m.speaker === 'opponent';
      const label = isPro ? 'PROPONENT' : (isOpp ? 'OPPONENT' : 'JUDGE');
      return [`[R${m.round}]\n${label}`, m.text];
    });

    autoTable(doc, {
      startY: y,
      head: [['Speaker', 'Argument / Statement']],
      body: transcriptBody,
      theme: 'grid',
      headStyles: { fillColor: colors.primary, textColor: 255 },
      columnStyles: {
        0: { cellWidth: 90, fontStyle: 'bold', halign: 'center', valign: 'middle' },
        1: { cellWidth: 'auto', fontSize: 10 }
      },
      willDrawCell: function(data) {
        if (data.section === 'body' && data.column.index === 0) {
          if (data.cell.raw && typeof data.cell.raw === 'string') {
            if (data.cell.raw.includes('PROPONENT')) doc.setTextColor(...colors.cyan);
            else if (data.cell.raw.includes('OPPONENT')) doc.setTextColor(...colors.red);
            else doc.setTextColor(...colors.gray);
          }
        }
        // Highlight penalties in transcript
        if (data.section === 'body' && data.column.index === 1) {
             const textStr = data.cell.raw as string;
             if (textStr.includes('SYSTEM NOTE: PENALTY APPLIED')) {
                 // Subtle red background tint for rows with penalties
                 doc.setFillColor(254, 242, 242); 
             }
        }
      },
      styles: { cellPadding: 8, overflow: 'linebreak' },
      margin: { left: 40, right: 40, bottom: 40 },
    });

    // ─── FOOTER (Page Numbers) ───
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | AI Debate Arena`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'center' }
      );
    }

    const safeTopic = (topic || 'debate').slice(0, 40).replace(/[^a-z0-9]+/gi, '_');
    doc.save(`Debate-Report_${safeTopic}.pdf`);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold tracking-wide inline-flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
    >
      📄 Export Premium PDF Report
    </button>
  );
}