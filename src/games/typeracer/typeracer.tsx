// TypeRacer Game - Main Component

import { useState, useEffect, useCallback } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Users, User, Keyboard as KeyboardIcon, Type, Loader2, X } from 'lucide-react';
import { TextDisplay, Keyboard, RaceTrack, ResultsScreen, LobbyScreen, CountdownOverlay } from './components';
import { useTypeRacer, useRandomText, useMultiplayer, useRoomFromUrl } from './hooks';
import type { GameStats, Player } from './types';

type GameMode = 'menu' | 'solo' | 'multiplayer-menu' | 'lobby' | 'racing' | 'finished';

export function TypeRacerGame() {
  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showText, setShowText] = useState(true);
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [joinRoomId, setJoinRoomId] = useState('');

  // Get random text for solo mode
  const [soloText, refreshSoloText] = useRandomText();

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
    hasSupabaseConfig: hasSupabase,
  } = useMultiplayer({
    onRaceStart: () => setGameMode('racing'),
  });

  // Determine the text to use
  const raceText = room?.text || soloText;

  // Type racer hook
  const {
    currentIndex,
    errors,
    stats,
    pressedKey,
    lastKeyCorrect,
    progress,
    reset: resetTyping,
  } = useTypeRacer({
    text: raceText,
    enabled: gameMode === 'racing' && countdown === null,
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
    onComplete: (finalStats) => {
      setFinalStats(finalStats);
      setGameMode('finished');

      // Update local players
      setLocalPlayers((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((p) => p.id === playerId);
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            progress: 100,
            wpm: finalStats.wpm,
            accuracy: finalStats.accuracy,
            finished: true,
            finishedAt: Date.now(),
          };
        }
        return updated;
      });

      // Update multiplayer if connected
      if (isConnected) {
        updateProgress(100, finalStats.wpm, finalStats.accuracy, true);
      }
    },
  });

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
  }, [playerId, playerName, resetTyping, soloText]);

  // Create multiplayer room
  const handleCreateRoom = useCallback(async () => {
    const success = await createNewRoom();
    if (success) {
      setGameMode('lobby');
    }
  }, [createNewRoom]);

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

  // Play again
  const handlePlayAgain = useCallback(() => {
    if (isConnected) {
      leaveRoom();
    }
    refreshSoloText();
    setFinalStats(null);
    setLocalPlayers([]);
    setGameMode('menu');
  }, [isConnected, leaveRoom, refreshSoloText]);

  // Back to menu
  const handleBackToMenu = useCallback(() => {
    if (isConnected) {
      leaveRoom();
    }
    setGameMode('menu');
    setJoinRoomId('');
  }, [isConnected, leaveRoom]);

  // Render main menu
  const renderMenu = () => (
    <div className='flex flex-col items-center gap-6 animate-in fade-in-0 duration-300'>
      <div className='text-center mb-4'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>TypeRacer</h1>
        <p className='text-muted-foreground'>Test your typing speed</p>
      </div>

      {/* Player name input */}
      <div className='w-full max-w-xs'>
        <label className='text-sm text-muted-foreground mb-1 block'>Your Name</label>
        <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder='Enter your name' maxLength={20} />
      </div>

      <div className='flex flex-col gap-3 w-full max-w-xs'>
        <Button onClick={handleStartSolo} size='lg' className='w-full gap-2'>
          <User className='w-4 h-4' />
          Solo Practice
        </Button>

        {hasSupabase && (
          <Button onClick={() => setGameMode('multiplayer-menu')} variant='outline' size='lg' className='w-full gap-2'>
            <Users className='w-4 h-4' />
            Multiplayer
          </Button>
        )}
      </div>
    </div>
  );

  // Render multiplayer menu
  const renderMultiplayerMenu = () => (
    <div className='flex flex-col items-center gap-6 animate-in fade-in-0 duration-300 w-full max-w-md'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-foreground mb-2'>Multiplayer</h2>
        <p className='text-muted-foreground text-sm'>Race against friends</p>
      </div>

      {/* Create room */}
      <Button onClick={handleCreateRoom} size='lg' className='w-full max-w-xs gap-2' disabled={mpLoading}>
        {mpLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Users className='w-4 h-4' />}
        Create Room
      </Button>

      <div className='flex items-center gap-3 w-full max-w-xs'>
        <div className='h-px bg-border flex-1' />
        <span className='text-xs text-muted-foreground'>or</span>
        <div className='h-px bg-border flex-1' />
      </div>

      {/* Join room */}
      <div className='w-full max-w-xs space-y-2'>
        <label className='text-sm text-muted-foreground'>Join Room</label>
        <div className='flex gap-2'>
          <Input
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
            placeholder='Room Code'
            maxLength={6}
            className='font-mono uppercase'
          />
          <Button onClick={handleJoinRoom} disabled={!joinRoomId.trim() || mpLoading}>
            Join
          </Button>
        </div>
      </div>

      {mpError && <p className='text-sm text-destructive'>{mpError}</p>}

      <Button variant='ghost' onClick={handleBackToMenu} className='gap-2'>
        <X className='w-4 h-4' />
        Back
      </Button>
    </div>
  );

  // Render lobby
  const renderLobby = () =>
    room && (
      <LobbyScreen
        roomId={room.id}
        players={room.players}
        currentPlayerId={playerId}
        isHost={isHost}
        onStartRace={handleStartRace}
        isStarting={mpLoading}
      />
    );

  // Render racing screen
  const renderRacing = () => (
    <div className='flex flex-col gap-4 w-full max-w-2xl relative animate-in fade-in-0 duration-300'>
      {/* Countdown overlay */}
      {countdown !== null && <CountdownOverlay count={countdown} />}

      {/* Stats bar */}
      <div className='flex items-center justify-between text-sm'>
        <div className='flex items-center gap-4'>
          <span className='text-muted-foreground'>
            WPM: <span className='text-foreground font-bold'>{stats.wpm}</span>
          </span>
          <span className='text-muted-foreground'>
            Accuracy: <span className='text-foreground font-bold'>{stats.accuracy.toFixed(1)}%</span>
          </span>
        </div>
        <div className='flex items-center gap-1'>
          <Toggle pressed={showText} onPressedChange={setShowText} size='sm' aria-label='Toggle text display'>
            <Type className='w-4 h-4' />
          </Toggle>
          <Toggle pressed={showKeyboard} onPressedChange={setShowKeyboard} size='sm' aria-label='Toggle keyboard display'>
            <KeyboardIcon className='w-4 h-4' />
          </Toggle>
        </div>
      </div>

      {/* Race track */}
      <RaceTrack players={localPlayers} currentPlayerId={playerId} />

      {/* Text display */}
      {showText && <TextDisplay text={raceText} currentIndex={currentIndex} errors={errors} />}

      {/* Virtual keyboard */}
      {showKeyboard && <Keyboard pressedKey={pressedKey} lastKeyCorrect={lastKeyCorrect} />}

      {/* Progress indicator */}
      <div className='h-2 bg-muted rounded-full overflow-hidden'>
        <div className='h-full bg-primary transition-all duration-150 ease-out' style={{ width: `${progress}%` }} />
      </div>
    </div>
  );

  // Render finished screen
  const renderFinished = () =>
    finalStats && (
      <ResultsScreen stats={finalStats} players={localPlayers} currentPlayerId={playerId} onPlayAgain={handlePlayAgain} isMultiplayer={isConnected} />
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
        {gameMode === 'menu' && renderMenu()}
        {gameMode === 'multiplayer-menu' && renderMultiplayerMenu()}
        {gameMode === 'lobby' && renderLobby()}
        {gameMode === 'racing' && renderRacing()}
        {gameMode === 'finished' && renderFinished()}
      </div>
    </GameLayout>
  );
}
