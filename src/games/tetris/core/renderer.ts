/**
 * Rendering utilities for Tetris game
 */

import type { TetrominoType, Tetromino, ThemePalette, ClearAnimationState, ClearMessage, LockPulse } from './types';
import { CELL_SIZE, GRID_WIDTH, GRID_HEIGHT, PREVIEW_CELL_SIZE } from './constants';
import { TETROMINO_SHAPES } from '../assets/tetromino_shapes';
import { clamp, withAlpha } from './palette';

export const drawGridBackground = (ctx: CanvasRenderingContext2D, palette: ThemePalette) => {
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

export const drawCell = (
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

export const drawLockedBlocks = (
  ctx: CanvasRenderingContext2D,
  grid: (TetrominoType | null)[][],
  palette: ThemePalette,
  skipLines?: Set<number>,
  timestamp?: number,
  lockPulse?: LockPulse | null,
) => {
  const pulseProgress = lockPulse && timestamp ? clamp((timestamp - lockPulse.start) / lockPulse.duration, 0, 1) : null;

  for (let row = 0; row < GRID_HEIGHT; row++) {
    if (skipLines?.has(row)) continue;
    for (let col = 0; col < GRID_WIDTH; col++) {
      const cellType = grid[row][col];
      if (cellType) {
        const color = palette.pieces[cellType].fill;
        const darkColor = palette.pieces[cellType].stroke;
        let isPulsing = false;
        let scale = 1;
        if (pulseProgress !== null && pulseProgress < 1 && lockPulse) {
          isPulsing = lockPulse.cells.some((c) => c.x === col && c.y === row);
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

export const drawCurrentPiece = (
  ctx: CanvasRenderingContext2D,
  piece: Tetromino,
  palette: ThemePalette,
  timestamp: number,
  spawnAnim?: { start: number; duration: number } | null,
) => {
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
  const color = palette.pieces[piece.type].fill;
  const darkColor = palette.pieces[piece.type].stroke;
  const spawnScale = spawnAnim && timestamp ? 1 + 0.12 * (1 - clamp((timestamp - spawnAnim.start) / spawnAnim.duration, 0, 1)) : 1;

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

export const drawGhostPiece = (
  ctx: CanvasRenderingContext2D,
  piece: Tetromino,
  ghostY: number,
  palette: ThemePalette,
) => {
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

export const drawPreviewPiece = (
  ctx: CanvasRenderingContext2D | null,
  type: TetrominoType | null,
  palette: ThemePalette,
) => {
  if (!ctx) return;
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

export const drawClearAnimation = (
  ctx: CanvasRenderingContext2D,
  anim: ClearAnimationState,
  timestamp: number,
  grid: (TetrominoType | null)[][],
  palette: ThemePalette,
  columnRank: number[],
  columnOrder: number[],
) => {
  const progress = clamp((timestamp - anim.start) / anim.duration, 0, 1);
  const maxRank = columnOrder.length - 1 || 1;

  ctx.save();
  for (const line of anim.lines) {
    const y = line * CELL_SIZE;
    for (let col = 0; col < GRID_WIDTH; col++) {
      const cellType = grid[line][col];
      if (!cellType) continue;
      const rank = columnRank[col] ?? 0;
      const stage = progress * (maxRank + 1);
      const local = clamp(stage - rank, 0, 1);
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

export const drawClearMessages = (
  ctx: CanvasRenderingContext2D,
  messages: ClearMessage[],
  timestamp: number,
): ClearMessage[] => {
  if (!messages.length) return messages;

  const width = GRID_WIDTH * CELL_SIZE;
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const baseTextColor = isDark ? '#ffffff' : '#0f172a';

  const remaining = messages.filter((m) => timestamp - m.start < m.duration);

  remaining.forEach((msg) => {
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

  return remaining;
};
