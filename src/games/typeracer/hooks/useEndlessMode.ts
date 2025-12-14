// Endless typing mode hook for TypeRacer

import { useState, useCallback, useEffect, useRef } from 'react';
import { generate } from 'random-words';
import type { GameStats } from '../types';

interface UseEndlessModeOptions {
  enabled: boolean;
  withPunctuation?: boolean;
  onProgress?: (wpm: number, accuracy: number) => void;
}

interface EndlessModeState {
  text: string;
  currentIndex: number;
  errors: Set<number>;
  stats: GameStats;
  pressedKey: string | null;
  lastKeyCorrect: boolean | null;
  isActive: boolean;
  scrollOffset: number;
  reset: () => void;
  stop: () => void;
}

const WORDS_PER_BATCH = 50;
const SCROLL_THRESHOLD_CHARS = 100; // Scroll after typing this many chars

export function useEndlessMode({ enabled, withPunctuation = false, onProgress }: UseEndlessModeOptions): EndlessModeState {
  const [text, setText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState<Set<number>>(new Set());
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [lastKeyCorrect, setLastKeyCorrect] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const correctCharsRef = useRef(0);
  const incorrectCharsRef = useRef(0);

  const [stats, setStats] = useState<GameStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
    timeElapsed: 0,
  });

  // Generate text with optional punctuation
  const generateText = useCallback(() => {
    let words = generate({ exactly: WORDS_PER_BATCH, join: ' ' }) as string;
    if (withPunctuation) {
      const wordArray = words.split(' ');
      words = wordArray
        .map((word, i) => {
          const rand = Math.random();
          if (rand < 0.1 && i < wordArray.length - 1) {
            return word + ',';
          } else if (rand < 0.15 && i < wordArray.length - 1) {
            return word + '.';
          }
          return word;
        })
        .join(' ');
    }
    return words;
  }, [withPunctuation]);

  // Initialize text
  useEffect(() => {
    if (enabled && !text) {
      setText(generateText());
    }
  }, [enabled, text, generateText]);

  // Add more text when approaching the end
  useEffect(() => {
    if (enabled && text && currentIndex > text.length - 100) {
      setText((prev) => prev + ' ' + generateText());
    }
  }, [enabled, text, currentIndex, generateText]);

  // Calculate scroll offset when typing progresses
  useEffect(() => {
    if (currentIndex > SCROLL_THRESHOLD_CHARS) {
      // Find a good word boundary to scroll to
      const scrollToIndex = currentIndex - SCROLL_THRESHOLD_CHARS;
      // Find the start of the word after scrollToIndex
      let boundary = scrollToIndex;
      while (boundary < text.length && text[boundary] !== ' ') {
        boundary++;
      }
      if (boundary < text.length) {
        setScrollOffset(boundary + 1);
      }
    }
  }, [currentIndex, text]);

  // Update stats
  const updateStats = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const totalChars = correctCharsRef.current + incorrectCharsRef.current;
    const accuracy = totalChars > 0 ? (correctCharsRef.current / totalChars) * 100 : 100;

    // WPM = (characters / 5) / minutes
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round(correctCharsRef.current / 5 / minutes) : 0;

    const newStats: GameStats = {
      wpm,
      accuracy,
      correctChars: correctCharsRef.current,
      incorrectChars: incorrectCharsRef.current,
      totalChars,
      timeElapsed: elapsed,
    };

    setStats(newStats);
    onProgress?.(wpm, accuracy);
  }, [onProgress]);

  // Handle keydown
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Handle backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentIndex > scrollOffset) {
          const newIndex = currentIndex - 1;
          setCurrentIndex(newIndex);
          setErrors((prev) => {
            const next = new Set(prev);
            next.delete(newIndex);
            return next;
          });
        }
        return;
      }

      // Ignore non-character keys
      if (e.key.length !== 1) return;

      e.preventDefault();

      // Start timer on first keypress
      if (!isActive) {
        setIsActive(true);
        startTimeRef.current = Date.now();
      }

      const expectedChar = text[currentIndex];
      const isCorrect = e.key === expectedChar;

      setPressedKey(e.key);
      setLastKeyCorrect(isCorrect);

      if (isCorrect) {
        correctCharsRef.current++;
        setCurrentIndex((i) => i + 1);
      } else {
        incorrectCharsRef.current++;
        setErrors((prev) => new Set(prev).add(currentIndex));
        setCurrentIndex((i) => i + 1);
      }

      updateStats();

      // Clear pressed key after short delay
      setTimeout(() => {
        setPressedKey(null);
        setLastKeyCorrect(null);
      }, 100);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isActive, text, currentIndex, scrollOffset, updateStats]);

  // Reset function
  const reset = useCallback(() => {
    setText(generateText());
    setCurrentIndex(0);
    setErrors(new Set());
    setScrollOffset(0);
    setPressedKey(null);
    setLastKeyCorrect(null);
    setIsActive(false);
    startTimeRef.current = null;
    correctCharsRef.current = 0;
    incorrectCharsRef.current = 0;
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
      timeElapsed: 0,
    });
  }, [generateText]);

  // Stop function
  const stop = useCallback(() => {
    setIsActive(false);
    updateStats();
  }, [updateStats]);

  return {
    text,
    currentIndex,
    errors,
    stats,
    pressedKey,
    lastKeyCorrect,
    isActive,
    scrollOffset,
    reset,
    stop,
  };
}
