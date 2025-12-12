/**
 * Game logic utilities for Tetris
 */

import type { Tetromino, TetrominoType } from './types';
import { TETROMINO_SHAPES, SPAWN_POSITIONS } from '../assets/tetromino_shapes';
import { GRID_WIDTH, GRID_HEIGHT, LINE_SCORES, kicksI, kicksJLSTZ } from './constants';

export type Grid = (TetrominoType | null)[][];

export const initGrid = (): Grid => {
  return Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(null));
};

export const isValidPosition = (piece: Tetromino, grid: Grid): boolean => {
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const gridX = piece.x + col;
        const gridY = piece.y + row;
        if (gridX < 0 || gridX >= GRID_WIDTH || gridY >= GRID_HEIGHT || (gridY >= 0 && grid[gridY]?.[gridX])) {
          return false;
        }
      }
    }
  }
  return true;
};

export const hasVisibleCell = (piece: Tetromino): boolean => {
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const gridY = piece.y + row;
        if (gridY >= 0) return true;
      }
    }
  }
  return false;
};

export const createPieceFromType = (type: TetrominoType, grid: Grid): Tetromino | null => {
  const spawnPos = SPAWN_POSITIONS[type];
  for (let offset = 0; offset <= 3; offset++) {
    const candidate: Tetromino = {
      type,
      rotation: 0,
      x: spawnPos.x,
      y: spawnPos.y - offset,
    };
    if (isValidPosition(candidate, grid) && hasVisibleCell(candidate)) {
      return candidate;
    }
  }
  return null;
};

export const lockPiece = (piece: Tetromino, grid: Grid): void => {
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const gridY = piece.y + row;
        const gridX = piece.x + col;
        if (gridY >= 0 && gridY < GRID_HEIGHT) {
          grid[gridY][gridX] = piece.type;
        }
      }
    }
  }
};

export const findFullLines = (grid: Grid): number[] => {
  const full: number[] = [];
  for (let row = 0; row < GRID_HEIGHT; row++) {
    if (grid[row].every((cell) => cell !== null)) {
      full.push(row);
    }
  }
  return full;
};

export const removeLines = (grid: Grid, lines: number[]): void => {
  const sorted = [...lines].sort((a, b) => b - a);
  for (const row of sorted) {
    grid.splice(row, 1);
  }
  while (grid.length < GRID_HEIGHT) {
    grid.unshift(Array(GRID_WIDTH).fill(null));
  }
};

export const calculateScore = (linesCleared: number, level: number): number => {
  return LINE_SCORES[linesCleared] * level;
};

export const getGhostPosition = (piece: Tetromino, grid: Grid): number => {
  let ghostY = piece.y;
  const testPiece = { ...piece };
  while (true) {
    testPiece.y++;
    if (!isValidPosition(testPiece, grid)) break;
    ghostY = testPiece.y;
  }
  return ghostY;
};

export const attemptRotate = (piece: Tetromino, newRotation: number, grid: Grid): Tetromino | null => {
  const kicks = piece.type === 'I' ? kicksI : kicksJLSTZ;
  const key = `${piece.rotation}>${newRotation}`;
  const tests = kicks[key] ?? [{ x: 0, y: 0 }];
  for (const kick of tests) {
    const candidate = {
      ...piece,
      rotation: newRotation,
      x: piece.x + kick.x,
      y: piece.y + kick.y,
    };
    if (isValidPosition(candidate, grid)) return candidate;
  }
  return null;
};

export const collectPieceCells = (piece: Tetromino): { x: number; y: number; type: TetrominoType }[] => {
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

// Bag randomizer
export class BagRandomizer {
  private bag: TetrominoType[] = [];

  private refill(): void {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    this.bag = this.bag.concat(types);
  }

  draw(): TetrominoType {
    if (this.bag.length === 0) {
      this.refill();
    }
    return this.bag.shift() as TetrominoType;
  }

  reset(): void {
    this.bag = [];
    this.refill();
  }
}

// Column order for clear animations (center-out)
export const buildColumnOrder = (): { order: number[]; rank: number[] } => {
  const order: number[] = [];
  let left = Math.floor((GRID_WIDTH - 1) / 2);
  let right = left + 1;
  while (left >= 0 || right < GRID_WIDTH) {
    if (left >= 0) order.push(left--);
    if (right < GRID_WIDTH) order.push(right++);
  }
  const rank = new Array<number>(GRID_WIDTH);
  order.forEach((col, idx) => {
    rank[col] = idx;
  });
  return { order, rank };
};
