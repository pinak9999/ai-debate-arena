import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

// 🔥 VERCEL TIMEOUT FIX: इसे Edge Runtime पर सेट करें ताकि 10 सेकंड में कनेक्शन न कटे
export const runtime = 'edge'; 
export const maxDuration = 60; // (ये Pro plan के लिए है, पर लिखे रहने दो)
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── UTILITY FUNCTIONS ───

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}

function stripFakeCitations(text: string): string {
  return text
    .replace(/\(?\s*(स्रोत|Source|संदर्भ)\s*[:：].*?(\)|(?=\n)|$)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function stripMetaCommentary(text: string): string {
  return text
    .replace(/मेरा (पिछला )?बयान[^।!?]*(भ्रमित|आलोचना|समीक्षा|पुनः)[^।!?]*[।!?]/g, '')
    .replace(/[^।!?]*(आलोचक|समीक्षक|रिव्यू|आलोचना के जवाब में)[^।!?]*[।!?]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function toManualTextStream(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// ─── WIKIPEDIA GROUNDING (RAG) — Topic Mode ───

async function searchWiki(lang: 'hi' | 'en', q: string) {
  try {
    const searchRes = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`
    );
    const searchData = await searchRes.json();
    return searchData?.query?.search?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchWikiSnippet(query: string): Promise<{ title: string; snippet: string; url: string | null } | null> {
  let topResult = await searchWiki('hi', query);
  let lang: 'hi' | 'en' = 'hi';
  if (!topResult) {
    topResult = await searchWiki('en', query);
    lang = 'en';
  }
  if (!topResult) return null;

  try {
    const summaryRes = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topResult.title)}`);
    const summaryData = await summaryRes.json();
    if (!summaryData?.extract) return null;
    return {
      title: summaryData.title,
      snippet: summaryData.extract.slice(0, 600),
      url: summaryData.content_urls?.desktop?.page || null,
    };
  } catch {
    return null;
  }
}

async function extractSearchCandidates(text: string): Promise<string[]> {
  try {
    const { text: raw } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      temperature: 0.1,
      prompt: `Analyze this Hindi text and extract up to 3 real, independently searchable named entities (people, places, historical events, organizations, or policies). 
CRITICAL RULES:
- IGNORE conversational filler, debate terms, and titles completely (e.g., DO NOT extract "माननीय जज", "विरोधाभास", "Opponent").
- ONLY extract the actual factual entities mentioned in the text.
- Output ONLY the names, one per line, without numbering, bullets, or extra words. 
Text: "${text}"`,
    });
    return raw
      .split('\n')
      .map((s) => s.replace(/^[-*\d.)\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

async function groundWithCandidates(text: string): Promise<{ title: string; snippet: string; url: string | null } | null> {
  const candidates = await extractSearchCandidates(text);
  for (const candidate of candidates) {
    const result = await fetchWikiSnippet(candidate);
    if (result) return result;
  }
  return null;
}

// ─── TAVILY LIVE WEB SEARCH GROUNDING ───

interface TavilySource {
  title: string;
  url: string;
  content: string;
}

async function searchTavily(query: string): Promise<{ answer: string | null; sources: TavilySource[] } | null> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || !query?.trim()) return null;
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 4,
        include_answer: true,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      answer: data.answer || null,
      sources: (data.results || []).map((r: any) => ({
        title: r.title || 'Untitled',
        url: r.url || '',
        content: (r.content || '').slice(0, 400),
      })),
    };
  } catch {
    return null;
  }
}

async function groundWithTavily(query: string): Promise<{ snippet: string; sources: TavilySource[] } | null> {
  const result = await searchTavily(query);
  if (!result || (!result.answer && result.sources.length === 0)) return null;

  const combinedContent = [
    result.answer ? `Summary: ${result.answer}` : '',
    ...result.sources.slice(0, 3).map((s, i) => `Source ${i + 1} (${s.title}): ${s.content}`),
  ]
    .filter(Boolean)
    .join('\n');

  return { snippet: combinedContent, sources: result.sources };
}

// ─── PROGRAMMATIC CHART EXTRACTION ───

interface ChartArtifact {
  type: 'bar_chart' | 'line_chart';
  title: string;
  data: { name: string; value: number }[];
}

function numberAppearsInText(value: number, text: string): boolean {
  const normalizedText = text.replace(/[,]/g, '');
  return normalizedText.includes(String(value));
}

function nameNumberProximityValid(name: string, value: number, text: string): boolean {
  const normalizedText = text.replace(/[,]/g, '');
  const valueStr = String(value);
  const idx = normalizedText.indexOf(valueStr);
  if (idx === -1) return false;
  const windowStart = Math.max(0, idx - 70);
  const windowEnd = Math.min(normalizedText.length, idx + valueStr.length + 20);
  const window = normalizedText.slice(windowStart, windowEnd);
  return name.split(/\s+/).filter(w => w.length > 1).some(w => window.includes(w));
}

const ABSTRACT_NAME_DENYLIST = [
  'ताकत', 'साहस', 'सफलता', 'विफलता', 'चुनौती', 'समस्या', 'उपलब्धि', 'नेतृत्व',
  'विश्वास', 'उद्देश्य', 'भूमिका', 'प्रतीक', 'रणनीति', 'दिखावा', 'देशभक्ति', 'लोग', 'प्रतिशत'
];

function isAbstractName(name: string): boolean {
  return ABSTRACT_NAME_DENYLIST.some((word) => name.trim() === word || name.trim().includes(word));
}

async function maybeGenerateChart(text: string): Promise<ChartArtifact | null> {
  try {
    const prompt = `You are a strict data-extraction tool. Check if this Hindi statement contains AT LEAST TWO distinct REAL NAMED ENTITIES being compared using real numbers.
Statement: "${text}"
RULES:
- Name MUST be a real named entity, NEVER abstract words.
- Only use numbers literally written in the statement.
- Output MUST be strictly valid JSON without markdown wrapping.
- Format: {"hasChart": true, "title": "छोटा शीर्षक", "type": "bar_chart", "data": [{"name": "नाम 1", "value": 40}, {"name": "नाम 2", "value": 60}]}
- If no valid comparison, respond ONLY: {"hasChart": false}`;

    const { text: raw } = await generateText({ 
      model: groq('llama-3.1-8b-instant'), 
      temperature: 0.1,
      prompt 
    });
    const parsed = safeJsonParse<any>(raw, { hasChart: false });

    if (!parsed?.hasChart || !Array.isArray(parsed.data) || parsed.data.length < 2) return null;
    const allNamesReal = parsed.data.every((d: any) => typeof d.name === 'string' && !isAbstractName(d.name));
    if (!allNamesReal) return null;
    const allPairsValid = parsed.data.every(
      (d: any) => typeof d.value === 'number' && typeof d.name === 'string' &&
      numberAppearsInText(d.value, text) && nameNumberProximityValid(d.name, d.value, text)
    );
    if (!allPairsValid) return null;

    return {
      type: parsed.type === 'line_chart' ? 'line_chart' : 'bar_chart',
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'डेटा तुलना',
      data: parsed.data.map((d: any) => ({ name: String(d.name), value: Number(d.value) })),
    };
  } catch {
    return null;
  }
}

// ─── API HANDLER ───

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ─────────────────────────────────────────────────────────────────
    // 0. STOCK DATA
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'stock_data') {
      const { symbol } = body;
      if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });

      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
        );
        const json = await res.json();
        const result = json?.chart?.result?.[0];

        if (!result) {
          return NextResponse.json({ error: `"${symbol}" नहीं मिला। NSE स्टॉक्स के लिए .NS लगाएं (जैसे SUZLON.NS)` }, { status: 404 });
        }

        const meta = result.meta;
        const timestamps: number[] = result.timestamp || [];
        const quote = result.indicators?.quote?.[0] || {};
        const closes: (number | null)[] = quote.close || [];
        const volumes: (number | null)[] = quote.volume || [];

        const prices = timestamps
          .map((t, i) => ({
            time: new Date(t * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            price: closes[i] != null ? Number((closes[i] as number).toFixed(2)) : null,
          }))
          .filter((p) => p.price !== null) as { time: string; price: number }[];

        const volumeData = timestamps
          .map((t, i) => ({
            time: new Date(t * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            volume: volumes[i] || 0,
          }))
          .filter((v) => v.volume > 0);

        const currentPrice = meta.regularMarketPrice ?? (closes[closes.length - 1] || 0);
        const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
        const change = currentPrice - previousClose;
        const changePercent = previousClose ? (change / previousClose) * 100 : 0;

        return NextResponse.json({
          symbol: meta.symbol || symbol,
          companyName: meta.longName || meta.shortName || symbol,
          currentPrice: Number(currentPrice.toFixed(2)),
          previousClose: Number(previousClose.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          dayHigh: meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh.toFixed(2)) : undefined,
          dayLow: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow.toFixed(2)) : undefined,
          currency: meta.currency || 'INR',
          prices,
          volumeData,
        });
      } catch (err) {
        return NextResponse.json({ error: 'लाइव मार्केट डेटा फ़ेच नहीं हो सका। कृपया टिकर सिंबल चेक करें।' }, { status: 500 });
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. DEBATE TURN
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'debate_turn') {
      const { topic, round, totalRounds, speaker, history = [], mode = 'topic', stockContext } = body;
      if (!topic || !speaker || !round) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

      const isStockMode = mode === 'stock';
      const isPersonalityMode = mode === 'personality';
      const position = speaker === 'proponent' ? 'SUPPORTING (पक्ष में)' : 'OPPOSING (विरोध में)';

      const messages = history.map((msg: { speaker: string; text: string }) => ({
        role: msg.speaker === speaker ? 'assistant' : 'user',
        content: msg.text,
      }));

      // ── Grounding ──
      let groundingBlock = '';
      if (isStockMode) {
        groundingBlock = stockContext
          ? `LIVE MARKET DATA for ${stockContext.symbol} (${stockContext.companyName || ''}):
- Current Price: ₹${stockContext.currentPrice}
- Change: ${stockContext.change} (${stockContext.changePercent}%)
Use these EXACT numbers naturally in your argument.`
          : `No live market feed available right now. Argue using general sector knowledge.`;
      } else if (isPersonalityMode) {
        const lastMessageText = history.length > 0 ? history[history.length - 1].text : topic;
        const searchQuery = round === 1 ? topic : lastMessageText;
        const tavilyData = await groundWithTavily(searchQuery);
        groundingBlock = tavilyData
          ? `LIVE INTERNET RESEARCH: \n${tavilyData.snippet}\nIncorporate current facts naturally.`
          : `Rely on strong reasoning and logical deduction.`;
      } else {
        const lastMessageText = history.length > 0 ? history[history.length - 1].text : topic;
        const searchContext = round === 1 ? topic : lastMessageText;
        const wikiData = await groundWithCandidates(searchContext);
        groundingBlock = wikiData
          ? `FACTUAL EVIDENCE: "${wikiData.snippet}"\nIncorporate relevant facts naturally.`
          : `Rely on strong logical deduction.`;
      }

      // 🔥 FIX 1: STRICT ANTI-REPETITION RULE
      const antiRepetitionRule = `
CRITICAL DEBATE RULES:
1. NEVER start your response with "माननीय जज", "अध्यक्ष महोदय", or polite greetings. Jump directly into your argument naturally.
2. NEVER CONCEDE. Never say "मैं सहमत हूँ" or adopt the opponent's conclusion. You must fiercely defend your stance.
3. STRICT ANTI-REPETITION: DO NOT copy-paste sentences or exact phrases from previous rounds. You MUST bring a NEW logical angle, NEW risk, or NEW metric in every single round.
4. If you repeat the exact same sentence as Round 1, you will be penalized. Evolve the argument.
5. DO NOT use meta-debate terms like "Ad-hoc fallacy", "Strawman", or "Opponent's logic". Just destroy their logic naturally.
      `.trim();

      let roundInstruction = '';
      if (round === 1) {
        roundInstruction = isStockMode
          ? 'OPENING POSITION: State your core investment thesis clearly with your strongest single argument. (60-80 words).'
          : 'OPENING STATEMENT: Clearly define your core thesis. Present your strongest foundational argument with impact. (Keep it concise, around 60-80 words).';
      } else if (round === totalRounds) {
        roundInstruction = isStockMode
          ? 'FINAL CALL: No new data. Deliver your hard-hitting final recommendation summarizing why you win. (Max 50 words).'
          : "CLOSING STATEMENT: Do not introduce new evidence. Powerfully summarize why your side wins based on the clash so far. Deliver a hard-hitting final punchline. (Max 50 words).";
      } else {
        roundInstruction = isStockMode
          ? "DIRECT CLASH: Attack the specific weakness in the opponent's last point, then reinforce your own case. (60-80 words)."
          : "DIRECT CLASH & REBUTTAL: 1. Directly attack the specific flaw in the opponent's last statement. 2. After breaking their point, reinforce your stance with a new layer of argument. Do not just pivot aimlessly. (Around 60-80 words).";
      }

      if (isPersonalityMode) {
        if (round === 1) {
          roundInstruction = speaker === 'proponent'
            ? 'OPENING BLITZ: Open with hard data, statistics, or a current news fact. Be direct, punchy, and assertive. (60-80 words).'
            : 'OPENING REFLECTION: Open by reframing the debate around a deeper ethical or philosophical question. (60-80 words).';
        } else if (round === totalRounds) {
          roundInstruction = speaker === 'proponent'
            ? 'FINAL STRIKE: Deliver a sharp, evidence-backed closing argument that dismantles the philosophical framing. (Max 50 words).'
            : 'FINAL WISDOM: Deliver a closing reflection on why values matter more than raw numbers. (Max 50 words).';
        } else {
          roundInstruction = speaker === 'proponent'
            ? "DATA STRIKE: Directly attack the philosopher's argument, then reinforce your position with a fresh data point. (60-80 words)."
            : "PHILOSOPHICAL COUNTER: Directly challenge the ethical blind spot in the data-driven argument, then deepen your own reasoning. (60-80 words).";
        }
      }

      // ─── OPPONENT: SWARM AGENT ───
      if (speaker === 'opponent') {
        const opponentHistory = history.map((msg: { speaker: string; text: string }) => `[${msg.speaker}]: ${msg.text}`).join('\n');

        // 🔥 FIX 2: INCREASED TEMPERATURE TO 0.6 FOR MORE CREATIVITY
        const [dataAgentCall, logicAgentCall] = await Promise.all([
          isStockMode
            ? generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify ONE NEW fundamental risk opposing a bullish case for "${topic}". Do not repeat previous risks. 1-2 Hindi sentences.`,
              })
            : isPersonalityMode
            ? generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify ONE ethical concern the proponent's argument on "${topic}" overlooks. 1-2 Hindi sentences.`,
              })
            : generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Find ONE factual counter-point to the proponent's claims on "${topic}":\n${opponentHistory}`,
              }),
          isStockMode
            ? generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify ONE NEW valuation/technical weakness in the bull's LATEST argument on "${topic}". Do not repeat previous weaknesses:\n${opponentHistory}`,
              })
            : isPersonalityMode
            ? generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify ONE historical/philosophical principle that challenges the proponent's claim on "${topic}":\n${opponentHistory}`,
              })
            : generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify the main logical flaw or weak assumption in the proponent's LATEST argument on "${topic}". Explain the flaw in 1-2 Hindi sentences WITHOUT using academic fallacy names (like ad-hoc, strawman):\n${opponentHistory}`,
              }),
        ]);

        // 🔥 FIX 3: ADDED STRICT "NEVER CONCLUDE IT WILL RECOVER" RULE FOR THE BEAR
        const leaderSystemPrompt = isStockMode
          ? `
You are a CAUTIOUS RISK MANAGER (BEAR) for "${topic}".
${groundingBlock}
Sub-agent inputs: Fundamental Risk: "${dataAgentCall.text}" | Valuation Risk: "${logicAgentCall.text}"
${antiRepetitionRule}
${roundInstruction}
CRITICAL: You are the BEAR. NEVER conclude that the stock will recover. Always conclude it is a risk.
Language: STRICTLY HINDI (DEVANAGARI). Sound professional, not a cheerleader.
          `.trim()
          : isPersonalityMode
          ? `
You are "THE PHILOSOPHER" debating "${topic}".
${groundingBlock}
Sub-agent inputs: Ethical Concern: "${dataAgentCall.text}" | Philosophical Precedent: "${logicAgentCall.text}"
${antiRepetitionRule}
${roundInstruction}
Language: STRICTLY HINDI (DEVANAGARI). Maintain a composed tone. Do not use meta-phrases.
          `.trim()
          : `
You are a FIERCE DEBATER. Topic: "${topic}" (Stance: ${position}).
${groundingBlock}
Sub-agent inputs: Counter: "${dataAgentCall.text}" | Flaw: "${logicAgentCall.text}"
${antiRepetitionRule}
${roundInstruction}
Language: STRICTLY HINDI (DEVANAGARI). Highly intellectual and sharp tone.
          `.trim();

        const { text: swarmRaw } = await generateText({
          model: groq('llama-3.1-8b-instant'),
          temperature: 0.7, // 🔥 Leader Temperature increased
          system: leaderSystemPrompt,
          messages: [...messages, { role: 'user', content: `Respond directly in Hindi. Remember: Do NOT use "माननीय जज". Do NOT agree with the opponent.` }] as any,
        });

        const cleanSwarm = stripMetaCommentary(stripFakeCitations(swarmRaw));
        const chart = isStockMode ? null : await maybeGenerateChart(cleanSwarm);
        const output = chart ? `${cleanSwarm}\n[UI_CHART]${JSON.stringify(chart)}[/UI_CHART]` : cleanSwarm;
        return toManualTextStream(output);
      }

      // ─── PROPONENT: SELF-CORRECTION LOOP ───
      const systemPrompt = isStockMode
        ? `
You are a SHARP BULLISH ANALYST for "${topic}".
${groundingBlock}
${antiRepetitionRule}
${roundInstruction}
Language: STRICTLY HINDI (DEVANAGARI). Confident, trading desk analyst tone.
        `.trim()
        : isPersonalityMode
        ? `
You are "THE AGGRESSIVE ANALYST". Topic: "${topic}".
${groundingBlock}
${antiRepetitionRule}
${roundInstruction}
Language: STRICTLY HINDI (DEVANAGARI). Confident, punchy, assertive.
        `.trim()
        : `
You are a FIERCE DEBATER. Role: ${speaker.toUpperCase()}
Stance: ${position} on "${topic}".
${groundingBlock}
${antiRepetitionRule}
${roundInstruction}
Language: STRICTLY HINDI (DEVANAGARI). Professional, persuasive.
        `.trim();

      const draftMessages = [...messages, { role: 'user', content: `It is your turn. ${roundInstruction} Respond directly in Hindi without formal greetings.` }];

      // 🔥 FIX 4: TEMPERATURE INCREASED TO 0.7 TO STOP REPETITION
      const { text: initialDraft } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        temperature: 0.7, 
        system: systemPrompt,
        messages: draftMessages as any,
      });

      const criticPrompt = isStockMode
        ? `Check this draft. Does it stay bullish? Is it free of "माननीय जज" and polite fluff? Is it in good Hindi? Draft: "${initialDraft}"
Respond STRICTLY with valid JSON ONLY: {"approved": true/false, "feedback": "reason in hindi"}.`
        : `Check this draft. Does it strictly defend its stance? Did it avoid agreeing with the opponent? Did it avoid robotic greetings like "माननीय जज" and academic fallacy names? Draft: "${initialDraft}"
Respond STRICTLY with valid JSON ONLY: {"approved": true/false, "feedback": "reason in hindi"}.`;

      const { text: criticOutput } = await generateText({ 
        model: groq('llama-3.1-8b-instant'), 
        temperature: 0.1, 
        prompt: criticPrompt 
      });
      const evaluation = safeJsonParse(criticOutput, { approved: true, feedback: 'Perfect' });

      let finalDraft = initialDraft;
      if (!evaluation.approved) {
        const finalMessages = [
          ...draftMessages,
          { role: 'assistant', content: initialDraft },
          { role: 'user', content: `CRITIC FEEDBACK: "${evaluation.feedback}". Fix the flaws, drop any robotic greetings, and provide a sharp response in Hindi.` },
        ];
        
        const { text: rewrittenDraft } = await generateText({
          model: groq('llama-3.1-8b-instant'),
          temperature: 0.7, // 🔥 Rewriter temperature increased too
          system: systemPrompt,
          messages: finalMessages as any,
        });
        finalDraft = rewrittenDraft;
      }

      const cleanFinal = stripMetaCommentary(stripFakeCitations(finalDraft));
      const chart = isStockMode ? null : await maybeGenerateChart(cleanFinal);
      const output = chart ? `${cleanFinal}\n[UI_CHART]${JSON.stringify(chart)}[/UI_CHART]` : cleanFinal;
      return toManualTextStream(output);
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. JUDGE CRITIQUE
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'judge_critique') {
      const { history = [], mode = 'topic' } = body;
      const biasNote = mode === 'personality'
        ? ' Judge purely on logical strength and evidence — do not favor either the aggressive/data-driven style or the philosophical style.'
        : '';
      const critiquePrompt = `Analyze the latest debate turn.${biasNote} Provide a strict 1-sentence feedback in HINDI (DEVANAGARI) under 25 words.\nTranscript:\n${history.map((msg: { speaker: string; text: string; round: number }) => `[Round ${msg.round}] ${msg.speaker}: ${msg.text}`).join('\n\n')}`;
      const { text } = await generateText({ 
        model: groq('llama-3.1-8b-instant'), 
        temperature: 0.4,
        prompt: critiquePrompt 
      });
      return NextResponse.json({ critique: stripFakeCitations(text) });
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. JUDGE VERDICT
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'judge_verdict') {
      const { topic, history = [], mode = 'topic' } = body;
      const biasNote = mode === 'personality'
        ? '\nIMPORTANT: You must remain STRICTLY NEUTRAL between the Aggressive Data-Driven debater and the Philosophical debater. Score based ONLY on logical strength, evidence, and direct engagement with the opponent — never based on which communication style you personally find more persuasive.'
        : '';
      
      // 🔥 FIX 5: ADDED STRICT PENALTY RULE FOR JUDGE
      const judgePrompt = `Evaluate the debate on Topic: "${topic}"${biasNote}
Transcript:\n${history.map((msg: { speaker: string; text: string; round: number }) => `[Round ${msg.round}] ${msg.speaker}: ${msg.text}`).join('\n\n')}

CRITICAL RULE FOR SCORING:
If any speaker has a "[SYSTEM NOTE: PENALTY APPLIED...]" tag in their transcript, you MUST strictly deduct that exact number of points from their final 'logic' and 'overall' score.

Respond STRICTLY with JSON ONLY:
{"winner":"proponent/opponent/tie","score_proponent":85,"score_opponent":80,"reasoning":"hindi summary of why they won, explicitly mentioning any penalties if applied."}`;
      
      const { text } = await generateText({ 
        model: groq('llama-3.1-8b-instant'), 
        temperature: 0.3,
        prompt: judgePrompt 
      });
      const object = safeJsonParse(text, { winner: 'tie', score_proponent: 50, score_opponent: 50, reasoning: 'मुकाबला बराबरी का रहा।' });
      return NextResponse.json({
        type: 'verdict',
        payload: {
          proponent: { logic: object.score_proponent, creativity: object.score_proponent, persuasion: object.score_proponent, evidence: object.score_proponent, overall: object.score_proponent },
          opponent: { logic: object.score_opponent, creativity: object.score_opponent, persuasion: object.score_opponent, evidence: object.score_opponent, overall: object.score_opponent },
          winner: object.winner,
          summary: stripFakeCitations(object.reasoning),
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. ROUND SCORE
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'round_score') {
      const { topic, history = [], round } = body;
      const prompt = `Topic: "${topic}". Rate round ${round}.\nTranscript:\n${history.map((msg: { speaker: string; text: string; round: number }) => `[Round ${msg.round}] ${msg.speaker}: ${msg.text}`).join('\n')}\nRespond STRICTLY with JSON ONLY: {"pro": 75, "opp": 80}`;
      const { text } = await generateText({ 
        model: groq('llama-3.1-8b-instant'), 
        temperature: 0.1,
        prompt 
      });
      const parsed = safeJsonParse(text, { pro: 50, opp: 50 });
      return NextResponse.json(parsed);
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. FALLACY & TONE CHECK (WITH TOPIC DRIFT DETECTION)
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'fallacy_check') {
      const { text, topic } = body; // 🔥 Extracted topic
      
      const prompt = `You are a strict NLP logic analyzer.
Analyze this Hindi statement against the MAIN TOPIC: "${topic || 'General Debate'}".

CRITICAL TASK: TOPIC DRIFT (TANGENT)
If the statement starts rambling about concepts highly unrelated to the main topic (e.g., tech infrastructure in a philosophy debate), you MUST flag it as a fallacy.
- Fallacy Name: "Off-Topic Tangent"
- Penalty: 15
- Explanation: Explain in Hindi how it drifted from the main topic.

If it is on-topic, check for standard fallacies (Strawman, Ad Hominem, Red Herring, etc.) and assign a 5-10 point penalty if found.
Calculate 'Aggression Score' (0-100, 100=hostile) and 'Logic Score' (0-100, 100=perfectly logical).

Statement: "${text}"

Respond STRICTLY with JSON ONLY using this format:
{"hasFallacy": true/false, "fallacyName": "English Name or null", "explanation": "Explanation in Hindi", "penalty": 0, "aggressionScore": 50, "logicScore": 80}`;

      const { text: result } = await generateText({ 
        model: groq('llama-3.1-8b-instant'), 
        temperature: 0.1, // Strict logic checking
        prompt 
      });
      
      const parsed = safeJsonParse(result, { 
        hasFallacy: false, 
        fallacyName: null, 
        explanation: '',
        penalty: 0,
        aggressionScore: 50,
        logicScore: 50 
      });
      
      return NextResponse.json(parsed);
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. FACT CHECK
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'fact_check') {
      const { claim } = body;
      try {
        const candidates = await extractSearchCandidates(claim);
        const primaryQuery = candidates.length ? candidates[0] : claim;

        const tavilyResult = await searchTavily(primaryQuery);
        if (tavilyResult && (tavilyResult.answer || tavilyResult.sources.length > 0)) {
          const topSource = tavilyResult.sources[0];
          return NextResponse.json({
            found: true,
            title: topSource?.title || 'Live Web Verification',
            snippet: (tavilyResult.answer || topSource?.content || '').slice(0, 220) + '...',
            url: topSource?.url || null,
          });
        }

        let wikiData: { title: string; snippet: string; url: string | null } | null = null;
        let lastTried = '';
        for (const candidate of candidates) {
          lastTried = candidate;
          wikiData = await fetchWikiSnippet(candidate);
          if (wikiData) break;
        }
        if (!wikiData) {
          const triedList = candidates.length ? candidates.join(', ') : lastTried;
          return NextResponse.json({ found: false, message: `कोई प्रासंगिक स्रोत नहीं मिला। (सर्च: "${triedList}")` });
        }
        return NextResponse.json({
          found: true,
          title: wikiData.title,
          snippet: wikiData.snippet.slice(0, 220) + '...',
          url: wikiData.url,
        });
      } catch (err) {
        return NextResponse.json({ found: false, message: 'फ़ैक्ट-चेक सेवा अभी उपलब्ध नहीं है।' });
      }
    }

    return NextResponse.json({ error: 'Unknown request type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'An error occurred processing your request.' }, { status: 500 });
  }
}