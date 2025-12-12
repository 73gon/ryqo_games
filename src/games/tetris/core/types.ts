/**
 * Type definitions for Tetris game
 */

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Tetromino {
  type: TetrominoType;
  rotation: number;
  x: number;
  y: number;
}

export interface ThemePalette {
  background: string;
  grid: string;
  gridStroke: string;
  ghost: string;
  accent: string;
  pieces: Record<TetrominoType, { fill: string; stroke: string }>;
}

export type PaletteName = 'default' | 'indigo' | 'coral' | 'mono' | 'emerald' | 'purple';

export interface ClearAnimationState {
  lines: number[];
  start: number;
  duration: number;
  isTetris: boolean;
}

export interface ClearMessage {
  id: number;
  text: string;
  points: number;
  start: number;
  duration: number;
  color?: string;
  row: number;
}

export interface SpawnAnim {
  start: number;
  duration: number;
}

export interface LockPulse {
  cells: { x: number; y: number; type: TetrominoType }[];
  start: number;
  duration: number;
}

export interface ShakeAnim {
  start: number;
  duration: number;
  amplitude: number;
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

export interface TetrisCoreProps {
  startLevel: number;
  onScoreChange: (score: number) => void;
  onLinesChange: (lines: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: () => void;
  onGameRestart: () => void;
  onStateChange: (playing: boolean) => void;
  palette?: PaletteName;
  onLineClear?: (linesCleared: number) => void;
  onMove?: () => void;
  onSoftDrop?: () => void;
  onHardDrop?: () => void;
  onRotate?: () => void;
  onHold?: () => void;
  sideControl?: React.ReactNode;
}
