// Multiplayer racing screen component for TypeRacer

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Keyboard as KeyboardIcon, RotateCcw } from 'lucide-react';
import { TextDisplay } from '../components/TextDisplay';
import { Keyboard } from '../components/Keyboard';
import { RaceTrack } from '../components/race-track';
import { CountdownOverlay } from '../components/CountdownOverlay';
import type { GameStats, Player } from '../types';

interface MultiplayerRacingScreenProps {
  // Display settings
  showKeyboard: boolean;
  onShowKeyboardChange: (show: boolean) => void;

  // Game state
  displayText: string;
  currentIndex: number;
  errors: Set<number>;
  stats: GameStats;
  pressedKey: string | null;
  lastKeyCorrect: boolean | null;
  progress: number;

  // Players
  players: Player[];
  currentPlayerId: string;

  // Finish state
  isFinished: boolean;
  allPlayersFinished: boolean;
  currentPlayerPosition: number | null;
  finalStats: GameStats | null;
  onReturnToLobby: () => void;

  // Countdown
  countdown: number | null;
}

export const MultiplayerRacingScreen = memo(function MultiplayerRacingScreen({
  showKeyboard,
  onShowKeyboardChange,
  displayText,
  currentIndex,
  errors,
  stats,
  pressedKey,
  lastKeyCorrect,
  progress,
  players,
  currentPlayerId,
  isFinished,
  allPlayersFinished,
  currentPlayerPosition,
  finalStats,
  onReturnToLobby,
  countdown,
}: MultiplayerRacingScreenProps) {
  return (
    <div className='flex flex-col gap-4 w-full relative animate-in fade-in-0 duration-300'>
      {/* Countdown overlay */}
      {countdown !== null && <CountdownOverlay count={countdown} />}

      {/* Stats bar */}
      <div className='flex items-center justify-between text-sm'>
        <div className='flex items-center gap-4'>
          <span className='text-muted-foreground'>
            wpm: <span className='text-foreground font-bold'>{stats.wpm}</span>
          </span>
          <span className='text-muted-foreground'>
            accuracy: <span className='text-foreground font-bold'>{stats.accuracy.toFixed(1)}%</span>
          </span>
          {isFinished && currentPlayerPosition && (
            <span className='text-muted-foreground'>
              place:{' '}
              <span className={`font-bold ${currentPlayerPosition === 1 ? 'text-yellow-500' : 'text-foreground'}`}>
                {currentPlayerPosition}
                {currentPlayerPosition === 1 ? 'st' : currentPlayerPosition === 2 ? 'nd' : currentPlayerPosition === 3 ? 'rd' : 'th'}
              </span>
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <Toggle pressed={showKeyboard} onPressedChange={onShowKeyboardChange} size='sm' aria-label='Toggle keyboard display'>
            <KeyboardIcon className='w-4 h-4' />
          </Toggle>
        </div>
      </div>

      {/* Race track */}
      <RaceTrack players={players} currentPlayerId={currentPlayerId} />

      {/* Text display - always visible */}
      <TextDisplay text={displayText} currentIndex={currentIndex} errors={errors} />

      {/* Virtual keyboard */}
      {showKeyboard && <Keyboard pressedKey={pressedKey} lastKeyCorrect={lastKeyCorrect} />}

      {/* Progress indicator - hide when finished */}
      {!isFinished && (
        <div className='h-2 bg-muted rounded-full overflow-hidden'>
          <div className='h-full bg-primary transition-all duration-150 ease-out' style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Finished status panel */}
      {isFinished && (
        <div className='flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-lg border border-border animate-in fade-in-0 duration-300'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-foreground mb-1'>
              {currentPlayerPosition === 1
                ? '🏆 You Won!'
                : `You finished ${currentPlayerPosition}${currentPlayerPosition === 2 ? 'nd' : currentPlayerPosition === 3 ? 'rd' : 'th'}!`}
            </div>
            <div className='text-muted-foreground'>{allPlayersFinished ? 'Race complete!' : 'Waiting for other players...'}</div>
          </div>

          <div className='flex items-center gap-6 text-sm'>
            <span className='text-muted-foreground'>
              wpm: <span className='text-foreground font-bold'>{finalStats?.wpm || stats.wpm}</span>
            </span>
            <span className='text-muted-foreground'>
              accuracy: <span className='text-foreground font-bold'>{(finalStats?.accuracy || stats.accuracy).toFixed(1)}%</span>
            </span>
          </div>

          {allPlayersFinished && (
            <Button onClick={onReturnToLobby} className='gap-2'>
              <RotateCcw className='w-4 h-4' />
              Play Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
