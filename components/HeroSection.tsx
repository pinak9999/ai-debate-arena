'use client';

import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  CircleDot,
  Flame,
  Gauge,
  Globe2,
  LineChart,
  MessageSquareText,
  Radio,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

interface HeroSectionProps {
  onStart: (
    input: string,
    rounds: number,
    subject: 'topic' | 'stock' | 'personality'
  ) => void;
}

type Subject = 'topic' | 'stock' | 'personality';

const EXAMPLES: Record<Subject, string[]> = {
  topic: [
    'AI will replace human creativity',
    'Social media does more harm than good',
    'Nuclear energy is key to climate change',
  ],
  stock: ['SUZLON.NS', 'TATAMOTORS.NS', 'RELIANCE.NS'],
  personality: [
    'Should AI make medical decisions?',
    'Is capitalism best for humanity?',
    'Should social media be banned for under-18s?',
  ],
};

const MODES: {
  key: Subject;
  label: string;
  short: string;
  icon: typeof Target;
  color: string;
}[] = [
  { key: 'topic', label: 'Topic', short: 'Debate', icon: Target, color: '#58dcff' },
  { key: 'stock', label: 'Market', short: 'War-Room', icon: LineChart, color: '#46efad' },
  { key: 'personality', label: 'Clash', short: 'Personality', icon: Flame, color: '#ffb85b' },
];

const AGENTS = [
  { name: 'ARGUMENT ENGINE', role: 'Builds the strongest case', icon: BrainCircuit },
  { name: 'COUNTER ENGINE', role: 'Finds flaws & counters', icon: Swords },
];

const ease = [0.16, 1, 0.3, 1] as const;

const panel: CSSProperties = {
  background: 'rgba(8, 13, 25, .76)',
  border: '1px solid rgba(255,255,255,.085)',
  boxShadow:
    '0 24px 70px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.045)',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
};

