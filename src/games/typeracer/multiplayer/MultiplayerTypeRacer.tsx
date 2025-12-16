// Multiplayer TypeRacer Page

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MultiplayerMenu, LobbyScreen, MultiplayerRacingScreen } from '../components';
import { useTypeRacer, useMultiplayer, useRoomFromUrl } from '../hooks';
import type { GameStats, Player } from '../types';

type MultiplayerMode = 'menu' | 'lobby' | 'racing';

export function MultiplayerTypeRacer() {
  // Game state
  const [mode, setMode] = useState<MultiplayerMode>('menu');
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [withPunctuation, setWithPunctuation] = useState(true);

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
      // Race is ready to begin
    },
    onCountdownStart: () => {
      setMode('racing');
    },
  });

  // Type racer hook for multiplayer
  const {
    currentIndex,
    errors,
    stats,
    pressedKey,
    lastKeyCorrect,
    progress,
    reset: resetTyping,
  } = useTypeRacer({
    text: room?.text || '',
    enabled: mode === 'racing' && countdown === null,
    onProgress: (prog, wpm, accuracy) => {
      setLocalPlayers((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((p) => p.id === playerId);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], progress: prog, wpm, accuracy };
        }
        return updated;
      });

      if (isConnected) {
        updateProgress(prog, wpm, accuracy, false);
      }
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

      if (isConnected) {
        updateProgress(100, completedStats.wpm, completedStats.accuracy, true);
      }
    },
  });

  // Check if current player has finished
  const currentPlayerFinished = useMemo(() => {
    return localPlayers.find((p) => p.id === playerId)?.finished || false;
  }, [localPlayers, playerId]);

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
    if (urlRoomId && hasSupabase && mode === 'menu') {
      setJoinRoomId(urlRoomId);
    }
  }, [urlRoomId, hasSupabase, mode]);

  // Sync multiplayer players to local state
  useEffect(() => {
    if (room?.players) {
      setLocalPlayers(room.players);
    }
  }, [room?.players]);

  // Create room
  const handleCreateRoom = useCallback(async () => {
    const success = await createNewRoom(withPunctuation);
    if (success) {
      setMode('lobby');
    }
  }, [createNewRoom, withPunctuation]);

  // Join room
  const handleJoinRoom = useCallback(async () => {
    if (!joinRoomId.trim()) return;
    const success = await joinExistingRoom(joinRoomId.trim());
    if (success) {
      setMode('lobby');
    }
  }, [joinExistingRoom, joinRoomId]);

  // Start race
  const handleStartRace = useCallback(async () => {
    await startTheRace();
  }, [startTheRace]);

  // Return to lobby
  const handleReturnToLobby = useCallback(() => {
    resetTyping(room?.text || '');
    resetForNewRace();
    setFinalStats(null);
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
    setMode('lobby');
  }, [resetTyping, resetForNewRace, room?.text]);

  // Back to menu
  const handleBack = useCallback(() => {
    if (isConnected) {
      leaveRoom();
    }
    setMode('menu');
    setJoinRoomId('');
    setFinalStats(null);
    setLocalPlayers([]);
  }, [isConnected, leaveRoom]);

  if (!hasSupabase) {
    return (
      <div className='flex flex-col items-center justify-center w-full gap-4'>
        <h2 className='text-xl font-bold'>Multiplayer Unavailable</h2>
        <p className='text-muted-foreground'>Supabase is not configured for multiplayer.</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center w-full'>
      {mode === 'menu' && (
        <MultiplayerMenu
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          withPunctuation={withPunctuation}
          onPunctuationChange={setWithPunctuation}
          joinRoomId={joinRoomId}
          onJoinRoomIdChange={setJoinRoomId}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={handleBack}
          isLoading={mpLoading}
          error={mpError}
        />
      )}

      {mode === 'lobby' && room && (
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

      {mode === 'racing' && (
        <MultiplayerRacingScreen
          showKeyboard={showKeyboard}
          onShowKeyboardChange={setShowKeyboard}
          displayText={room?.text || ''}
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
  );
}
