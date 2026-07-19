import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

// VERCEL TIMEOUT FIX: इसे Edge Runtime पर सेट करें ताकि 10 सेकंड में कनेक्शन न कटे
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

// 🔥 MULTI-LANGUAGE UPDATE
async function extractSearchCandidates(text: string, language: string = 'Hindi'): Promise<string[]> {
  try {
    const { text: raw } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      temperature: 0.1,
      prompt: `Analyze this ${language} text and extract the most specific, verifiable FACTUAL CLAIM (like statistics, dates, percentages, or specific historical events). 
CRITICAL RULES:
- Do NOT just extract names of people or countries. 
- Convert the claim into a short, precise English search query.
Example Input: "2013-14 से 2016-17 के बीच विकास दर में 3.6% की गिरावट आई।"
Example Output: India GDP growth rate 2013 to 2017
Text: "${text}"
Output ONLY 1-2 search queries, one per line, without numbering or bullets.`,
    });
    return raw
      .split('\n')
      .map((s) => s.replace(/^[-*\d.)\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 2);
  } catch {
    return [];
  }
}

async function groundWithCandidates(text: string, language: string = 'Hindi'): Promise<{ title: string; snippet: string; url: string | null } | null> {
  const candidates = await extractSearchCandidates(text, language);
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

async function maybeGenerateChart(text: string, language: string = 'Hindi'): Promise<ChartArtifact | null> {
  try {
    const prompt = `You are a strict data-extraction tool. Check if this ${language} statement contains AT LEAST TWO distinct REAL NAMED ENTITIES being compared using real numbers.
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
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Data Comparison',
      data: parsed.data.map((d: any) => ({ name: String(d.name), value: Number(d.value) })),
    };
  } catch {
    return null;
  }
}

// ─── AUDIENCE SCORE TYPE + VALIDATOR ───

interface AudienceScore {
  pro: number;
  opp: number;
}

function isValidAudienceScore(value: any): value is AudienceScore {
  return (
    value &&
    typeof value.pro === 'number' &&
    typeof value.opp === 'number' &&
    Number.isFinite(value.pro) &&
    Number.isFinite(value.opp)
  );
}

function buildRLInstruction(
  audienceScore: unknown,
  round: number,
  speaker: 'proponent' | 'opponent'
): string {
  if (!isValidAudienceScore(audienceScore) || round <= 1) return '';

  const myScore = speaker === 'proponent' ? audienceScore.pro : audienceScore.opp;

  if (myScore <= 35) {
    return `[CRITICAL STRATEGY SHIFT — LIVE AUDIENCE FEEDBACK]: You are LOSING the live audience vote heavily (Current score: ${myScore}%). You must CHANGE YOUR STRATEGY immediately. Stop using heavy technical jargon. Make an emotional, highly relatable, and desperate appeal to win the audience back. Be defensive but persuasive. Speak simply, from the heart.`;
  }
  if (myScore >= 65) {
    return `[CRITICAL STRATEGY SHIFT — LIVE AUDIENCE FEEDBACK]: You are WINNING the live audience vote decisively (Current score: ${myScore}%). DOUBLE DOWN on your current strategy. Be assertive, highly confident, and deliver a crushing blow to completely destroy your opponent's remaining credibility.`;
  }
  return `[CRITICAL STRATEGY SHIFT — LIVE AUDIENCE FEEDBACK]: The live audience vote is closely contested (Current score: ${myScore}%). This is a neck-and-neck battle. Maintain your composure, deliver a perfectly balanced and undeniable factual argument to break the tie in your favor.`;
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
          return NextResponse.json({ error: `"${symbol}" not found.` }, { status: 404 });
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
        return NextResponse.json({ error: 'Failed to fetch live market data.' }, { status: 500 });
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. DEBATE TURN
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'debate_turn') {
      const { topic, round, totalRounds, speaker, history = [], mode = 'topic', stockContext, audienceScore, language = 'Hindi' } = body;
      if (!topic || !speaker || !round) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

      const isStockMode = mode === 'stock';
      const isPersonalityMode = mode === 'personality';
      const position = speaker === 'proponent' ? 'SUPPORTING' : 'OPPOSING';

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
        const wikiData = await groundWithCandidates(searchContext, language);
        groundingBlock = wikiData
          ? `FACTUAL EVIDENCE: "${wikiData.snippet}"\nIncorporate relevant facts naturally.`
          : `Rely on strong logical deduction.`;
      }

      // 🔥 MULTI-LANGUAGE BAN RULE
      const antiRepetitionRule = `
CRITICAL DEBATE RULES (HUMAN TONE REQUIRED):
1. NEVER start your response with formal/polite greetings. Jump directly into your argument naturally.
2. NEVER CONCEDE. Never adopt the opponent's conclusion. You must fiercely defend your stance.
3. BAN ON ROBOTIC CONNECTORS: Do NOT repeatedly use formal connector words (like "Furthermore", "Moreover", "इसके अलावा", etc.). Use natural, sharp, and aggressive transitions like a real human college debater.
4. STRICT ANTI-REPETITION: DO NOT copy-paste sentences or exact phrases from previous rounds. You MUST bring a NEW logical angle, NEW risk, or NEW metric in every single round.
5. DO NOT use meta-debate terms like "Ad-hoc fallacy", "Strawman", or "Opponent's logic". Just destroy their logic naturally.
      `.trim();

      // 🔥 STRICT LANGUAGE INSTRUCTION
      const langInstruction = `CRITICAL RULE: You MUST write your entire response STRICTLY in ${language.toUpperCase()}. Do not mix languages.`;

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

      const rlInstruction = buildRLInstruction(audienceScore, round, speaker);

      // ─── OPPONENT: SWARM AGENT ───
      if (speaker === 'opponent') {
        const opponentHistory = history.map((msg: { speaker: string; text: string }) => `[${msg.speaker}]: ${msg.text}`).join('\n');

        const [dataAgentCall, logicAgentCall] = await Promise.all([
          isStockMode
            ? generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify ONE NEW fundamental risk opposing a bullish case for "${topic}". Do not repeat previous risks. 1-2 sentences in ${language}.`,
              })
            : isPersonalityMode
            ? generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify ONE ethical concern the proponent's argument on "${topic}" overlooks. 1-2 sentences in ${language}.`,
              })
            : generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Find ONE factual counter-point to the proponent's claims on "${topic}":\n${opponentHistory}\nRespond in ${language}.`,
              }),
          isStockMode
            ? generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify ONE NEW valuation/technical weakness in the bull's LATEST argument on "${topic}". Do not repeat previous weaknesses:\n${opponentHistory}\nRespond in ${language}.`,
              })
            : isPersonalityMode
            ? generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify ONE historical/philosophical principle that challenges the proponent's claim on "${topic}":\n${opponentHistory}\nRespond in ${language}.`,
              })
            : generateText({
                model: groq('llama-3.1-8b-instant'),
                temperature: 0.6,
                prompt: `Identify the main logical flaw or weak assumption in the proponent's LATEST argument on "${topic}". Explain the flaw in 1-2 sentences in ${language} WITHOUT using academic fallacy names:\n${opponentHistory}`,
              }),
        ]);

        const leaderSystemPrompt = isStockMode
          ? `
You are a CAUTIOUS RISK MANAGER (BEAR) for "${topic}".
${groundingBlock}
Sub-agent inputs: Fundamental Risk: "${dataAgentCall.text}" | Valuation Risk: "${logicAgentCall.text}"
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
CRITICAL: You are the BEAR. NEVER conclude that the stock will recover. Always conclude it is a risk.
${langInstruction} Sound professional, not a cheerleader.
          `.trim()
          : isPersonalityMode
          ? `
You are "THE PHILOSOPHER" debating "${topic}".
${groundingBlock}
Sub-agent inputs: Ethical Concern: "${dataAgentCall.text}" | Philosophical Precedent: "${logicAgentCall.text}"
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
${langInstruction} Maintain a composed tone. Do not use meta-phrases.
          `.trim()
          : `
You are a FIERCE DEBATER. Topic: "${topic}" (Stance: ${position}).
${groundingBlock}
Sub-agent inputs: Counter: "${dataAgentCall.text}" | Flaw: "${logicAgentCall.text}"
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
${langInstruction} Highly intellectual and sharp tone.
          `.trim();

        const { text: swarmRaw } = await generateText({
          model: groq('llama-3.1-8b-instant'),
          temperature: 0.7,
          system: leaderSystemPrompt,
          messages: [...messages, { role: 'user', content: `Respond directly in ${language}. Remember: Do NOT use formal greetings. AVOID repetitive robotic connector words.` }] as any,
        });

        const cleanSwarm = stripMetaCommentary(stripFakeCitations(swarmRaw));
        const chart = isStockMode ? null : await maybeGenerateChart(cleanSwarm, language);
        const output = chart ? `${cleanSwarm}\n[UI_CHART]${JSON.stringify(chart)}[/UI_CHART]` : cleanSwarm;
        return toManualTextStream(output);
      }

      // ─── PROPONENT: SELF-CORRECTION LOOP ───
      const systemPrompt = isStockMode
        ? `
You are a SHARP BULLISH ANALYST for "${topic}".
${groundingBlock}
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
${langInstruction} Confident, trading desk analyst tone.
        `.trim()
        : isPersonalityMode
        ? `
You are "THE AGGRESSIVE ANALYST". Topic: "${topic}".
${groundingBlock}
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
${langInstruction} Confident, punchy, assertive.
        `.trim()
        : `
You are a FIERCE DEBATER. Role: ${speaker.toUpperCase()}
Stance: ${position} on "${topic}".
${groundingBlock}
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
${langInstruction} Professional, persuasive.
        `.trim();

      const draftMessages = [...messages, { role: 'user', content: `It is your turn. ${roundInstruction} Respond directly in ${language} without formal greetings and avoid robotic connector words.` }];

      const { text: initialDraft } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        temperature: 0.7,
        system: systemPrompt,
        messages: draftMessages as any,
      });

      const criticPrompt = isStockMode
        ? `Check this draft. Does it stay bullish? Is it free of robotic fluff and polite greetings? Is it in good ${language}? Draft: "${initialDraft}"
Respond STRICTLY with valid JSON ONLY: {"approved": true/false, "feedback": "reason in ${language}"}.`
        : `Check this draft. Does it strictly defend its stance? Did it avoid agreeing with the opponent? Did it avoid robotic greetings and repetitive words? Draft: "${initialDraft}"
Respond STRICTLY with valid JSON ONLY: {"approved": true/false, "feedback": "reason in ${language}"}.`;

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
          { role: 'user', content: `CRITIC FEEDBACK: "${evaluation.feedback}". Fix the flaws, drop any robotic greetings or repetitive words, and provide a sharp response in ${language}.` },
        ];

        const { text: rewrittenDraft } = await generateText({
          model: groq('llama-3.1-8b-instant'),
          temperature: 0.7,
          system: systemPrompt,
          messages: finalMessages as any,
        });
        finalDraft = rewrittenDraft;
      }

      const cleanFinal = stripMetaCommentary(stripFakeCitations(finalDraft));
      const chart = isStockMode ? null : await maybeGenerateChart(cleanFinal, language);
      const output = chart ? `${cleanFinal}\n[UI_CHART]${JSON.stringify(chart)}[/UI_CHART]` : cleanFinal;
      return toManualTextStream(output);
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. JUDGE CRITIQUE
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'judge_critique') {
      const { history = [], mode = 'topic', language = 'Hindi' } = body;
      const biasNote = mode === 'personality'
        ? ' Judge purely on logical strength and evidence — do not favor either the aggressive/data-driven style or the philosophical style.'
        : '';
      const critiquePrompt = `Analyze the latest debate turn.${biasNote} Provide a strict 1-sentence feedback in ${language.toUpperCase()} under 25 words.\nTranscript:\n${history.map((msg: { speaker: string; text: string; round: number }) => `[Round ${msg.round}] ${msg.speaker}: ${msg.text}`).join('\n\n')}`;
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
      const { topic, history = [], mode = 'topic', language = 'Hindi' } = body;
      const biasNote = mode === 'personality'
        ? '\nIMPORTANT: You must remain STRICTLY NEUTRAL between the Aggressive Data-Driven debater and the Philosophical debater. Score based ONLY on logical strength, evidence, and direct engagement with the opponent — never based on which communication style you personally find more persuasive.'
        : '';

      const judgePrompt = `Evaluate the debate on Topic: "${topic}"${biasNote}
Transcript:\n${history.map((msg: { speaker: string; text: string; round: number }) => `[Round ${msg.round}] ${msg.speaker}: ${msg.text}`).join('\n\n')}

CRITICAL RULE FOR SCORING:
If any speaker has a "[SYSTEM NOTE: PENALTY APPLIED...]" tag in their transcript, you MUST strictly deduct that exact number of points from their final 'logic' and 'overall' score.

Respond STRICTLY with JSON ONLY:
{"winner":"proponent/opponent/tie","score_proponent":85,"score_opponent":80,"reasoning":"${language} summary of why they won, explicitly mentioning any penalties if applied."}`;

      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        temperature: 0.3,
        prompt: judgePrompt
      });
      const object = safeJsonParse(text, { winner: 'tie', score_proponent: 50, score_opponent: 50, reasoning: 'The debate was a tie.' });
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
    // 5. FALLACY & TONE CHECK (SMART UPGRADE)
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'fallacy_check') {
      const { text, topic, language = 'Hindi' } = body;
      const prompt = `You are an expert, unbiased Debate Moderator. Analyze this statement (${language}) for logical fallacies.
Topic: "${topic}"
Statement: "${text}"

CRITICAL DEBATE RULES (AVOID FALSE POSITIVES):
1. Counter-arguments are NOT fallacies: Questioning the opponent's claims, asking for data, or challenging their logic is a VALID DEBATE TACTIC. Do NOT flag it as "Off-Topic" or "Strawman".
2. Citing sources (like Wikipedia, Journals) is NOT "Appeal to Authority". It is providing evidence. Do NOT penalize it.
3. Rhetorical questions or pointing out contradictions is NOT a "False Dilemma".
4. Only flag GENUINE, extreme fallacies: Ad Hominem (direct personal insults), Strawman (completely misrepresenting the opponent).
5. If there is NO real logical fallacy, you MUST set "hasFallacy": false. DO NOT BE OVERLY SENSITIVE.

Calculate 'Aggression Score' (0-100) and 'Logic Score' (0-100).

Respond STRICTLY with JSON ONLY using this format:
{"hasFallacy": true/false, "fallacyName": "English Name or null", "explanation": "Explanation in ${language}", "penalty": 0 (only if fallacy is true, max 15), "aggressionScore": 50, "logicScore": 80}`;
      
      const { text: result } = await generateText({ 
        model: groq('llama-3.1-8b-instant'), 
        temperature: 0.1,
        prompt 
      });
      
      const parsed = safeJsonParse(result, { 
        hasFallacy: false, 
        fallacyName: null, 
        explanation: '',
        penalty: 0,
        aggressionScore: 50,
        logicScore: 80 
      });
      
      return NextResponse.json(parsed);
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. FACT CHECK
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'fact_check') {
      const { claim, language = 'Hindi' } = body;
      try {
        const candidates = await extractSearchCandidates(claim, language);
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
          return NextResponse.json({ found: false, message: `No relevant source found. (Searched: "${triedList}")` });
        }
        return NextResponse.json({
          found: true,
          title: wikiData.title,
          snippet: wikiData.snippet.slice(0, 220) + '...',
          url: wikiData.url,
        });
      } catch (err) {
        return NextResponse.json({ found: false, message: 'Fact-check service currently unavailable.' });
      }
    }

    return NextResponse.json({ error: 'Unknown request type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'An error occurred processing your request.' }, { status: 500 });
  }
}