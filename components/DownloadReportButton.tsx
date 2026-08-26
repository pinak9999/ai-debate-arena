'use client';

import { useRef } from 'react';
import type { DebateMessage, JudgeScores, ScorePoint } from '../hooks/useDebate';

interface DownloadReportButtonProps {
  topic: string;
  messages: DebateMessage[];
  scores: JudgeScores | null;
  scoreHistory: ScorePoint[];
  disabled?: boolean;
}

// Font stack covers Latin + all major Indic scripts used in the language selector.
// Browser font-fallback automatically picks the right sub-font per character,
// AND handles proper shaping (matras/conjuncts) — which jsPDF's own text engine cannot do.
const FONT_STACK =
  "'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Bengali', 'Noto Sans Gujarati', " +
  "'Noto Sans Gurmukhi', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Kannada', " +
  "'Noto Sans Malayalam', system-ui, sans-serif";

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  'family=Noto+Sans:wght@400;700' +
  '&family=Noto+Sans+Devanagari:wght@400;700' +
  '&family=Noto+Sans+Bengali:wght@400;700' +
  '&family=Noto+Sans+Gujarati:wght@400;700' +
  '&family=Noto+Sans+Gurmukhi:wght@400;700' +
  '&family=Noto+Sans+Tamil:wght@400;700' +
  '&family=Noto+Sans+Telugu:wght@400;700' +
  '&family=Noto+Sans+Kannada:wght@400;700' +
  '&family=Noto+Sans+Malayalam:wght@400;700' +
  '&display=swap';

async function ensureFontsLoaded() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('report-fonts-link')) {
    const link = document.createElement('link');
    link.id = 'report-fonts-link';
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }
  try {
    await (document as any).fonts?.ready;
  } catch {
    // ignore — fonts API not available in some environments
  }
  // small settle delay so freshly injected @font-face rules are actually applied
  await new Promise((r) => setTimeout(r, 300));
}

