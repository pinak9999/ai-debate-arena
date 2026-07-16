import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  /** Milliseconds per character. Lower = faster. Default: 18 */
  speed?: number;
  /** Delay in ms before starting. Default: 0 */
  startDelay?: number;
}

interface UseTypewriterReturn {
  displayText: string;
  isComplete: boolean;
  reset: () => void;
}

/**
 * useTypewriter — progressively reveals a static string character by character.
 *
 * For live SSE-streamed text, simply pass the growing `streamingText` directly
 * to the component and skip this hook — SSE already provides the typewriter effect
 * naturally as chunks arrive from the LLM.
 *
 * This hook is best suited for:
 *  - Replaying completed messages on first render (e.g. historical rounds)
 *  - Fallback animation when no streaming backend is available
 */
export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const { speed = 18, startDelay = 0 } = options;

  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const reset = () => {
    clearTimers();
    setDisplayText('');
    setIsComplete(false);
    indexRef.current = 0;
  };

  useEffect(() => {
    clearTimers();
    setDisplayText('');
    setIsComplete(false);
    indexRef.current = 0;

    if (!text) {
      setIsComplete(true);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        indexRef.current += 1;
        setDisplayText(text.slice(0, indexRef.current));

        if (indexRef.current >= text.length) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsComplete(true);
        }
      }, speed);
    }, startDelay);

    return clearTimers;
  }, [text, speed, startDelay]);

  return { displayText, isComplete, reset };
}
