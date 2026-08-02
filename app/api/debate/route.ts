import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

// FIX: Hobby plan पर Node.js serverless function का hard limit 10 सेकंड है,
// इसे override नहीं किया जा सकता (60 सिर्फ Pro plan पर काम करता). इसलिए maxDuration
// यहाँ 10 रखा है (जो वैसे भी default है) — असली fix नीचे calls कम करने में है।
export const maxDuration = 10;

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

// FIX: text से आखिरी 6-8 meaningful words निकालने का हल्का, LLM-free तरीका
function quickSearchQuery(text: string): string {
  return text
    .replace(/[।!?,.\n]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join(' ')
    .trim();
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
      snippet: summaryData.extract.slice(0, 500),
      url: summaryData.content_urls?.desktop?.page || null,
    };
  } catch {
    return null;
  }
}

async function groundWithQuery(text: string): Promise<{ title: string; snippet: string; url: string | null } | null> {
  const query = quickSearchQuery(text);
  if (!query) return null;
  return fetchWikiSnippet(query);
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 3,
        include_answer: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      answer: data.answer || null,
      sources: (data.results || []).map((r: any) => ({
        title: r.title || 'Untitled',
        url: r.url || '',
        content: (r.content || '').slice(0, 300),
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
    ...result.sources.slice(0, 2).map((s, i) => `Source ${i + 1} (${s.title}): ${s.content}`),
  ]
    .filter(Boolean)
    .join('\n');

  return { snippet: combinedContent, sources: result.sources };
}

// ─── AUDIENCE SCORE ───

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
    return `[CRITICAL STRATEGY SHIFT — LIVE AUDIENCE FEEDBACK]: You are LOSING the live audience vote heavily (Current score: ${myScore}%). Change strategy immediately — stop technical jargon, make an emotional, relatable appeal. Speak simply, from the heart.`;
  }
  if (myScore >= 65) {
    return `[CRITICAL STRATEGY SHIFT — LIVE AUDIENCE FEEDBACK]: You are WINNING decisively (Current score: ${myScore}%). DOUBLE DOWN — be assertive, confident, deliver a crushing blow.`;
  }
  return `[CRITICAL STRATEGY SHIFT — LIVE AUDIENCE FEEDBACK]: The vote is closely contested (Current score: ${myScore}%). Maintain composure, deliver a balanced, undeniable argument to break the tie.`;
}