function esc(str: unknown) {
  return (str ?? '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildReportHTML(
  topic: string,
  messages: DebateMessage[],
  scores: JudgeScores | null,
  scoreHistory: ScorePoint[]
) {
  const cyan = '#00D4FF';
  const red = '#FF2D55';
  const gray = '#64748B';
  const dark = '#0F172A';

  const winnerColor =
    scores?.winner === 'proponent' ? cyan : scores?.winner === 'opponent' ? red : gray;

  const scoreTable = scores
    ? `
    <h2 style="font-size:18px;font-weight:700;color:${dark};margin:24px 0 10px;">JUDGE VERDICT &amp; SCORE BREAKDOWN</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px;">
      <thead>
        <tr style="background:${dark};color:#fff;">
          <th style="text-align:left;padding:8px;">Metric</th>
          <th style="padding:8px;">Proponent (BULL)</th>
          <th style="padding:8px;">Opponent (BEAR)</th>
        </tr>
      </thead>
      <tbody>
        ${[
          ['Logic & Reasoning', scores.proponent.logic, scores.opponent.logic],
          ['Evidence Quality', scores.proponent.evidence, scores.opponent.evidence],
          ['Persuasion & Delivery', scores.proponent.persuasion, scores.opponent.persuasion],
          ['Creativity', scores.proponent.creativity, scores.opponent.creativity],
          ['OVERALL SCORE', scores.proponent.overall, scores.opponent.overall],
        ]
          .map(
            ([label, pro, opp], i) => `
          <tr style="background:${i % 2 === 1 ? '#F8FAFC' : '#fff'};border-bottom:1px solid #E2E8F0;">
            <td style="padding:8px;font-weight:700;">${esc(label)}</td>
            <td style="padding:8px;text-align:center;color:${cyan};font-weight:700;">${esc(pro)}</td>
            <td style="padding:8px;text-align:center;color:${red};font-weight:700;">${esc(opp)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
    <div style="font-weight:700;font-size:13px;margin-bottom:6px;">
      FINAL WINNER: <span style="color:${winnerColor};">${esc(scores.winner.toUpperCase())}</span>
    </div>
    <div style="font-size:12px;color:#333;margin-bottom:20px;">Summary: ${esc(scores.summary)}</div>
  `
    : '';

  const roundTable =
    scoreHistory.length > 0
      ? `
    <h2 style="font-size:18px;font-weight:700;color:${dark};margin:24px 0 10px;">ROUND-BY-ROUND TRAJECTORY</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
      <thead>
        <tr style="background:#475569;color:#fff;">
          <th style="text-align:left;padding:8px;">Round</th>
          <th style="padding:8px;">Proponent Score</th>
          <th style="padding:8px;">Opponent Score</th>
          <th style="text-align:left;padding:8px;">Remarks / Penalties</th>
        </tr>
      </thead>
      <tbody>
        ${scoreHistory
          .map((pt, i) => {
            const roundMsgs = messages.filter((m) => m.round === pt.round);
            const remarks = roundMsgs
              .filter((m) => /\[SYSTEM NOTE: PENALTY APPLIED.*?\]/i.test(m.text))
              .map((m) => `${m.speaker.toUpperCase()}: Penalty!`);
            const remarkText = remarks.length > 0 ? remarks.join(', ') : 'Clean Round';
            const isPenalty = remarks.length > 0;
            return `
          <tr style="background:${i % 2 === 1 ? '#F1F5F9' : '#fff'};border-bottom:1px solid #E2E8F0;">
            <td style="padding:8px;font-weight:700;">Round ${pt.round}</td>
            <td style="padding:8px;text-align:center;color:${cyan};font-weight:700;">${esc(pt.pro)}</td>
            <td style="padding:8px;text-align:center;color:${red};font-weight:700;">${esc(pt.opp)}</td>
            <td style="padding:8px;font-style:italic;color:${isPenalty ? '#DC2626' : gray};font-weight:${
              isPenalty ? '700' : '400'
            };">${esc(remarkText)}</td>
          </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  `
      : '';

  const transcript = `
    <h2 style="font-size:18px;font-weight:700;color:${dark};margin:24px 0 10px;">FULL DEBATE TRANSCRIPT</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:${dark};color:#fff;">
          <th style="text-align:left;padding:8px;width:90px;">Speaker</th>
          <th style="text-align:left;padding:8px;">Argument / Statement</th>
        </tr>
      </thead>
      <tbody>
        ${messages
          .map((m) => {
            const isPro = m.speaker === 'proponent';
            const isOpp = m.speaker === 'opponent';
            const label = isPro ? 'PROPONENT' : isOpp ? 'OPPONENT' : 'JUDGE';
            const color = isPro ? cyan : isOpp ? red : gray;
            const hasPenalty = /SYSTEM NOTE: PENALTY APPLIED/i.test(m.text);
            return `
          <tr style="border-bottom:1px solid #E2E8F0;background:${hasPenalty ? '#FEF2F2' : '#fff'};">
            <td style="padding:8px;vertical-align:top;text-align:center;font-weight:700;color:${color};">[R${
              m.round
            }]<br/>${label}</td>
            <td style="padding:8px;vertical-align:top;white-space:pre-wrap;line-height:1.6;">${esc(m.text)}</td>
          </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  `;

  return `
    <div style="padding:0 0 30px;">
      <div style="background:${dark};padding:20px 40px;color:#fff;">
        <div style="font-size:22px;font-weight:700;letter-spacing:1px;">AI DEBATE ARENA</div>
        <div style="font-size:10px;color:#ccc;margin-top:4px;letter-spacing:1px;">FINANCIAL WAR-ROOM | OFFICIAL EVALUATION REPORT</div>
      </div>
      <div style="padding:24px 40px 0;">
        <div style="font-size:13px;margin-bottom:6px;"><b>DEBATE TOPIC:</b> ${esc(topic || 'N/A')}</div>
        <div style="font-size:10px;color:#999;margin-bottom:16px;">GENERATED ON: ${esc(
          new Date().toLocaleString('en-IN')
        )}</div>
        ${scoreTable}
        ${roundTable}
        ${transcript}
      </div>
    </div>
  `;
}

export function DownloadReportButton({
  topic,
  messages,
  scores,
  scoreHistory,
  disabled,
}: DownloadReportButtonProps) {
  const busyRef = useRef(false);

  const handleDownload = async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      await ensureFontsLoaded();

      // Build the report off-screen using real HTML so the browser handles
      // correct script shaping (Devanagari / Tamil / Bengali / etc.)
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-99999px';
      wrapper.style.top = '0';
      wrapper.style.width = '794px'; // ~A4 width @ 96dpi
      wrapper.style.background = '#ffffff';
      wrapper.style.fontFamily = FONT_STACK;
      wrapper.style.color = '#0f172a';
      wrapper.innerHTML = buildReportHTML(topic, messages, scores, scoreHistory);
      document.body.appendChild(wrapper);

      try {
        await new Promise((r) => setTimeout(r, 50)); // let layout settle

        const canvas = await html2canvas(wrapper, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: wrapper.scrollWidth,
        });

        const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const FOOTER_SPACE_PT = 26; // reserved strip at the bottom of every page for the page number
        const contentHeightPt = pageHeight - FOOTER_SPACE_PT;

        const imgWidth = pageWidth;
        const scaleFactor = canvas.width / wrapper.offsetWidth; // DOM px -> canvas px
        const pageCanvasHeight = (contentHeightPt * canvas.width) / imgWidth; // max px-per-page in canvas space

        // Collect "do not split" element boundaries (table rows + headings) in canvas-px space,
        // so a page break never lands in the middle of a row/paragraph.
        const wrapperRect = wrapper.getBoundingClientRect();
        const noSplitEls = Array.from(wrapper.querySelectorAll('tr, h2'));
        const boundaries = noSplitEls
          .map((el) => {
            const r = (el as HTMLElement).getBoundingClientRect();
            return {
              top: (r.top - wrapperRect.top) * scaleFactor,
              bottom: (r.bottom - wrapperRect.top) * scaleFactor,
            };
          })
          .sort((a, b) => a.top - b.top);

        let renderedHeight = 0;
        let pageIndex = 0;

        while (renderedHeight < canvas.height) {
          const desiredCut = Math.min(renderedHeight + pageCanvasHeight, canvas.height);

          // If the desired cut line falls inside a row/heading, pull the cut back
          // to the start of that element so the whole thing moves to the next page.
          let safeCut = desiredCut;
          for (const b of boundaries) {
            if (b.top > renderedHeight && desiredCut > b.top && desiredCut < b.bottom) {
              safeCut = b.top;
              break;
            }
          }
          // Guard against a single element being taller than one page (would loop forever otherwise)
          if (safeCut <= renderedHeight) safeCut = desiredCut;

          const sliceHeight = safeCut - renderedHeight;

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
              canvas,
              0,
              renderedHeight,
              canvas.width,
              sliceHeight,
              0,
              0,
              canvas.width,
              sliceHeight
            );
          }

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          const pageImgHeight = (sliceHeight * imgWidth) / canvas.width;

          if (pageIndex > 0) pdf.addPage();
          pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidth, pageImgHeight);

          renderedHeight = safeCut;
          pageIndex += 1;
        }

        // Footer page numbers (Latin-only text, helvetica is fine here)
        const pageCount = pdf.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`Page ${i} of ${pageCount} | AI Debate Arena`, pageWidth / 2, pageHeight - 12, {
            align: 'center',
          });
        }

        const safeTopic = (topic || 'debate').slice(0, 40).replace(/[^a-z0-9]+/gi, '_');
        pdf.save(`Debate-Report_${safeTopic || 'debate'}.pdf`);
      } finally {
        document.body.removeChild(wrapper);
      }
    } finally {
      busyRef.current = false;
    }
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