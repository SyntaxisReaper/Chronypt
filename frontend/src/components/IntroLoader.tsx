import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroLoaderProps {
  onComplete: () => void;
}

/* ─── Terminal script content ─── */
// Each entry: { text, type, delay (ms before this line starts), speed (ms/char) }
type LineType = 'comment' | 'keyword' | 'code' | 'command' | 'output' | 'success' | 'error' | 'blank';

interface ScriptLine {
  text: string;
  type: LineType;
  delayBefore?: number; // pause before this line appears
  instant?: boolean;    // skip typewriter, appear all at once (for output)
}

const SCRIPT: ScriptLine[] = [
  { text: '// chronypt — deployment engine v2.4.1', type: 'comment', delayBefore: 0 },
  { text: '// Initializing project scaffold...', type: 'comment', delayBefore: 120 },
  { text: '', type: 'blank', delayBefore: 80 },
  { text: "import express from 'express';", type: 'code', delayBefore: 200 },
  { text: "import cors    from 'cors';", type: 'code', delayBefore: 80 },
  { text: "import helmet  from 'helmet';", type: 'code', delayBefore: 80 },
  { text: '', type: 'blank', delayBefore: 60 },
  { text: 'const app  = express();', type: 'code', delayBefore: 140 },
  { text: 'const PORT = process.env.PORT || 8080;', type: 'code', delayBefore: 80 },
  { text: '', type: 'blank', delayBefore: 60 },
  { text: 'app.use(helmet());', type: 'code', delayBefore: 120 },
  { text: "app.use(cors({ origin: process.env.FRONTEND_URL }));", type: 'code', delayBefore: 80 },
  { text: '', type: 'blank', delayBefore: 60 },
  { text: "app.get('/api/status', (_req, res) => {", type: 'code', delayBefore: 140 },
  { text: "  res.json({ status: 'operational', regions: 12 });", type: 'code', delayBefore: 80 },
  { text: '});', type: 'code', delayBefore: 60 },
  { text: '', type: 'blank', delayBefore: 60 },
  { text: 'app.listen(PORT, () => {', type: 'code', delayBefore: 100 },
  { text: "  console.log(`Server running on :${PORT}`);", type: 'code', delayBefore: 80 },
  { text: '});', type: 'code', delayBefore: 60 },
  { text: '', type: 'blank', delayBefore: 300 },

  // Build phase
  { text: '$ docker build -t chronypt/core:latest .', type: 'command', delayBefore: 400 },
  { text: '  → Sending build context to Docker daemon  4.21MB', type: 'output', delayBefore: 320, instant: true },
  { text: '  → Step 1/8 : FROM node:20-alpine', type: 'output', delayBefore: 80, instant: true },
  { text: '  → Step 2/8 : WORKDIR /app', type: 'output', delayBefore: 60, instant: true },
  { text: '  → Step 3/8 : COPY package*.json .', type: 'output', delayBefore: 60, instant: true },
  { text: '  → Step 4/8 : RUN npm ci --omit=dev', type: 'output', delayBefore: 60, instant: true },
  { text: '  → Step 5/8 : COPY . .', type: 'output', delayBefore: 180, instant: true },
  { text: '  → Step 6/8 : EXPOSE 8080', type: 'output', delayBefore: 50, instant: true },
  { text: '  → Step 7/8 : CMD ["node","dist/server.js"]', type: 'output', delayBefore: 50, instant: true },
  { text: '  ✓ Successfully built  a3f91b2cd814', type: 'success', delayBefore: 220, instant: true },
  { text: '', type: 'blank', delayBefore: 80 },

  // Push phase
  { text: '$ docker push chronypt/core:latest', type: 'command', delayBefore: 260 },
  { text: '  → Pushing layer sha256:9c3a…  56.2MB', type: 'output', delayBefore: 200, instant: true },
  { text: '  ✓ Digest: sha256:a3f91b2cd8149e6f…', type: 'success', delayBefore: 280, instant: true },
  { text: '', type: 'blank', delayBefore: 80 },

  // Deploy phase
  { text: '$ kubectl apply -f k8s/ --record', type: 'command', delayBefore: 300 },
  { text: '  → deployment.apps/chronypt     configured', type: 'output', delayBefore: 160, instant: true },
  { text: '  → service/chronypt-lb          configured', type: 'output', delayBefore: 60, instant: true },
  { text: '  → ingress/chronypt-global      configured', type: 'output', delayBefore: 60, instant: true },
  { text: '  → hpa/chronypt-autoscaler      configured', type: 'output', delayBefore: 60, instant: true },
  { text: '', type: 'blank', delayBefore: 180 },

  // Rollout
  { text: '$ kubectl rollout status deployment/chronypt', type: 'command', delayBefore: 200 },
  { text: '  → Waiting for rollout to finish: 0/3 updated...', type: 'output', delayBefore: 220, instant: true },
  { text: '  → Waiting for rollout to finish: 1/3 updated...', type: 'output', delayBefore: 380, instant: true },
  { text: '  → Waiting for rollout to finish: 2/3 updated...', type: 'output', delayBefore: 280, instant: true },
  { text: '  ✓ deployment "chronypt" successfully rolled out', type: 'success', delayBefore: 300, instant: true },
  { text: '', type: 'blank', delayBefore: 100 },

  // Final success
  { text: '  ✓ Replicas  : 3/3 running', type: 'success', delayBefore: 80, instant: true },
  { text: '  ✓ Edge nodes: 24/24 healthy', type: 'success', delayBefore: 80, instant: true },
  { text: '  ✓ Regions   : us-east · eu-west · ap-south · ap-east · [+8 more]', type: 'success', delayBefore: 80, instant: true },
  { text: '', type: 'blank', delayBefore: 120 },
  { text: '  ✓ GLOBAL DEPLOYMENT COMPLETE', type: 'success', delayBefore: 160, instant: true },
];

