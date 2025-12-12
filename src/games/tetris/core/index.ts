/**
 * Tetris Core Module
 * Main exports for the Tetris game engine
 */

export { TetrisCore } from './tetris_core';
export type { TetrisGameHandle, TetrisCoreProps, PaletteName } from './types';
export type {
  TetrominoType,
  Tetromino,
  ThemePalette,
  ClearAnimationState,
  ClearMessage,
  SpawnAnim,
  LockPulse,
  ShakeAnim,
} from './types';

// Constants
export {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  PREVIEW_CELL_SIZE,
  DAS,
  ARR,
  SOFT_DROP_INTERVAL,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  GRAVITY_TABLE,
  MIN_GRAVITY_MS,
  LINE_SCORES,
  kicksI,
  kicksJLSTZ,
} from './constants';

// Palette utilities
export { buildPalette, clamp, withAlpha } from './palette';

// Game logic utilities
export {
  initGrid,
  isValidPosition,
  hasVisibleCell,
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

// Renderer utilities
export {
  drawGridBackground,
  drawCell,
  drawLockedBlocks,
  drawCurrentPiece,
  drawGhostPiece,
  drawPreviewPiece,
  drawClearAnimation,
  drawClearMessages,
} from './renderer';
