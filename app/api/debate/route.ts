import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

export const maxDuration = 60;

// 🔥 FIX: API Key क्रैश प्रोटेक्शन
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '', 
});

// ─── UTILITY FUNCTIONS ───

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    let clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const startIndex = clean.indexOf('{');
    const endIndex = clean.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      clean = clean.substring(startIndex, endIndex + 1);
    }
    return JSON.parse(clean) as T;
  } catch (error) {
    console.error("JSON Parse fallback triggered:", error);
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

async function generateSearchQuery(text: string): Promise<string> {
  try {
    const { text: query } = await generateText({
      model: groq('groq/compound'),
      prompt: `You are an expert Google Search query generator. Extract a highly specific 3 to 5 word search query to fact-check the following statement. \nStatement: "${text.slice(0, 300)}"\nCRITICAL: Output ONLY the search keywords. Do NOT use quotes, do NOT explain, do NOT write "Search query:". Just the words.`,
      temperature: 0.1,
    });
    return query.replace(/["'\n]/g, '').trim();
  } catch {
    return text.replace(/[।!?,.\n]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 5).join(' ').trim();
  }
}

// ─── WIKIPEDIA GROUNDING (RAG) ───

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
      snippet: summaryData.extract.slice(0, 400), // 🔥 ट्रिम किया ताकि साइज़ बड़ा न हो
      url: summaryData.content_urls?.desktop?.page || null,
    };
  } catch {
    return null;
  }
}

async function groundWithQuery(text: string): Promise<{ title: string; snippet: string; url: string | null } | null> {
  const query = await generateSearchQuery(text);
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
      answer: data.answer ? data.answer.slice(0, 500) : null, // 🔥 ट्रिम किया
      sources: (data.results || []).map((r: any) => ({
        title: r.title || 'Untitled',
        url: r.url || '',
        content: (r.content || '').slice(0, 200), // 🔥 ट्रिम किया
      })),
    };
  } catch {
    return null;
  }
}

async function groundWithTavily(text: string): Promise<{ snippet: string; sources: TavilySource[] } | null> {
  const query = await generateSearchQuery(text);
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
    return `[CRITICAL STRATEGY SHIFT]: You are losing heavily (Score: ${myScore}%). Make a simple, emotional appeal.`;
  }
  if (myScore >= 65) {
    return `[CRITICAL STRATEGY SHIFT]: You are winning decisively (Score: ${myScore}%). Be assertive and confident.`;
  }
  return '';
}

