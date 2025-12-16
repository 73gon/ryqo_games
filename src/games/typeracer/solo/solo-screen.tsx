// Solo racing screen component for TypeRacer

import { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, Toggle as ToggleGroupItem } from '@/components/ui/toggle-group';
import { Keyboard as KeyboardIcon, RotateCcw, Clock, FileText, Infinity } from 'lucide-react';
import { TextDisplay } from '../components/TextDisplay';
import { Keyboard } from '../components/Keyboard';
import { CountdownOverlay } from '../components/CountdownOverlay';
import type { GameStats, SoloModeType, TimeDuration } from '../types';

interface SoloRacingScreenProps {
  // Mode settings
  soloModeType: SoloModeType;
  onModeChange: (mode: SoloModeType) => void;
  timedDuration: TimeDuration;
  onDurationChange: (duration: TimeDuration) => void;

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

  // Timed mode
  isTimed: boolean;
  timeRemaining: number;

  // Endless mode
  isEndless?: boolean;
  scrollOffset?: number;

  // Finish state
  isFinished: boolean;
  finalStats: GameStats | null;
  onPlayAgain: () => void;
  onStop?: () => void;

  // Scrolling
  onRequestScroll?: (newOffset: number) => void;

  // Countdown
  countdown: number | null;
}

export const SoloRacingScreen = memo(function SoloRacingScreen({
  soloModeType,
  onModeChange,
  timedDuration,
  onDurationChange,
  showKeyboard,
  onShowKeyboardChange,
  displayText,
  currentIndex,
  errors,
  stats,
  pressedKey,
  lastKeyCorrect,
  isTimed,
  isEndless = false,
  timeRemaining,
  scrollOffset = 0,
  isFinished,
  finalStats,
  onPlayAgain,
  onStop,
  onRequestScroll,
  countdown,
}: SoloRacingScreenProps) {
  return (
    <div className='flex flex-col gap-4 w-full max-w-7xl relative animate-in fade-in-0 duration-300'>
      {/* Countdown overlay */}
      {countdown !== null && <CountdownOverlay count={countdown} />}
      {/* Stats bar */}
      <div className='flex items-center justify-between text-sm px-2'>
        <div className='flex items-center gap-4'>
          <motion.span layout className='text-muted-foreground'>
            time:{' '}
            <span className={`font-bold ${isTimed && timeRemaining <= 5 ? 'text-red-500' : 'text-foreground'}`}>
              {isTimed ? `${timeRemaining}s` : `${Math.floor(stats.timeElapsed)}s`}
            </span>
          </motion.span>
          <motion.span layout className='text-muted-foreground'>
            wpm: <span className='text-foreground font-bold'>{stats.wpm}</span>
          </motion.span>
          <motion.span layout className='text-muted-foreground'>
            accuracy:{' '}
            <motion.span layout className='text-foreground font-bold'>
              {stats.accuracy.toFixed(1)}%
            </motion.span>
          </motion.span>

          <motion.span layout className='text-muted-foreground'>
            chars:{' '}
            <motion.span layout className='text-foreground font-bold'>
              {stats.correctChars}
            </motion.span>
          </motion.span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2'>
            {/* Duration toggle - only show in timed mode, on the left */}
            <AnimatePresence>
              {soloModeType === 'timed' && (
                <motion.div
                  key='duration-toggle'
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  layout
                >
                  <ToggleGroup
                    value={[timedDuration.toString()]}
                    onValueChange={(v) => v.length > 0 && onDurationChange(parseInt(v[0]) as TimeDuration)}
                  >
                    <ToggleGroupItem value='15'>15s</ToggleGroupItem>
                    <ToggleGroupItem value='30'>30s</ToggleGroupItem>
                  </ToggleGroup>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout>
              {/* Mode toggle: Text vs Timed vs Endless */}
              <ToggleGroup value={[soloModeType]} onValueChange={(v) => v.length > 0 && onModeChange(v[0] as SoloModeType)}>
                <ToggleGroupItem value='text' aria-label='Text mode'>
                  <FileText className='w-4 h-4' />
                </ToggleGroupItem>
                <ToggleGroupItem value='timed' aria-label='Timed mode'>
                  <Clock className='w-4 h-4' />
                </ToggleGroupItem>
                <ToggleGroupItem value='endless' aria-label='Just type mode'>
                  <Infinity className='w-4 h-4' />
                </ToggleGroupItem>
              </ToggleGroup>
            </motion.div>
          </div>

          {/* Stop button for endless mode */}
          {isEndless && stats.timeElapsed > 0 && onStop && (
            <Button variant='outline' size='sm' onClick={onStop}>
              Stop
            </Button>
          )}

          <motion.div layout>
            <Toggle pressed={showKeyboard} onPressedChange={onShowKeyboardChange} size='sm' aria-label='Toggle keyboard display'>
              <KeyboardIcon className='w-4 h-4' />
            </Toggle>
          </motion.div>
        </div>
      </div>
      {/* Text display - show with scroll offset for endless mode */}
      <motion.div layout className='w-full'>
        <TextDisplay text={displayText} currentIndex={currentIndex} errors={errors} scrollOffset={scrollOffset} onRequestScroll={onRequestScroll} />
      </motion.div>

      <AnimatePresence mode='popLayout'>
        {/* Virtual keyboard */}
        {showKeyboard && (
          <motion.div
            key='keyboard-container'
            layout
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: 20,
              scale: 0.9,
              transition: { duration: 0.2, ease: 'easeOut' },
            }}
            className='w-full flex flex-col gap-2'
          >
            {/* Separator inside the container */}
            <div className='h-px bg-border w-full' />

            {/* Keyboard */}
            <Keyboard pressedKey={pressedKey} lastKeyCorrect={lastKeyCorrect} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Finished status panel */}
      {isFinished && (
        <div className='flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-lg border border-border animate-in fade-in-0 duration-300'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-foreground mb-1'>
              {isTimed ? "time's up!" : isEndless ? 'Session Stopped!' : 'Race Complete!'}
            </div>
          </div>

          <div className='flex items-center gap-6 text-sm'>
            <span className='text-muted-foreground'>
              wpm: <span className='text-foreground font-bold'>{finalStats?.wpm || stats.wpm}</span>
            </span>
            <span className='text-muted-foreground'>
              accuracy: <span className='text-foreground font-bold'>{(finalStats?.accuracy || stats.accuracy).toFixed(1)}%</span>
            </span>
            {(isTimed || isEndless) && (
              <span className='text-muted-foreground'>
                characters: <span className='text-foreground font-bold'>{finalStats?.correctChars || stats.correctChars}</span>
              </span>
            )}
            {isEndless && (
              <span className='text-muted-foreground'>
                time: <span className='text-foreground font-bold'>{Math.floor(finalStats?.timeElapsed || stats.timeElapsed)}s</span>
              </span>
            )}
          </div>

          <Button onClick={onPlayAgain} className='gap-2'>
            <RotateCcw className='w-4 h-4' />
            Play Again
          </Button>
        </div>
      )}
    </div>
  );
});