export default function HeroSection({ onStart }: HeroSectionProps) {
  const [subject, setSubject] = useState<Subject>('topic');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);
  const [language, setLanguage] = useState('Hindi');
  const [launching, setLaunching] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 820);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const activeMode = MODES.find((m) => m.key === subject)!;
  const examples = EXAMPLES[subject];
  const canStart = topic.trim().length > 0 && !launching;

  const particles = useMemo(
    () =>
      Array.from({ length: mobile ? 9 : 18 }, (_, i) => ({
        left: `${(i * 47 + 9) % 100}%`,
        top: `${(i * 67 + 4) % 100}%`,
        delay: (i % 6) * 0.55,
        duration: 4 + (i % 5),
      })),
    [mobile]
  );

  const start = () => {
    if (!canStart) return;
    setLaunching(true);
    setTimeout(() => onStart(topic.trim(), rounds, subject), 450);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      start();
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100dvh',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        color: '#fff',
        background:
          'radial-gradient(circle at 50% -20%, rgba(79,100,210,.24), transparent 42%), radial-gradient(circle at 8% 70%, rgba(0,210,255,.08), transparent 25%), radial-gradient(circle at 92% 60%, rgba(178,65,255,.08), transparent 25%), #03060c',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* GRID + ambient light */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.5,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
          backgroundSize: mobile ? '42px 42px' : '58px 58px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        }}
      />

      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: mobile ? '12%' : '5%',
          width: mobile ? 360 : 760,
          height: mobile ? 360 : 760,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${activeMode.color}18, transparent 68%)`,
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {particles.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: i % 4 === 0 ? 3 : 2,
            height: i % 4 === 0 ? 3 : 2,
            borderRadius: '50%',
            background: i % 3 === 0 ? activeMode.color : '#fff',
            opacity: 0.18,
            pointerEvents: 'none',
          }}
          animate={{ y: [-10, 12, -10], opacity: [0.05, 0.28, 0.05] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 1280,
          minHeight: '100dvh',
          margin: '0 auto',
          padding: mobile ? '16px 12px 24px' : '22px 28px 28px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* TOP COMMAND BAR — intentionally compact */}
        <motion.header
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease }}
          style={{
            ...panel,
            borderRadius: 17,
            minHeight: mobile ? 56 : 62,
            padding: mobile ? '8px 10px' : '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
            }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 32,
                height: 32,
                flex: '0 0 auto',
                display: 'grid',
                placeItems: 'center',
                borderRadius: 10,
                background: `linear-gradient(135deg, ${activeMode.color}, #8b5cf6)`,
                boxShadow: `0 0 22px ${activeMode.color}28`,
              }}
            >
              <Swords size={17} />
            </motion.div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 950,
                  letterSpacing: '.08em',
                  whiteSpace: 'nowrap',
                }}
              >
                AI DEBATE <span style={{ color: activeMode.color }}>ARENA</span>
              </div>
              {!mobile && (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 8,
                    color: 'rgba(255,255,255,.3)',
                    letterSpacing: '.13em',
                    fontWeight: 800,
                  }}
                >
                  INTELLIGENCE • ARGUMENT • JUDGEMENT
                </div>
              )}
            </div>
          </div>

          {/* Live */}
          {!mobile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                color: 'rgba(255,255,255,.38)',
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: '.14em',
              }}
            >
              <motion.span
                animate={{ opacity: [1, .35, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#4ff3b0',
                  boxShadow: '0 0 10px #4ff3b0',
                }}
              />
              SYSTEM ONLINE
            </div>
          )}

          {/* Language */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 9px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,.07)',
              background: 'rgba(255,255,255,.025)',
            }}
          >
            <Globe2 size={13} style={{ color: activeMode.color }} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Language"
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                border: 0,
                outline: 0,
                background: 'transparent',
                color: 'rgba(255,255,255,.62)',
                fontSize: 9,
                fontWeight: 850,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <option>Hindi</option>
              <option>English</option>
            </select>
            <ChevronDown size={11} style={{ opacity: .45 }} />
          </div>
        </motion.header>

        {/* MAIN — desktop is intentionally compact and centered */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: mobile ? '24px 0 0' : '18px 0 0',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 1060,
              display: 'grid',
              gridTemplateColumns: mobile ? '1fr' : 'minmax(0, .86fr) minmax(420px, 1.14fr)',
              gap: mobile ? 18 : 22,
              alignItems: 'center',
            }}
          >
            {/* LEFT — identity / animation */}
            <motion.section
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: .75, delay: .08, ease }}
              style={{
                padding: mobile ? '4px 4px 0' : '0 4px',
                textAlign: mobile ? 'center' : 'left',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  borderRadius: 999,
                  border: `1px solid ${activeMode.color}30`,
                  background: `${activeMode.color}09`,
                  color: activeMode.color,
                  fontSize: 8,
                  fontWeight: 950,
                  letterSpacing: '.17em',
                }}
              >
                <Radio size={12} />
                REAL-TIME AI BATTLE
              </div>

              <h1
                style={{
                  margin: mobile ? '18px 0 12px' : '22px 0 13px',
                  fontSize: mobile ? 'clamp(42px, 14vw, 62px)' : 'clamp(58px, 6.3vw, 86px)',
                  lineHeight: .84,
                  letterSpacing: '-.075em',
                  fontWeight: 950,
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    background: 'linear-gradient(100deg,#f5fbff,#72dcff 52%,#7e8cff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Think.
                </span>
                <span
                  style={{
                    display: 'block',
                    marginTop: 5,
                    background: 'linear-gradient(100deg,#54dcff,#8b6cff 50%,#e34cff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Clash.
                </span>
                <span
                  style={{
                    display: 'block',
                    marginTop: 5,
                    color: 'rgba(255,255,255,.9)',
                  }}
                >
                  Decide.
                </span>
              </h1>

              <p
                style={{
                  maxWidth: 470,
                  margin: mobile ? '0 auto' : 0,
                  color: 'rgba(255,255,255,.4)',
                  fontSize: mobile ? 11 : 12,
                  lineHeight: 1.7,
                }}
              >
                Two AI minds enter. Arguments collide in structured rounds.
                A judge evaluates the evidence, reasoning and final winner.
              </p>

              {/* Animated agent rail */}
              <div
                style={{
                  display: 'flex',
                  gap: 9,
                  marginTop: mobile ? 18 : 24,
                  justifyContent: mobile ? 'center' : 'flex-start',
                }}
              >
                {AGENTS.map((agent, i) => {
                  const Icon = agent.icon;
                  return (
                    <motion.div
                      key={agent.name}
                      animate={{ y: [0, i ? -3 : 3, 0] }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        ...panel,
                        borderRadius: 14,
                        padding: '10px 11px',
                        width: mobile ? 142 : 165,
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                        }}
                      >
                        <Icon size={14} style={{ color: i ? '#b88cff' : activeMode.color }} />
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 950,
                            letterSpacing: '.08em',
                          }}
                        >
                          {i ? 'AI 02' : 'AI 01'}
                        </span>
                        <motion.span
                          animate={{ opacity: [1, .35, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                          style={{
                            marginLeft: 'auto',
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: i ? '#b88cff' : activeMode.color,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 8,
                          color: 'rgba(255,255,255,.5)',
                          fontWeight: 800,
                        }}
                      >
                        {agent.role}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* RIGHT — actual debate launch console */}
            <motion.section
              initial={{ x: 24, opacity: 0, scale: .98 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ duration: .75, delay: .14, ease }}
              style={{
                ...panel,
                borderRadius: 24,
                padding: mobile ? 14 : 18,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* animated scanner line */}
              <motion.div
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 1,
                  top: 0,
                  background: `linear-gradient(90deg,transparent,${activeMode.color},transparent)`,
                  opacity: .6,
                }}
                animate={{ y: [0, 360, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />

              {/* Mode tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  padding: 4,
                  borderRadius: 13,
                  background: 'rgba(255,255,255,.025)',
                  border: '1px solid rgba(255,255,255,.06)',
                }}
              >
                {MODES.map((mode) => {
                  const Icon = mode.icon;
                  const active = subject === mode.key;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => {
                        setSubject(mode.key);
                        setTopic('');
                      }}
                      style={{
                        flex: 1,
                        minHeight: 40,
                        border: active ? `1px solid ${mode.color}38` : '1px solid transparent',
                        borderRadius: 9,
                        background: active ? `${mode.color}0f` : 'transparent',
                        color: active ? mode.color : 'rgba(255,255,255,.32)',
                        fontFamily: 'inherit',
                        fontSize: 8,
                        fontWeight: 950,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon size={12} />
                      {mobile ? mode.label : `${mode.label} ${mode.short}`}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'end',
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: activeMode.color,
                        fontSize: 8,
                        fontWeight: 950,
                        letterSpacing: '.17em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {subject === 'stock' ? 'NSE TARGET' : 'BATTLE PROPOSITION'}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 17,
                        fontWeight: 900,
                        letterSpacing: '-.025em',
                      }}
                    >
                      What should the AIs debate?
                    </div>
                  </div>
                  <Activity size={17} style={{ color: activeMode.color, opacity: .7 }} />
                </div>

                <div
                  style={{
                    borderRadius: 17,
                    border: `1px solid ${topic ? `${activeMode.color}42` : 'rgba(255,255,255,.075)'}`,
                    background: 'rgba(0,0,0,.18)',
                    boxShadow: topic ? `0 0 0 3px ${activeMode.color}07` : 'none',
                    transition: 'all .25s ease',
                  }}
                >
                  <textarea
                    value={topic}
                    onChange={(e) =>
                      setTopic(subject === 'stock' ? e.target.value.toUpperCase() : e.target.value)
                    }
                    onKeyDown={onKeyDown}
                    rows={mobile ? 3 : subject === 'stock' ? 2 : 4}
                    placeholder={
                      subject === 'stock'
                        ? 'e.g. SUZLON.NS'
                        : subject === 'personality'
                          ? 'Enter a controversial question…'
                          : 'Enter a statement worth arguing about…'
                    }
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      resize: 'none',
                      border: 0,
                      outline: 0,
                      background: 'transparent',
                      color: '#fff',
                      padding: '15px 15px 8px',
                      fontFamily: 'inherit',
                      fontSize: 13,
                      lineHeight: 1.55,
                      caretColor: activeMode.color,
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 15px 10px',
                      color: 'rgba(255,255,255,.2)',
                      fontSize: 8,
                    }}
                  >
                    <span>Ctrl + Enter to launch</span>
                    <span>{topic.length}/300</span>
                  </div>
                </div>
              </div>

              {/* Examples */}
              <div style={{ marginTop: 11 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 7,
                    color: 'rgba(255,255,255,.25)',
                    fontSize: 8,
                    fontWeight: 900,
                    letterSpacing: '.13em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Sparkles size={11} style={{ color: activeMode.color }} />
                  Quick launch
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {examples.map((example) => (
                    <motion.button
                      key={example}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: .97 }}
                      onClick={() => setTopic(example)}
                      style={{
                        border: '1px solid rgba(255,255,255,.07)',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,.025)',
                        color: 'rgba(255,255,255,.4)',
                        padding: '6px 8px',
                        fontSize: 8,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {example}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Config row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
                  gap: 9,
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    padding: '11px 12px',
                    borderRadius: 13,
                    background: 'rgba(255,255,255,.025)',
                    border: '1px solid rgba(255,255,255,.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'rgba(255,255,255,.32)',
                      fontSize: 8,
                      fontWeight: 900,
                      letterSpacing: '.12em',
                    }}
                  >
                    <Gauge size={12} />
                    ROUNDS
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3,1fr)',
                      gap: 5,
                      marginTop: 8,
                    }}
                  >
                    {[3, 5, 7].map((r) => {
                      const active = rounds === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRounds(r)}
                          style={{
                            minHeight: 32,
                            borderRadius: 8,
                            border: active
                              ? `1px solid ${activeMode.color}45`
                              : '1px solid rgba(255,255,255,.055)',
                            background: active
                              ? `${activeMode.color}12`
                              : 'rgba(255,255,255,.02)',
                            color: active ? activeMode.color : 'rgba(255,255,255,.32)',
                            fontSize: 9,
                            fontWeight: 950,
                            cursor: 'pointer',
                          }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    padding: '11px 12px',
                    borderRadius: 13,
                    background: 'rgba(255,255,255,.025)',
                    border: '1px solid rgba(255,255,255,.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'rgba(255,255,255,.32)',
                      fontSize: 8,
                      fontWeight: 900,
                      letterSpacing: '.12em',
                    }}
                  >
                    <ShieldCheck size={12} />
                    JUDGE SYSTEM
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      marginTop: 10,
                      color: 'rgba(255,255,255,.5)',
                      fontSize: 9,
                      fontWeight: 750,
                    }}
                  >
                    <Trophy size={13} style={{ color: '#ffd166' }} />
                    Logic • Evidence • Rebuttal
                  </div>
                </div>
              </div>

              {/* Launch */}
              <motion.button
                type="button"
                disabled={!canStart}
                onClick={start}
                whileHover={canStart ? { y: -2, scale: 1.008 } : {}}
                whileTap={canStart ? { scale: .985 } : {}}
                style={{
                  width: '100%',
                  minHeight: 52,
                  marginTop: 12,
                  border: 0,
                  borderRadius: 14,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  background: canStart
                    ? `linear-gradient(100deg, ${activeMode.color}, #766cff 55%, #c74dff)`
                    : 'rgba(255,255,255,.045)',
                  color: canStart ? '#fff' : 'rgba(255,255,255,.22)',
                  boxShadow: canStart
                    ? `0 12px 34px ${activeMode.color}22`
                    : 'none',
                  fontFamily: 'inherit',
                  fontSize: 9,
                  fontWeight: 950,
                  letterSpacing: '.17em',
                  textTransform: 'uppercase',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={launching ? 'loading' : 'ready'}
                    initial={{ opacity: 0, y: 7 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -7 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 9,
                    }}
                  >
                    {launching ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: .8, repeat: Infinity, ease: 'linear' }}
                          style={{ display: 'inline-flex' }}
                        >
                          <Zap size={15} />
                        </motion.span>
                        INITIALIZING BATTLE…
                      </>
                    ) : (
                      <>
                        <Swords size={15} />
                        ENTER THE ARENA
                        <ArrowRight size={15} />
                      </>
                    )}
                  </motion.span>
                </AnimatePresence>

                {canStart && !launching && (
                  <motion.span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: 70,
                      background:
                        'linear-gradient(90deg,transparent,rgba(255,255,255,.32),transparent)',
                      transform: 'skewX(-18deg)',
                    }}
                    animate={{ left: ['-20%', '125%'] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: .8,
                    }}
                  />
                )}
              </motion.button>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 14,
                  marginTop: 9,
                  color: 'rgba(255,255,255,.19)',
                  fontSize: 7,
                  fontWeight: 850,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                }}
              >
                <span><CircleDot size={8} style={{ display: 'inline', marginRight: 3 }} /> SSE LIVE</span>
                <span><MessageSquareText size={8} style={{ display: 'inline', marginRight: 3 }} /> STRUCTURED</span>
                <span><Users size={8} style={{ display: 'inline', marginRight: 3 }} /> 2 AGENTS</span>
              </div>
            </motion.section>
          </div>
        </div>

        {/* tiny bottom status — no huge empty vertical area */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: .7 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            paddingTop: 10,
            color: 'rgba(255,255,255,.17)',
            fontSize: 7,
            fontWeight: 900,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
          }}
        >
          <Activity size={10} />
          AI DEBATE ENGINE READY
          <span>•</span>
          {language.toUpperCase()} MODE
        </motion.footer>
      </div>
    </motion.main>
  );
}