// Timed typing mode hook

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameStats, TimeDuration } from '../types';
import { generateRandomWords } from '../supabase';

interface UseTimedModeProps {
  duration: TimeDuration;
  withPunctuation: boolean;
  enabled: boolean;
  onComplete?: (stats: GameStats) => void;
}

interface UseTimedModeReturn {
  text: string;
  currentIndex: number;
  errors: Set<number>;
  stats: GameStats;
  pressedKey: string | null;
  lastKeyCorrect: boolean | null;
  timeRemaining: number;
  isActive: boolean;
  reset: () => void;
}

const MIN_WORDS = 50; // Ensure at least 3 rows of words
const WORDS_PER_ROW = 12;

export function useTimedMode({ duration, withPunctuation, enabled, onComplete }: UseTimedModeProps): UseTimedModeReturn {
  const [text, setText] = useState(() => generateRandomWords(MIN_WORDS, withPunctuation));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(duration);
  const [isActive, setIsActive] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [lastKeyCorrect, setLastKeyCorrect] = useState<boolean | null>(null);

  // Refs for stale closures
  const currentIndexRef = useRef(currentIndex);
  const textRef = useRef(text);
  const enabledRef = useRef(enabled);
  const isActiveRef = useRef(isActive);
  const startTimeRef = useRef(startTime);
  const timeRemainingRef = useRef<number>(timeRemaining);
  const onCompleteRef = useRef(onComplete);
  const correctCharsRef = useRef(0);
  const totalCharsTypedRef = useRef(0);
  const durationRef = useRef(duration);
  const withPunctuationRef = useRef(withPunctuation);

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    textRef.current = text;
  }, [text]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);
  useEffect(() => {
    withPunctuationRef.current = withPunctuation;
  }, [withPunctuation]);

  const calculateStats = useCallback((): GameStats => {
    const timeElapsed = startTimeRef.current ? Math.min(Date.now() - startTimeRef.current, durationRef.current * 1000) : 0;
    const minutes = timeElapsed / 1000 / 60;
    const wordsTyped = currentIndexRef.current / 5;
    const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
    const accuracy = totalCharsTypedRef.current > 0 ? (correctCharsRef.current / totalCharsTypedRef.current) * 100 : 100;

    return {
      wpm,
      accuracy,
      correctChars: correctCharsRef.current,
      incorrectChars: totalCharsTypedRef.current - correctCharsRef.current,
      totalChars: currentIndexRef.current,
      timeElapsed,
    };
  }, []);

  const reset = useCallback(() => {
    const newText = generateRandomWords(MIN_WORDS, withPunctuationRef.current);
    setText(newText);
    textRef.current = newText;
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setErrors(new Set());
    setStartTime(null);
    startTimeRef.current = null;
    setTimeRemaining(durationRef.current);
    timeRemainingRef.current = durationRef.current;
    setIsActive(false);
    isActiveRef.current = false;
    setPressedKey(null);
    setLastKeyCorrect(null);
    correctCharsRef.current = 0;
    totalCharsTypedRef.current = 0;
  }, []);

  // Handle key press
  const handleKeyPress = useCallback((key: string) => {
    if (!enabledRef.current || timeRemainingRef.current <= 0) return;

    // Start timer on first keypress
    if (!isActiveRef.current) {
      const now = Date.now();
      setStartTime(now);
      startTimeRef.current = now;
      setIsActive(true);
      isActiveRef.current = true;
    }

    setPressedKey(key);
    totalCharsTypedRef.current++;

    const idx = currentIndexRef.current;
    const txt = textRef.current;
    const expectedChar = txt[idx];
    const isCorrect = key === expectedChar;

    setLastKeyCorrect(isCorrect);

    if (isCorrect) {
      correctCharsRef.current++;
      const newIndex = idx + 1;
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;

      // Add more words if running low
      if (newIndex > txt.length - 100) {
        const moreWords = generateRandomWords(WORDS_PER_ROW * 3, withPunctuationRef.current);
        const newText = txt + ' ' + moreWords;
        setText(newText);
        textRef.current = newText;
      }
    } else {
      setErrors((prev) => new Set(prev).add(idx));
    }

    setTimeout(() => {
      setPressedKey(null);
      setLastKeyCorrect(null);
    }, 100);
  }, []);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (!enabledRef.current || !isActiveRef.current || currentIndexRef.current === 0) return;

    const newIndex = currentIndexRef.current - 1;
    setCurrentIndex(newIndex);
    currentIndexRef.current = newIndex;

    setErrors((prev) => {
      const next = new Set(prev);
      next.delete(newIndex); // Remove error at the new (previous) index
      return next;
    });

    if (totalCharsTypedRef.current > 0) {
      totalCharsTypedRef.current--;
    }

    setPressedKey(null);
    setLastKeyCorrect(null);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isActive || !enabled) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        timeRemainingRef.current = newTime;

        if (newTime <= 0) {
          setIsActive(false);
          isActiveRef.current = false;
          const finalStats = calculateStats();
          onCompleteRef.current?.(finalStats);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, enabled, calculateStats]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current || !isActiveRef.current || timeRemainingRef.current <= 0) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (e.key.length === 1 || e.key === ' ') {
        e.preventDefault();
        handleKeyPress(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleBackspace]);

  // Reset when duration or punctuation changes
  useEffect(() => {
    reset();
  }, [duration, withPunctuation, reset]);

  return {
    text,
    currentIndex,
    errors,
    stats: calculateStats(),
    pressedKey,
    lastKeyCorrect,
    timeRemaining,
    isActive,
    reset,
  };
}
