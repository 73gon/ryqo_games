/**
 * Palette utilities for Tetris game
 * Reads tetris colors from CSS variables defined in index.css
 */

import type { ThemePalette, PaletteName, TetrominoType } from './types';

export const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

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

const getCssVar = (variable: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const styles = getComputedStyle(document.documentElement);
  return resolveCssVar(styles, variable, fallback);
};

const getBaseColors = () => {
  const pieces: Record<TetrominoType, { fill: string; stroke: string }> = {
    I: { fill: getCssVar('--tetris-i', '#06b6d4'), stroke: getCssVar('--tetris-i-dark', '#0f7490') },
    O: { fill: getCssVar('--tetris-o', '#fbbf24'), stroke: getCssVar('--tetris-o-dark', '#b45309') },
    T: { fill: getCssVar('--tetris-t', '#a855f7'), stroke: getCssVar('--tetris-t-dark', '#6b21a8') },
    S: { fill: getCssVar('--tetris-s', '#22c55e'), stroke: getCssVar('--tetris-s-dark', '#15803d') },
    Z: { fill: getCssVar('--tetris-z', '#fb7185'), stroke: getCssVar('--tetris-z-dark', '#be123c') },
    J: { fill: getCssVar('--tetris-j', '#3b82f6'), stroke: getCssVar('--tetris-j-dark', '#1d4ed8') },
    L: { fill: getCssVar('--tetris-l', '#f97316'), stroke: getCssVar('--tetris-l-dark', '#c2410c') },
  };
  return pieces;
};

const getPaletteColors = (paletteName: PaletteName): Record<TetrominoType, { fill: string; stroke: string }> | null => {
  if (paletteName === 'default') return null;

  const prefix = `--tetris-${paletteName}`;
  const order: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  // Check if palette exists by checking one variable
  const testVar = getCssVar(`${prefix}-i`, '');
  if (!testVar) return null;

  const pieces: Record<TetrominoType, { fill: string; stroke: string }> = {} as any;
  order.forEach((type) => {
    const key = type.toLowerCase();
    pieces[type] = {
      fill: getCssVar(`${prefix}-${key}`, ''),
      stroke: getCssVar(`${prefix}-${key}-dark`, ''),
    };
  });

  return pieces;
};

const getPaletteAccent = (paletteName: PaletteName): string | null => {
  if (paletteName === 'default') return null;
  return getCssVar(`--tetris-${paletteName}-accent`, '');
};

export const buildPalette = (paletteName: PaletteName = 'default'): ThemePalette => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const base = {
    background: getCssVar('--card', isDark ? '#0c1220' : '#f9fafb'),
    grid: getCssVar('--game-bg', isDark ? '#0f172a' : '#e5e7eb'),
    gridStroke: getCssVar('--game-border', isDark ? '#0b1324' : '#d1d5db'),
    ghost: getCssVar('--tetris-ghost', isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'),
    accent: getCssVar('--primary', '#111827'),
  };

  const defaultPieces = getBaseColors();

  if (paletteName !== 'default') {
    const presetPieces = getPaletteColors(paletteName);
    const presetAccent = getPaletteAccent(paletteName);
    if (presetPieces) {
      return {
        ...base,
        accent: presetAccent || base.accent,
        pieces: presetPieces,
      };
    }
  }

  return {
    ...base,
    pieces: defaultPieces,
  };
};
