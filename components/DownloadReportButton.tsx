'use client';

import { useState } from 'react';
import type { DebateMessage, JudgeScores, ScorePoint } from '../hooks/useDebate';

interface DownloadReportButtonProps {
  topic: string;
  messages: DebateMessage[];
  scores: JudgeScores | null;
  scoreHistory: ScorePoint[];
  disabled?: boolean;
  language?: string;
}

export function DownloadReportButton({
  topic,
  messages,
  scores,
  scoreHistory,
  disabled,
  language = 'English',
}: DownloadReportButtonProps) {
  
  // PDF जनरेट होते समय बटन को लोडिंग स्टेट में डालने के लिए
  const [isGenerating, setIsGenerating] = useState(false);

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleDownload = async () => {
    if (!messages || messages.length === 0) {
      alert("No debate transcript available to download yet!");
      return;
    }

    try {
      setIsGenerating(true);
      
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      // 🔥 1. SMART FONT LOADER (Direct from GitHub CDN)
      const langLower = language.toLowerCase();
      let fontUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf'; // Default English/Latin
      
      // भाषा के अनुसार सही फ़ॉन्ट URL सेट करना
      if (langLower.includes('hindi') || langLower.includes('marathi') || langLower.includes('nepali')) {
        fontUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf';
      } else if (langLower.includes('gujarati')) {
        fontUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf';
      } else if (langLower.includes('bengali')) {
        fontUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf';
      } else if (langLower.includes('tamil')) {
        fontUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf';
      } else if (langLower.includes('telugu')) {
        fontUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf';
      }

      try {
        const response = await fetch(fontUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const base64Font = arrayBufferToBase64(buffer);
          doc.addFileToVFS('NotoCustom.ttf', base64Font);
          doc.addFont('NotoCustom.ttf', 'NotoCustom', 'normal');
          doc.setFont('NotoCustom'); 
        } else {
          doc.setFont('helvetica'); // Fallback
        }
      } catch (error) {
        console.warn("CDN Font failed, using fallback.", error);
        doc.setFont('helvetica');
      }
      
      // ─── THEME COLORS ───
      const colors = {
        primary: [15, 23, 42] as [number, number, number], 
        cyan: [0, 212, 255] as [number, number, number],    
        red: [255, 45, 85] as [number, number, number],     
        gray: [100, 116, 139] as [number, number, number],  
      };

      let y = 50;

      // ─── HEADER SECTION (English Only -> Helvetica) ───
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
      
      // टॉपिक किसी भी भाषा में हो सकता है, इसलिए कस्टम फ़ॉन्ट यूज़ करें
      doc.setFont('NotoCustom', 'normal');
      doc.setFontSize(12);
      const topicLines = doc.splitTextToSize(topic || 'N/A', doc.internal.pageSize.getWidth() - 150);
      doc.text(topicLines, 140, y);
      
      y += topicLines.length * 15 + 10;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`GENERATED ON: ${new Date().toLocaleString('en-IN')} | LANG: ${language.toUpperCase()}`, 40, y);
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
          styles: { font: 'NotoCustom' }, 
          headStyles: { fillColor: colors.primary, textColor: 255, font: 'helvetica' },
          columnStyles: {
            0: { cellWidth: 150, font: 'helvetica' },
            1: { halign: 'center', textColor: colors.cyan, font: 'helvetica', fontStyle: 'bold' },
            2: { halign: 'center', textColor: colors.red, font: 'helvetica', fontStyle: 'bold' }
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 40, right: 40 },
          willDrawCell: function(data) {
            if (data.row.index === 4) doc.setFillColor(241, 245, 249);
          }
        });

        y = (doc as any).lastAutoTable.finalY + 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('FINAL WINNER: ', 40, y);
        doc.setTextColor(...winnerColor);
        doc.text(winnerText, 130, y);
        
        y += 20;

        doc.setFont('NotoCustom', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        const summaryLines = doc.splitTextToSize(`Summary: ${scores.summary || 'N/A'}`, doc.internal.pageSize.getWidth() - 80);
        doc.text(summaryLines, 40, y);
        y += summaryLines.length * 15 + 40;
      }

      // ─── ROUND-BY-ROUND PERFORMANCE ───
      if (scoreHistory && scoreHistory.length > 0) {
        const getRemarksForRound = (roundNum: number) => {
          const roundMsgs = messages.filter(m => m.round === roundNum);
          let remarks: string[] = [];
          roundMsgs.forEach(m => {
            const textStr = m.text || '';
            const penaltyMatch = textStr.match(/\[SYSTEM NOTE: PENALTY APPLIED.*?\]/i);
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
          styles: { font: 'NotoCustom' }, 
          headStyles: { fillColor: [71, 85, 105], textColor: 255, font: 'helvetica' },
          columnStyles: {
            0: { cellWidth: 80, font: 'helvetica' },
            1: { halign: 'center', textColor: colors.cyan, font: 'helvetica', fontStyle: 'bold' },
            2: { halign: 'center', textColor: colors.red, font: 'helvetica', fontStyle: 'bold' },
            3: { textColor: colors.gray, font: 'helvetica' }
          },
          willDrawCell: function(data) {
            if (data.column.index === 3 && typeof data.cell.raw === 'string' && data.cell.raw.includes('Penalty')) {
              doc.setTextColor(220, 38, 38); 
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
        
        // 🔥 BLANK TEXT FIX: अगर टेक्स्ट लोड नहीं हुआ है, तो क्रैश/ब्लैंक होने से बचाएं
        const argumentText = m.text ? m.text.trim() : "[Transcript data missing or not loaded from archive]";
        return [`[R${m.round}]\n${label}`, argumentText];
      });

      autoTable(doc, {
        startY: y,
        head: [['Speaker', 'Argument / Statement']],
        body: transcriptBody,
        theme: 'grid',
        styles: { font: 'NotoCustom', cellPadding: 8, overflow: 'linebreak' }, 
        headStyles: { fillColor: colors.primary, textColor: 255, font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 90, halign: 'center', valign: 'middle', font: 'helvetica', fontStyle: 'bold' },
          1: { cellWidth: 'auto', fontSize: 10 }
        },
        willDrawCell: function(data) {
          if (data.section === 'body' && data.column.index === 0) {
            if (typeof data.cell.raw === 'string') {
              if (data.cell.raw.includes('PROPONENT')) doc.setTextColor(...colors.cyan);
              else if (data.cell.raw.includes('OPPONENT')) doc.setTextColor(...colors.red);
              else doc.setTextColor(...colors.gray);
            }
          }
          if (data.section === 'body' && data.column.index === 1) {
             const textStr = data.cell.raw as string;
             if (textStr.includes('SYSTEM NOTE: PENALTY APPLIED')) doc.setFillColor(254, 242, 242); 
          }
        },
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
      
    } catch (criticalError: any) {
      console.error("PDF Generation Crashed:", criticalError);
      alert("Failed to generate PDF. Check Console for details.");
    } finally {
      setIsGenerating(false); // काम खत्म होने पर बटन वापस नॉर्मल कर दें
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || isGenerating}
      className={`px-5 py-2.5 rounded-lg text-white text-sm font-bold tracking-wide inline-flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] ${
        disabled || isGenerating
          ? 'bg-blue-800 opacity-50 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-500'
      }`}
    >
      {isGenerating ? '⏳ Generating PDF...' : '📄 Export Premium PDF Report'}
    </button>
  );
}