/* ─── Syntax token colours ─── */
function tokenize(text: string, type: LineType): React.ReactNode {
  if (type === 'blank') return <>&nbsp;</>;

  if (type === 'comment') {
    return <span style={{ color: '#6272a4' }}>{text}</span>;
  }

  if (type === 'command') {
    const [dollar, ...rest] = text.split(' ');
    return (
      <>
        <span style={{ color: '#ff79c6', fontWeight: 700 }}>{dollar}</span>
        <span style={{ color: '#f1fa8c' }}>{' ' + rest.join(' ')}</span>
      </>
    );
  }

  if (type === 'output') {
    return <span style={{ color: '#8be9fd', opacity: 0.85 }}>{text}</span>;
  }

  if (type === 'success') {
    const isGlobal = text.includes('GLOBAL DEPLOYMENT');
    return (
      <span style={{
        color: isGlobal ? '#ffffff' : '#50fa7b',
        fontWeight: isGlobal ? 800 : 500,
        textShadow: isGlobal ? '0 0 18px rgba(80,250,123,0.6)' : undefined,
        fontSize: isGlobal ? '1.05em' : undefined,
        letterSpacing: isGlobal ? '0.08em' : undefined,
      }}>
        {text}
      </span>
    );
  }

  if (type === 'error') {
    return <span style={{ color: '#ff5555' }}>{text}</span>;
  }

  // 'code' — light syntax highlight
  return <CodeLine text={text} />;
}

/* ─── Minimal inline code highlighter ─── */
const KEYWORDS = ['import', 'from', 'const', 'let', 'export', 'default', 'return', 'async', 'await', 'if', 'else'];
function CodeLine({ text }: { text: string }) {
  // Tokenise by spaces to colour keywords, strings, numbers
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Highlight leading whitespace
  const indent = remaining.match(/^(\s+)/)?.[1] || '';
  if (indent) {
    parts.push(<span key={key++}>{indent}</span>);
    remaining = remaining.slice(indent.length);
  }

  // Simple token pass
  const tokenRe = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`|\b(?:import|from|const|let|export|default|return|async|await|if|else)\b|[a-zA-Z_$][\w$]*|[0-9]+|[^a-zA-Z0-9_$"'`\s]+|\s+)/g;
  const matches = remaining.match(tokenRe) || [remaining];

  for (const token of matches) {
    if (/^["'`]/.test(token)) {
      parts.push(<span key={key++} style={{ color: '#f1fa8c' }}>{token}</span>);
    } else if (KEYWORDS.includes(token)) {
      parts.push(<span key={key++} style={{ color: '#ff79c6' }}>{token}</span>);
    } else if (/^\d+$/.test(token)) {
      parts.push(<span key={key++} style={{ color: '#bd93f9' }}>{token}</span>);
    } else if (/^[A-Z]/.test(token)) {
      parts.push(<span key={key++} style={{ color: '#8be9fd' }}>{token}</span>);
    } else {
      parts.push(<span key={key++} style={{ color: '#f8f8f2' }}>{token}</span>);
    }
  }

  return <>{parts}</>;
}

