import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameLayout } from '@/components/game-layout';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Pause, Cog } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { TetrisCore, type TetrisGameHandle, type PaletteName } from './core';
import { LeaderboardSheet } from './components/LeaderboardSheet';
import { useTetrisLeaderboard } from './hooks/useLeaderboard';
import { AudioManager, DEFAULT_MUSIC_SRC, DEFAULT_SFX } from './audioManager';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { CELL_SIZE_OPTIONS, SENSITIVITY_PRESETS, type CellSizeOption, type SensitivityOption } from './core/constants';

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
  const startLevel = 1;
  const [palette, setPalette] = useState<PaletteName>(() => {
    const saved = localStorage.getItem('tetrisPalette');
    const allowed: PaletteName[] = ['default', 'indigo', 'coral', 'mono', 'emerald', 'purple'];
    return allowed.includes(saved as PaletteName) ? (saved as PaletteName) : 'default';
  });
  const [cellSize, setCellSize] = useState<CellSizeOption>(() => {
    const saved = localStorage.getItem('tetrisCellSize');
    return (saved as CellSizeOption) || 'medium';
  });
  const [sensitivity, setSensitivity] = useState<SensitivityOption>(() => {
    const saved = localStorage.getItem('tetrisSensitivity');
    return (saved as SensitivityOption) || 'normal';
  });
  const [musicVolume, setMusicVolume] = useState<number>(() => {
    const saved = localStorage.getItem('tetrisMusicVolume');
    const parsed = saved ? parseFloat(saved) : 0.25;
    return Number.isNaN(parsed) ? 0.25 : Math.min(Math.max(parsed, 0), 1);
  });
  const [sfxVolume, setSfxVolume] = useState<number>(() => {
    const saved = localStorage.getItem('tetrisSfxVolume');
    const parsed = saved ? parseFloat(saved) : 0.4;
    return Number.isNaN(parsed) ? 0.4 : Math.min(Math.max(parsed, 0), 1);
  });
  const audioManagerRef = useRef<AudioManager | null>(null);
  const {
    leaderboard,
    allTimeLeaderboard,
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

  const getAudio = () => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager(DEFAULT_MUSIC_SRC, DEFAULT_SFX);
      audioManagerRef.current.setMusicVolume(musicVolume);
      audioManagerRef.current.setSfxVolume(sfxVolume);
    }
    return audioManagerRef.current;
  };

  const handleScoreChange = (newScore: number) => {
    const prev = scoreRef.current;
    setScore(newScore);
    scoreRef.current = newScore;
    if (newScore > prev) {
      getAudio().playSfx('score', 0.8);
    }
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
    getAudio().stopMusic();
    getAudio().playSfx('gameover', 0.7);
    markGameOverScore(scoreRef.current);
  };

  const handleStateChange = (playing: boolean) => {
    setIsPlaying(playing);
    if (playing) {
      getAudio().startMusic();
    } else {
      getAudio().stopMusic();
    }
  };

  const handleLineClearSfx = (linesCleared: number) => {
    if (linesCleared <= 0) return;
    const name = linesCleared === 4 ? 'line_tetris' : linesCleared === 3 ? 'line_triple' : linesCleared === 2 ? 'line_double' : 'line_single';
    getAudio().playSfx(name as any, 0.9);
  };

  const handleMoveSfx = () => {
    getAudio().playSfx('move', 0.4);
  };

  const handleSoftDropSfx = () => {
    getAudio().playSfx('soft_drop', 0.5);
  };

  const handleHardDropSfx = () => {
    getAudio().playSfx('hard_drop', 0.8);
  };

  const handleRotateSfx = () => {
    getAudio().playSfx('rotate', 0.6);
  };

  const handleHoldSfx = () => {
    getAudio().playSfx('hold', 0.6);
  };

  useEffect(() => {
    if (!isPlaying && !gameOver && !hasStartedRef.current) {
      setLevel(startLevel);
    }
  }, [isPlaying, gameOver]);

  useEffect(() => {
    localStorage.setItem('tetrisPalette', palette);
  }, [palette]);

  useEffect(() => {
    localStorage.setItem('tetrisCellSize', cellSize);
  }, [cellSize]);

  useEffect(() => {
    localStorage.setItem('tetrisSensitivity', sensitivity);
  }, [sensitivity]);

  useEffect(() => {
    getAudio().setMusicVolume(musicVolume);
    localStorage.setItem('tetrisMusicVolume', musicVolume.toString());
  }, [musicVolume]);

  useEffect(() => {
    getAudio().setSfxVolume(sfxVolume);
    localStorage.setItem('tetrisSfxVolume', sfxVolume.toString());
  }, [sfxVolume]);

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
            getAudio().startMusic();
          } else {
            gameRef.current?.resumeGame();
            getAudio().startMusic();
          }
        }
        return;
      }

      switch (e.code) {
        case 'Enter':
          e.preventDefault();
          if (isPlaying) gameRef.current?.stopGame();
          else {
            gameRef.current?.resumeGame();
            getAudio().startMusic();
          }
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
            getAudio().stopMusic();
          } else {
            if (gameOver || !hasStartedRef.current) {
              hasStartedRef.current = true;
              resetGameState();
              gameRef.current?.startGame();
              getAudio().startMusic();
            } else {
              gameRef.current?.resumeGame();
              getAudio().startMusic();
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
            getAudio().stopMusic();
          } else if (gameOver) {
            hasStartedRef.current = true;
            resetGameState();
            gameRef.current?.startGame();
            getAudio().startMusic();
          } else {
            if (!hasStartedRef.current) {
              hasStartedRef.current = true;
              resetGameState();
              gameRef.current?.startGame();
              getAudio().startMusic();
            } else {
              gameRef.current?.resumeGame();
              getAudio().startMusic();
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

  const settingsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='h-9 w-9'>
          <Cog className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-72 space-y-3 p-3'>
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className='space-y-2 px-2'>
          <div className='flex items-center pt-1'>
            <span className='text-sm font-medium'>Colors</span>
          </div>
          <div className='grid grid-cols-3 gap-2'>
            {(['default', 'indigo', 'coral', 'mono', 'emerald', 'purple'] as PaletteName[]).map((name) => (
              <Button
                key={name}
                variant={palette === name ? 'default' : 'outline'}
                size='sm'
                className='h-8'
                onClick={() => setPalette(name)}
                disabled={isPlaying}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className='space-y-2 px-2'>
          <div className='flex items-center pt-1'>
            <span className='text-sm font-medium'>Cell Size</span>
          </div>
          <div className='grid grid-cols-3 gap-2'>
            {(['small', 'medium', 'large'] as CellSizeOption[]).map((size) => (
              <Button
                key={size}
                variant={cellSize === size ? 'default' : 'outline'}
                size='sm'
                className='h-8 capitalize'
                onClick={() => setCellSize(size)}
                disabled={isPlaying}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className='space-y-2 px-2'>
          <div className='flex items-center pt-1'>
            <span className='text-sm font-medium'>Key Sensitivity</span>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            {(['slow', 'normal', 'fast', 'instant'] as SensitivityOption[]).map((sens) => (
              <Button
                key={sens}
                variant={sensitivity === sens ? 'default' : 'outline'}
                size='sm'
                className='h-8 capitalize'
                onClick={() => setSensitivity(sens)}
              >
                {sens}
              </Button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className='space-y-2 px-2'>
          <div className='flex items-center justify-between pt-1'>
            <span className='text-sm font-medium'>Soundtrack</span>
            <span className='text-xs text-muted-foreground'>{Math.round(musicVolume * 100)}%</span>
          </div>
          <input
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={musicVolume}
            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
            className='w-full accent-primary'
          />
        </div>

        <div className='space-y-2 px-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>SFX</span>
            <span className='text-xs text-muted-foreground'>{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={sfxVolume}
            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
            className='w-full accent-primary'
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <GameLayout controls={controls}>
      <div className='flex items-start justify-center gap-8 w-full'>
        <div className='flex-1 max-w-md' />

        <div className='flex flex-col items-center gap-6'>
          <div className='flex items-center gap-2 mb-2'>
            {settingsMenu}
            <LeaderboardSheet
              weeklyLeaderboard={leaderboard}
              allTimeLeaderboard={allTimeLeaderboard}
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
          </div>

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
            palette={palette}
            cellSize={CELL_SIZE_OPTIONS[cellSize]}
            sensitivity={SENSITIVITY_PRESETS[sensitivity]}
            onLineClear={handleLineClearSfx}
            onMove={handleMoveSfx}
            onSoftDrop={handleSoftDropSfx}
            onHardDrop={handleHardDropSfx}
            onRotate={handleRotateSfx}
            onHold={handleHoldSfx}
          />

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

        <div className='flex-1 max-w-md' />
      </div>
    </GameLayout>
  );
}
