'use client';

import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  Brain,
  ChevronRight,
  Flame,
  Gauge,
  LineChart,
  MessageSquareQuote,
  Radio,
  ShieldCheck,
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

const TOPICS = [
  'AI will replace human creativity',
  'Universal Basic Income is net positive',
  'Social media does more harm than good',
  'Nuclear energy can solve climate change',
];

const STOCKS = ['SUZLON.NS', 'TATAMOTORS.NS', 'RELIANCE.NS', 'INFY.NS'];

const PERSONALITY = [
  'Should AI make life-or-death decisions?',
  'Is capitalism the best system for humanity?',
  'Should social media be banned for under-18s?',
  'Is space exploration worth the cost?',
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function HeroSection({ onStart }: HeroSectionProps) {
  const [subject, setSubject] = useState<'topic' | 'stock' | 'personality'>('topic');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);
  const [launching, setLaunching] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const config = useMemo(() => {
    if (subject === 'stock') {
      return {
        accent: '#34f5a4',
        accent2: '#16c79a',
        glow: '52,245,164',
        label: 'MARKET WAR-ROOM',
        kicker: 'Analyze • Challenge • Decide',
        icon: TrendingUp,
        action: 'Launch War-Room',
        placeholder: 'Enter NSE ticker — e.g. RELIANCE.NS',
        examples: STOCKS,
      };
    }
    if (subject === 'personality') {
      return {
        accent: '#ffbd66',
        accent2: '#ff4d88',
        glow: '255,189,102',
        label: 'PERSONALITY CLASH',
        kicker: 'Perspective • Conflict • Verdict',
        icon: Flame,
        action: 'Start The Clash',
        placeholder: 'Give both AI personalities something to fight about…',
        examples: PERSONALITY,
      };
    }
    return {
      accent: '#55dcff',
      accent2: '#9a6cff',
      glow: '85,220,255',
      label: 'TOPIC DEBATE',
      kicker: 'Evidence • Rebuttal • Judge',
      icon: Target,
      action: 'Start Debate',
      placeholder: 'What should the two AI agents debate?',
      examples: TOPICS,
    };
  }, [subject]);

  const canStart = topic.trim().length > 0 && !launching;
  const Icon = config.icon;

  const start = () => {
    if (!canStart) return;
    setLaunching(true);
    setTimeout(() => onStart(topic.trim(), rounds, subject), 450);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      start();
    }
  };

  return (
    <section
      style={{
        width: '100%',
        maxWidth: 1180,
        margin: '0 auto',
        padding: '18px clamp(14px, 3vw, 34px) 28px',
        boxSizing: 'border-box',
      }}
    >
      {/* Compact product hero — deliberately no giant title / no unnecessary vertical space */}
      <div
        style={{
          position: 'relative',
          minHeight: 'calc(100dvh - 150px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.08fr) minmax(300px, .72fr)',
          gap: 18,
          alignItems: 'stretch',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-15% -10%',
            background:
              `radial-gradient(circle at 28% 40%, rgba(${config.glow},.15), transparent 32%), radial-gradient(circle at 78% 72%, rgba(154,108,255,.12), transparent 28%)`,
            filter: 'blur(28px)',
            pointerEvents: 'none',
          }}
        />

        {/* LEFT: identity + debate creation */}
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: .65, ease }}
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 28,
            padding: 'clamp(20px, 3vw, 34px)',
            background:
              'linear-gradient(145deg, rgba(15,23,42,.88), rgba(5,9,20,.82))',
            border: '1px solid rgba(255,255,255,.09)',
            boxShadow:
              '0 30px 100px rgba(0,0,0,.45), inset 0 1px rgba(255,255,255,.055)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '8%',
              right: '8%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${config.accent}, #9a6cff, transparent)`,
              boxShadow: `0 0 22px rgba(${config.glow},.45)`,
            }}
          />

          {/* Brand row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  display: 'grid',
                  placeItems: 'center',
                  background: `linear-gradient(135deg, rgba(${config.glow},.20), rgba(154,108,255,.18))`,
                  border: `1px solid rgba(${config.glow},.28)`,
                  boxShadow: `0 0 32px rgba(${config.glow},.12)`,
                }}
              >
                <Swords size={20} style={{ color: config.accent }} />
              </motion.div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.22em', color: config.accent }}>
                  AI DEBATE
                </div>
                <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: '-.04em' }}>
                  ARENA
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,.035)',
                border: '1px solid rgba(255,255,255,.07)',
                color: 'rgba(255,255,255,.38)',
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: '.12em',
              }}
            >
              <motion.span
                animate={{ opacity: [.3, 1, .3] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#54dcff',
                  boxShadow: '0 0 12px #54dcff',
                }}
              />
              SYSTEM ONLINE
            </div>
          </div>

          <div style={{ marginTop: 'clamp(28px, 5vh, 58px)', maxWidth: 650 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                color: config.accent,
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={13} />
              THINK • CLASH • DECIDE
            </div>

            <h1
              style={{
                margin: '12px 0 0',
                fontSize: 'clamp(38px, 5.2vw, 72px)',
                lineHeight: .95,
                letterSpacing: '-.065em',
                fontWeight: 950,
              }}
            >
              Put two AIs.
              <br />
              <span
                style={{
                  background: `linear-gradient(105deg, #fff 0%, ${config.accent} 46%, ${config.accent2} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Let them fight.
              </span>
            </h1>

            <p
              style={{
                margin: '16px 0 0',
                maxWidth: 560,
                color: 'rgba(255,255,255,.43)',
                fontSize: 'clamp(12px, 1.4vw, 14px)',
                lineHeight: 1.7,
              }}
            >
              Real-time AI arguments, structured rebuttals, evidence checks and a final
              judge — all inside one focused debate session.
            </p>
          </div>

          {/* Mode selector */}
          <div style={{ marginTop: 'clamp(24px, 4vh, 40px)' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 7,
                padding: 5,
                borderRadius: 16,
                background: 'rgba(255,255,255,.035)',
                border: '1px solid rgba(255,255,255,.065)',
              }}
            >
              {[
                ['topic', 'Topic', Target],
                ['stock', 'Market', LineChart],
                ['personality', 'Clash', Flame],
              ].map(([key, label, ModeIcon]) => {
                const active = subject === key;
                const MI = ModeIcon as typeof Target;
                return (
                  <button
                    key={key as string}
                    type="button"
                    onClick={() => {
                      setSubject(key as 'topic' | 'stock' | 'personality');
                      setTopic('');
                    }}
                    style={{
                      flex: '1 1 130px',
                      border: active ? `1px solid rgba(${config.glow},.32)` : '1px solid transparent',
                      borderRadius: 12,
                      minHeight: 42,
                      background: active ? `rgba(${config.glow},.10)` : 'transparent',
                      color: active ? config.accent : 'rgba(255,255,255,.34)',
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      transition: 'all .2s ease',
                    }}
                  >
                    <MI size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input */}
          <div
            style={{
              marginTop: 12,
              borderRadius: 19,
              background: 'rgba(0,0,0,.18)',
              border: `1px solid ${topic ? `rgba(${config.glow},.34)` : 'rgba(255,255,255,.075)'}`,
              boxShadow: topic ? `0 0 0 3px rgba(${config.glow},.035)` : 'none',
              transition: 'all .25s ease',
            }}
          >
            <textarea
              ref={inputRef}
              value={topic}
              onChange={(e) => setTopic(subject === 'stock' ? e.target.value.toUpperCase() : e.target.value)}
              onKeyDown={onKeyDown}
              rows={3}
              placeholder={config.placeholder}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: 0,
                outline: 0,
                resize: 'none',
                background: 'transparent',
                color: '#fff',
                padding: '16px 17px 6px',
                fontFamily: 'inherit',
                fontSize: 14,
                lineHeight: 1.55,
                caretColor: config.accent,
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 16px 11px',
                color: 'rgba(255,255,255,.2)',
                fontSize: 8,
              }}
            >
              <span>Ctrl / ⌘ + Enter to launch</span>
              <span>{topic.length}/500</span>
            </div>
          </div>

          {/* Suggestions */}
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                marginBottom: 7,
                color: 'rgba(255,255,255,.25)',
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
              }}
            >
              <MessageSquareQuote size={12} />
              Quick launch
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {config.examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setTopic(example);
                    inputRef.current?.focus();
                  }}
                  style={{
                    border: '1px solid rgba(255,255,255,.07)',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,.025)',
                    color: 'rgba(255,255,255,.38)',
                    padding: '7px 9px',
                    fontSize: 8,
                    cursor: 'pointer',
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 'auto', paddingTop: 18 }}>
            <motion.button
              id="start-debate-btn"
              type="button"
              disabled={!canStart}
              onClick={start}
              whileHover={canStart ? { y: -2 } : {}}
              whileTap={canStart ? { scale: .985 } : {}}
              style={{
                width: '100%',
                minHeight: 54,
                border: 0,
                borderRadius: 15,
                cursor: canStart ? 'pointer' : 'not-allowed',
                background: canStart
                  ? `linear-gradient(105deg, ${config.accent}, ${config.accent2})`
                  : 'rgba(255,255,255,.045)',
                color: canStart ? '#061018' : 'rgba(255,255,255,.2)',
                fontFamily: 'inherit',
                fontSize: 10,
                fontWeight: 950,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                boxShadow: canStart
                  ? `0 12px 38px rgba(${config.glow},.18)`
                  : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={launching ? 'loading' : 'ready'}
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -7 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
                >
                  {launching ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: .75, repeat: Infinity, ease: 'linear' }}
                      >
                        <Radio size={15} />
                      </motion.span>
                      CONNECTING AI AGENTS…
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      {config.action}
                      <ArrowUpRight size={15} />
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {/* RIGHT: live battle preview */}
        <motion.aside
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: .65, delay: .08, ease }}
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 28,
            padding: 'clamp(18px, 3vw, 26px)',
            background:
              'linear-gradient(160deg, rgba(17,24,43,.84), rgba(6,9,20,.9))',
            border: '1px solid rgba(255,255,255,.08)',
            boxShadow: '0 30px 100px rgba(0,0,0,.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'rgba(255,255,255,.35)',
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
            }}
          >
            <span>LIVE BATTLE PREVIEW</span>
            <span style={{ color: config.accent }}>● READY</span>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: '12px 13px',
              borderRadius: 15,
              background: `linear-gradient(135deg, rgba(${config.glow},.09), rgba(154,108,255,.08))`,
              border: `1px solid rgba(${config.glow},.13)`,
            }}
          >
            <div style={{ color: config.accent, fontSize: 8, fontWeight: 900, letterSpacing: '.14em' }}>
              {config.label}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800 }}>
              {config.kicker}
            </div>
          </div>

          {/* Agents */}
          <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
            {[
              { name: 'NOVA', role: 'ADVOCATE', icon: Brain, side: config.accent },
              { name: 'ORBIT', role: 'CHALLENGER', icon: Swords, side: '#b58cff' },
            ].map(({ name, role, icon: AgentIcon, side }, index) => (
              <motion.div
                key={name}
                animate={{ y: [0, index ? -2 : 2, 0] }}
                transition={{ duration: 3.5 + index, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  padding: 13,
                  borderRadius: 17,
                  background: 'rgba(255,255,255,.028)',
                  border: `1px solid ${index === 0 ? `rgba(${config.glow},.16)` : 'rgba(181,140,255,.15)'}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: side,
                    boxShadow: `0 0 15px ${side}`,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      background: `rgba(255,255,255,.05)`,
                    }}
                  >
                    <AgentIcon size={15} style={{ color: side }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 950 }}>{name}</div>
                    <div style={{ marginTop: 2, fontSize: 7, color: 'rgba(255,255,255,.28)', letterSpacing: '.13em' }}>
                      {role}
                    </div>
                  </div>
                  <span style={{ color: side, fontSize: 8, fontWeight: 900 }}>ONLINE</span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    height: 4,
                    borderRadius: 99,
                    background: 'rgba(255,255,255,.045)',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    animate={{ width: ['28%', '72%', '44%', '65%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${side}, transparent)`, borderRadius: 99 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* VS divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '13px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.1))' }} />
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(255,255,255,.045)',
                border: '1px solid rgba(255,255,255,.07)',
                color: 'rgba(255,255,255,.45)',
                fontSize: 8,
                fontWeight: 950,
              }}
            >
              VS
            </div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,.1), transparent)' }} />
          </div>

          {/* Configuration */}
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                padding: 13,
                borderRadius: 17,
                background: 'rgba(0,0,0,.18)',
                border: '1px solid rgba(255,255,255,.055)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900 }}>Debate depth</div>
                  <div style={{ marginTop: 3, color: 'rgba(255,255,255,.25)', fontSize: 8 }}>
                    Structured rounds + final judge
                  </div>
                </div>
                <Gauge size={17} style={{ color: config.accent }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 11 }}>
                {[3, 5, 7].map((r) => {
                  const active = rounds === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRounds(r)}
                      style={{
                        minHeight: 42,
                        borderRadius: 11,
                        border: active ? `1px solid rgba(${config.glow},.34)` : '1px solid rgba(255,255,255,.06)',
                        background: active ? `rgba(${config.glow},.10)` : 'rgba(255,255,255,.025)',
                        color: active ? config.accent : 'rgba(255,255,255,.32)',
                        fontSize: 10,
                        fontWeight: 950,
                        cursor: 'pointer',
                      }}
                    >
                      {r}
                      <span style={{ display: 'block', fontSize: 6, opacity: .55, letterSpacing: '.12em' }}>
                        ROUNDS
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 6,
                marginTop: 8,
              }}
            >
              {[
                [Brain, '2 AGENTS'],
                [ShieldCheck, 'EVIDENCE'],
                [Trophy, 'JUDGE'],
              ].map(([StatusIcon, label]) => {
                const SI = StatusIcon as typeof Brain;
                return (
                  <div
                    key={label as string}
                    style={{
                      padding: '9px 5px',
                      textAlign: 'center',
                      borderRadius: 11,
                      background: 'rgba(255,255,255,.022)',
                      border: '1px solid rgba(255,255,255,.05)',
                    }}
                  >
                    <SI size={12} style={{ color: config.accent }} />
                    <div style={{ marginTop: 4, fontSize: 6.5, color: 'rgba(255,255,255,.3)', fontWeight: 900, letterSpacing: '.08em' }}>
                      {label as string}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.aside>
      </div>

      <style>{`
        textarea::placeholder { color: rgba(255,255,255,.19); }
        button { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 820px) {
          section > div {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
          }
          section > div > aside {
            min-height: 390px;
          }
        }
        @media (max-width: 520px) {
          section { padding-top: 10px !important; }
          section h1 { font-size: 39px !important; }
          section > div > div,
          section > div > aside { border-radius: 21px !important; }
        }
      `}</style>
    </section>
  );
}