/* ─── Typewriter hook ─── */
function useTypewriter(fullText: string, speedMs: number, active: boolean) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!active) { setDisplayed(''); return; }
    if (fullText === '') { setDisplayed(''); return; }

    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, speedMs);

    return () => clearInterval(interval);
  }, [fullText, speedMs, active]);

  return displayed;
}

/* ─── Single line renderer (handles typewriter or instant) ─── */
function TerminalLine({
  scriptLine,
  lineNumber,
  active,
  done,
  onDone,
}: {
  scriptLine: ScriptLine;
  lineNumber: number;
  active: boolean;
  done: boolean;
  onDone: () => void;
}) {
  const speed = scriptLine.type === 'command' ? 28 : 18;
  const typed = useTypewriter(scriptLine.instant ? '' : scriptLine.text, speed, active && !scriptLine.instant);
  const displayText = scriptLine.instant || done ? scriptLine.text : typed;
  const showCursor = active && !done && !scriptLine.instant;

  useEffect(() => {
    if (!active) return;
    if (scriptLine.instant || scriptLine.text === '') {
      const t = setTimeout(onDone, 40);
      return () => clearTimeout(t);
    }
  }, [active, scriptLine.instant, scriptLine.text, onDone]);

  // When typewriter finishes
  useEffect(() => {
    if (!active || scriptLine.instant || scriptLine.text === '') return;
    if (typed === scriptLine.text) {
      const t = setTimeout(onDone, 60);
      return () => clearTimeout(t);
    }
  }, [typed, scriptLine.text, active, scriptLine.instant, onDone]);

  const isVisible = active || done;
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      style={{
        display: 'flex',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
        fontSize: 'clamp(0.72rem, 1.3vw, 0.88rem)',
        lineHeight: 1.65,
        whiteSpace: 'pre',
      }}
    >
      {/* Line number */}
      <span style={{
        minWidth: '2.8rem',
        color: '#44475a',
        userSelect: 'none',
        textAlign: 'right',
        paddingRight: '1.2rem',
        flexShrink: 0,
      }}>
        {scriptLine.type !== 'blank' ? lineNumber : ''}
      </span>

      {/* Content */}
      <span style={{ flex: 1, overflow: 'hidden' }}>
        {tokenize(displayText, scriptLine.type)}
        {showCursor && (
          <span style={{
            display: 'inline-block',
            width: '0.55em',
            height: '1em',
            background: '#bd93f9',
            verticalAlign: 'text-bottom',
            animation: 'cursor-blink 0.9s step-end infinite',
            marginLeft: '1px',
          }} />
        )}
      </span>
    </motion.div>
  );
}

