import { TETROMINO_DARK_COLORS, TETROMINO_COLORS } from './assets/tetromino_colors'

export const GRID_WIDTH = 10
export const GRID_HEIGHT = 20
export const CELL_SIZE = 30
export const PREVIEW_CELL_SIZE = 22

// Movement/feel tuning
export const DAS = 80 // delay before horizontal repeat
export const ARR = 30 // horizontal repeat interval
export const SOFT_DROP_INTERVAL = 60 // soft drop step interval
export const LOCK_DELAY_MS = 450
export const MAX_LOCK_RESETS = 15

// Gravity table (ms per row). Clamp to last entry for higher levels; we decay beyond it.
export const GRAVITY_TABLE = [500, 520, 450, 380, 320, 270, 230, 200, 170, 150, 135, 120, 105, 95, 85]
export const MIN_GRAVITY_MS = 20 // kill-speed floor for very high levels

// Standard SRS kick tables (clockwise) for JLSTZ and I pieces.
// Keys are `${from}>${to}` where rotations are 0-3.
export const kicksJLSTZ: Record<string, { x: number; y: number }[]> = {
  '0>1': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -2 },
    { x: -1, y: -2 },
  ],
  '1>2': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ],
  '2>3': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: -2 },
    { x: 1, y: -2 },
  ],
  '3>0': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: 2 },
    { x: -1, y: 2 },
  ],
}

export const kicksI: Record<string, { x: number; y: number }[]> = {
  '0>1': [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: -1 },
    { x: 1, y: 2 },
  ],
  '1>2': [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 2 },
    { x: 2, y: -1 },
  ],
  '2>3': [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 1 },
    { x: -1, y: -2 },
  ],
  '3>0': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: -2 },
    { x: -2, y: 1 },
  ],
}

export const baseColors = {
  pieces: {
    I: TETROMINO_COLORS.I,
    O: TETROMINO_COLORS.O,
    T: TETROMINO_COLORS.T,
    S: TETROMINO_COLORS.S,
    Z: TETROMINO_COLORS.Z,
    J: TETROMINO_COLORS.J,
    L: TETROMINO_COLORS.L,
  },
  strokes: {
    I: TETROMINO_DARK_COLORS.I,
    O: TETROMINO_DARK_COLORS.O,
    T: TETROMINO_DARK_COLORS.T,
    S: TETROMINO_DARK_COLORS.S,
    Z: TETROMINO_DARK_COLORS.Z,
    J: TETROMINO_DARK_COLORS.J,
    L: TETROMINO_DARK_COLORS.L,
  },
}
