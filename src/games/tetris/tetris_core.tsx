import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { TETROMINO_SHAPES, SPAWN_POSITIONS, type TetrominoType } from './assets/tetromino_shapes';
import {
  ARR,
  CELL_SIZE,
  DAS,
  GRAVITY_TABLE,
  GRID_HEIGHT,
  GRID_WIDTH,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  MIN_GRAVITY_MS,
  PREVIEW_CELL_SIZE,
  SOFT_DROP_INTERVAL,
  kicksI,
  kicksJLSTZ,
} from './constants';
import { buildPalette, clamp, type ThemePalette, type PaletteName, withAlpha } from './utils';
import { Pause } from 'lucide-react';

interface TetrisCoreProps {
  startLevel: number;
  onScoreChange: (score: number) => void;
  onLinesChange: (lines: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: () => void;
  onGameRestart: () => void;
  onStateChange: (playing: boolean) => void;
  palette?: PaletteName;
}

export interface TetrisGameHandle {
  startGame: () => void;
  stopGame: () => void;
  resumeGame: () => void;
  moveLeft: (pressed?: boolean) => void;
  moveRight: (pressed?: boolean) => void;
  moveDown: (pressed?: boolean) => void;
  rotate: () => void;
  hardDrop: () => void;
  holdPiece: () => void;
}

interface Tetromino {
  type: TetrominoType;
  rotation: number;
  x: number;
  y: number;
}

interface ClearAnimationState {
  lines: number[];
  start: number;
  duration: number;
  isTetris: boolean;
}

interface ClearMessage {
  id: number;
  text: string;
  points: number;
  start: number;
  duration: number;
  color?: string;
  row: number;
}

interface SpawnAnim {
  start: number;
  duration: number;
}

interface LockPulse {
  cells: { x: number; y: number; type: TetrominoType }[];
  start: number;
  duration: number;
}

interface ShakeAnim {
  start: number;
  duration: number;
  amplitude: number;
}

export const TetrisCore = forwardRef<TetrisGameHandle, TetrisCoreProps>(
  ({ startLevel, onScoreChange, onLinesChange, onLevelChange, onGameOver, onGameRestart, onStateChange, palette = 'default' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const holdCanvasRef = useRef<HTMLCanvasElement>(null);

    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const previewCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const holdCtxRef = useRef<CanvasRenderingContext2D | null>(null);

    const animationFrameRef = useRef<number | null>(null);
    const clearAnimationTimeoutRef = useRef<number | null>(null);
    const lastMoveTimeRef = useRef<number>(0);
    const isPlayingRef = useRef(false);
    const gameOverRef = useRef(false);

    const gridRef = useRef<(TetrominoType | null)[][]>([]);
    const bagRef = useRef<TetrominoType[]>([]);
    const currentPieceRef = useRef<Tetromino | null>(null);
    const nextPieceRef = useRef<TetrominoType | null>(null);
    const holdPieceRef = useRef<TetrominoType | null>(null);
    const holdUsedRef = useRef(false);
    const clearAnimationRef = useRef<ClearAnimationState | null>(null);
    const clearMessagesRef = useRef<ClearMessage[]>([]);
    const lockTimerRef = useRef<number | null>(null);
    const columnOrderRef = useRef<number[]>([]);
    const columnRankRef = useRef<number[]>([]);
    const spawnAnimRef = useRef<SpawnAnim | null>(null);
    const lockPulseRef = useRef<LockPulse | null>(null);
    const shakeRef = useRef<ShakeAnim | null>(null);

    const scoreRef = useRef(0);
    const linesRef = useRef(0);
    const levelRef = useRef(1);
    const [isPaused, setIsPaused] = useState(false);
    const leftPressedRef = useRef(false);
    const rightPressedRef = useRef(false);
    const downPressedRef = useRef(false);
    const lastHorizontalPressRef = useRef(0);
    const lastAutoShiftRef = useRef(0);
    const lockResetRef = useRef(0);
    const lastManualTapRef = useRef(0);

    const paletteRef = useRef<ThemePalette>(buildPalette(palette));

    const collectPieceCells = (piece: Tetromino): { x: number; y: number; type: TetrominoType }[] => {
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
      const cells: { x: number; y: number; type: TetrominoType }[] = [];
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            cells.push({ x: piece.x + col, y: piece.y + row, type: piece.type });
          }
        }
      }
      return cells;
    };

