import { baseColors } from './constants';
import { TETROMINO_COLORS, TETROMINO_DARK_COLORS } from './assets/tetromino_colors';
import type { TetrominoType } from './assets/tetromino_shapes';

export interface ThemePalette {
  background: string;
  grid: string;
  gridStroke: string;
  ghost: string;
  accent: string;
  pieces: Record<TetrominoType, { fill: string; stroke: string }>;
}

export type PaletteName = 'default' | 'indigo' | 'coral' | 'mono' | 'emerald' | 'purple';

export const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

export const toHex = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

const parseHsl = (value: string) => {
  const match = value.replace(/,/g, ' ').match(/hsl[a]?\(\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%/i);
  if (!match) return null;
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
};

export const withAlpha = (color: string, alpha: number) => {
  const hsl = parseHsl(color);
  if (hsl) return `hsla(${hsl.h} ${hsl.s}% ${hsl.l}% / ${alpha})`;
  const hexMatch = color.match(/^#([a-f0-9]{6}|[a-f0-9]{3})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const nums =
      hex.length === 3
        ? hex.split('').map((c) => parseInt(c + c, 16))
        : [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  return color;
};

const resolveCssVar = (styles: CSSStyleDeclaration, variable: string, fallback: string, seen: Set<string> = new Set()): string => {
  if (seen.has(variable)) return fallback;
  seen.add(variable);
  const raw = styles.getPropertyValue(variable).trim();
  if (!raw) return fallback;
  const varMatch = raw.match(/^var\((--[\w-]+)\)$/);
  if (varMatch) {
    return resolveCssVar(styles, varMatch[1], fallback, seen);
  }
  if (/^\d/.test(raw) && raw.includes('%')) {
    return `hsl(${raw})`;
  }
  return raw;
};

const makePieces = (fills: string[], strokes: string[]) => {
  const order: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const map: Record<TetrominoType, { fill: string; stroke: string }> = {} as any;
  order.forEach((type, idx) => {
    map[type] = { fill: fills[idx], stroke: strokes[idx] };
  });
  return map;
};

const presetPalette = (name: PaletteName): { pieces: ThemePalette['pieces']; accent?: string } | null => {
  switch (name) {
    case 'indigo':
      return {
        accent: '#6366f1',
        pieces: makePieces(
          ['#818cf8', '#a5b4fc', '#c084fc', '#22d3ee', '#38bdf8', '#6366f1', '#4f46e5'],
          ['#4f46e5', '#6366f1', '#7c3aed', '#0ea5e9', '#0f9cf5', '#4338ca', '#312e81'],
        ),
      };
    case 'coral':
      return {
        accent: '#f9735b',
        pieces: makePieces(
          ['#fb7185', '#fcd34d', '#f472b6', '#f97316', '#ef4444', '#fb923c', '#f59e0b'],
          ['#c24163', '#eab308', '#db2777', '#c2410c', '#b91c1c', '#f97316', '#b45309'],
        ),
      };
    case 'mono':
      return {
        accent: '#f5f5f5',
        pieces: makePieces(
          ['#e5e5e5', '#d4d4d4', '#cfcfcf', '#c7c7c7', '#bdbdbd', '#a3a3a3', '#8f8f8f'],
          ['#a3a3a3', '#8a8a8a', '#878787', '#7a7a7a', '#6f6f6f', '#5c5c5c', '#4a4a4a'],
        ),
      };
    case 'emerald':
      return {
        accent: '#10b981',
        pieces: makePieces(
          ['#34d399', '#22d3ee', '#a5b4fc', '#10b981', '#14b8a6', '#2dd4bf', '#22c55e'],
          ['#0f766e', '#0891b2', '#6366f1', '#047857', '#0f766e', '#0d9488', '#15803d'],
        ),
      };
    case 'purple':
      return {
        accent: '#a855f7',
        pieces: makePieces(
          ['#a855f7', '#c084fc', '#e879f9', '#8b5cf6', '#6366f1', '#7c3aed', '#9333ea'],
          ['#7c3aed', '#8b5cf6', '#c026d3', '#6d28d9', '#4338ca', '#5b21b6', '#6b21a8'],
        ),
      };
    default:
      return null;
  }
};

export const buildPalette = (paletteName: PaletteName = 'default'): ThemePalette => {
  const basePieces = {
    I: toHex(TETROMINO_COLORS.I),
    O: toHex(TETROMINO_COLORS.O),
    T: toHex(TETROMINO_COLORS.T),
    S: toHex(TETROMINO_COLORS.S),
    Z: toHex(TETROMINO_COLORS.Z),
    J: toHex(TETROMINO_COLORS.J),
    L: toHex(TETROMINO_COLORS.L),
  };

  const baseStrokes = {
    I: toHex(TETROMINO_DARK_COLORS.I),
    O: toHex(TETROMINO_DARK_COLORS.O),
    T: toHex(TETROMINO_DARK_COLORS.T),
    S: toHex(TETROMINO_DARK_COLORS.S),
    Z: toHex(TETROMINO_DARK_COLORS.Z),
    J: toHex(TETROMINO_DARK_COLORS.J),
    L: toHex(TETROMINO_DARK_COLORS.L),
  };

  const base = (() => {
    if (typeof window === 'undefined') {
      return {
        background: '#f9fafb',
        grid: '#e5e7eb',
        gridStroke: '#d1d5db',
        ghost: 'rgba(0,0,0,0.45)',
        accent: '#111827',
      };
    }
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const isDark = root.classList.contains('dark');
    const primary = resolveCssVar(styles, '--primary', toHex(baseColors.pieces.J));
    return {
      background: resolveCssVar(styles, '--card', isDark ? '#0c1220' : '#f9fafb'),
      grid: resolveCssVar(styles, '--game-bg', isDark ? '#0f172a' : '#e5e7eb'),
      gridStroke: resolveCssVar(styles, '--game-border', isDark ? '#0b1324' : '#d1d5db'),
      ghost: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)',
      accent: primary,
    };
  })();

  const defaultPalette = {
    ...base,
    pieces: {
      I: { fill: basePieces.I, stroke: baseStrokes.I },
      O: { fill: basePieces.O, stroke: baseStrokes.O },
      T: { fill: basePieces.T, stroke: baseStrokes.T },
      S: { fill: basePieces.S, stroke: baseStrokes.S },
      Z: { fill: basePieces.Z, stroke: baseStrokes.Z },
      J: { fill: basePieces.J, stroke: baseStrokes.J },
      L: { fill: basePieces.L, stroke: baseStrokes.L },
    },
  };

  if (paletteName !== 'default') {
    const preset = presetPalette(paletteName);
    if (preset) {
      return {
        ...base,
        accent: preset.accent ?? base.accent,
        pieces: preset.pieces,
      };
    }
  }

  return defaultPalette;
};
