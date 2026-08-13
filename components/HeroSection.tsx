'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  ChevronDown,
  Flame,
  Gauge,
  Layers3,
  LineChart,
  Lock,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';

interface HeroSectionProps {
  onStart: (
    input: string,
    rounds: number,
    subject: 'topic' | 'stock' | 'personality'
  ) => void;
}

const EXAMPLE_TOPICS = [
  'AI will replace human creativity entirely',
  'Universal Basic Income is net positive',
  'Social media does more harm than good',
  'Space colonisation should be humanity\'s top priority',
  'Nuclear energy is key to solving climate change',
];

const EXAMPLE_TICKERS = [
  'SUZLON.NS',
  'TATAMOTORS.NS',
  'RELIANCE.NS',
  'IRFC.NS',
  'INFY.NS',
  'ZOMATO.NS',
];

const EXAMPLE_PERSONALITY_TOPICS = [
  'Should the death penalty be abolished worldwide?',
  'Is capitalism the best economic system for humanity?',
  'Should AI make life-or-death medical decisions?',
  'Is space exploration justified while poverty exists?',
  'Should social media be banned for under-18s?',
];

const ease = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease },
  },
};

const glass: CSSProperties = {
  background:
    'linear-gradient(145deg, rgba(16,24,42,.78), rgba(6,10,22,.72))',
  border: '1px solid rgba(255,255,255,.09)',
  boxShadow:
    '0 30px 90px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.055)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

export default function HeroSection({ onStart }: HeroSectionProps) {
  const [subject, setSubject] = useState<'topic' | 'stock' | 'personality'>('topic');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);
  const [launching, setLaunching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 760);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const isStock = subject === 'stock';
  const isPersonality = subject === 'personality';

  const theme = useMemo(() => {
    if (isStock) {
      return {
        accent: '#43f0a4',
        accent2: '#22c55e',
        rgb: '67,240,164',
        soft: 'rgba(67,240,164,.12)',
        gradient: 'linear-gradient(135deg,#43f0a4 0%,#22c55e 48%,#06b6d4 100%)',
        label: 'MARKET WAR-ROOM',
        icon: TrendingUp,
      };
    }

    if (isPersonality) {
      return {
        accent: '#ffbd5c',
        accent2: '#ff4d7d',
        rgb: '255,189,92',
        soft: 'rgba(255,189,92,.12)',
        gradient: 'linear-gradient(135deg,#ffbd5c 0%,#ff4d7d 52%,#a855f7 100%)',
        label: 'PERSONALITY CLASH',
        icon: Flame,
      };
    }

    return {
      accent: '#54d9ff',
      accent2: '#9b6cff',
      rgb: '84,217,255',
      soft: 'rgba(84,217,255,.12)',
      gradient: 'linear-gradient(135deg,#54d9ff 0%,#6877ff 50%,#d24cff 100%)',
      label: 'TOPIC DEBATE',
      icon: Target,
    };
  }, [isPersonality, isStock]);

  const examples = isStock
    ? EXAMPLE_TICKERS
    : isPersonality
      ? EXAMPLE_PERSONALITY_TOPICS
      : EXAMPLE_TOPICS;

  const canStart = topic.trim().length > 0 && !launching;

  const handleStart = () => {
    if (!canStart) return;
    setLaunching(true);
    setTimeout(() => onStart(topic.trim(), rounds, subject), 500);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleStart();
    }
  };

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: `${(i * 37) % 101}%`,
        top: `${(i * 61) % 100}%`,
        size: i % 5 === 0 ? 3 : 1.5,
        duration: 4 + (i % 5),
        delay: (i % 7) * 0.35,
      })),
    []
  );

  const TabIcon = theme.icon;

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      style={{
        minHeight: '100dvh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        color: '#fff',
        background:
          'radial-gradient(circle at 50% 10%, rgba(71,94,180,.17), transparent 28%), radial-gradient(circle at 15% 60%, rgba(0,212,255,.07), transparent 25%), radial-gradient(circle at 85% 70%, rgba(173,70,255,.07), transparent 25%), #03060d',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Ambient animated background */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 85%)',
        }}
      />

      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 'min(720px, 90vw)',
          height: 'min(720px, 90vw)',
          borderRadius: '50%',
          left: '50%',
          top: '7%',
          transform: 'translateX(-50%)',
          background: `radial-gradient(circle, rgba(${theme.rgb},.10), transparent 66%)`,
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {particles.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: i % 3 === 0 ? theme.accent : '#fff',
            opacity: 0.16,
            pointerEvents: 'none',
          }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.06, 0.28, 0.06],
          }}
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
          width: '100%',
          maxWidth: 1280,
          padding: isMobile
            ? '22px 12px 38px'
            : 'clamp(28px, 5vw, 64px) clamp(16px, 4vw, 42px) 48px',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Top status */}
        <motion.div variants={itemVariants}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              padding: '8px 13px',
              borderRadius: 999,
              border: `1px solid rgba(${theme.rgb},.22)`,
              background: `rgba(${theme.rgb},.055)`,
              boxShadow: `0 0 30px rgba(${theme.rgb},.07)`,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.22em',
              color: theme.accent,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: theme.accent,
                boxShadow: `0 0 12px ${theme.accent}`,
              }}
            />
            LIVE AI ARENA
            <span style={{ opacity: 0.35 }}>•</span>
            REAL-TIME STREAMING
          </div>
        </motion.div>

        {/* Hero */}
        <motion.section
          variants={itemVariants}
          style={{
            textAlign: 'center',
            marginTop: 'clamp(22px, 4vw, 40px)',
            maxWidth: 900,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(48px, 9vw, 118px)',
              lineHeight: 0.82,
              fontWeight: 950,
              letterSpacing: '-.075em',
              textTransform: 'uppercase',
              filter: `drop-shadow(0 0 34px rgba(${theme.rgb},.12))`,
            }}
          >
            <motion.span
              style={{
                display: 'block',
                background: 'linear-gradient(105deg,#fff 4%,#bfefff 32%,#54d9ff 60%,#9b6cff 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              AI DEBATE
            </motion.span>
            <span
              style={{
                display: 'block',
                marginTop: 8,
                background: theme.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ARENA
            </span>
          </div>

          <p
            style={{
              margin: '24px auto 0',
              maxWidth: 620,
              color: 'rgba(255,255,255,.48)',
              fontSize: 'clamp(11px, 1.5vw, 14px)',
              lineHeight: 1.8,
              letterSpacing: '.17em',
              textTransform: 'uppercase',
            }}
          >
            Two AI agents. Structured rounds. Live evidence. One final judge.
          </p>
        </motion.section>

        {/* Live metrics */}
        <motion.div
          variants={itemVariants}
          style={{
            width: '100%',
            maxWidth: 720,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            marginTop: 28,
          }}
        >
          {[
            { icon: Brain, value: '02', label: 'AI AGENTS' },
            { icon: Layers3, value: '03–07', label: 'ROUNDS' },
            { icon: Trophy, value: 'LIVE', label: 'JUDGE SCORE' },
          ].map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              style={{
                ...glass,
                borderRadius: 16,
                padding: '13px 10px',
                textAlign: 'center',
              }}
            >
              <Icon
                size={14}
                style={{ color: theme.accent, marginBottom: 5 }}
              />
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: '.08em',
                }}
              >
                {value}
              </div>
              <div
                style={{
                  marginTop: 3,
                  fontSize: 8,
                  color: 'rgba(255,255,255,.3)',
                  letterSpacing: '.15em',
                  fontWeight: 800,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Main workspace */}
        <motion.section
          variants={itemVariants}
          style={{
            width: '100%',
            maxWidth: 940,
            marginTop: 18,
            ...glass,
            borderRadius: 28,
            padding: 'clamp(16px, 3vw, 28px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, rgba(${theme.rgb},.055), transparent 38%, rgba(155,108,255,.045))`,
              pointerEvents: 'none',
            }}
          />

          {/* Window chrome */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 22,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', gap: 7 }}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <span
                  key={c}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: c,
                    opacity: 0.65,
                  }}
                />
              ))}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                color: 'rgba(255,255,255,.28)',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '.16em',
              }}
            >
              <Lock size={11} />
              SECURE DEBATE SESSION
            </div>

            <div style={{ width: 44 }} />
          </div>

          {/* Mode selector */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              padding: 5,
              borderRadius: 15,
              background: 'rgba(255,255,255,.035)',
              border: '1px solid rgba(255,255,255,.065)',
            }}
          >
            {[
              { key: 'topic' as const, label: 'Topic Debate', icon: Target },
              { key: 'stock' as const, label: 'Market War-Room', icon: LineChart },
              { key: 'personality' as const, label: 'Personality Clash', icon: Flame },
            ].map(({ key, label, icon: Icon }) => {
              const active = subject === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSubject(key);
                    setTopic('');
                  }}
                  style={{
                    flex: '1 1 180px',
                    minHeight: 42,
                    border: active
                      ? `1px solid rgba(${key === 'stock' ? '67,240,164' : key === 'personality' ? '255,189,92' : '84,217,255'},.38)`
                      : '1px solid transparent',
                    borderRadius: 11,
                    background: active
                      ? `rgba(${key === 'stock' ? '67,240,164' : key === 'personality' ? '255,189,92' : '84,217,255'},.09)`
                      : 'transparent',
                    color: active
                      ? key === 'stock'
                        ? '#43f0a4'
                        : key === 'personality'
                          ? '#ffbd5c'
                          : '#54d9ff'
                      : 'rgba(255,255,255,.38)',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 850,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all .2s ease',
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
              ? 'minmax(0, 1fr)'
              : 'minmax(0, 1.35fr) minmax(260px, .65fr)',
              gap: 14,
              marginTop: 14,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Input panel */}
            <div
              style={{
                borderRadius: 20,
                padding: 'clamp(16px, 3vw, 22px)',
                background: 'rgba(0,0,0,.18)',
                border: '1px solid rgba(255,255,255,.065)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 11,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: theme.accent,
                      fontWeight: 900,
                      letterSpacing: '.18em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {theme.label}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 18,
                      fontWeight: 850,
                      letterSpacing: '-.02em',
                    }}
                  >
                    Define the battlefield
                  </div>
                </div>
                <TabIcon size={20} style={{ color: theme.accent, opacity: .8 }} />
              </div>

              <div
                style={{
                  borderRadius: 16,
                  border: `1px solid ${topic ? `rgba(${theme.rgb},.28)` : 'rgba(255,255,255,.08)'}`,
                  background: 'rgba(255,255,255,.025)',
                  boxShadow: topic ? `0 0 0 3px rgba(${theme.rgb},.035)` : 'none',
                  transition: 'all .25s ease',
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={topic}
                  onChange={(e) =>
                    setTopic(isStock ? e.target.value.toUpperCase() : e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isStock
                      ? 'Enter NSE ticker • e.g. SUZLON.NS'
                      : isPersonality
                        ? 'Enter a topic for Analyst vs Philosopher…'
                        : 'Enter a controversial statement or topic…'
                  }
                  rows={isStock ? 2 : 5}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'block',
                    border: 0,
                    outline: 0,
                    resize: 'none',
                    background: 'transparent',
                    color: '#fff',
                    padding: '17px 17px 8px',
                    fontSize: 'clamp(13px, 1.6vw, 15px)',
                    lineHeight: 1.65,
                    fontFamily: 'inherit',
                    caretColor: theme.accent,
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '0 17px 12px',
                    color: 'rgba(255,255,255,.24)',
                    fontSize: 9,
                    letterSpacing: '.05em',
                  }}
                >
                  <span>
                    {isStock
                      ? 'Use .NS for NSE symbols'
                      : 'Ctrl / ⌘ + Enter to launch'}
                  </span>
                  <span>{topic.length} chars</span>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 9,
                  }}
                >
                  <span
                    style={{
                      color: 'rgba(255,255,255,.3)',
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isStock ? 'Popular symbols' : 'Try one of these'}
                  </span>
                  <Sparkles size={12} style={{ color: theme.accent, opacity: .55 }} />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 7,
                  }}
                >
                  {examples.map((example) => (
                    <motion.button
                      key={example}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: .97 }}
                      onClick={() => {
                        setTopic(example);
                        textareaRef.current?.focus();
                      }}
                      style={{
                        border: '1px solid rgba(255,255,255,.075)',
                        borderRadius: 999,
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,.025)',
                        color: 'rgba(255,255,255,.42)',
                        cursor: 'pointer',
                        fontSize: 9,
                        lineHeight: 1.2,
                        textAlign: 'left',
                      }}
                    >
                      {example}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Control panel */}
            <div
              style={{
                borderRadius: 20,
                padding: 'clamp(16px, 3vw, 22px)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.018))',
                border: '1px solid rgba(255,255,255,.065)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  color: 'rgba(255,255,255,.34)',
                  fontSize: 9,
                  fontWeight: 850,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                }}
              >
                Battle configuration
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 15,
                  background: 'rgba(0,0,0,.18)',
                  border: '1px solid rgba(255,255,255,.055)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>Rounds</div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 9,
                        color: 'rgba(255,255,255,.27)',
                      }}
                    >
                      More rounds = deeper debate
                    </div>
                  </div>
                  <Gauge size={18} style={{ color: theme.accent }} />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 7,
                    marginTop: 13,
                  }}
                >
                  {[3, 5, 7].map((r) => {
                    const active = rounds === r;
                    return (
                      <motion.button
                        key={r}
                        type="button"
                        whileTap={{ scale: .96 }}
                        onClick={() => setRounds(r)}
                        style={{
                          minHeight: 48,
                          borderRadius: 12,
                          border: active
                            ? `1px solid rgba(${theme.rgb},.42)`
                            : '1px solid rgba(255,255,255,.065)',
                          background: active ? theme.soft : 'rgba(255,255,255,.025)',
                          color: active ? theme.accent : 'rgba(255,255,255,.35)',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        {r}
                        <span
                          style={{
                            display: 'block',
                            marginTop: 2,
                            fontSize: 7,
                            letterSpacing: '.1em',
                            opacity: .65,
                          }}
                        >
                          ROUNDS
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 15,
                  background: 'rgba(0,0,0,.14)',
                  border: '1px solid rgba(255,255,255,.055)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,.52)',
                  }}
                >
                  <Swords size={14} style={{ color: theme.accent }} />
                  MATCH FORMAT
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 12,
                  }}
                >
                  {['AI A', 'VS', 'AI B'].map((text, i) => (
                    <div
                      key={text}
                      style={{
                        flex: i === 1 ? 0 : 1,
                        textAlign: 'center',
                        padding: '8px 5px',
                        borderRadius: 9,
                        background:
                          i === 1 ? 'transparent' : 'rgba(255,255,255,.035)',
                        border:
                          i === 1
                            ? '0'
                            : '1px solid rgba(255,255,255,.055)',
                        color:
                          i === 1 ? theme.accent : 'rgba(255,255,255,.42)',
                        fontSize: 8,
                        fontWeight: 900,
                        letterSpacing: '.1em',
                      }}
                    >
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 14 }}>
                <motion.button
                  id="start-debate-btn"
                  type="button"
                  disabled={!canStart}
                  onClick={handleStart}
                  whileHover={canStart ? { y: -2, scale: 1.01 } : {}}
                  whileTap={canStart ? { scale: .985 } : {}}
                  style={{
                    width: '100%',
                    minHeight: 58,
                    border: 0,
                    borderRadius: 15,
                    cursor: canStart ? 'pointer' : 'not-allowed',
                    background: canStart
                      ? theme.gradient
                      : 'rgba(255,255,255,.045)',
                    color: canStart ? '#fff' : 'rgba(255,255,255,.22)',
                    boxShadow: canStart
                      ? `0 12px 38px rgba(${theme.rgb},.2), 0 0 60px rgba(${theme.rgb},.08)`
                      : 'none',
                    fontFamily: 'inherit',
                    fontSize: 10,
                    fontWeight: 950,
                    letterSpacing: '.16em',
                    textTransform: 'uppercase',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={launching ? 'launching' : 'ready'}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
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
                            transition={{
                              duration: .8,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            style={{ display: 'inline-flex' }}
                          >
                            <Zap size={15} />
                          </motion.span>
                          INITIALIZING ARENA…
                        </>
                      ) : (
                        <>
                          <Zap size={15} />
                          {isStock
                            ? 'Launch War-Room'
                            : isPersonality
                              ? 'Start The Clash'
                              : 'Start Debate'}
                          <ArrowRight size={15} />
                        </>
                      )}
                    </motion.span>
                  </AnimatePresence>

                  {canStart && !launching && (
                    <motion.span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: 80,
                        background:
                          'linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)',
                        filter: 'blur(2px)',
                      }}
                      animate={{ left: ['-25%', '125%'] }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: 'linear',
                        repeatDelay: .7,
                      }}
                    />
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Bottom trust strip */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px 22px',
              marginTop: 18,
              color: 'rgba(255,255,255,.23)',
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '.13em',
              textTransform: 'uppercase',
            }}
          >
            <span>● SSE Streaming</span>
            <span>● Structured Arguments</span>
            <span>● Evidence-Aware</span>
            <span>● Judge Scoring</span>
          </div>
        </motion.section>

        {/* Scroll / footer cue */}
        <motion.div
          variants={itemVariants}
          style={{
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 7,
            color: 'rgba(255,255,255,.22)',
          }}
        >
          <span
            style={{
              fontSize: 8,
              letterSpacing: '.2em',
              fontWeight: 800,
            }}
          >
            ENTER THE ARENA
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={15} />
          </motion.div>
        </motion.div>
      </div>
    </motion.main>
  );
}