    const initGrid = () => {
      gridRef.current = Array(GRID_HEIGHT)
        .fill(null)
        .map(() => Array(GRID_WIDTH).fill(null));
    };

    const refillBag = () => {
      const bag: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      bagRef.current = bagRef.current.concat(bag);
    };

    const drawFromBag = (): TetrominoType => {
      if (bagRef.current.length === 0) {
        refillBag();
      }
      return bagRef.current.shift() as TetrominoType;
    };

    const createPieceFromType = (type: TetrominoType): Tetromino | null => {
      const spawnPos = SPAWN_POSITIONS[type];
      const piece: Tetromino = {
        type,
        rotation: 0,
        x: spawnPos.x,
        y: spawnPos.y,
      };
      if (!isValidPosition(piece)) return null;
      return piece;
    };

    const takeNextPiece = (): Tetromino | null => {
      const type = nextPieceRef.current ?? drawFromBag();
      nextPieceRef.current = drawFromBag();
      return createPieceFromType(type);
    };

    const isValidPosition = (piece: Tetromino): boolean => {
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const gridX = piece.x + col;
            const gridY = piece.y + row;
            if (gridX < 0 || gridX >= GRID_WIDTH || gridY >= GRID_HEIGHT || (gridY >= 0 && gridRef.current[gridY]?.[gridX])) {
              return false;
            }
          }
        }
      }
      return true;
    };

    const lockPiece = (piece: Tetromino) => {
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const gridY = piece.y + row;
            const gridX = piece.x + col;
            if (gridY >= 0 && gridY < GRID_HEIGHT) {
              gridRef.current[gridY][gridX] = piece.type;
            }
          }
        }
      }
    };

    const findFullLines = (): number[] => {
      const full: number[] = [];
      for (let row = 0; row < GRID_HEIGHT; row++) {
        if (gridRef.current[row].every((cell) => cell !== null)) {
          full.push(row);
        }
      }
      return full;
    };

    const removeLines = (lines: number[]) => {
      const sorted = [...lines].sort((a, b) => b - a); // remove from bottom to top to avoid index shift
      for (const row of sorted) {
        gridRef.current.splice(row, 1);
      }
      while (gridRef.current.length < GRID_HEIGHT) {
        gridRef.current.unshift(Array(GRID_WIDTH).fill(null));
      }
    };

    const calculateScore = (linesCleared: number): number => {
      const lineScores = [0, 100, 300, 500, 900];
      return lineScores[linesCleared] * levelRef.current;
    };

    const gravityInterval = () => {
      const levelIdx = levelRef.current - 1;
      if (levelIdx < GRAVITY_TABLE.length) {
        return GRAVITY_TABLE[levelIdx];
      }
      // Past the table: ramp down linearly until we hit a kill-speed floor.
      const extraLevels = levelIdx - (GRAVITY_TABLE.length - 1);
      const decayed = GRAVITY_TABLE[GRAVITY_TABLE.length - 1] - extraLevels * 5;
      return Math.max(MIN_GRAVITY_MS, decayed);
    };

    const getGhostPosition = (piece: Tetromino): number => {
      let ghostY = piece.y;
      const testPiece = { ...piece };
      while (true) {
        testPiece.y++;
        if (!isValidPosition(testPiece)) break;
        ghostY = testPiece.y;
      }
      return ghostY;
    };

    const drawGridBackground = (ctx: CanvasRenderingContext2D) => {
      const palette = paletteRef.current;
      const width = GRID_WIDTH * CELL_SIZE;
      const height = GRID_HEIGHT * CELL_SIZE;

      // gradient background with slight vignette
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, withAlpha(palette.background, 1));
      gradient.addColorStop(1, withAlpha(palette.background, 0.9));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // subtle vignette edges
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.2,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75,
      );
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, withAlpha(palette.gridStroke, 0.12));
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = palette.gridStroke;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;

      for (let x = 0; x <= GRID_WIDTH; x++) {
        const px = x * CELL_SIZE + 0.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
      }

      for (let y = 0; y <= GRID_HEIGHT; y++) {
        const py = y * CELL_SIZE + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };

    const drawCell = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      darkColor: string,
      size: number = CELL_SIZE,
      isActive: boolean = false,
    ) => {
      const inset = 1.2;
      const innerX = x + inset;
      const innerY = y + inset;
      const innerSize = size - inset * 2;

      ctx.fillStyle = isActive ? withAlpha(color, 0.95) : color;
      ctx.fillRect(innerX, innerY, innerSize, innerSize);

      // outer stroke
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(innerX + 0.5, innerY + 0.5, innerSize - 1, innerSize - 1);

      // top/left highlight for depth
      ctx.strokeStyle = withAlpha('#ffffff', isActive ? 0.3 : 0.2);
      ctx.beginPath();
      ctx.moveTo(innerX + 1, innerY + innerSize - 1);
      ctx.lineTo(innerX + 1, innerY + 1);
      ctx.lineTo(innerX + innerSize - 1, innerY + 1);
      ctx.stroke();

      // bottom/right shadow
      ctx.strokeStyle = withAlpha(darkColor, 0.35);
      ctx.beginPath();
      ctx.moveTo(innerX + innerSize - 1, innerY + 1);
      ctx.lineTo(innerX + innerSize - 1, innerY + innerSize - 1);
      ctx.lineTo(innerX + 1, innerY + innerSize - 1);
      ctx.stroke();

      // subtle top sheen
      ctx.fillStyle = withAlpha('#ffffff', isActive ? 0.28 : 0.18);
      ctx.fillRect(innerX + 2, innerY + 2, innerSize - 4, innerSize / 3);
    };

    const drawLockedBlocks = (ctx: CanvasRenderingContext2D, skipLines?: Set<number>, timestamp?: number) => {
      const palette = paletteRef.current;
      const pulse = lockPulseRef.current;
      const pulseProgress = pulse && timestamp ? clamp((timestamp - pulse.start) / pulse.duration, 0, 1) : null;
      for (let row = 0; row < GRID_HEIGHT; row++) {
        if (skipLines?.has(row)) continue;
        for (let col = 0; col < GRID_WIDTH; col++) {
          const cellType = gridRef.current[row][col];
          if (cellType) {
            const color = palette.pieces[cellType].fill;
            const darkColor = palette.pieces[cellType].stroke;
            let isPulsing = false;
            let scale = 1;
            if (pulseProgress !== null && pulseProgress < 1 && pulse) {
              isPulsing = pulse.cells.some((c) => c.x === col && c.y === row);
              if (isPulsing) {
                scale = 1 + 0.08 * (1 - pulseProgress);
              }
            }
            if (isPulsing) {
              ctx.save();
              ctx.translate(col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2);
              ctx.scale(scale, scale);
              drawCell(ctx, -CELL_SIZE / 2, -CELL_SIZE / 2, color, darkColor, CELL_SIZE, false);
              ctx.restore();
            } else {
              drawCell(ctx, col * CELL_SIZE, row * CELL_SIZE, color, darkColor);
            }
          }
        }
      }
    };

    const drawCurrentPiece = (ctx: CanvasRenderingContext2D, timestamp: number) => {
      if (!currentPieceRef.current) return;
      const palette = paletteRef.current;
      const piece = currentPieceRef.current;
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
      const color = palette.pieces[piece.type].fill;
      const darkColor = palette.pieces[piece.type].stroke;
      const spawn = spawnAnimRef.current;
      const spawnScale = spawn && timestamp ? 1 + 0.12 * (1 - clamp((timestamp - spawn.start) / spawn.duration, 0, 1)) : 1;

      ctx.save();
      if (spawnScale !== 1) {
        ctx.translate((piece.x + shape[0].length / 2) * CELL_SIZE, (piece.y + shape.length / 2) * CELL_SIZE);
        ctx.scale(spawnScale, spawnScale);
        ctx.translate(-(piece.x + shape[0].length / 2) * CELL_SIZE, -(piece.y + shape.length / 2) * CELL_SIZE);
      }

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const x = (piece.x + col) * CELL_SIZE;
            const y = (piece.y + row) * CELL_SIZE;
            drawCell(ctx, x, y, color, darkColor, CELL_SIZE, true);
          }
        }
      }
      ctx.restore();
    };

    const drawGhostPiece = (ctx: CanvasRenderingContext2D) => {
      if (!currentPieceRef.current) return;

      const palette = paletteRef.current;
      const piece = currentPieceRef.current;
      const ghostY = getGhostPosition(piece);
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation];

      ctx.save();
      ctx.strokeStyle = palette.ghost;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.globalAlpha = 0.8;

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const x = (piece.x + col) * CELL_SIZE;
            const y = (ghostY + row) * CELL_SIZE;
            ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          }
        }
      }

      ctx.restore();
    };

    const drawPreviewPiece = (ctx: CanvasRenderingContext2D | null, type: TetrominoType | null) => {
      if (!ctx) return;
      const palette = paletteRef.current;
      const size = PREVIEW_CELL_SIZE;
      const width = 4 * size;
      const height = 4 * size;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, width, height);

      if (!type) return;

      const shape = TETROMINO_SHAPES[type][0];
      const shapeWidth = shape[0].length;
      const shapeHeight = shape.length;
      const offsetX = ((4 - shapeWidth) * size) / 2;
      const offsetY = ((4 - shapeHeight) * size) / 2;
      const color = palette.pieces[type].fill;
      const darkColor = palette.pieces[type].stroke;

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const x = offsetX + col * size;
            const y = offsetY + row * size;
            drawCell(ctx, x, y, color, darkColor, size);
          }
        }
      }
    };

    const drawClearAnimation = (ctx: CanvasRenderingContext2D, anim: ClearAnimationState, timestamp: number) => {
      const palette = paletteRef.current;
      const progress = clamp((timestamp - anim.start) / anim.duration, 0, 1);
      const ranks = columnRankRef.current;
      const maxRank = columnOrderRef.current.length - 1 || 1;

      ctx.save();
      for (const line of anim.lines) {
        const y = line * CELL_SIZE;
        for (let col = 0; col < GRID_WIDTH; col++) {
          const cellType = gridRef.current[line][col];
          if (!cellType) continue;
          const rank = ranks[col] ?? 0;
          const stage = progress * (maxRank + 1);
          const local = clamp(stage - rank, 0, 1); // 0 => not started, 1 => gone
          if (local >= 1) continue;

          const alpha = 1 - local;
          const scale = 1 - 0.45 * local;
          const color = palette.pieces[cellType].fill;
          const stroke = palette.pieces[cellType].stroke;
          const cx = col * CELL_SIZE + CELL_SIZE / 2;
          const cy = y + CELL_SIZE / 2;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1;
          ctx.strokeRect(-CELL_SIZE / 2 + 0.5, -CELL_SIZE / 2 + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          ctx.restore();
        }
      }

      if (anim.isTetris) {
        const width = GRID_WIDTH * CELL_SIZE;
        const height = GRID_HEIGHT * CELL_SIZE;
        const bandHeight = height * 0.6;
        const bandTop = -bandHeight + progress * (height + bandHeight);
        const bandBottom = bandTop + bandHeight;
        const rainbow = ctx.createLinearGradient(0, bandTop, 0, bandBottom);
        rainbow.addColorStop(0, '#ff4d4f');
        rainbow.addColorStop(0.2, '#ffbe0b');
        rainbow.addColorStop(0.4, '#3ae374');
        rainbow.addColorStop(0.6, '#2ac3ff');
        rainbow.addColorStop(0.8, '#7c3aed');
        rainbow.addColorStop(1, '#ff4d4f');

        ctx.save();
        ctx.lineWidth = 8;
        ctx.strokeStyle = rainbow;
        ctx.globalAlpha = 0.9 * (1 - progress * 0.6);
        ctx.strokeRect(4, 4, width - 8, height - 8);
        ctx.restore();
      }

      ctx.restore();
    };

    const drawClearMessages = (ctx: CanvasRenderingContext2D, timestamp: number) => {
      const msgs = clearMessagesRef.current;
      if (!msgs.length) return;
      const width = GRID_WIDTH * CELL_SIZE;
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const baseTextColor = isDark ? '#ffffff' : '#0f172a';

      clearMessagesRef.current = msgs.filter((m) => timestamp - m.start < m.duration);

      clearMessagesRef.current.forEach((msg) => {
        const progress = clamp((timestamp - msg.start) / msg.duration, 0, 1);
        const alpha = 1 - progress;
        const y = GRID_HEIGHT * CELL_SIZE * 0.45 - progress * 25;
        const scale = progress < 0.25 ? 0.9 + progress * 0.6 : 1 + (progress - 0.25) * 0.12;
        const color = baseTextColor;

        ctx.save();
        ctx.translate(width / 2, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.font = 'bold 22px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(msg.text, 0, 0);
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillText(`+${msg.points}`, 0, 22);
        ctx.restore();
      });
    };

    const render = (timestamp: number = performance.now()) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      // shake animation on tetris
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

      drawGridBackground(ctx);
      const anim = clearAnimationRef.current;
      const skip = anim ? new Set(anim.lines) : undefined;
      drawLockedBlocks(ctx, skip, timestamp);
      drawGhostPiece(ctx);
      drawCurrentPiece(ctx, timestamp);

      if (anim) {
        drawClearAnimation(ctx, anim, timestamp);
      }
      drawClearMessages(ctx, timestamp);

      drawPreviewPiece(previewCtxRef.current, nextPieceRef.current);
      drawPreviewPiece(holdCtxRef.current, holdPieceRef.current);

      ctx.restore();
    };

    const finalizeClear = (lines: number[]) => {
      removeLines(lines);
      const linesCleared = lines.length;
      if (linesCleared > 0) {
        const gained = calculateScore(linesCleared);
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
      lockPiece(currentPieceRef.current);
      holdUsedRef.current = false;
      cancelLockTimer();
      lockPulseRef.current = {
        cells: collectPieceCells(currentPieceRef.current),
        start: performance.now(),
        duration: 220,
      };
      const fullLines = findFullLines();
      if (fullLines.length > 0) {
        currentPieceRef.current = null;
        startClearAnimation(fullLines);
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

    const moveDown = (): boolean => {
      if (!currentPieceRef.current || clearAnimationRef.current) return false;
      const newPiece = {
        ...currentPieceRef.current,
        y: currentPieceRef.current.y + 1,
      };
      if (isValidPosition(newPiece)) {
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
      if (isValidPosition(newPiece)) {
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

    const moveHorizontal = (dir: number) => {
      if (!currentPieceRef.current) return false;
      const moved = {
        ...currentPieceRef.current,
        x: currentPieceRef.current.x + dir,
      };
      if (isValidPosition(moved)) {
        currentPieceRef.current = moved;
        // lock delay reset on ground nudge
        const below = { ...moved, y: moved.y + 1 };
        if (!isValidPosition(below) && lockResetRef.current < MAX_LOCK_RESETS) {
          lockResetRef.current += 1;
          cancelLockTimer();
        }
        return true;
      }
      return false;
    };

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

    const attemptRotate = (piece: Tetromino, newRotation: number): Tetromino | null => {
      const kicks = piece.type === 'I' ? kicksI : kicksJLSTZ;
      const from = piece.rotation % 2;
      const tests = kicks[from];
      for (const kick of tests) {
        const candidate = {
          ...piece,
          rotation: newRotation,
          x: piece.x + kick.x,
          y: piece.y + kick.y,
        };
        if (isValidPosition(candidate)) return candidate;
      }
      return null;
    };

    useImperativeHandle(ref, () => ({
      startGame: () => {
        refreshPalette();
        initGrid();
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
        bagRef.current = [];
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

        refillBag();
        nextPieceRef.current = drawFromBag();
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
        if (isValidPosition(newPiece)) {
          currentPieceRef.current = newPiece;
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
        if (isValidPosition(newPiece)) {
          currentPieceRef.current = newPiece;
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
        if (moveDown()) {
          render();
        }
      },
      rotate: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || clearAnimationRef.current) return;
        const piece = currentPieceRef.current;
        const numRotations = TETROMINO_SHAPES[piece.type].length;
        const newRotation = (piece.rotation + 1) % numRotations;
        const kicked = attemptRotate(piece, newRotation);
        if (kicked) {
          currentPieceRef.current = kicked;
          if (lockResetRef.current < MAX_LOCK_RESETS) lockResetRef.current += 1;
          cancelLockTimer();
          render();
        }
      },
      hardDrop: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || clearAnimationRef.current) return;
        const ghostY = getGhostPosition(currentPieceRef.current);
        currentPieceRef.current = { ...currentPieceRef.current, y: ghostY };
        cancelLockTimer();
        handleLock();
        render();
      },
      holdPiece: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || holdUsedRef.current) return;
        if (clearAnimationRef.current) return;

        // cancel any pending lock from the previous piece before swapping
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
          const swapped = createPieceFromType(swapType);
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
        drawPreviewPiece(holdCtxRef.current, holdPieceRef.current);
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

      initGrid();
      paletteRef.current = buildPalette(palette);
      const order: number[] = [];
      let left = Math.floor((GRID_WIDTH - 1) / 2);
      let right = left + 1;
      while (left >= 0 || right < GRID_WIDTH) {
        if (left >= 0) order.push(left--);
        if (right < GRID_WIDTH) order.push(right++);
      }
      columnOrderRef.current = order;
      const ranks = new Array<number>(GRID_WIDTH);
      order.forEach((col, idx) => {
        ranks[col] = idx;
      });
      columnRankRef.current = ranks;
      bagRef.current = [];
      refillBag();
      nextPieceRef.current = drawFromBag();
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

          {isPaused && !gameOverRef.current && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='flex flex-col items-center gap-3 rounded-xl border border-border bg-background/85 backdrop-blur-sm px-4 py-3 shadow-lg'>
                <div className='flex items-center gap-2 text-foreground/80'>
                  <Pause size={24} className='text-foreground/60' />
                  <span className='text-sm font-semibold uppercase tracking-wide'>Paused</span>
                </div>
                <div className='text-xs font-medium text-muted-foreground'>
                  Press <span className='font-semibold text-foreground'>Enter</span> to resume
                </div>
              </div>
            </div>
          )}
        </div>

        <div className='flex flex-col gap-3 w-[110px] text-xs text-muted-foreground'>
          <div className='rounded-md border border-border bg-card p-2 shadow-sm'>
            <div className='text-[11px] font-semibold uppercase tracking-wide text-foreground/80'>Next</div>
            <canvas ref={previewCanvasRef} width={4 * PREVIEW_CELL_SIZE} height={4 * PREVIEW_CELL_SIZE} className='mt-2' />
          </div>

          <div className='rounded-md border border-border bg-card p-2 shadow-sm'>
            <div className='text-[11px] font-semibold uppercase tracking-wide text-foreground/80'>Hold</div>
            <canvas ref={holdCanvasRef} width={4 * PREVIEW_CELL_SIZE} height={4 * PREVIEW_CELL_SIZE} className='mt-2' />
          </div>
        </div>
      </div>
    );
  },
);

TetrisCore.displayName = 'TetrisCore';
