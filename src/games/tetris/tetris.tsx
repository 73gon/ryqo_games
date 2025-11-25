import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameLayout } from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, RotateCcw, Pause } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { TetrisCore, type TetrisGameHandle } from './tetris_core';
import { LeaderboardPanel } from '../../components/LeaderboardPanel';
import { useTetrisLeaderboard } from './hooks/useLeaderboard';

export function TetrisGame() {
  const { t } = useTranslation();
  const gameRef = useRef<TetrisGameHandle>(null);
  const hasStartedRef = useRef(false);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startLevel, setStartLevel] = useState<number>(() => {
    const saved = localStorage.getItem('tetrisStartLevel');
    const parsed = saved ? parseInt(saved, 10) : 1;
    return Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 1), 15);
  });
  const {
    leaderboard,
    leaderboardLoading,
    leaderboardError,
    playerName,
    pendingScore,
    submittingScore,
    lastSubmittedId,
    hasSupabaseConfig,
    weekStartLabel,
    setPlayerName,
    handleSubmitScore,
    markGameOverScore,
    resetLeaderboardState,
  } = useTetrisLeaderboard();

  const resetGameState = () => {
    setGameOver(false);
    setScore(0);
    scoreRef.current = 0;
    setLines(0);
    setLevel(startLevel);
    resetLeaderboardState();
  };

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
    scoreRef.current = newScore;
  };

  const handleLinesChange = (newLines: number) => {
    setLines(newLines);
  };

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
  };

  const handleGameOver = () => {
    hasStartedRef.current = false;
    setGameOver(true);
    setIsPlaying(false);
    markGameOverScore(scoreRef.current);
  };

  const handleStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  useEffect(() => {
    localStorage.setItem('tetrisStartLevel', startLevel.toString());
  }, [startLevel]);

  useEffect(() => {
    if (!isPlaying && !gameOver && !hasStartedRef.current) {
      setLevel(startLevel);
    }
  }, [startLevel, isPlaying, gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Space') {
        e.preventDefault();
      }

      if (!isPlaying || gameOver) {
        if (e.code === 'Enter') {
          e.preventDefault();
          if (gameOver || !hasStartedRef.current) {
            hasStartedRef.current = true;
            resetGameState();
            gameRef.current?.startGame();
          } else {
            gameRef.current?.resumeGame();
          }
        }
        return;
      }

      switch (e.code) {
        case 'Enter':
          e.preventDefault();
          if (isPlaying) gameRef.current?.stopGame();
          else gameRef.current?.resumeGame();
          break;
        case 'ArrowLeft':
          gameRef.current?.moveLeft(true);
          break;
        case 'ArrowRight':
          gameRef.current?.moveRight(true);
          break;
        case 'ArrowDown':
          gameRef.current?.moveDown(true);
          break;
        case 'ArrowUp':
        case 'KeyX':
          e.preventDefault();
          gameRef.current?.rotate();
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          e.preventDefault();
          gameRef.current?.holdPiece();
          break;
        case 'Space':
          e.preventDefault();
          gameRef.current?.hardDrop();
          break;
        case 'KeyP':
          e.preventDefault();
          if (isPlaying) {
            gameRef.current?.stopGame();
          } else {
            if (gameOver || !hasStartedRef.current) {
              hasStartedRef.current = true;
              resetGameState();
              gameRef.current?.startGame();
            } else {
              gameRef.current?.resumeGame();
            }
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') {
        gameRef.current?.moveLeft(false);
      } else if (e.code === 'ArrowRight') {
        gameRef.current?.moveRight(false);
      } else if (e.code === 'ArrowDown') {
        gameRef.current?.moveDown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, gameOver]);

  const controls = (
    <div className='flex items-center gap-6'>
      <div className='flex items-center gap-4'>
        <div className='flex flex-col items-end'>
          <span className='text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1'>{t('games.common.score')}</span>
          <span className='font-mono font-bold text-2xl tabular-nums leading-none'>{score.toString().padStart(6, '0')}</span>
        </div>

        <div className='h-8 w-px bg-border' />

        <div className='flex flex-col items-end'>
          <span className='text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1'>Lines</span>
          <span className='font-mono font-bold text-2xl tabular-nums leading-none'>{lines.toString().padStart(3, '0')}</span>
        </div>

        <div className='h-8 w-px bg-border' />

        <div className='flex flex-col items-end'>
          <span className='text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1'>Level</span>
          <span className='font-mono font-bold text-2xl tabular-nums leading-none'>{level.toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className='h-8 w-px bg-border' />

      <Button
        onClick={() => {
          if (isPlaying) {
            gameRef.current?.stopGame();
          } else if (gameOver) {
            hasStartedRef.current = true;
            resetGameState();
            gameRef.current?.startGame();
          } else {
            if (!hasStartedRef.current) {
              hasStartedRef.current = true;
              resetGameState();
              gameRef.current?.startGame();
            } else {
              gameRef.current?.resumeGame();
            }
          }
        }}
        variant={isPlaying ? 'destructive' : 'default'}
        className='h-11'
      >
        {gameOver ? (
          <>
            <RotateCcw className='mr-2 h-5 w-5' />
            <span className='font-bold'>{t('games.common.restart')}</span>
          </>
        ) : isPlaying ? (
          <>
            <Pause className='mr-2 h-5 w-5' />
            <span className='font-bold'>Pause</span>
          </>
        ) : (
          <>
            <Play className='mr-2 h-5 w-5' />
            <span className='font-bold'>{t('games.common.start')}</span>
          </>
        )}
      </Button>
    </div>
  );

  return (
    <GameLayout controls={controls}>
      <div className='flex items-start justify-center gap-8 w-full'>
        <div className='flex-1 max-w-md' />

        <div className='flex flex-col items-center gap-6'>
          <TetrisCore
            ref={gameRef}
            startLevel={startLevel}
            onScoreChange={handleScoreChange}
            onLinesChange={handleLinesChange}
            onLevelChange={handleLevelChange}
            onGameOver={handleGameOver}
            onGameRestart={() => {
              resetGameState();
            }}
            onStateChange={handleStateChange}
          />

          <div className='flex flex-col gap-4 w-full max-w-xs'>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <label className='text-sm font-medium'>Start Level</label>
                <span className='text-sm text-muted-foreground'>{startLevel}</span>
              </div>
              <Slider value={[startLevel]} onValueChange={(v) => setStartLevel(v[0])} min={1} max={15} step={1} disabled={isPlaying} />
            </div>
          </div>

          <div className='flex flex-col items-center gap-2'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground uppercase font-bold'>{t('games.common.controls.move')}</span>
              <div className='flex gap-1'>
                <Kbd>Left</Kbd>
                <Kbd>Right</Kbd>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground uppercase font-bold'>Soft Drop</span>
              <Kbd>Down</Kbd>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground uppercase font-bold'>Hard Drop</span>
              <Kbd>{t('kbd.space')}</Kbd>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground uppercase font-bold'>Rotate</span>
              <Kbd>Up</Kbd>
              <span className='text-xs text-muted-foreground'>or</span>
              <Kbd>X</Kbd>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground uppercase font-bold'>Hold</span>
              <Kbd>C</Kbd>
              <span className='text-xs text-muted-foreground'>or</span>
              <Kbd>Shift</Kbd>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground uppercase font-bold'>Pause</span>
              <Kbd>P</Kbd>
              <span className='text-xs text-muted-foreground'>or</span>
              <Kbd>enter</Kbd>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground uppercase font-bold'>Start/Resume</span>
              <Kbd>Enter</Kbd>
            </div>
          </div>

          {gameOver && (
            <div className='flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500'>
              <div className='text-5xl font-black text-destructive animate-bounce'>{t('games.common.gameOver')}</div>
              <div className='text-sm text-muted-foreground animate-pulse'>Press Enter or click Play to restart</div>
            </div>
          )}
        </div>

        <LeaderboardPanel
          leaderboard={leaderboard}
          loading={leaderboardLoading}
          error={leaderboardError}
          pendingScore={pendingScore}
          playerName={playerName}
          submitting={submittingScore}
          lastSubmittedId={lastSubmittedId}
          hasSupabaseConfig={hasSupabaseConfig}
          weekStartLabel={weekStartLabel}
          onPlayerNameChange={setPlayerName}
          onSubmit={handleSubmitScore}
        />

        <div className='flex-1 max-w-md' />
      </div>
    </GameLayout>
  );
}