function clampScore(n: unknown, fallback: number, min = 10, max = 100): number {
  const num = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

// ─── API HANDLER ───

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'ASLI ERROR: GROQ_API_KEY Environment Variable is missing!' }, { status: 500 });
    }

    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ error: 'ASLI ERROR: Invalid or empty JSON body received from frontend.' }, { status: 400 });
    }

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

    if (body.type === 'debate_turn') {
      const { topic, round, totalRounds, speaker, history = [], mode = 'topic', stockContext, audienceScore, language = 'Hindi' } = body;
      if (!topic || !speaker || !round) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

      const isStockMode = mode === 'stock';
      const isPersonalityMode = mode === 'personality';
      const isYoutubeMode = mode === 'youtube'; 
      const isDocumentMode = mode === 'document'; 
      const position = speaker === 'proponent' ? 'SUPPORTING' : 'OPPOSING';

      // 🔥 FIX: सिर्फ आख़िरी के 4 मैसेज ही लो ताकि रिक्वेस्ट का साइज़ छोटा रहे ("Too Large" एरर खत्म!)
      const recentHistory = history.slice(-4);
      const messages = recentHistory.map((msg: { speaker: string; text: string }) => ({
        role: msg.speaker === speaker ? 'assistant' : 'user',
        content: msg.text,
      }));

      let groundingBlock = '';
      if (isDocumentMode) {
        const documentText = body.documentText || '';
        groundingBlock = documentText 
          ? `UPLOADED DOCUMENT CONTEXT:\n"""\n${documentText.slice(0, 3000)}\n"""`
          : `No document provided.`;
      } else if (isStockMode) {
        groundingBlock = stockContext
          ? `LIVE MARKET DATA for ${stockContext.symbol}: Price: ₹${stockContext.currentPrice}, Change: ${stockContext.changePercent}%`
          : `No live market feed.`;
      } else if (isPersonalityMode || isYoutubeMode) {
        const searchContext = round === 1 ? topic.replace('[YOUTUBE CONTEXT]', '') : (history.length > 0 ? history[history.length - 1].text : topic);
        const tavilyData = await groundWithTavily(searchContext);
        groundingBlock = tavilyData
          ? `FACT-CHECK DATA: \n${tavilyData.snippet.slice(0, 600)}`
          : `Rely on logic.`;
      } else {
        const lastMessageText = history.length > 0 ? history[history.length - 1].text : topic;
        const wikiData = await groundWithQuery(lastMessageText);
        groundingBlock = wikiData
          ? `FACTUAL EVIDENCE: "${wikiData.snippet.slice(0, 400)}"`
          : `Rely on logic.`;
      }

      const antiRepetitionRule = `
CRITICAL DEBATE RULES:
1. NEVER start with greetings. Jump directly into your argument.
2. NEVER CONCEDE. Fiercely defend your stance.
3. Bring a NEW logical angle or metric every round.
      `.trim();

      const langInstruction = `CRITICAL RULE: You MUST write your entire response STRICTLY in ${language.toUpperCase()} using its NATIVE SCRIPT ONLY. Do not use Roman/English letters.`;

      let roundInstruction = '';
      if (isDocumentMode) {
        roundInstruction = round === 1 ? "Present core logic or audit flaws." : "Defend or attack code structure.";
      } else if (isYoutubeMode) {
        roundInstruction = round === 1 ? "Support or critique creator claims with data." : "Counter-attack with concrete stats.";
      } else if (isStockMode) {
        roundInstruction = "Argue using valuation and market trends.";
      } else {
        roundInstruction = round === 1 ? "State core thesis." : "Rebut opponent and reinforce stance.";
      }

      const rlInstruction = buildRLInstruction(audienceScore, round, speaker);

      const systemPrompt = `
You are a FIERCE DEBATER. Role: ${speaker.toUpperCase()} (${position}) on "${topic}".
${groundingBlock}
${antiRepetitionRule}
${rlInstruction}
${roundInstruction}
${langInstruction}
      `.trim();

      const finalMessages = [
        ...messages, 
        { 
          role: 'user', 
          content: `It is your turn. ${roundInstruction} Respond directly and STRICTLY in ${language} native script (NO ENGLISH LETTERS) without formal greetings.` 
        }
      ];

      const { text: rawOutput } = await generateText({
        model: groq('groq/compound'),
        temperature: 0.7,
        system: systemPrompt,
        messages: finalMessages as any,
      });

      const cleanOutput = stripMetaCommentary(stripFakeCitations(rawOutput));
      return toManualTextStream(cleanOutput);
    }

    if (body.type === 'judge_critique') {
      const { history = [], mode = 'topic', language = 'Hindi' } = body;
      const critiquePrompt = `Provide a strict 1-sentence feedback in ${language} Native Script, under 25 words.\nTranscript:\n${history.slice(-2).map((m: any) => `${m.speaker}: ${m.text}`).join('\n')}`;
      const { text } = await generateText({
        model: groq('groq/compound'),
        temperature: 0.4,
        prompt: critiquePrompt
      });
      return NextResponse.json({ critique: stripFakeCitations(text) });
    }

    if (body.type === 'judge_verdict') {
      const { topic, history = [], language = 'Hindi' } = body;
      const judgePrompt = `Evaluate the debate on "${topic}" based on recent transcript. Respond STRICTLY with a RAW JSON object (no markdown blocks):
{
  "winner": "proponent" | "opponent" | "tie",
  "proponent": {"logic": 80, "creativity": 80, "persuasion": 80, "evidence": 80},
  "opponent": {"logic": 80, "creativity": 80, "persuasion": 80, "evidence": 80},
  "reasoning": "summary in ${language}"
}`;

      const { text } = await generateText({
        model: groq('groq/compound'),
        temperature: 0.1,
        prompt: judgePrompt
      });

      const fallbackShape = {
        winner: 'tie' as const,
        proponent: { logic: 75, creativity: 75, persuasion: 75, evidence: 75 },
        opponent: { logic: 75, creativity: 75, persuasion: 75, evidence: 75 },
        reasoning: 'Tie due to evaluation format.',
      };
      
      const object = safeJsonParse(text, fallbackShape);
      return NextResponse.json({
        type: 'verdict',
        payload: {
          proponent: { ...object.proponent, overall: 78 },
          opponent: { ...object.opponent, overall: 78 },
          winner: object.winner,
          summary: stripFakeCitations(object.reasoning || fallbackShape.reasoning),
        },
      });
    }

    if (body.type === 'round_score') {
      return NextResponse.json({ pro: 85, opp: 85 });
    }

    if (body.type === 'fallacy_check') {
      return NextResponse.json({ hasFallacy: false, fallacyName: null, explanation: '', penalty: 0, aggressionScore: 50, logicScore: 80 });
    }

    if (body.type === 'fact_check') {
      const { claim } = body;
      const query = await generateSearchQuery(claim);
      const wikiData = await fetchWikiSnippet(query);
      if (!wikiData) return NextResponse.json({ found: false });
      return NextResponse.json({ found: true, title: wikiData.title, snippet: wikiData.snippet, url: wikiData.url });
    }

    return NextResponse.json({ error: 'Unknown request type' }, { status: 400 });

  } catch (error: any) {
    console.error("FATAL API ERROR:", error.message || error);
    return NextResponse.json({ error: `ASLI ERROR: ${error.message || String(error)}` }, { status: 500 });
  }
}