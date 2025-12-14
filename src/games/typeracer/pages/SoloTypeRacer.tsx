// Solo TypeRacer Page

import { useState, useCallback, useMemo } from 'react';
import { SoloRacingScreen } from '../components';
import { useTypeRacer, useRandomText, useTimedMode, useEndlessMode } from '../hooks';
import type { GameStats, Player, SoloModeType, TimeDuration } from '../types';

export function SoloTypeRacer() {
  // Game state
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [isPlaying] = useState(true);

  // Solo mode settings
  const [soloModeType, setSoloModeType] = useState<SoloModeType>('text');
  const [timedDuration, setTimedDuration] = useState<TimeDuration>(30);
  const [withPunctuation] = useState(false);

  // Get random text for solo text mode
  const [soloText, refreshSoloText] = useRandomText(withPunctuation);

  // Generate a player ID
  const playerId = useMemo(() => `solo_${Date.now()}`, []);
  const playerName = 'You';

  // Solo timed mode detection
  const isSoloTimed = isPlaying && soloModeType === 'timed';
  const isEndless = isPlaying && soloModeType === 'endless';

  // Timed mode hook
  const timedMode = useTimedMode({
    duration: timedDuration,
    withPunctuation,
    enabled: isSoloTimed,
    onComplete: (timedStats) => {
      setFinalStats(timedStats);
      setLocalPlayers((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((p) => p.id === playerId);
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            progress: 100,
            wpm: timedStats.wpm,
            accuracy: timedStats.accuracy,
            finished: true,
            finishedAt: Date.now(),
          };
        }
        return updated;
      });
    },
  });

  // Endless mode hook
  const endlessMode = useEndlessMode({
    enabled: isEndless,
    withPunctuation,
  });

  // Type racer hook (for text mode)
  const {
    currentIndex: textCurrentIndex,
    errors: textErrors,
    stats: textStats,
    pressedKey: textPressedKey,
    lastKeyCorrect: textLastKeyCorrect,
    progress: textProgress,
    reset: resetTyping,
  } = useTypeRacer({
    text: soloText,
    enabled: isPlaying && !isSoloTimed,
    onProgress: (prog, wpm, accuracy) => {
      setLocalPlayers((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((p) => p.id === playerId);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], progress: prog, wpm, accuracy };
        }
        return updated;
      });
    },
    onComplete: (completedStats) => {
      setFinalStats(completedStats);
      setLocalPlayers((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((p) => p.id === playerId);
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            progress: 100,
            wpm: completedStats.wpm,
            accuracy: completedStats.accuracy,
            finished: true,
            finishedAt: Date.now(),
          };
        }
        return updated;
      });
    },
  });

  // Get the right values based on mode
  const currentIndex = isEndless ? endlessMode.currentIndex : isSoloTimed ? timedMode.currentIndex : textCurrentIndex;
  const errors = isEndless ? endlessMode.errors : isSoloTimed ? timedMode.errors : textErrors;
  const stats = isEndless ? endlessMode.stats : isSoloTimed ? timedMode.stats : textStats;
  const pressedKey = isEndless ? endlessMode.pressedKey : isSoloTimed ? timedMode.pressedKey : textPressedKey;
  const lastKeyCorrect = isEndless ? endlessMode.lastKeyCorrect : isSoloTimed ? timedMode.lastKeyCorrect : textLastKeyCorrect;
  const progress = isSoloTimed || isEndless ? 0 : textProgress;
  const displayText = isEndless ? endlessMode.text : isSoloTimed ? timedMode.text : soloText;
  const scrollOffset = isEndless ? endlessMode.scrollOffset : 0;

  // Check if current player has finished
  const currentPlayerFinished = useMemo(() => {
    if (isEndless) {
      return false; // Endless mode never finishes on its own
    }
    if (isSoloTimed) {
      return timedMode.timeRemaining <= 0 && timedMode.isActive === false && timedMode.currentIndex > 0;
    }
    return localPlayers.find((p) => p.id === playerId)?.finished || false;
  }, [localPlayers, playerId, isSoloTimed, isEndless, timedMode.timeRemaining, timedMode.isActive, timedMode.currentIndex]);

  // Initialize player on mount
  useState(() => {
    setLocalPlayers([
      {
        id: playerId,
        name: playerName,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
      },
    ]);
  });

  // Play again
  const handlePlayAgain = useCallback(() => {
    refreshSoloText();
    setFinalStats(null);

    if (soloModeType === 'timed') {
      timedMode.reset();
    } else if (soloModeType === 'endless') {
      endlessMode.reset();
    } else {
      resetTyping(soloText);
    }

    setLocalPlayers([
      {
        id: playerId,
        name: playerName,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
      },
    ]);
  }, [refreshSoloText, soloModeType, timedMode, endlessMode, resetTyping, soloText, playerId]);

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode: SoloModeType) => {
      if (newMode === soloModeType) return;
      setSoloModeType(newMode);
      setFinalStats(null);
      if (newMode === 'timed') {
        timedMode.reset();
      } else if (newMode === 'endless') {
        endlessMode.reset();
      } else {
        refreshSoloText();
        resetTyping(soloText);
      }
      setLocalPlayers([
        {
          id: playerId,
          name: playerName,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
        },
      ]);
    },
    [soloModeType, timedMode, endlessMode, refreshSoloText, resetTyping, soloText, playerId],
  );

  // Handle duration change
  const handleDurationChange = useCallback(
    (newDuration: TimeDuration) => {
      if (newDuration === timedDuration) return;
      setTimedDuration(newDuration);
      setFinalStats(null);
      timedMode.reset();
      setLocalPlayers([
        {
          id: playerId,
          name: playerName,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
        },
      ]);
    },
    [timedDuration, timedMode, playerId],
  );

  // Handle stop for endless mode
  const handleStopEndless = useCallback(() => {
    endlessMode.stop();
    setFinalStats(endlessMode.stats);
  }, [endlessMode]);

  return (
    <div className='flex flex-col items-center justify-center w-full'>
      <SoloRacingScreen
        soloModeType={soloModeType}
        onModeChange={handleModeChange}
        timedDuration={timedDuration}
        onDurationChange={handleDurationChange}
        showKeyboard={showKeyboard}
        onShowKeyboardChange={setShowKeyboard}
        displayText={displayText}
        currentIndex={currentIndex}
        errors={errors}
        stats={stats}
        pressedKey={pressedKey}
        lastKeyCorrect={lastKeyCorrect}
        progress={progress}
        isTimed={isSoloTimed}
        isEndless={isEndless}
        timeRemaining={timedMode.timeRemaining}
        isFinished={currentPlayerFinished || (isEndless && finalStats !== null)}
        finalStats={finalStats}
        onPlayAgain={handlePlayAgain}
        onStop={handleStopEndless}
        scrollOffset={scrollOffset}
        countdown={null}
      />
    </div>
  );
}
