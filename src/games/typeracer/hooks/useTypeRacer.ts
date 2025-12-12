// TypeRacer game logic hook

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameStats } from '../types';
import { getRandomText } from '../supabase';

interface UseTypeRacerProps {
  text: string;
  onProgress?: (progress: number, wpm: number, accuracy: number) => void;
  onComplete?: (stats: GameStats) => void;
  enabled?: boolean;
}

interface UseTypeRacerReturn {
  currentIndex: number;
  errors: Set<number>;
  isComplete: boolean;
  stats: GameStats;
  pressedKey: string | null;
  lastKeyCorrect: boolean | null;
  progress: number;
  reset: (newText?: string) => void;
  handleKeyPress: (key: string) => void;
}

export function useTypeRacer({ text, onProgress, onComplete, enabled = true }: UseTypeRacerProps): UseTypeRacerReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [lastKeyCorrect, setLastKeyCorrect] = useState<boolean | null>(null);
  const [currentText, setCurrentText] = useState(text);

  // Use refs to avoid stale closures in event handlers
  const currentIndexRef = useRef(currentIndex);
  const currentTextRef = useRef(currentText);
  const startTimeRef = useRef(startTime);
  const isCompleteRef = useRef(isComplete);
  const enabledRef = useRef(enabled);
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const correctCharsRef = useRef(0);
  const totalCharsTypedRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    currentTextRef.current = currentText;
  }, [currentText]);
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);
  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const progress = currentText.length > 0 ? (currentIndex / currentText.length) * 100 : 0;

  const calculateStats = useCallback((): GameStats => {
    const timeElapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    const minutes = timeElapsed / 1000 / 60;
    const wordsTyped = currentIndexRef.current / 5; // Standard: 5 chars = 1 word
    const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
    const accuracy = totalCharsTypedRef.current > 0 ? (correctCharsRef.current / totalCharsTypedRef.current) * 100 : 100;

    return {
      wpm,
      accuracy,
      correctChars: correctCharsRef.current,
      incorrectChars: totalCharsTypedRef.current - correctCharsRef.current,
      totalChars: currentTextRef.current.length,
      timeElapsed,
    };
  }, []);

  const reset = useCallback((newText?: string) => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setErrors(new Set());
    setIsComplete(false);
    isCompleteRef.current = false;
    setStartTime(null);
    startTimeRef.current = null;
    setPressedKey(null);
    setLastKeyCorrect(null);
    correctCharsRef.current = 0;
    totalCharsTypedRef.current = 0;
    if (newText) {
      setCurrentText(newText);
      currentTextRef.current = newText;
    }
  }, []);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (!enabledRef.current || isCompleteRef.current) return;

      // Start timer on first keypress
      if (startTimeRef.current === null) {
        const now = Date.now();
        setStartTime(now);
        startTimeRef.current = now;
      }

      setPressedKey(key);
      totalCharsTypedRef.current++;

      const idx = currentIndexRef.current;
      const txt = currentTextRef.current;
      const expectedChar = txt[idx];
      const isCorrect = key === expectedChar;

      setLastKeyCorrect(isCorrect);

      if (isCorrect) {
        correctCharsRef.current++;
        const newIndex = idx + 1;
        setCurrentIndex(newIndex);
        currentIndexRef.current = newIndex;

        // Calculate current stats for progress callback
        const timeElapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        const minutes = timeElapsed / 1000 / 60;
        const wordsTyped = newIndex / 5;
        const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
        const accuracy = totalCharsTypedRef.current > 0 ? (correctCharsRef.current / totalCharsTypedRef.current) * 100 : 100;
        const newProgress = (newIndex / txt.length) * 100;

        onProgressRef.current?.(newProgress, wpm, accuracy);

        // Check if complete
        if (newIndex >= txt.length) {
          setIsComplete(true);
          isCompleteRef.current = true;
          const finalStats = calculateStats();
          onCompleteRef.current?.(finalStats);
        }
      } else {
        setErrors((prev) => new Set(prev).add(idx));
      }

      // Clear pressed key visual after a short delay
      setTimeout(() => {
        setPressedKey(null);
        setLastKeyCorrect(null);
      }, 100);
    },
    [calculateStats],
  );

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;

      // Prevent default for keys we handle
      if (e.key.length === 1 || e.key === ' ') {
        e.preventDefault();
        handleKeyPress(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  // Update text when prop changes
  useEffect(() => {
    setCurrentText(text);
    currentTextRef.current = text;
  }, [text]);

  return {
    currentIndex,
    errors,
    isComplete,
    stats: calculateStats(),
    pressedKey,
    lastKeyCorrect,
    progress,
    reset,
    handleKeyPress,
  };
}

export function useRandomText(): [string, () => void] {
  const [text, setText] = useState(() => getRandomText());

  const refreshText = useCallback(() => {
    setText(getRandomText());
  }, []);

  return [text, refreshText];
}
