import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GameLayout } from '@/components/game-layout';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ElectricBorder from '@/components/electric-border';

const GRID_SIZE = 4;
const CELL_SIZE = 80;
const CELL_GAP = 12;

type Tile = {
  id: number;
  value: number;
  x: number;
  y: number;
  isNew?: boolean;
  isMerged?: boolean;
};

type GameState = {
  tiles: Tile[];
  score: number;
};

const getTileColor = (value: number, isDark: boolean) => {
  const colors: Record<number, { bg: string; text: string }> = {
    2: { bg: isDark ? 'bg-zinc-700' : 'bg-amber-100', text: isDark ? 'text-zinc-100' : 'text-zinc-800' },
    4: { bg: isDark ? 'bg-zinc-600' : 'bg-amber-200', text: isDark ? 'text-zinc-100' : 'text-zinc-800' },
    8: { bg: isDark ? 'bg-orange-600' : 'bg-orange-400', text: 'text-white' },
    16: { bg: isDark ? 'bg-orange-500' : 'bg-orange-500', text: 'text-white' },
    32: { bg: isDark ? 'bg-red-600' : 'bg-red-400', text: 'text-white' },
    64: { bg: isDark ? 'bg-red-500' : 'bg-red-500', text: 'text-white' },
    128: { bg: isDark ? 'bg-yellow-500' : 'bg-yellow-400', text: 'text-white' },
    256: { bg: isDark ? 'bg-yellow-400' : 'bg-yellow-500', text: 'text-white' },
    512: { bg: isDark ? 'bg-yellow-300' : 'bg-yellow-600', text: isDark ? 'text-zinc-800' : 'text-white' },
    1024: { bg: isDark ? 'bg-emerald-500' : 'bg-emerald-500', text: 'text-white' },
    2048: { bg: isDark ? 'bg-emerald-400' : 'bg-emerald-400', text: 'text-white' },
  };
  return colors[value] || { bg: isDark ? 'bg-purple-600' : 'bg-purple-500', text: 'text-white' };
};

const getFontSize = (value: number) => {
  if (value < 100) return 'text-4xl';
  if (value < 1000) return 'text-3xl';
  if (value < 10000) return 'text-2xl';
  return 'text-xl';
};