/* ─── Main IntroLoader component ─── */
export default function IntroLoader({ onComplete }: IntroLoaderProps) {
  const [currentLine, setCurrentLine] = useState(-1); // -1 = terminal not yet shown
  const [doneLines, setDoneLines] = useState<Set<number>>(new Set());
  const [exiting, setExiting] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [particleBurst, setParticleBurst] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineQueueRef = useRef<number>(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
    return t;
  }, []);

  // Scroll to bottom as lines appear
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [currentLine, doneLines.size]);

  // Kick off sequence
  useEffect(() => {
    // Show skip after 1 second
    const skipT = setTimeout(() => setShowSkip(true), 1000);

    // Slide terminal in
    const termT = setTimeout(() => {
      setTerminalVisible(true);
      // Start first line after terminal animates in
      setTimeout(() => startLine(0), 700);
    }, 200);

    return () => {
      clearTimeout(skipT);
      clearTimeout(termT);
      clearAllTimeouts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startLine(idx: number) {
    if (idx >= SCRIPT.length) {
      // All lines done → trigger exit
      scheduleTimeout(triggerExit, 900);
      return;
    }
    lineQueueRef.current = idx;
    const delayBefore = SCRIPT[idx].delayBefore ?? 0;
    scheduleTimeout(() => setCurrentLine(idx), delayBefore);
  }

  function handleLineDone(idx: number) {
    setDoneLines((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    startLine(idx + 1);
  }

  function triggerExit() {
    setParticleBurst(true);
    scheduleTimeout(() => {
      setExiting(true);
      scheduleTimeout(onComplete, 900);
    }, 400);
  }

  function handleSkip() {
    clearAllTimeouts();
    setExiting(true);
    setTimeout(onComplete, 700);
  }

  // Count code lines for line numbers (skip blank/output)
  let codeLineCounter = 0;
  const lineNumbers = SCRIPT.map((l) => {
    if (l.type === 'blank' || l.type === 'output' || l.type === 'success' || l.type === 'error') return null;
    codeLineCounter++;
    return codeLineCounter;
  });

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#020204',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Ambient purple glow behind terminal */}
          <div style={{
            position: 'absolute',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(147,45,194,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          {/* Particle burst overlay */}
          {particleBurst && <ParticleBurst />}

          {/* Terminal window */}
          <AnimatePresence>
            {terminalVisible && (
              <motion.div
                key="terminal"
                initial={{ opacity: 0, y: 60, scale: 0.96 }}
                animate={{
                  opacity: exiting ? 0 : 1,
                  y: exiting ? -40 : 0,
                  scale: exiting ? 1.04 : 1,
                }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: 'min(860px, 96vw)',
                  maxHeight: '80vh',
                  background: 'rgba(12, 10, 22, 0.92)',
                  border: '1px solid rgba(147, 45, 194, 0.25)',
                  borderRadius: '14px',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(147,45,194,0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Chrome bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.2rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  flexShrink: 0,
                }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'block', boxShadow: '0 0 6px rgba(255,95,87,0.5)' }} />
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e', display: 'block', boxShadow: '0 0 6px rgba(255,189,46,0.5)' }} />
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c940', display: 'block', boxShadow: '0 0 6px rgba(40,201,64,0.5)' }} />
                  <span style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    color: '#666',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.04em',
                  }}>
                    chronypt — deploy.sh
                  </span>
                </div>

                {/* Code area */}
                <div
                  ref={scrollRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.2rem 1.2rem 1.2rem 0.4rem',
                    scrollbarWidth: 'none',
                  }}
                >
                  {SCRIPT.map((line, idx) => (
                    <TerminalLine
                      key={idx}
                      scriptLine={line}
                      lineNumber={lineNumbers[idx] ?? 0}
                      active={currentLine === idx}
                      done={doneLines.has(idx)}
                      onDone={() => handleLineDone(idx)}
                    />
                  ))}
                </div>

                {/* Bottom status bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.45rem 1.2rem',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(147,45,194,0.08)',
                  fontSize: '0.72rem',
                  color: '#555',
                  fontFamily: "'JetBrains Mono', monospace",
                  flexShrink: 0,
                }}>
                  <span style={{ color: '#932DC2' }}>chronypt</span>
                  <span>deploy.sh</span>
                  <span>UTF-8</span>
                  <span>bash</span>
                  <span style={{ color: doneLines.size === SCRIPT.length ? '#50fa7b' : '#8be9fd' }}>
                    {doneLines.size === SCRIPT.length ? '● deployed' : '● running'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button */}
          <AnimatePresence>
            {showSkip && !exiting && (
              <motion.button
                key="skip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleSkip}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#666',
                  padding: '6px 18px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.05em',
                  transition: 'all 0.25s ease',
                  zIndex: 10,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(147,45,194,0.5)';
                  e.currentTarget.style.background = 'rgba(147,45,194,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#666';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                Skip ↩
              </motion.button>
            )}
          </AnimatePresence>

          {/* Keyframes */}
          <style>{`
            @keyframes cursor-blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Particle burst on completion ─── */
function ParticleBurst() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    angle: (i / 40) * 360,
    distance: 120 + Math.random() * 200,
    size: 2 + Math.random() * 4,
    color: i % 3 === 0 ? '#932DC2' : i % 3 === 1 ? '#3bb4d2' : '#50fa7b',
    duration: 0.6 + Math.random() * 0.5,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
            transition={{ duration: p.duration, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        );
      })}
    </div>
  );
}
