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
    // 3. JUDGE VERDICT — FIX: कंसिस्टेंट स्कोरिंग और असली मैथमेटिकल पेनल्टी
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

      const judgePrompt = `Evaluate the debate on Topic: "${topic}"${biasNote}
Transcript:\n${history.map((msg: { speaker: string; text: string; round: number }) => `[Round ${msg.round}] ${msg.speaker}: ${msg.text}`).join('\n\n')}

CRITICAL RULE FOR SCORING (CONSISTENCY WITH PREVIOUS ROUNDS):
1. Score both debaters realistically out of 100 based on their logical arguments, evidence, and rebuttals.
2. DO NOT artificially jump scores. If a debater was trailing in the live rounds, they should only win if their closing round was exceptionally superior.
3. Penalties: If any debater used logical fallacies (Appeal to Fear/Emotion), deduct points accordingly.

Respond STRICTLY with JSON ONLY:
{"winner":"proponent/opponent/tie","score_proponent":80,"score_opponent":78,"reasoning":"summary written STRICTLY in ${language} native script of why they won, explicitly mentioning any penalties or fallacies."}`;

      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        temperature: 0.3,
        prompt: judgePrompt
      });
      const object = safeJsonParse(text, { winner: 'tie', score_proponent: 75, score_opponent: 75, reasoning: 'The debate was a tie.' });

      // FIX: हार्डकोड पेनल्टी माइनस करना ताकि UI में सही और कटा हुआ स्कोर दिखे
      const finalProScore = Math.max(10, (object.score_proponent || 75) - proPenalty);
      const finalOppScore = Math.max(10, (object.score_opponent || 75) - oppPenalty);
      
      let finalWinner = object.winner;
      if (finalProScore > finalOppScore) finalWinner = 'proponent';
      else if (finalOppScore > finalProScore) finalWinner = 'opponent';
      else finalWinner = 'tie';

      return NextResponse.json({
        type: 'verdict',
        payload: {
          proponent: { logic: finalProScore, creativity: finalProScore, persuasion: finalProScore, evidence: finalProScore, overall: finalProScore },
          opponent: { logic: finalOppScore, creativity: finalOppScore, persuasion: finalOppScore, evidence: finalOppScore, overall: finalOppScore },
          winner: finalWinner,
          summary: stripFakeCitations(object.reasoning),
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. ROUND SCORE
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'round_score') {
      const { topic, history = [], round, language = 'Hindi' } = body;
      const prompt = `Topic: "${topic}" (Debate conducted in ${language}). Rate round ${round} realistically between 60 and 90.\nTranscript:\n${history.map((msg: { speaker: string; text: string; round: number }) => `[Round ${msg.round}] ${msg.speaker}: ${msg.text}`).join('\n')}\nRespond STRICTLY with JSON ONLY: {"pro": 75, "opp": 80}`;
      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        temperature: 0.1,
        prompt
      });
      const parsed = safeJsonParse(text, { pro: 75, opp: 75 });
      return NextResponse.json(parsed);
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. FALLACY & TONE CHECK — FIX: Appeal to Fear/Emotion को सही से पेनल्टी देना
    // ─────────────────────────────────────────────────────────────────
    if (body.type === 'fallacy_check') {
      const { text, topic, language = 'Hindi' } = body;
      const prompt = `You are an expert, unbiased Debate Moderator. Analyze this statement (written in ${language}) for logical fallacies.
Topic: "${topic}"
Statement: "${text}"

CRITICAL DEBATE RULES:
1. Counter-arguments are NOT fallacies.
2. Citing sources is NOT "Appeal to Authority".
3. ONLY flag GENUINE fallacies:
   - Ad Hominem (direct personal insults) -> Penalty: 10
   - Strawman (misrepresenting opponent) -> Penalty: 8
   - Appeal to Fear / Existential Threat (fear-mongering instead of logic) -> Penalty: 5
   - Appeal to Emotion (using emotional/mental health extremes like BPD to replace logic) -> Penalty: 5
4. If there is NO real logical fallacy, set "hasFallacy": false and "penalty": 0.

Calculate 'Aggression Score' (0-100) and 'Logic Score' (0-100).

Respond STRICTLY with JSON ONLY:
{"hasFallacy": true/false, "fallacyName": "English Name or null", "explanation": "Explanation written STRICTLY in ${language} Native Script", "penalty": 0, "aggressionScore": 50, "logicScore": 80}`;

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
        fallacyName: parsed?.fallacyName ?? null,
        explanation: parsed?.explanation ?? '',
        penalty: parsed?.hasFallacy ? (parsed?.penalty || 5) : 0,
        aggressionScore: parsed?.aggressionScore ?? 50,
        logicScore: parsed?.logicScore ?? 80
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