// ─── SCORE CLAMP HELPER ───
function clampScore(n: unknown, fallback: number, min = 10, max = 100): number {
  const num = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
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
        const wikiData = await groundWithQuery(searchContext);
        groundingBlock = wikiData
          ? `FACTUAL EVIDENCE: "${wikiData.snippet}"\nIncorporate relevant facts naturally.`
          : `Rely on strong logical deduction.`;
      }

      // FIX: बेतुके उदाहरणों (जैसे Mental Health / BPD) पर सख्त पाबंदी और कड़े डिबेट नियम
      const antiRepetitionRule = `
CRITICAL DEBATE RULES (HUMAN TONE REQUIRED):
1. NEVER start your response with formal/polite greetings. Jump directly into your argument naturally.
2. NEVER CONCEDE. Never adopt the opponent's conclusion. You must fiercely defend your stance.
3. BAN ON ROBOTIC CONNECTORS: Do NOT repeatedly use formal connector words (e.g. "Furthermore", "Moreover", or their equivalents in ${language}). Use natural, sharp, aggressive transitions like a real human college debater speaking ${language}.
4. STRICT ANTI-REPETITION: DO NOT copy-paste sentences or exact phrases from previous rounds. Bring a NEW logical angle, NEW risk, or NEW metric every round.
5. STRICT BAN ON BIZARRE ANALOGIES: Do NOT use mental health disorders (like Borderline Personality Disorder, depression, self-harm) as examples to explain emotional depth or creativity. Use real-world artistic, economic, or technological examples.
6. DO NOT use meta-debate terms like "Ad-hoc fallacy", "Strawman", or "Opponent's logic". Just destroy their logic naturally.
      `.trim();

      const langInstruction = `CRITICAL RULE: You MUST write your entire response STRICTLY in ${language.toUpperCase()} using its NATIVE SCRIPT ONLY (e.g., Devanagari for Hindi, Gujarati script for Gujarati, Gurmukhi for Punjabi, Bengali script for Bengali, Tamil script for Tamil, Telugu script for Telugu, Kannada script for Kannada, Malayalam script for Malayalam). DO NOT use Roman/English letters. Do not mix languages. Every single word must be authentically written in the native ${language} alphabet.`;

      let roundInstruction = '';
      if (round === 1) {
        roundInstruction = isStockMode
          ? 'OPENING POSITION: State your core investment thesis clearly with your strongest single argument. (60-80 words).'
          : 'OPENING STATEMENT: Clearly define your core thesis. Present your strongest foundational argument with impact. (60-80 words).';
      } else if (round === totalRounds) {
        roundInstruction = isStockMode
          ? 'FINAL CALL: No new data. Deliver your hard-hitting final recommendation summarizing why you win. (Max 50 words).'
          : "CLOSING STATEMENT: Do not introduce new evidence. Powerfully summarize why your side wins. Deliver a hard-hitting final punchline. (Max 50 words).";
      } else {
        roundInstruction = isStockMode
          ? "DIRECT CLASH: Attack the specific weakness in the opponent's last point, then reinforce your own case. (60-80 words)."
          : "DIRECT CLASH & REBUTTAL: 1. Directly attack the specific flaw in the opponent's last statement. 2. Reinforce your stance with a new layer of argument. (60-80 words).";
      }

      if (isPersonalityMode) {
        if (round === 1) {
          roundInstruction = speaker === 'proponent'
            ? 'OPENING BLITZ: Open with hard data, statistics, or a current news fact. Be direct, punchy, assertive. (60-80 words).'
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

      const opponentExtraInstruction = isStockMode
        ? `As the BEAR, identify ONE fresh fundamental/valuation risk not mentioned before, and weave it naturally into your argument.`
        : isPersonalityMode
        ? `Identify ONE ethical or historical/philosophical concern the proponent's argument overlooks, and weave it naturally into your argument.`
        : `Identify the ONE main factual counter-point or logical flaw in the proponent's latest argument (without naming it academically), and weave it naturally into your argument.`;

      const systemPrompt = isStockMode
        ? `
You are a ${speaker === 'proponent' ? 'SHARP BULLISH ANALYST' : 'CAUTIOUS RISK MANAGER (BEAR)'} for "${topic}".
${groundingBlock}
${speaker === 'opponent' ? opponentExtraInstruction : ''}
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
${speaker === 'opponent' ? 'CRITICAL: You are the BEAR. NEVER conclude that the stock will recover. Always conclude it is a risk.' : ''}
${langInstruction} ${speaker === 'proponent' ? 'Confident, trading desk analyst tone.' : 'Sound professional, not a cheerleader.'}
        `.trim()
        : isPersonalityMode
        ? `
You are "${speaker === 'proponent' ? 'THE AGGRESSIVE ANALYST' : 'THE PHILOSOPHER'}" debating "${topic}".
${groundingBlock}
${speaker === 'opponent' ? opponentExtraInstruction : ''}
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
${langInstruction} ${speaker === 'proponent' ? 'Confident, punchy, assertive.' : 'Maintain a composed tone. Do not use meta-phrases.'}
        `.trim()
        : `
You are a FIERCE DEBATER. Role: ${speaker.toUpperCase()}
Stance: ${position} on "${topic}".
${groundingBlock}
${speaker === 'opponent' ? opponentExtraInstruction : ''}
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
${langInstruction} Highly intellectual, sharp, professional, persuasive tone.
        `.trim();

      const finalMessages = [...messages, { role: 'user', content: `It is your turn. ${roundInstruction} Respond directly and STRICTLY in ${language} native script without formal greetings and avoid robotic connector words.` }];

      const { text: rawOutput } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        temperature: 0.7,
        system: systemPrompt,
        messages: finalMessages as any,
      });

      const cleanOutput = stripMetaCommentary(stripFakeCitations(rawOutput));
      return toManualTextStream(cleanOutput);
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. JUDGE CRITIQUE
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'judge_critique') {
      const { history = [], mode = 'topic', language = 'Hindi' } = body;
      const biasNote = mode === 'personality'
        ? ' Judge purely on logical strength and evidence — do not favor either style.'
        : '';
      const critiquePrompt = `Analyze the latest debate turn.${biasNote} Provide a strict 1-sentence feedback, written STRICTLY in ${language.toUpperCase()} Native Script, under 25 words.\nTranscript:\n${history.map((msg: { speaker: string; text: string; round: number }) => `[Round ${msg.round}] ${msg.speaker}: ${msg.text}`).join('\n\n')}`;
      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        temperature: 0.4,
        prompt: critiquePrompt
      });
      return NextResponse.json({ critique: stripFakeCitations(text) });
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. JUDGE VERDICT
    // FIX #1: कंसिस्टेंट स्कोरिंग और असली मैथमेटिकल पेनल्टी (पहले से था)
    // FIX #2 (NEW): अब LLM से हर category (logic/creativity/persuasion/evidence)
    //   का ALAG-ALAG score माँगा जाता है — पहले सिर्फ 1 overall score को
    //   4 बार copy कर दिया जाता था, इसलिए UI में सारी bars same दिखती थीं।
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'judge_verdict') {
      const { topic, history = [], mode = 'topic', language = 'Hindi' } = body;
      const biasNote = mode === 'personality'
        ? '\nIMPORTANT: Remain STRICTLY NEUTRAL between the Aggressive Data-Driven debater and the Philosophical debater. Score only on logical strength, evidence, and direct engagement.'
        : '';

      // FIX: ट्रांसक्रिप्ट से ऑटोमैटिकली पेनल्टी पॉइंट्स गिनना ताकि वो हकीकत में कटें
      let proPenalty = 0;
      let oppPenalty = 0;
      history.forEach((msg: { speaker: string; text: string }) => {
        const penaltyMatch = msg.text.match(/\[SYSTEM NOTE: PENALTY APPLIED.*?(-\d+)/i);
        if (penaltyMatch && penaltyMatch[1]) {
          const deduction = Math.abs(parseInt(penaltyMatch[1], 10));
          if (msg.speaker === 'proponent') proPenalty += deduction;
          if (msg.speaker === 'opponent') oppPenalty += deduction;
        }
      });

      const judgePrompt = `You are a strict, expert debate judge. Evaluate the FULL debate on Topic: "${topic}"${biasNote}

Transcript:
${history.map((msg: { speaker: string; text: string; round: number }) => `[Round ${msg.round}] ${msg.speaker}: ${msg.text}`).join('\n\n')}

Score EACH debater SEPARATELY across FOUR distinct categories, each out of 100. Do NOT give the same number to every category — differentiate based on what actually happened in the transcript:
- "logic": strength and coherence of reasoning, validity of claims, absence of contradictions.
- "creativity": originality of angles/examples, avoiding repetition round to round.
- "persuasion": rhetorical force, confidence, how compelling the delivery was.
- "evidence": use of concrete facts, data, or specific real-world examples (vague claims score lower here).

RULES:
1. Scores must reflect REAL differences between the two debaters — avoid defaulting to near-identical numbers unless performance was genuinely equal.
2. DO NOT artificially inflate a closing round. If a debater was trailing, they should only overtake if their closing was exceptionally superior.
3. If fallacies (Appeal to Fear/Emotion) were used, that should already reduce their own internal consistency — reflect it mainly in the "logic" category.

Respond STRICTLY with JSON ONLY, no extra text:
{
  "winner": "proponent" | "opponent" | "tie",
  "proponent": {"logic": 0, "creativity": 0, "persuasion": 0, "evidence": 0},
  "opponent": {"logic": 0, "creativity": 0, "persuasion": 0, "evidence": 0},
  "reasoning": "summary written STRICTLY in ${language} native script explaining the score differences and mentioning any penalties or fallacies."
}`;

      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        temperature: 0.4,
        prompt: judgePrompt
      });

      const fallbackShape = {
        winner: 'tie' as const,
        proponent: { logic: 75, creativity: 75, persuasion: 75, evidence: 75 },
        opponent: { logic: 75, creativity: 75, persuasion: 75, evidence: 75 },
        reasoning: 'The debate was a tie.',
      };
      const object = safeJsonParse(text, fallbackShape);

      // FIX: हर category को individually clamp करना, ताकि LLM की गलत/missing values भी safe रहें
      const proLogic = clampScore(object?.proponent?.logic, 75);
      const proCreativity = clampScore(object?.proponent?.creativity, 75);
      const proPersuasion = clampScore(object?.proponent?.persuasion, 75);
      const proEvidence = clampScore(object?.proponent?.evidence, 75);

      const oppLogic = clampScore(object?.opponent?.logic, 75);
      const oppCreativity = clampScore(object?.opponent?.creativity, 75);
      const oppPersuasion = clampScore(object?.opponent?.persuasion, 75);
      const oppEvidence = clampScore(object?.opponent?.evidence, 75);

      // FIX: Hardcoded fallacy penalty ab सीधे "logic" category से कटती है (सही जगह
      // पर, क्योंकि fallacy असल में logical flaw है) — फिर overall उसी penalized
      // logic को शामिल करके average निकाला जाता है।
      const proLogicPenalized = Math.max(10, proLogic - proPenalty);
      const oppLogicPenalized = Math.max(10, oppLogic - oppPenalty);

      const proOverall = Math.round((proLogicPenalized + proCreativity + proPersuasion + proEvidence) / 4);
      const oppOverall = Math.round((oppLogicPenalized + oppCreativity + oppPersuasion + oppEvidence) / 4);

      let finalWinner: 'proponent' | 'opponent' | 'tie' = 'tie';
      if (proOverall > oppOverall) finalWinner = 'proponent';
      else if (oppOverall > proOverall) finalWinner = 'opponent';

      return NextResponse.json({
        type: 'verdict',
        payload: {
          proponent: {
            logic: proLogicPenalized,
            creativity: proCreativity,
            persuasion: proPersuasion,
            evidence: proEvidence,
            overall: proOverall,
          },
          opponent: {
            logic: oppLogicPenalized,
            creativity: oppCreativity,
            persuasion: oppPersuasion,
            evidence: oppEvidence,
            overall: oppOverall,
          },
          winner: finalWinner,
          summary: stripFakeCitations(object.reasoning || fallbackShape.reasoning),
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. ROUND SCORE
    // FIX: पहले पूरी history (सारे rounds) भेजी जाती थी और सिर्फ कहा जाता था
    //   "rate round X" — इससे LLM हर बार लगभग same generic number देता था
    //   (screenshot में हर round पर Opponent:80 / Proponent:75 hardcoded जैसा
    //   दिख रहा था)। अब सिर्फ USI round के messages भेजे जाते हैं, ताकि score
    //   सच में उसी round के content पर based हो और round-to-round बदले।
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'round_score') {
      const { topic, history = [], round, language = 'Hindi' } = body;

      const roundMessages = history.filter((msg: { round: number }) => Number(msg.round) === Number(round));
      const transcriptForRound = roundMessages
        .map((msg: { speaker: string; text: string }) => `${msg.speaker}: ${msg.text}`)
        .join('\n\n');

      const prompt = `You are scoring ONLY Round ${round} of a debate on "${topic}" (conducted in ${language}).

Round ${round} statements:
${transcriptForRound || '(No statements found for this round)'}

Score each debater's performance in THIS ROUND ONLY, between 55 and 95. Base it strictly on: specific evidence/examples used, logical coherence, and strength of any rebuttal made THIS round. Do not default to a generic middle value — if one side clearly argued better in this specific round, reflect that gap in the numbers (a difference of at least 5-10 points is expected unless truly balanced).

Respond STRICTLY with JSON ONLY: {"pro": <number>, "opp": <number>}`;

      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        temperature: 0.5,
        prompt
      });
      const parsed = safeJsonParse(text, { pro: 70, opp: 70 });
      return NextResponse.json({
        pro: clampScore(parsed.pro, 70, 30, 100),
        opp: clampScore(parsed.opp, 70, 30, 100),
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. FALLACY & TONE CHECK
    // FIX: पहले normal argumentative statements (जैसे "AI creativity replace
    //   कर देगा") भी "Appeal to Fear" के नाम पर flag हो रही थीं। अब rules को
    //   ज़्यादा strict/specific बनाया — सिर्फ genuinely manipulative,
    //   catastrophic या alarmist भाषा को ही fallacy माना जाएगा, सामान्य
    //   position/claim को नहीं। साथ ही explanation में exact फ़्रेज़ quote
    //   करना ज़रूरी किया ताकि false-positive कम हों।
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'fallacy_check') {
      const { text, topic, language = 'Hindi' } = body;
      const prompt = `You are an expert, UNBIASED and CONSERVATIVE Debate Moderator. Analyze this statement (written in ${language}) for GENUINE logical fallacies ONLY.
Topic: "${topic}"
Statement: "${text}"

CRITICAL DEBATE RULES — READ CAREFULLY:
1. A normal argumentative claim (e.g. "X will replace Y", "X is a risk to Y") is NOT a fallacy — it is a standard debate position, even if it sounds negative or concerning. DO NOT flag ordinary predictions or position statements.
2. Counter-arguments and rebuttals are NOT fallacies.
3. Citing sources or data is NOT "Appeal to Authority".
4. Passionate or confident tone is NOT "Appeal to Emotion" — it must involve genuinely manipulative language.
5. ONLY flag a GENUINE fallacy if the statement meets a HIGH bar:
   - Ad Hominem (direct personal insult of the opponent, not their argument) -> Penalty: 10
   - Strawman (blatantly misrepresenting what the opponent actually said) -> Penalty: 8
   - Appeal to Fear / Existential Threat (uses exaggerated, catastrophic, alarmist language SPECIFICALLY to bypass logic — e.g. "humanity will be destroyed forever", "we will all suffer irreversibly" — NOT a normal risk claim) -> Penalty: 5
   - Appeal to Emotion (explicitly substitutes emotional manipulation FOR logical reasoning, e.g. invoking extreme suffering with no supporting logic) -> Penalty: 5
6. If in doubt, or if it's a normal (even strongly worded) debate argument, set "hasFallacy": false and "penalty": 0. False positives are worse than missing a borderline case.
7. If "hasFallacy" is true, the "explanation" MUST quote the exact fallacious phrase (under 15 words) from the statement that justifies the flag.

Calculate 'Aggression Score' (0-100) and 'Logic Score' (0-100) regardless of fallacy verdict.

Respond STRICTLY with JSON ONLY:
{"hasFallacy": true/false, "fallacyName": "English Name or null", "explanation": "Explanation written STRICTLY in ${language} Native Script, quoting the exact phrase if hasFallacy is true", "penalty": 0, "aggressionScore": 50, "logicScore": 80}`;

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

      const finalParsed = {
        hasFallacy: parsed?.hasFallacy ?? false,
        fallacyName: parsed?.hasFallacy ? (parsed?.fallacyName ?? null) : null,
        explanation: parsed?.explanation ?? '',
        penalty: parsed?.hasFallacy ? clampScore(parsed?.penalty || 5, 5, 3, 10) : 0,
        aggressionScore: clampScore(parsed?.aggressionScore, 50, 0, 100),
        logicScore: clampScore(parsed?.logicScore, 80, 0, 100),
      };

      return NextResponse.json(finalParsed);
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. FACT CHECK
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'fact_check') {
      const { claim, language = 'Hindi' } = body;
      try {
        const primaryQuery = quickSearchQuery(claim);

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

        const wikiData = await fetchWikiSnippet(primaryQuery);
        if (!wikiData) {
          return NextResponse.json({ found: false, message: `No relevant source found. (Searched: "${primaryQuery}")` });
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