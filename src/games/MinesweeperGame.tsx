import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { GameLayout } from '@/components/game-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, Bomb, RotateCcw, Timer, Trophy, Frown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 8, cols: 8, mines: 10 },
  medium: { rows: 12, cols: 12, mines: 30 },
  hard: { rows: 16, cols: 16, mines: 60 },
};

type Cell = {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-500',
  2: 'text-green-500',
  3: 'text-red-500',
  4: 'text-purple-600',
  5: 'text-amber-600',
  6: 'text-cyan-600',
  7: 'text-gray-800 dark:text-gray-200',
  8: 'text-gray-500',
};

export function MinesweeperGame() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagsLeft, setFlagsLeft] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { rows, cols, mines } = DIFFICULTY_CONFIG[difficulty];

  const initGame = useCallback(() => {
    // Create empty grid
    const newGrid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setGameOver(false);
    setWon(false);
    setFlagsLeft(mines);
    setFirstClick(true);
    setTimer(0);
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [rows, cols, mines]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isPlaying && !gameOver && !won) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, gameOver, won]);

  const placeMines = (excludeR: number, excludeC: number, currentGrid: Cell[][]) => {
    // Place mines avoiding first click area
    const newGrid = currentGrid.map((row) => row.map((cell) => ({ ...cell })));
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      // Avoid placing mine on first click or adjacent cells
      const isExcluded = Math.abs(r - excludeR) <= 1 && Math.abs(c - excludeC) <= 1;
      if (!newGrid[r][c].isMine && !isExcluded) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (newGrid[r][c].isMine) continue;

        let neighbors = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const nr = r + i;
            const nc = c + j;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc].isMine) {
              neighbors++;
            }
          }
        }
        newGrid[r][c].neighborMines = neighbors;
      }
    }

    return newGrid;
  };

  const revealCell = (r: number, c: number) => {
    if (gameOver || won || grid[r]?.[c]?.isRevealed || grid[r]?.[c]?.isFlagged) return;

    let currentGrid = grid;

    if (firstClick) {
      currentGrid = placeMines(r, c, grid);
      setFirstClick(false);
      setIsPlaying(true);
    }

    const newGrid = currentGrid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = newGrid[r][c];

    if (cell.isMine) {
      // Game Over
      cell.isRevealed = true;
      // Reveal all mines
      newGrid.forEach((row) =>
        row.forEach((c) => {
          if (c.isMine) c.isRevealed = true;
        }),
      );
      setGrid(newGrid);
      setGameOver(true);
      setIsPlaying(false);
      return;
    }

    // Flood fill if 0 neighbors
    const stack = [{ r, c }];
    while (stack.length > 0) {
      const { r: currR, c: currC } = stack.pop()!;

      if (newGrid[currR][currC].isRevealed) continue;
      newGrid[currR][currC].isRevealed = true;

      if (newGrid[currR][currC].neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const nr = currR + i;
            const nc = currC + j;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !newGrid[nr][nc].isRevealed && !newGrid[nr][nc].isFlagged) {
              stack.push({ r: nr, c: nc });
            }
          }
        }
      }
    }

    setGrid(newGrid);
    checkWin(newGrid);
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won || grid[r][c].isRevealed || firstClick) return;

    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = newGrid[r][c];

    if (!cell.isFlagged && flagsLeft === 0) return;

    cell.isFlagged = !cell.isFlagged;
    setGrid(newGrid);
    setFlagsLeft((prev) => (cell.isFlagged ? prev - 1 : prev + 1));
  };

  const checkWin = (currentGrid: Cell[][]) => {
    let unrevealedSafeCells = 0;
    currentGrid.forEach((row) =>
      row.forEach((cell) => {
        if (!cell.isMine && !cell.isRevealed) unrevealedSafeCells++;
      }),
    );
    if (unrevealedSafeCells === 0) {
      setWon(true);
      setGameOver(true);
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCellSize = () => {
    switch (difficulty) {
      case 'easy':
        return 'w-10 h-10 sm:w-12 sm:h-12';
      case 'medium':
        return 'w-8 h-8 sm:w-10 sm:h-10';
      case 'hard':
        return 'w-6 h-6 sm:w-7 sm:h-7';
    }
  };

  return (
    <GameLayout
      controls={
        <div className='flex items-center gap-3 sm:gap-4 flex-wrap justify-center'>
          <Select value={difficulty} onValueChange={(v: Difficulty | null) => v && setDifficulty(v)}>
            <SelectTrigger className='w-28'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='easy'>{t('games.minesweeper.easy', 'Easy')}</SelectItem>
              <SelectItem value='medium'>{t('games.minesweeper.medium', 'Medium')}</SelectItem>
              <SelectItem value='hard'>{t('games.minesweeper.hard', 'Hard')}</SelectItem>
            </SelectContent>
          </Select>

          <div className='flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md'>
            <Timer className='h-4 w-4 text-muted-foreground' />
            <span className='font-mono font-bold tabular-nums'>{formatTime(timer)}</span>
          </div>

          <div className='flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md'>
            <Flag className='h-4 w-4 text-red-500' />
            <span className='font-mono font-bold tabular-nums'>{flagsLeft}</span>
          </div>

          <Button onClick={initGame} variant='outline' size='icon' className='h-9 w-9'>
            <RotateCcw className='h-4 w-4' />
          </Button>
        </div>
      }
    >
      <div className='flex flex-col items-center gap-4'>
        {/* Game Grid */}
        <div className='grid gap-0.5 bg-border p-1 rounded-lg shadow-lg' style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <motion.button
                key={`${r}-${c}`}
                initial={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  getCellSize(),
                  'flex items-center justify-center text-sm font-bold rounded transition-all duration-100',
                  !cell.isRevealed && 'bg-linear-to-br from-muted to-muted/80 hover:from-muted/90 hover:to-muted/70 shadow-sm border border-border',
                  cell.isRevealed && !cell.isMine && 'bg-background border border-border/50',
                  cell.isRevealed && cell.isMine && 'bg-red-500/20 border border-red-500',
                  cell.isFlagged && !cell.isRevealed && 'bg-amber-100 dark:bg-amber-900/30 border-amber-400',
                )}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                disabled={gameOver || won}
              >
                <AnimatePresence mode='wait'>
                  {cell.isFlagged && !cell.isRevealed && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Flag className='h-4 w-4 text-red-500' />
                    </motion.div>
                  )}
                  {cell.isRevealed && cell.isMine && (
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}>
                      <Bomb className='h-4 w-4 text-red-600' />
                    </motion.div>
                  )}
                  {cell.isRevealed && !cell.isMine && cell.neighborMines > 0 && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('font-bold', NUMBER_COLORS[cell.neighborMines])}>
                      {cell.neighborMines}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )),
          )}
        </div>

        {/* Game Over / Win overlay */}
        <AnimatePresence>
          {(gameOver || won) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                'flex items-center gap-3 px-6 py-3 rounded-lg',
                won ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
              )}
            >
              {won ? (
                <>
                  <Trophy className='h-6 w-6 text-green-600 dark:text-green-400' />
                  <span className='text-lg font-bold text-green-700 dark:text-green-300'>
                    {t('games.common.youWin')} - {formatTime(timer)}
                  </span>
                </>
              ) : (
                <>
                  <Frown className='h-6 w-6 text-red-600 dark:text-red-400' />
                  <span className='text-lg font-bold text-red-700 dark:text-red-300'>{t('games.common.gameOver')}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className='text-sm text-muted-foreground text-center'>{t('games.minesweeper.hint', 'Left click to reveal • Right click to flag')}</p>
      </div>
    </GameLayout>
  );
}
