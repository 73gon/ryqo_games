/**
 * TetrisCore - Main game component
 * Handles game state, rendering loop, and user input
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { TETROMINO_SHAPES } from '../assets/tetromino_shapes';
import {
  CELL_SIZE,
  DAS,
  ARR,
  GRAVITY_TABLE,
  GRID_HEIGHT,
  GRID_WIDTH,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  MIN_GRAVITY_MS,
  PREVIEW_CELL_SIZE,
  SOFT_DROP_INTERVAL,
} from './constants';
import type {
  TetrisCoreProps,
  TetrisGameHandle,
  Tetromino,
  TetrominoType,
  ThemePalette,
  ClearAnimationState,
  ClearMessage,
  SpawnAnim,
  LockPulse,
  ShakeAnim,
} from './types';
import { buildPalette, clamp } from './palette';
import {
  drawGridBackground,
  drawLockedBlocks,
  drawCurrentPiece,
  drawGhostPiece,
  drawPreviewPiece,
  drawClearAnimation,
  drawClearMessages,
} from './renderer';
import {
  initGrid,
  isValidPosition,
  createPieceFromType,
  lockPiece,
  findFullLines,
  removeLines,
  calculateScore,
  getGhostPosition,
  attemptRotate,
  collectPieceCells,
  BagRandomizer,
  buildColumnOrder,
  type Grid,
} from './game-logic';
import { GameOverlay } from '../game_overlay';

export const TetrisCore = forwardRef<TetrisGameHandle, TetrisCoreProps>(
  (
    {
      startLevel,
      onScoreChange,
      onLinesChange,
      onLevelChange,
      onGameOver,
      onGameRestart,
      onStateChange,
      palette = 'default',
      onLineClear,
      onMove,
      onSoftDrop,
      onHardDrop,
      onRotate,
      onHold,
      sideControl,
    },
    ref,
  ) => {
    // Canvas refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const holdCanvasRef = useRef<HTMLCanvasElement>(null);

    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const previewCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const holdCtxRef = useRef<CanvasRenderingContext2D | null>(null);

    // Animation and timing refs
    const animationFrameRef = useRef<number | null>(null);
    const clearAnimationTimeoutRef = useRef<number | null>(null);
    const lastMoveTimeRef = useRef<number>(0);
    const isPlayingRef = useRef(false);
    const gameOverRef = useRef(false);

    // Game state refs
    const gridRef = useRef<Grid>([]);
    const bagRef = useRef(new BagRandomizer());
    const currentPieceRef = useRef<Tetromino | null>(null);
    const nextPieceRef = useRef<TetrominoType | null>(null);
    const holdPieceRef = useRef<TetrominoType | null>(null);
    const holdUsedRef = useRef(false);

    // Animation state refs
    const clearAnimationRef = useRef<ClearAnimationState | null>(null);
    const clearMessagesRef = useRef<ClearMessage[]>([]);
    const lockTimerRef = useRef<number | null>(null);
    const columnOrderRef = useRef<number[]>([]);
    const columnRankRef = useRef<number[]>([]);
    const spawnAnimRef = useRef<SpawnAnim | null>(null);
    const lockPulseRef = useRef<LockPulse | null>(null);
    const shakeRef = useRef<ShakeAnim | null>(null);

    // Score state refs
    const scoreRef = useRef(0);
    const linesRef = useRef(0);
    const levelRef = useRef(1);
    const [isPaused, setIsPaused] = useState(false);

    // Input state refs
    const leftPressedRef = useRef(false);
    const rightPressedRef = useRef(false);
    const downPressedRef = useRef(false);
    const lastHorizontalPressRef = useRef(0);
    const lastAutoShiftRef = useRef(0);
    const lockResetRef = useRef(0);
    const lastManualTapRef = useRef(0);

    // Palette ref
    const paletteRef = useRef<ThemePalette>(buildPalette(palette));

    // Bag operations
    const takeNextPiece = (): Tetromino | null => {
      const type = nextPieceRef.current ?? bagRef.current.draw();
      nextPieceRef.current = bagRef.current.draw();
      return createPieceFromType(type, gridRef.current);
    };

    // Timer management
    const startLockTimer = () => {
      if (lockTimerRef.current) return;
      lockTimerRef.current = window.setTimeout(() => {
        lockTimerRef.current = null;
        handleLock();
      }, LOCK_DELAY_MS);
    };

    const cancelLockTimer = () => {
      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }
    };

    const gravityInterval = () => {
      const levelIdx = levelRef.current - 1;
      if (levelIdx < GRAVITY_TABLE.length) {
        return GRAVITY_TABLE[levelIdx];
      }
      const extraLevels = levelIdx - (GRAVITY_TABLE.length - 1);
      const decayed = GRAVITY_TABLE[GRAVITY_TABLE.length - 1] - extraLevels * 5;
      return Math.max(MIN_GRAVITY_MS, decayed);
    };

    // Game state updates
    const finalizeClear = (lines: number[]) => {
      removeLines(gridRef.current, lines);
      const linesCleared = lines.length;
      if (linesCleared > 0) {
        const gained = calculateScore(linesCleared, levelRef.current);
        linesRef.current += linesCleared;
        scoreRef.current += gained;
        const baseLevel = Math.max(1, startLevel);
        levelRef.current = baseLevel + Math.floor(linesRef.current / 10);
        onScoreChange(scoreRef.current);
        onLinesChange(linesRef.current);
        onLevelChange(levelRef.current);

        if (linesCleared >= 2) {
          const label = linesCleared === 4 ? 'TETRIS' : linesCleared === 3 ? 'TRIPLE' : 'DOUBLE';
          const duration = linesCleared === 4 ? 1500 : 1100;
          const medianRow = lines.reduce((sum, r) => sum + r, 0) / lines.length || GRID_HEIGHT / 2;
          clearMessagesRef.current.push({
            id: performance.now() + Math.random(),
            text: label,
            points: gained,
            start: performance.now(),
            duration,
            color: linesCleared === 4 ? '#f97316' : undefined,
            row: medianRow,
          });
        }
      }

      if (linesCleared === 4) {
        shakeRef.current = {
          start: performance.now(),
          duration: 450,
          amplitude: 4,
        };
      }

      clearAnimationRef.current = null;

      const spawned = takeNextPiece();
      if (!spawned) {
        gameOverRef.current = true;
        isPlayingRef.current = false;
        setIsPaused(false);
        onStateChange(false);
        onGameOver();
        render();
        return;
      }
      currentPieceRef.current = spawned;
      render();
    };

    const startClearAnimation = (lines: number[]) => {
      const duration = lines.length >= 4 ? 650 : 360;

      clearAnimationRef.current = {
        lines,
        start: performance.now(),
        duration,
        isTetris: lines.length >= 4,
      };
      if (clearAnimationTimeoutRef.current) {
        clearTimeout(clearAnimationTimeoutRef.current);
      }
      clearAnimationTimeoutRef.current = window.setTimeout(() => finalizeClear(lines), duration);
      render();
    };

    const handleLock = () => {
      if (!currentPieceRef.current) return false;
      lockPiece(currentPieceRef.current, gridRef.current);
      holdUsedRef.current = false;
      cancelLockTimer();
      lockPulseRef.current = {
        cells: collectPieceCells(currentPieceRef.current),
        start: performance.now(),
        duration: 220,
      };
      const fullLines = findFullLines(gridRef.current);
      if (fullLines.length > 0) {
        currentPieceRef.current = null;
        startClearAnimation(fullLines);
        onLineClear?.(fullLines.length);
        return true;
      }

      const newPiece = takeNextPiece();
      if (!newPiece) {
        gameOverRef.current = true;
        isPlayingRef.current = false;
        setIsPaused(false);
        onStateChange(false);
        onGameOver();
        render();
        return false;
      }

      currentPieceRef.current = newPiece;
      spawnAnimRef.current = { start: performance.now(), duration: 110 };
      render();
      return true;
    };

    // Movement functions
    const moveDown = (): boolean => {
      if (!currentPieceRef.current || clearAnimationRef.current) return false;
      const newPiece = {
        ...currentPieceRef.current,
        y: currentPieceRef.current.y + 1,
      };
      if (isValidPosition(newPiece, gridRef.current)) {
        currentPieceRef.current = newPiece;
        cancelLockTimer();
        return true;
      }
      startLockTimer();
      return false;
    };

    const applyGravity = () => {
      if (!currentPieceRef.current || clearAnimationRef.current) return;
      const newPiece = {
        ...currentPieceRef.current,
        y: currentPieceRef.current.y + 1,
      };
      if (isValidPosition(newPiece, gridRef.current)) {
        currentPieceRef.current = newPiece;
      } else {
        startLockTimer();
      }
    };

    const processSoftDrop = (now: number) => {
      if (!downPressedRef.current || clearAnimationRef.current || !currentPieceRef.current) return;
      if (now - lastMoveTimeRef.current < SOFT_DROP_INTERVAL) return;
      const moved = moveDown();
      if (!moved) startLockTimer();
      lastMoveTimeRef.current = now;
    };

    const moveHorizontal = (dir: number) => {
      if (!currentPieceRef.current) return false;
      const moved = {
        ...currentPieceRef.current,
        x: currentPieceRef.current.x + dir,
      };
      if (isValidPosition(moved, gridRef.current)) {
        currentPieceRef.current = moved;
        onMove?.();
        const below = { ...moved, y: moved.y + 1 };
        if (!isValidPosition(below, gridRef.current) && lockResetRef.current < MAX_LOCK_RESETS) {
          lockResetRef.current += 1;
          cancelLockTimer();
        }
        return true;
      }
      return false;
    };

    const processHorizontal = (now: number) => {
      if (!currentPieceRef.current || clearAnimationRef.current) return;
      const left = leftPressedRef.current;
      const right = rightPressedRef.current;
      if (left && right) return;
      const dir = left ? -1 : right ? 1 : 0;
      if (!dir) return;

      if (lastHorizontalPressRef.current === 0) {
        if (moveHorizontal(dir)) {
          lastHorizontalPressRef.current = now;
          lastAutoShiftRef.current = now;
        }
        return;
      }

      const sincePress = now - lastHorizontalPressRef.current;
      if (sincePress < DAS) return;
      if (now - lastAutoShiftRef.current >= ARR) {
        if (moveHorizontal(dir)) {
          lastAutoShiftRef.current = now;
        }
      }
    };

    // Rendering
    const render = (timestamp: number = performance.now()) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      const shake = shakeRef.current;
      if (shake && timestamp - shake.start > shake.duration) {
        shakeRef.current = null;
      }
      const shakeProgress = shake && shake.duration > 0 ? 1 - clamp((timestamp - shake.start) / shake.duration, 0, 1) : 0;
      const shakeOffset = shake && shakeProgress > 0 ? Math.sin(timestamp * 0.05) * shake.amplitude * shakeProgress : 0;

      ctx.save();
      if (shakeOffset !== 0) {
        ctx.translate(shakeOffset, shakeOffset / 2);
      }

      drawGridBackground(ctx, paletteRef.current);
      const anim = clearAnimationRef.current;
      const skip = anim ? new Set(anim.lines) : undefined;
      drawLockedBlocks(ctx, gridRef.current, paletteRef.current, skip, timestamp, lockPulseRef.current);

      if (currentPieceRef.current) {
        const ghostY = getGhostPosition(currentPieceRef.current, gridRef.current);
        drawGhostPiece(ctx, currentPieceRef.current, ghostY, paletteRef.current);
        drawCurrentPiece(ctx, currentPieceRef.current, paletteRef.current, timestamp, spawnAnimRef.current);
      }

      if (anim) {
        drawClearAnimation(ctx, anim, timestamp, gridRef.current, paletteRef.current, columnRankRef.current, columnOrderRef.current);
      }
      clearMessagesRef.current = drawClearMessages(ctx, clearMessagesRef.current, timestamp);

      drawPreviewPiece(previewCtxRef.current, nextPieceRef.current, paletteRef.current);
      drawPreviewPiece(holdCtxRef.current, holdPieceRef.current, paletteRef.current);

      ctx.restore();
    };

    // Game loop
    const gameLoop = (timestamp: number) => {
      if (!isPlayingRef.current || gameOverRef.current) return;

      const moveInterval = gravityInterval();

      if (!clearAnimationRef.current && timestamp - lastMoveTimeRef.current > moveInterval) {
        applyGravity();
        lastMoveTimeRef.current = timestamp;
      }

      processSoftDrop(timestamp);
      processHorizontal(timestamp);
      render(timestamp);
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    const refreshPalette = () => {
      paletteRef.current = buildPalette(palette);
      render();
    };

    const resumeInternal = () => {
      if (gameOverRef.current) return;
      if (!currentPieceRef.current) {
        const next = takeNextPiece();
        if (!next) {
          gameOverRef.current = true;
          isPlayingRef.current = false;
          setIsPaused(false);
          onStateChange(false);
          onGameOver();
          return;
        }
        currentPieceRef.current = next;
      }
      isPlayingRef.current = true;
      setIsPaused(false);
      onStateChange(true);
      lastMoveTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      render();
    };

    useImperativeHandle(ref, () => ({
      startGame: () => {
        refreshPalette();
        gridRef.current = initGrid();
        scoreRef.current = 0;
        linesRef.current = 0;
        levelRef.current = Math.max(1, startLevel);
        holdPieceRef.current = null;
        holdUsedRef.current = false;
        gameOverRef.current = false;
        clearAnimationRef.current = null;
        clearMessagesRef.current = [];
        spawnAnimRef.current = null;
        lockPulseRef.current = null;
        shakeRef.current = null;
        bagRef.current.reset();
        lockResetRef.current = 0;
        leftPressedRef.current = false;
        rightPressedRef.current = false;
        downPressedRef.current = false;
        lastHorizontalPressRef.current = 0;
        lastAutoShiftRef.current = 0;
        cancelLockTimer();
        onScoreChange(0);
        onLinesChange(0);
        onLevelChange(levelRef.current);
        onGameRestart();

        nextPieceRef.current = bagRef.current.draw();
        currentPieceRef.current = takeNextPiece();

        isPlayingRef.current = true;
        setIsPaused(false);
        onStateChange(true);
        lastMoveTimeRef.current = performance.now();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        render();
      },
      stopGame: () => {
        isPlayingRef.current = false;
        setIsPaused(true);
        onStateChange(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        cancelLockTimer();
        clearMessagesRef.current = [];
      },
      resumeGame: resumeInternal,
      moveLeft: (pressed = true) => {
        if (!isPlayingRef.current) return;
        if (!pressed) {
          leftPressedRef.current = false;
          lastHorizontalPressRef.current = 0;
          lastAutoShiftRef.current = 0;
          return;
        }
        leftPressedRef.current = true;
        rightPressedRef.current = false;
        if (!currentPieceRef.current || clearAnimationRef.current) return;
        const now = performance.now();
        if (now - lastManualTapRef.current < 70) return;
        lastManualTapRef.current = now;
        lastHorizontalPressRef.current = now;
        lastAutoShiftRef.current = now;
        const newPiece = {
          ...currentPieceRef.current,
          x: currentPieceRef.current.x - 1,
        };
        if (isValidPosition(newPiece, gridRef.current)) {
          currentPieceRef.current = newPiece;
          onMove?.();
          cancelLockTimer();
          lockResetRef.current = 0;
          render();
        }
      },
      moveRight: (pressed = true) => {
        if (!isPlayingRef.current) return;
        if (!pressed) {
          rightPressedRef.current = false;
          lastHorizontalPressRef.current = 0;
          lastAutoShiftRef.current = 0;
          return;
        }
        rightPressedRef.current = true;
        leftPressedRef.current = false;
        if (!currentPieceRef.current || clearAnimationRef.current) return;
        const now = performance.now();
        if (now - lastManualTapRef.current < 70) return;
        lastManualTapRef.current = now;
        lastHorizontalPressRef.current = now;
        lastAutoShiftRef.current = now;
        const newPiece = {
          ...currentPieceRef.current,
          x: currentPieceRef.current.x + 1,
        };
        if (isValidPosition(newPiece, gridRef.current)) {
          currentPieceRef.current = newPiece;
          onMove?.();
          cancelLockTimer();
          lockResetRef.current = 0;
          render();
        }
      },
      moveDown: (pressed = true) => {
        if (!isPlayingRef.current) return;
        if (!pressed) {
          downPressedRef.current = false;
          return;
        }
        downPressedRef.current = true;
        if (!currentPieceRef.current || clearAnimationRef.current) return;
        const moved = moveDown();
        if (moved) {
          onSoftDrop?.();
          render();
        }
      },
      rotate: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || clearAnimationRef.current) return;
        const piece = currentPieceRef.current;
        const numRotations = TETROMINO_SHAPES[piece.type].length;
        const newRotation = (piece.rotation + 1) % numRotations;
        const kicked = attemptRotate(piece, newRotation, gridRef.current);
        if (kicked) {
          currentPieceRef.current = kicked;
          if (lockResetRef.current < MAX_LOCK_RESETS) lockResetRef.current += 1;
          cancelLockTimer();
          onRotate?.();
          render();
        }
      },
      hardDrop: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || clearAnimationRef.current) return;
        const ghostY = getGhostPosition(currentPieceRef.current, gridRef.current);
        currentPieceRef.current = { ...currentPieceRef.current, y: ghostY };
        cancelLockTimer();
        onHardDrop?.();
        handleLock();
        render();
      },
      holdPiece: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || holdUsedRef.current) return;
        if (clearAnimationRef.current) return;

        cancelLockTimer();
        lockResetRef.current = 0;

        const currentType = currentPieceRef.current.type;

        if (!holdPieceRef.current) {
          holdPieceRef.current = currentType;
          const next = takeNextPiece();
          if (!next) {
            gameOverRef.current = true;
            isPlayingRef.current = false;
            onStateChange(false);
            onGameOver();
            return;
          }
          currentPieceRef.current = next;
        } else {
          const swapType = holdPieceRef.current;
          holdPieceRef.current = currentType;
          const swapped = createPieceFromType(swapType, gridRef.current);
          if (!swapped) {
            gameOverRef.current = true;
            isPlayingRef.current = false;
            onStateChange(false);
            onGameOver();
            return;
          }
          currentPieceRef.current = swapped;
        }

        holdUsedRef.current = true;
        drawPreviewPiece(holdCtxRef.current, holdPieceRef.current, paletteRef.current);
        onHold?.();
        render();
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = GRID_WIDTH * CELL_SIZE;
      canvas.height = GRID_HEIGHT * CELL_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctxRef.current = ctx;

      const previewCanvas = previewCanvasRef.current;
      if (previewCanvas) {
        previewCanvas.width = 4 * PREVIEW_CELL_SIZE;
        previewCanvas.height = 4 * PREVIEW_CELL_SIZE;
        previewCtxRef.current = previewCanvas.getContext('2d');
      }

      const holdCanvas = holdCanvasRef.current;
      if (holdCanvas) {
        holdCanvas.width = 4 * PREVIEW_CELL_SIZE;
        holdCanvas.height = 4 * PREVIEW_CELL_SIZE;
        holdCtxRef.current = holdCanvas.getContext('2d');
      }

      gridRef.current = initGrid();
      paletteRef.current = buildPalette(palette);

      const { order, rank } = buildColumnOrder();
      columnOrderRef.current = order;
      columnRankRef.current = rank;

      bagRef.current.reset();
      nextPieceRef.current = bagRef.current.draw();
      spawnAnimRef.current = null;
      lockPulseRef.current = null;
      shakeRef.current = null;
      lockResetRef.current = 0;
      leftPressedRef.current = false;
      rightPressedRef.current = false;
      downPressedRef.current = false;
      lastHorizontalPressRef.current = 0;
      lastAutoShiftRef.current = 0;
      render();

      const observer = new MutationObserver(refreshPalette);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => {
        observer.disconnect();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (clearAnimationTimeoutRef.current) {
          clearTimeout(clearAnimationTimeoutRef.current);
        }
        cancelLockTimer();
        clearMessagesRef.current = [];
        clearAnimationRef.current = null;
      };
    }, []);

    useEffect(() => {
      paletteRef.current = buildPalette(palette);
      render();
    }, [palette]);

    return (
      <div className='flex items-start gap-4'>
        <div className='relative'>
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            className='border-2 border-border rounded-lg shadow-sm'
            style={{
              backgroundColor: paletteRef.current.background,
              filter: isPaused ? 'blur(3px)' : 'none',
              transition: 'filter 150ms ease',
            }}
          />

          <GameOverlay isPaused={isPaused} isGameOver={gameOverRef.current} />
        </div>

        <div className='flex flex-col gap-3 w-[110px] text-xs text-muted-foreground relative'>
          <div className='rounded-md border border-border bg-card p-2 shadow-sm'>
            <div className='text-[11px] font-semibold uppercase tracking-wide text-foreground/80'>Next</div>
            <canvas ref={previewCanvasRef} width={4 * PREVIEW_CELL_SIZE} height={4 * PREVIEW_CELL_SIZE} className='mt-2' />
          </div>

          <div className='rounded-md border border-border bg-card p-2 shadow-sm'>
            <div className='text-[11px] font-semibold uppercase tracking-wide text-foreground/80'>Hold</div>
            <canvas ref={holdCanvasRef} width={4 * PREVIEW_CELL_SIZE} height={4 * PREVIEW_CELL_SIZE} className='mt-2' />
          </div>

          {sideControl && <div className='mt-2 flex justify-end'>{sideControl}</div>}
        </div>
      </div>
    );
  },
);

TetrisCore.displayName = 'TetrisCore';

// Re-export types for convenience
export type { TetrisGameHandle, TetrisCoreProps, PaletteName } from './types';
