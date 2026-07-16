'use client';

import type { DebateMessage, JudgeScores, ScorePoint } from '../hooks/useDebate';

interface DownloadReportButtonProps {
  topic: string;
  messages: DebateMessage[];
  scores: JudgeScores | null;
  scoreHistory: ScorePoint[];
  disabled?: boolean;
}

// Requires: npm install jspdf
export function DownloadReportButton({
  topic,
  messages,
  scores,
  scoreHistory,
  disabled,
}: DownloadReportButtonProps) {
  const handleDownload = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    const maxWidth = pageWidth - margin * 2;
    let y = 60;

    const ensureSpace = (needed: number) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 50;
      }
    };

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('AI Debate Arena — Report', margin, y);
    y += 28;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(90);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 24;

    // Topic
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Topic', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const topicLines = doc.splitTextToSize(topic || 'N/A', maxWidth);
    doc.text(topicLines, margin, y);
    y += topicLines.length * 14 + 16;

    // Verdict
    if (scores) {
      ensureSpace(90);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Judge Verdict', margin, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Winner: ${scores.winner.toUpperCase()}`, margin, y);
      y += 16;
      doc.text(`Proponent overall score: ${scores.proponent.overall}`, margin, y);
      y += 16;
      doc.text(`Opponent overall score: ${scores.opponent.overall}`, margin, y);
      y += 16;

      const summaryLines = doc.splitTextToSize(`Summary: ${scores.summary}`, maxWidth);
      ensureSpace(summaryLines.length * 14 + 10);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 14 + 18;
    }

    // Score history table
    if (scoreHistory.length > 0) {
      ensureSpace(30 + scoreHistory.length * 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Round-by-Round Score', margin, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      scoreHistory.forEach((pt) => {
        ensureSpace(14);
        doc.text(`Round ${pt.round}:   Proponent ${pt.pro}   |   Opponent ${pt.opp}`, margin, y);
        y += 14;
      });
      y += 14;
    }

    // Full transcript
    ensureSpace(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Full Transcript', margin, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    messages.forEach((m) => {
      const label = m.speaker === 'judge' ? 'JUDGE' : m.speaker.toUpperCase();
      const lines = doc.splitTextToSize(`[Round ${m.round}] ${label}: ${m.text}`, maxWidth);
      ensureSpace(lines.length * 13 + 8);
      doc.text(lines, margin, y);
      y += lines.length * 13 + 8;
    });

    const safeTopic = (topic || 'debate').slice(0, 40).replace(/[^a-z0-9]+/gi, '_');
    doc.save(`debate-report-${safeTopic}.pdf`);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium inline-flex items-center gap-2"
    >
      📄 Download Debate Report (PDF)
    </button>
  );
}