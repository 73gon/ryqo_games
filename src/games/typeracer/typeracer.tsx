// TypeRacer Game - Main Component

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameLayout } from '@/components/game-layout';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { LobbyScreen, MainMenu, MultiplayerMenu, SoloRacingScreen, MultiplayerRacingScreen } from './components';
import { useTypeRacer, useRandomText, useMultiplayer, useRoomFromUrl, useTimedMode } from './hooks';
import type { GameStats, Player, SoloModeType, TimeDuration } from './types';

type GameMode = 'menu' | 'solo' | 'multiplayer-menu' | 'lobby' | 'racing' | 'finished';

export function TypeRacerGame() {
  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [joinRoomId, setJoinRoomId] = useState('');

  // Solo mode settings
  const [soloModeType, setSoloModeType] = useState<SoloModeType>('text');
  const [timedDuration, setTimedDuration] = useState<TimeDuration>(30);
  const [withPunctuation, setWithPunctuation] = useState(true);

  // Get random text for solo text mode
  const [soloText, refreshSoloText] = useRandomText(withPunctuation);

  // URL room check
  const urlRoomId = useRoomFromUrl();

  // Multiplayer hook
  const {
    playerId,
    playerName,
    setPlayerName,
    room,
    isHost,
    isConnected,
    isLoading: mpLoading,
    error: mpError,
    countdown,
    createNewRoom,
    joinExistingRoom,
    startTheRace,
    updateProgress,
    leaveRoom,
    resetForNewRace,
    hasSupabaseConfig: hasSupabase,
  } = useMultiplayer({
    onRaceStart: () => {
      // Race is ready to begin (countdown finished)
    },
    onCountdownStart: () => {
      // Switch to racing screen when countdown starts
      setGameMode('racing');
    },
  });

  // Determine the text to use for text mode
  const raceText = room?.text || soloText;

  // Solo timed mode detection
  const isSoloTimed = gameMode === 'racing' && !isConnected && soloModeType === 'timed';

  // Timed mode hook
  const timedMode = useTimedMode({
    duration: timedDuration,
    withPunctuation,
    enabled: isSoloTimed && countdown === null,
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

  // Type racer hook (for text mode and multiplayer)
  const {
    currentIndex: textCurrentIndex,
    errors: textErrors,
    stats: textStats,
    pressedKey: textPressedKey,
    lastKeyCorrect: textLastKeyCorrect,
    progress: textProgress,
    reset: resetTyping,
  } = useTypeRacer({
    text: raceText,
    enabled: gameMode === 'racing' && countdown === null && !isSoloTimed,
    onProgress: (prog, wpm, accuracy) => {
      // Update local players for display
      setLocalPlayers((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((p) => p.id === playerId);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], progress: prog, wpm, accuracy };
        }
        return updated;
      });

      // Update multiplayer if connected
      if (isConnected) {
        updateProgress(prog, wpm, accuracy, false);
      }
    },
    onComplete: (completedStats) => {
      setFinalStats(completedStats);

      // Stay on racing screen for both solo and multiplayer
      // The racing screen will show the completion panel

      // Update local players
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

      // Update multiplayer if connected
      if (isConnected) {
        updateProgress(100, completedStats.wpm, completedStats.accuracy, true);
      }
    },
  });

  // Get the right values based on mode
  const currentIndex = isSoloTimed ? timedMode.currentIndex : textCurrentIndex;
  const errors = isSoloTimed ? timedMode.errors : textErrors;
  const stats = isSoloTimed ? timedMode.stats : textStats;
  const pressedKey = isSoloTimed ? timedMode.pressedKey : textPressedKey;
  const lastKeyCorrect = isSoloTimed ? timedMode.lastKeyCorrect : textLastKeyCorrect;
  const progress = isSoloTimed ? 0 : textProgress; // No progress bar in timed mode
  const displayText = isSoloTimed ? timedMode.text : raceText;

  // Check if current player has finished
  const currentPlayerFinished = useMemo(() => {
    if (isSoloTimed) {
      return timedMode.timeRemaining <= 0 && timedMode.isActive === false && timedMode.currentIndex > 0;
    }
    return localPlayers.find((p) => p.id === playerId)?.finished || false;
  }, [localPlayers, playerId, isSoloTimed, timedMode.timeRemaining, timedMode.isActive, timedMode.currentIndex]);

  // Check if all players have finished
  const allPlayersFinished = useMemo(() => {
    return localPlayers.length > 0 && localPlayers.every((p) => p.finished);
  }, [localPlayers]);

  // Get current player's position
  const currentPlayerPosition = useMemo(() => {
    if (!currentPlayerFinished) return null;
    const finishedPlayers = localPlayers.filter((p) => p.finished).sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0));
    return finishedPlayers.findIndex((p) => p.id === playerId) + 1;
  }, [localPlayers, playerId, currentPlayerFinished]);

  // Handle URL room join on load
  useEffect(() => {
    if (urlRoomId && hasSupabase && gameMode === 'menu') {
      setJoinRoomId(urlRoomId);
      setGameMode('multiplayer-menu');
    }
  }, [urlRoomId, hasSupabase, gameMode]);

  // Sync multiplayer players to local state
  useEffect(() => {
    if (room?.players) {
      setLocalPlayers(room.players);
    }
  }, [room?.players]);

  // Start solo game
  const handleStartSolo = useCallback(() => {
    resetTyping(soloText);
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
    setGameMode('racing');
    setFinalStats(null);
    // Reset timed mode if using it
    if (soloModeType === 'timed') {
      timedMode.reset();
    }
  }, [playerId, playerName, resetTyping, soloText, soloModeType, timedMode]);

  // Create multiplayer room
  const handleCreateRoom = useCallback(async () => {
    const success = await createNewRoom(withPunctuation);
    if (success) {
      setGameMode('lobby');
    }
  }, [createNewRoom, withPunctuation]);

  // Join multiplayer room
  const handleJoinRoom = useCallback(async () => {
    if (!joinRoomId.trim()) return;
    const success = await joinExistingRoom(joinRoomId.trim());
    if (success) {
      setGameMode('lobby');
    }
  }, [joinExistingRoom, joinRoomId]);

  // Start multiplayer race
  const handleStartRace = useCallback(async () => {
    await startTheRace();
  }, [startTheRace]);

  // Play again in solo - restart immediately
  const handlePlayAgain = useCallback(() => {
    refreshSoloText();
    setFinalStats(null);

    // Reset and start immediately
    if (soloModeType === 'timed') {
      timedMode.reset();
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
    // Stay in racing mode - just reset
  }, [refreshSoloText, soloModeType, timedMode, resetTyping, soloText, playerId, playerName]);

  // Return to lobby for another multiplayer race
  const handleReturnToLobby = useCallback(() => {
    resetTyping(room?.text || '');
    resetForNewRace();
    setFinalStats(null);
    // Reset all players progress
    setLocalPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        finishedAt: undefined,
      })),
    );
    setGameMode('lobby');
  }, [resetTyping, resetForNewRace, room?.text]);

  // Back to menu
  const handleBackToMenu = useCallback(() => {
    if (isConnected) {
      leaveRoom();
    }
    timedMode.reset();
    setGameMode('menu');
    setJoinRoomId('');
    setFinalStats(null);
    setLocalPlayers([]);
  }, [isConnected, leaveRoom, timedMode]);

  // Handle mode change during solo play
  const handleModeChange = useCallback(
    (newMode: SoloModeType) => {
      if (newMode === soloModeType) return;
      setSoloModeType(newMode);
      setFinalStats(null);
      if (newMode === 'timed') {
        timedMode.reset();
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
    [soloModeType, timedMode, refreshSoloText, resetTyping, soloText, playerId, playerName],
  );

  // Handle duration change during solo play
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
    [timedDuration, timedMode, playerId, playerName],
  );

  // Controls for game layout
  const controls =
    gameMode === 'racing' ? (
      <Button variant='ghost' size='icon' onClick={handleBackToMenu}>
        <X className='w-4 h-4' />
      </Button>
    ) : null;

  return (
    <GameLayout controls={controls}>
      <div className='flex flex-col items-center justify-center w-full min-h-[400px]'>
        {gameMode === 'menu' && (
          <MainMenu onStartSolo={handleStartSolo} onMultiplayer={() => setGameMode('multiplayer-menu')} hasMultiplayer={hasSupabase} />
        )}

        {gameMode === 'multiplayer-menu' && (
          <MultiplayerMenu
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            withPunctuation={withPunctuation}
            onPunctuationChange={setWithPunctuation}
            joinRoomId={joinRoomId}
            onJoinRoomIdChange={setJoinRoomId}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBack={handleBackToMenu}
            isLoading={mpLoading}
            error={mpError}
          />
        )}

        {gameMode === 'lobby' && room && (
          <LobbyScreen
            roomId={room.id}
            players={room.players}
            currentPlayerId={playerId}
            isHost={isHost}
            onStartRace={handleStartRace}
            isStarting={mpLoading}
            isCountingDown={countdown !== null}
          />
        )}

        {gameMode === 'racing' && !isConnected && (
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
            timeRemaining={timedMode.timeRemaining}
            isFinished={currentPlayerFinished}
            finalStats={finalStats}
            onPlayAgain={handlePlayAgain}
            countdown={countdown}
          />
        )}

        {gameMode === 'racing' && isConnected && (
          <MultiplayerRacingScreen
            showKeyboard={showKeyboard}
            onShowKeyboardChange={setShowKeyboard}
            displayText={displayText}
            currentIndex={currentIndex}
            errors={errors}
            stats={stats}
            pressedKey={pressedKey}
            lastKeyCorrect={lastKeyCorrect}
            progress={progress}
            players={localPlayers}
            currentPlayerId={playerId}
            isFinished={currentPlayerFinished}
            allPlayersFinished={allPlayersFinished}
            currentPlayerPosition={currentPlayerPosition}
            finalStats={finalStats}
            onReturnToLobby={handleReturnToLobby}
            countdown={countdown}
          />
        )}
      </div>
    </GameLayout>
  );
}
