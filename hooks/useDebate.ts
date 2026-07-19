import { useState, useCallback, useRef, useEffect } from 'react';
import { useSpeech } from './useSpeech';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UIArtifact {
  type: 'stock_chart' | 'ev_comparison' | 'bar_chart' | 'line_chart';
  title: string;
  data: any[];
}

export interface DebateMessage {
  id: string;
  speaker: 'proponent' | 'opponent' | 'judge';
  text: string;
  hiddenContext?: string;
  round: number;
  isComplete: boolean;
  isStreaming: boolean;
  uiArtifact?: UIArtifact | null;
}

export interface JudgeScores {
  proponent: {
    logic: number;
    creativity: number;
    persuasion: number;
    evidence: number;
    overall: number;
  };
  opponent: {
    logic: number;
    creativity: number;
    persuasion: number;
    evidence: number;
    overall: number;
  };
  winner: 'proponent' | 'opponent' | 'tie';
  summary: string;
}

export type DebateStatus = 'idle' | 'debating' | 'judging' | 'finished' | 'error';
export type DebateMode = 'spectator' | 'player';
export type DebateSubject = 'topic' | 'stock' | 'personality';
export type DebateLanguage = 'Hindi' | 'English' | 'Gujarati' | 'Marathi' | 'Punjabi'; // 🔥 NEW

export interface ScorePoint {
  round: number;
  pro: number;
  opp: number;
}

export interface FallacyResult {
  hasFallacy: boolean;
  fallacyName: string | null;
  explanation: string;
  penalty: number;
  aggressionScore: number;
  logicScore: number;
}

export interface FactCheckResult {
  found: boolean;
  title?: string;
  snippet?: string;
  url?: string | null;
  message?: string;
}

export interface StockData {
  symbol: string;
  companyName?: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh?: number;
  dayLow?: number;
  currency?: string;
  prices: { time: string; price: number }[];
  volumeData: { time: string; volume: number }[];
}

export interface DebateConfig {
  topic: string;
  totalRounds: number;
  subject?: DebateSubject; 
  language?: DebateLanguage; // 🔥 NEW
}

export interface AgentLog {
  id: string;
  timestamp: number;
  text: string;
  type: 'info' | 'fact' | 'fallacy' | 'judge' | 'system' | 'ui_render';
}

export interface AudienceScore {
  pro: number;
  opp: number;
}

export interface UseDebateReturn {
  status: DebateStatus;
  messages: DebateMessage[];
  streamingText: string;
  streamingMessageId: string | null;
  currentRound: number;
  totalRounds: number;
  currentSpeaker: 'proponent' | 'opponent' | 'judge' | null;
  scores: JudgeScores | null;
  topic: string;
  language: DebateLanguage; // 🔥 NEW
  error: string | null;
  startDebate: (config: DebateConfig) => void;
  resetDebate: () => void;
  isSpeaking: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  scoreHistory: ScorePoint[];
  mode: DebateMode;
  setMode: (m: DebateMode) => void;
  waitingForPlayer: boolean;
  submitPlayerArgument: (text: string) => void;
  fallacies: Record<string, FallacyResult>;
  factChecks: Record<string, FactCheckResult>;
  factCheckLoading: Record<string, boolean>;
  agentLogs: AgentLog[];
  audienceScore: AudienceScore;
  subject: DebateSubject;
  stockData: StockData | null;
  stockLoading: boolean;
}

const API_ENDPOINT = '/api/debate';
const INTER_TURN_DELAY_MS = 400;

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function extractHiddenContext(rawText: string): { cleanText: string; hiddenContext?: string } {
  const match = rawText.match(/\[SYSTEM NOTE:[\s\S]*?\]/);
  if (match) {
    return {
      cleanText: rawText.replace(match[0], '').trim(),
      hiddenContext: match[0],
    };
  }
  return { cleanText: rawText };
}