export function Game2048() {
  const { t } = useTranslation();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('2048BestScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [continueAfterWin, setContinueAfterWin] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [history, setHistory] = useState<GameState[]>([]);
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect dark mode
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const addRandomTile = useCallback((currentTiles: Tile[], idStart: number): { tiles: Tile[]; nextId: number } => {
    const emptyCells: { x: number; y: number }[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!currentTiles.find((t) => t.x === x && t.y === y)) {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length === 0) return { tiles: currentTiles, nextId: idStart };

    const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    return {
      tiles: [...currentTiles, { id: idStart, value, x, y, isNew: true }],
      nextId: idStart + 1,
    };
  }, []);

  const checkGameOver = useCallback((currentTiles: Tile[]): boolean => {
    // Check if any empty cells
    if (currentTiles.length < GRID_SIZE * GRID_SIZE) return false;

    // Check for possible merges
    for (const tile of currentTiles) {
      const neighbors = [
        { x: tile.x - 1, y: tile.y },
        { x: tile.x + 1, y: tile.y },
        { x: tile.x, y: tile.y - 1 },
        { x: tile.x, y: tile.y + 1 },
      ];
      for (const n of neighbors) {
        const neighbor = currentTiles.find((t) => t.x === n.x && t.y === n.y);
        if (neighbor && neighbor.value === tile.value) return false;
      }
    }
    return true;
  }, []);

  const initGame = useCallback(() => {
    let result = addRandomTile([], 1);
    result = addRandomTile(result.tiles, result.nextId);
    setTiles(result.tiles);
    setNextId(result.nextId);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setContinueAfterWin(false);
    setHistory([]);
  }, [addRandomTile]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('2048BestScore', score.toString());
    }
  }, [score, bestScore]);

  const move = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (gameOver || (won && !continueAfterWin)) return;

      setTiles((prevTiles) => {
        // Save history
        setHistory((h) => [...h.slice(-9), { tiles: prevTiles, score }]);

        let moved = false;
        let newScore = score;
        let idCounter = nextId;

        // Clear flags
        let workingTiles = prevTiles.map((t) => ({ ...t, isNew: false, isMerged: false }));

        // Process each line
        const lines: Tile[][] = [];
        for (let i = 0; i < GRID_SIZE; i++) {
          const line = workingTiles.filter((t) => (direction === 'UP' || direction === 'DOWN' ? t.x === i : t.y === i));
          if (direction === 'UP' || direction === 'LEFT') {
            line.sort((a, b) => (direction === 'UP' ? a.y - b.y : a.x - b.x));
          } else {
            line.sort((a, b) => (direction === 'DOWN' ? b.y - a.y : b.x - a.x));
          }
          lines.push(line);
        }

        const nextTiles: Tile[] = [];

        lines.forEach((line, lineIndex) => {
          const newLine: Tile[] = [];
          let targetPos = 0;

          for (let i = 0; i < line.length; i++) {
            const tile = line[i];
            const lastTile = newLine[newLine.length - 1];

            if (lastTile && lastTile.value === tile.value && !lastTile.isMerged) {
              // Merge
              const mergedValue = lastTile.value * 2;
              newLine[newLine.length - 1] = {
                ...lastTile,
                value: mergedValue,
                isMerged: true,
                id: idCounter++,
              };
              newScore += mergedValue;
              moved = true;

              // Check win
              if (mergedValue === 2048 && !won && !continueAfterWin) {
                setWon(true);
              }
            } else {
              let newX = tile.x;
              let newY = tile.y;

              if (direction === 'UP') {
                newX = lineIndex;
                newY = targetPos;
              } else if (direction === 'DOWN') {
                newX = lineIndex;
                newY = GRID_SIZE - 1 - targetPos;
              } else if (direction === 'LEFT') {
                newX = targetPos;
                newY = lineIndex;
              } else {
                newX = GRID_SIZE - 1 - targetPos;
                newY = lineIndex;
              }

              if (newX !== tile.x || newY !== tile.y) moved = true;

              newLine.push({ ...tile, x: newX, y: newY });
              targetPos++;
            }
          }
          nextTiles.push(...newLine);
        });

        if (!moved) return prevTiles;

        setScore(newScore);

        // Add new tile
        const result = addRandomTile(nextTiles, idCounter);
        setNextId(result.nextId);

        // Check game over
        if (checkGameOver(result.tiles)) {
          setGameOver(true);
        }

        return result.tiles;
      });
    },
    [gameOver, won, continueAfterWin, score, nextId, addRandomTile, checkGameOver],
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setTiles(lastState.tiles);
    setScore(lastState.score);
    setHistory((h) => h.slice(0, -1));
    setGameOver(false);
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowUp':
          move('UP');
          break;
        case 'ArrowDown':
          move('DOWN');
          break;
        case 'ArrowLeft':
          move('LEFT');
          break;
        case 'ArrowRight':
          move('RIGHT');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        move(diffX > 0 ? 'RIGHT' : 'LEFT');
      } else {
        move(diffY > 0 ? 'DOWN' : 'UP');
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [move]);

  const gridSize = GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * CELL_GAP;

  return (
    <GameLayout
      controls={
        <div className='flex items-center gap-3'>
          <div className='bg-muted px-4 py-2 rounded-lg'>
            <span className='text-xs uppercase font-bold text-muted-foreground block'>{t('games.common.score')}</span>
            <span className='text-xl font-bold'>{score}</span>
          </div>
          <div className='bg-muted px-4 py-2 rounded-lg'>
            <span className='text-xs uppercase font-bold text-muted-foreground flex items-center gap-1'>
              <Trophy className='h-3 w-3' />
              {t('games.common.best', 'Best')}
            </span>
            <span className='text-xl font-bold'>{bestScore}</span>
          </div>
          <Button onClick={undo} variant='outline' size='icon' disabled={history.length === 0}>
            <Undo2 className='h-4 w-4' />
          </Button>
          <Button onClick={initGame} variant='outline' size='icon'>
            <RotateCcw className='h-4 w-4' />
          </Button>
        </div>
      }
    >
      <div className='flex flex-col items-center gap-6'>
        <ElectricBorder color='#f59e0b' thickness={2} className='rounded-xl'>
          <div
            ref={containerRef}
            className='relative rounded-xl p-3 bg-zinc-300 dark:bg-zinc-800 touch-none select-none'
            style={{ width: gridSize, height: gridSize }}
          >
            {/* Grid Background */}
            <div
              className='grid gap-3 w-full h-full'
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                <div key={i} className='bg-zinc-200 dark:bg-zinc-700 rounded-lg' />
              ))}
            </div>

            {/* Tiles */}
            <AnimatePresence>
              {tiles.map((tile) => {
                const colors = getTileColor(tile.value, isDark);
                return (
                  <motion.div
                    key={tile.id}
                    initial={tile.isNew ? { scale: 0, opacity: 0 } : tile.isMerged ? { scale: 1.2 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      duration: 0.15,
                    }}
                    className={cn(
                      'absolute flex items-center justify-center rounded-lg font-bold shadow-lg',
                      getFontSize(tile.value),
                      colors.bg,
                      colors.text,
                    )}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      left: CELL_GAP + tile.x * (CELL_SIZE + CELL_GAP),
                      top: CELL_GAP + tile.y * (CELL_SIZE + CELL_GAP),
                      transition: 'left 0.12s ease, top 0.12s ease',
                    }}
                  >
                    {tile.value}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Overlay for Game Over / Won */}
            <AnimatePresence>
              {(gameOver || (won && !continueAfterWin)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl gap-4'
                >
                  <h2 className={cn('text-4xl font-bold', won ? 'text-amber-500' : 'text-foreground')}>
                    {won ? '🎉 2048!' : t('games.common.gameOver')}
                  </h2>
                  <p className='text-lg text-muted-foreground'>
                    {t('games.common.finalScore', 'Final Score')}: {score}
                  </p>
                  <div className='flex gap-2'>
                    {won && (
                      <Button onClick={() => setContinueAfterWin(true)} variant='outline'>
                        {t('games.2048.continue', 'Keep Playing')}
                      </Button>
                    )}
                    <Button onClick={initGame}>{t('games.common.restart')}</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ElectricBorder>

        <p className='text-sm text-muted-foreground text-center'>
          {t('games.2048.instructions', 'Use arrow keys or swipe to move tiles. Merge matching numbers to reach 2048!')}
        </p>
      </div>
    </GameLayout>
  );
}