function extractUIArtifact(rawText: string): { cleanText: string; uiArtifact: UIArtifact | null } {
  let uiArtifact: UIArtifact | null = null;
  let cleanText = rawText;

  const matches = [...rawText.matchAll(/\[UI_CHART\]([\s\S]*?)\[\/UI_CHART\]/g)];

  if (matches.length > 0) {
    try {
      const jsonString = matches[matches.length - 1][1].trim();
      uiArtifact = JSON.parse(jsonString) as UIArtifact;
    } catch (e) {
      console.error('UI Artifact JSON parsing failed', e);
    }
  }

  cleanText = rawText.replace(/\[UI_CHART\][\s\S]*?\[\/UI_CHART\]/g, '').trim();

  return { cleanText, uiArtifact };
}

export function useDebate(): UseDebateReturn {
  const [status, setStatus] = useState<DebateStatus>('idle');
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<'proponent' | 'opponent' | 'judge' | null>(null);
  const [scores, setScores] = useState<JudgeScores | null>(null);
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<DebateLanguage>('Hindi'); // 🔥 NEW
  const [error, setError] = useState<string | null>(null);

  const [scoreHistory, setScoreHistory] = useState<ScorePoint[]>([]);
  const [mode, setMode] = useState<DebateMode>('spectator');
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const playerInputResolverRef = useRef<((text: string) => void) | null>(null);

  const [fallacies, setFallacies] = useState<Record<string, FallacyResult>>({});
  const [factChecks, setFactChecks] = useState<Record<string, FactCheckResult>>({});
  const [factCheckLoading, setFactCheckLoading] = useState<Record<string, boolean>>({});

  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [audienceScore, setAudienceScore] = useState<AudienceScore>({ pro: 50, opp: 50 });

  const audienceScoreRef = useRef<AudienceScore>({ pro: 50, opp: 50 });
  useEffect(() => {
    audienceScoreRef.current = audienceScore;
  }, [audienceScore]);

  const [subject, setSubject] = useState<DebateSubject>('topic');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

  const currentRoundRef = useRef(1);

  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingTextRef = useRef('');

  const { speak, stop: stopSpeech, isSpeaking, isMuted, toggleMute } = useSpeech();

  const addLog = useCallback((text: string, type: AgentLog['type'] = 'info') => {
    setAgentLogs((prev) => [...prev, { id: generateId(), timestamp: Date.now(), text, type }]);
  }, []);

  useEffect(() => {
    console.log("Supabase Realtime Connection Start...");

    const voteChannel = supabase
      .channel('realtime-votes-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        async (payload) => {
          console.log('🔥 VOTE EVENT RECEIVED:', payload);

          const activeRound = currentRoundRef.current;
          console.log('[Live Vote] Fetching fresh count for round:', activeRound);

          const { data, error } = await supabase
            .from('votes')
            .select('side')
            .eq('round_number', activeRound);

          if (error) {
            console.error(`[Live Vote] Error fetching votes: ${error.message}`);
            return;
          }

          if (data) {
            const total = data.length;
            const proVotes = data.filter((v) => v.side === 'proponent').length;
            const proPercentage = total > 0 ? Math.round((proVotes / total) * 100) : 50;
            const oppPercentage = 100 - proPercentage;

            const nextScore = { pro: proPercentage, opp: oppPercentage };
            setAudienceScore(nextScore);
            audienceScoreRef.current = nextScore;

            addLog(`[Live Vote] Round ${activeRound}: ${proPercentage}% Pro / ${oppPercentage}% Opp (Total votes: ${total})`, 'system');
            console.log(`[Live Vote] Round ${activeRound} updated: ${proPercentage}% Pro`);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Supabase Live Voting 100% Connected!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Supabase Channel Error:', err);
        }
      });

    return () => {
      console.log("Cleaning up Supabase Connection...");
      supabase.removeChannel(voteChannel);
    };
  }, [addLog]);

  const resetDebate = useCallback(() => {
    abortControllerRef.current?.abort();
    stopSpeech();
    setStatus('idle');
    setMessages([]);
    setStreamingText('');
    setStreamingMessageId(null);
    setCurrentRound(0);
    setTotalRounds(0);
    setCurrentSpeaker(null);
    setScores(null);
    setTopic('');
    setLanguage('Hindi'); // 🔥 NEW
    setError(null);
    setScoreHistory([]);
    setWaitingForPlayer(false);
    setFallacies({});
    setFactChecks({});
    setFactCheckLoading({});
    setAgentLogs([]);
    setAudienceScore({ pro: 50, opp: 50 });
    audienceScoreRef.current = { pro: 50, opp: 50 };
    setSubject('topic');
    setStockData(null);
    setStockLoading(false);
    playerInputResolverRef.current = null;
    streamingTextRef.current = '';
  }, [stopSpeech]);

  const readTextStream = useCallback(
    async (response: Response, onChunk: (chunk: string) => void, signal: AbortSignal): Promise<string> => {
      if (!response.body) throw new Error('Response body is null');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      try {
        while (true) {
          if (signal.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            fullText += chunk;
            onChunk(chunk);
          }
        }
      } finally {
        reader.releaseLock();
      }
      return fullText;
    },
    []
  );

  const fetchStockData = useCallback(async (symbol: string, signal: AbortSignal): Promise<StockData | null> => {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stock_data', symbol }),
        signal,
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: 'Unknown market data error' }));
        addLog(`[Market Data] ${errJson.error || 'Failed to fetch stock data'}`, 'system');
        return null;
      }
      const data = (await response.json()) as StockData;
      return data;
    } catch {
      return null;
    }
  }, [addLog]);

  const fetchDebateTurn = useCallback(
    async (
      params: {
        topic: string;
        round: number;
        totalRounds: number;
        speaker: 'proponent' | 'opponent';
        previousMessages: DebateMessage[];
        subjectMode: DebateSubject;
        stockContext?: StockData | null;
        audienceScore?: AudienceScore; 
        language: DebateLanguage; // 🔥 NEW
      },
      signal: AbortSignal
    ): Promise<string> => {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'debate_turn',
          topic: params.topic,
          round: params.round,
          totalRounds: params.totalRounds,
          speaker: params.speaker,
          history: params.previousMessages.map((m) => ({
            speaker: m.speaker,
            text: m.hiddenContext ? `${m.text}\n\n${m.hiddenContext}` : m.text,
          })),
          mode: params.subjectMode,
          stockContext: params.stockContext || undefined,
          audienceScore: params.audienceScore,
          language: params.language, // 🔥 NEW
        }),
        signal,
      });
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new Error(`API ${response.status}: ${errorBody}`);
      }
      return readTextStream(
        response,
        (chunk) => {
          streamingTextRef.current += chunk;
          setStreamingText(streamingTextRef.current);
        },
        signal
      );
    },
    [readTextStream]
  );

  const fetchJudgeCritique = useCallback(
    async (debateTopic: string, previousMessages: DebateMessage[], subjectMode: DebateSubject, debateLang: DebateLanguage, signal: AbortSignal): Promise<string> => {
      addLog(`[Judge] Generating critique for Round...`, 'judge');
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'judge_critique',
          topic: debateTopic,
          mode: subjectMode,
          language: debateLang, // 🔥 NEW
          history: previousMessages.map((m) => ({
            speaker: m.speaker,
            text: m.hiddenContext ? `${m.text}\n\n${m.hiddenContext}` : m.text,
            round: m.round,
          })),
        }),
        signal,
      });
      if (!response.ok) throw new Error('Critique API Error');
      const json = await response.json();
      addLog(`[Judge] Critique successfully synthesized.`, 'judge');
      return json.critique || '';
    },
    [addLog]
  );

  const fetchJudgeVerdict = useCallback(
    async (debateTopic: string, allMessages: DebateMessage[], subjectMode: DebateSubject, debateLang: DebateLanguage, signal: AbortSignal): Promise<JudgeScores> => {
      addLog(`[System] Compiling full debate history for final verdict...`, 'system');
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'judge_verdict',
          topic: debateTopic,
          mode: subjectMode,
          language: debateLang, // 🔥 NEW
          history: allMessages.map((m) => ({
            speaker: m.speaker,
            text: m.hiddenContext ? `${m.text}\n\n${m.hiddenContext}` : m.text,
            round: m.round,
          })),
        }),
        signal,
      });
      if (!response.ok) throw new Error(`Judge API ${response.status}`);
      const json = await response.json();
      if (json.type === 'verdict' && json.payload) {
        addLog(`[System] Verdict received successfully.`, 'system');
        return json.payload as JudgeScores;
      }
      throw new Error('Failed to parse judge verdict');
    },
    [addLog]
  );

  const fetchRoundScore = useCallback(
    async (debateTopic: string, round: number, allMessages: DebateMessage[], debateLang: DebateLanguage, signal: AbortSignal) => {
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'round_score',
            topic: debateTopic,
            round,
            language: debateLang, // 🔥 NEW
            history: allMessages.map((m) => ({
              speaker: m.speaker,
              text: m.hiddenContext ? `${m.text}\n\n${m.hiddenContext}` : m.text,
              round: m.round,
            })),
          }),
          signal,
        });
        if (!response.ok) {
          setScoreHistory((prev) => [...prev, { round, pro: 50, opp: 50 }]);
          return;
        }
        const json = await response.json();
        setScoreHistory((prev) => [...prev, { round, pro: json.pro ?? 50, opp: json.opp ?? 50 }]);
      } catch (err) {
        setScoreHistory((prev) => [...prev, { round, pro: 50, opp: 50 }]);
      }
    },
    []
  );

  const runFallacyCheck = useCallback((messageId: string, text: string, currentTopic: string, debateLang: DebateLanguage) => {
    addLog(`[NLP Engine] Scanning argument for fallacies & topic drift...`, 'fallacy');
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'fallacy_check', text, topic: currentTopic, language: debateLang }), // 🔥 NEW
    })
      .then((res) => res.json())
      .then((result: FallacyResult) => {
        setFallacies((prev) => ({ ...prev, [messageId]: result }));
        if (result.hasFallacy) {
          addLog(`[Alert] Fallacy: ${result.fallacyName} | Penalty: -${result.penalty} pts`, 'fallacy');
        } else {
          addLog(`[Tone Check] Logic: ${result.logicScore}/100 | Aggression: ${result.aggressionScore}/100`, 'info');
        }
      })
      .catch(() => {});
  }, [addLog]);

  const runFactCheck = useCallback((messageId: string, claim: string, debateLang: DebateLanguage) => {
    setFactCheckLoading((prev) => ({ ...prev, [messageId]: true }));
    addLog(`[RAG Module] Querying live web + Wikipedia for claim validation...`, 'fact');
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'fact_check', claim, language: debateLang }), // 🔥 NEW
    })
      .then((res) => res.json())
      .then((result: FactCheckResult) => {
        setFactChecks((prev) => ({ ...prev, [messageId]: result }));
        if (result.found) {
          addLog(`[Source Verified] Matched with: "${result.title}"`, 'fact');
        } else {
          addLog(`[Warning] No reliable source found. Claim remains unverified.`, 'fact');
        }
      })
      .catch(() => {
        setFactChecks((prev) => ({ ...prev, [messageId]: { found: false, message: 'Fact-check failed.' } }));
      })
      .finally(() => {
        setFactCheckLoading((prev) => ({ ...prev, [messageId]: false }));
      });
  }, [addLog]);

  const waitForPlayerInput = useCallback((): Promise<string> => {
    setWaitingForPlayer(true);
    addLog(`[System] Awaiting human input...`, 'system');
    return new Promise<string>((resolve) => {
      playerInputResolverRef.current = (text: string) => {
        setWaitingForPlayer(false);
        addLog(`[System] Human input received. Transmitting to Opponent AI.`, 'system');
        resolve(text);
      };
    });
  }, [addLog]);

  const submitPlayerArgument = useCallback((text: string) => {
    if (!text.trim()) return;
    if (playerInputResolverRef.current) {
      playerInputResolverRef.current(text.trim());
      playerInputResolverRef.current = null;
    }
  }, []);

  const startDebate = useCallback(
    async (config: DebateConfig) => {
      abortControllerRef.current?.abort();
      stopSpeech();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      const subjectMode: DebateSubject = config.subject || 'topic';
      const debateLang: DebateLanguage = config.language || 'Hindi'; // 🔥 NEW

      setTopic(config.topic);
      setTotalRounds(config.totalRounds);
      setLanguage(debateLang); // 🔥 NEW
      setStatus('debating');
      setMessages([]);
      setScores(null);
      setError(null);
      setScoreHistory([]);
      setFallacies({});
      setFactChecks({});
      setAgentLogs([]);
      setAudienceScore({ pro: 50, opp: 50 });
      audienceScoreRef.current = { pro: 50, opp: 50 };
      setSubject(subjectMode);
      setStockData(null);
      streamingTextRef.current = '';

      addLog(`[System] Initializing debate environment. Topic: "${config.topic}" (Language: ${debateLang})`, 'system'); // 🔥 NEW

      let fetchedStockData: StockData | null = null;
      if (subjectMode === 'stock') {
        setStockLoading(true);
        addLog(`[Market Data] Fetching live intraday feed for ${config.topic}...`, 'system');
        fetchedStockData = await fetchStockData(config.topic, signal);
        setStockLoading(false);
        if (fetchedStockData) {
          setStockData(fetchedStockData);
          addLog(
            `[Market Data] ${fetchedStockData.symbol} @ ₹${fetchedStockData.currentPrice} (${fetchedStockData.changePercent >= 0 ? '+' : ''}${fetchedStockData.changePercent}%)`,
            'system'
          );
        } else {
          addLog(`[Market Data] Warning: Live feed unavailable. Agents will use general financial reasoning.`, 'system');
        }
      } else if (subjectMode === 'personality') {
        addLog(`[System] Personality Clash Mode activated — Aggressive Analyst vs The Philosopher, grounded via live web research.`, 'system');
      }

      const committedMessages: DebateMessage[] = [];
      const speakerOrder = ['proponent', 'opponent'] as const;

      try {
        for (let round = 1; round <= config.totalRounds; round++) {
          if (signal.aborted) break;
          setCurrentRound(round);
          addLog(`[System] --- Commencing Round ${round}/${config.totalRounds} ---`, 'system');

          for (const speaker of speakerOrder) {
            if (signal.aborted) break;

            const messageId = generateId();
            setCurrentSpeaker(speaker);
            streamingTextRef.current = '';
            setStreamingText('');
            setStreamingMessageId(messageId);

            const placeholder: DebateMessage = {
              id: messageId,
              speaker,
              text: '',
              round,
              isComplete: false,
              isStreaming: true,
            };
            setMessages((prev) => [...prev, placeholder]);
            committedMessages.push(placeholder);

            let fullText: string;
            let hiddenCtx: string | undefined;

            if (mode === 'player' && speaker === 'proponent') {
              setStreamingMessageId(null);
              const rawInput = await waitForPlayerInput();

              const extracted = extractHiddenContext(rawInput);
              fullText = extracted.cleanText;
              hiddenCtx = extracted.hiddenContext;

              if (signal.aborted) break;
            } else {
              addLog(`[LLM Router] Routing context to AI Agent #${speaker === 'proponent' ? '001' : '002'}...`, 'info');
              console.log('[Live Vote] Sending audienceScore to AI:', audienceScoreRef.current, 'for round', round);
              fullText = await fetchDebateTurn(
                {
                  topic: config.topic,
                  round,
                  totalRounds: config.totalRounds,
                  speaker,
                  previousMessages: committedMessages.slice(0, -1),
                  subjectMode,
                  stockContext: fetchedStockData,
                  audienceScore: audienceScoreRef.current,
                  language: debateLang, // 🔥 NEW 
                },
                signal
              );
            }

            const { cleanText, uiArtifact } = extractUIArtifact(fullText);
            if (uiArtifact) {
              addLog(`[Generative UI] Rendering live data chart: ${uiArtifact.title}`, 'ui_render');
            }

            const completed: DebateMessage = {
              ...placeholder,
              text: cleanText,
              hiddenContext: hiddenCtx,
              isComplete: true,
              isStreaming: false,
              uiArtifact,
            };

            const idx = committedMessages.findIndex((m) => m.id === messageId);
            if (idx !== -1) committedMessages[idx] = completed;

            setMessages((prev) => prev.map((m) => (m.id === messageId ? completed : m)));
            setStreamingMessageId(null);
            setStreamingText('');
            streamingTextRef.current = '';

            if (mode === 'spectator' || speaker === 'opponent') {
              runFallacyCheck(messageId, cleanText, config.topic, debateLang); // 🔥 NEW
              runFactCheck(messageId, cleanText, debateLang); // 🔥 NEW
            }

            if (!signal.aborted) {
              // 🔥 NEW: Pass debateLang to useSpeech so it reads in correct accent
              const speakPromise = (speak as any)(cleanText, speaker, debateLang);
              const abortPromise = new Promise<void>((resolve) => {
                signal.addEventListener('abort', () => resolve(), { once: true });
              });
              await Promise.race([speakPromise, abortPromise] as any[]);
              if (signal.aborted) stopSpeech();
            }

            if (!signal.aborted) {
              await new Promise<void>((resolve) => {
                const t = setTimeout(resolve, INTER_TURN_DELAY_MS);
                signal.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
              });
            }
          }

          if (!signal.aborted) {
            fetchRoundScore(config.topic, round, committedMessages, debateLang, signal); // 🔥 NEW
          }

          if (round < config.totalRounds && !signal.aborted) {
            setCurrentSpeaker('judge');
            const critiqueId = generateId();

            const critiquePlaceholder: DebateMessage = {
              id: critiqueId, speaker: 'judge', text: 'Judge is analyzing the round...', round, isComplete: false, isStreaming: false,
            };
            setMessages((prev) => [...prev, critiquePlaceholder]);

            const critiqueText = await fetchJudgeCritique(config.topic, committedMessages, subjectMode, debateLang, signal); // 🔥 NEW
            const completedCritique = { ...critiquePlaceholder, text: critiqueText, isComplete: true };

            committedMessages.push(completedCritique);
            setMessages((prev) => prev.map((m) => (m.id === critiqueId ? completedCritique : m)));

            if (!signal.aborted) {
              const speakPromise = (speak as any)(critiqueText, 'judge', debateLang); // 🔥 NEW
              const abortPromise = new Promise<void>((resolve) => {
                signal.addEventListener('abort', () => resolve(), { once: true });
              });
              await Promise.race([speakPromise, abortPromise] as any[]);
            }
          }
        }

        if (!signal.aborted) {
          setStatus('judging');
          setCurrentSpeaker(null);
          const verdict = await fetchJudgeVerdict(config.topic, committedMessages, subjectMode, debateLang, signal); // 🔥 NEW
          setScores(verdict);
          setStatus('finished');
        }
      } catch (err) {
        if (signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(msg);
        setStatus('error');
        console.error('[useDebate] Fatal error:', err);
      }
    },
    [fetchDebateTurn, fetchJudgeCritique, fetchJudgeVerdict, fetchRoundScore, runFallacyCheck, runFactCheck, waitForPlayerInput, mode, speak, stopSpeech, addLog, fetchStockData]
  );

  return {
    status, messages, streamingText, streamingMessageId, currentRound, totalRounds,
    currentSpeaker, scores, topic, language, error, startDebate, resetDebate,
    isSpeaking, isMuted, toggleMute, scoreHistory, mode, setMode,
    waitingForPlayer, submitPlayerArgument, fallacies, factChecks, factCheckLoading,
    agentLogs,
    audienceScore,
    subject,
    stockData,
    stockLoading,
  };
}