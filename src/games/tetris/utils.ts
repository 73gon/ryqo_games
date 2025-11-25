import { baseColors } from './constants'
import { TETROMINO_COLORS, TETROMINO_DARK_COLORS } from './assets/tetromino_colors'
import type { TetrominoType } from './assets/tetromino_shapes'

export interface ThemePalette {
  background: string
  grid: string
  gridStroke: string
  ghost: string
  accent: string
  pieces: Record<TetrominoType, { fill: string; stroke: string }>
}

export const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)

export const toHex = (value: number) => `#${value.toString(16).padStart(6, '0')}`

const parseHsl = (value: string) => {
  const match = value.replace(/,/g, ' ').match(/hsl[a]?\(\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%/i)
  if (!match) return null
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  }
}

export const withAlpha = (color: string, alpha: number) => {
  const hsl = parseHsl(color)
  if (hsl) return `hsla(${hsl.h} ${hsl.s}% ${hsl.l}% / ${alpha})`
  const hexMatch = color.match(/^#([a-f0-9]{6}|[a-f0-9]{3})$/i)
  if (hexMatch) {
    const hex = hexMatch[1]
    const nums =
      hex.length === 3
        ? hex.split('').map((c) => parseInt(c + c, 16))
        : [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
    return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
  }
  return color
}

const resolveCssVar = (styles: CSSStyleDeclaration, variable: string, fallback: string, seen: Set<string> = new Set()): string => {
  if (seen.has(variable)) return fallback
  seen.add(variable)
  const raw = styles.getPropertyValue(variable).trim()
  if (!raw) return fallback
  const varMatch = raw.match(/^var\((--[\w-]+)\)$/)
  if (varMatch) {
    return resolveCssVar(styles, varMatch[1], fallback, seen)
  }
  if (/^\d/.test(raw) && raw.includes('%')) {
    return `hsl(${raw})`
  }
  return raw
}

export const buildPalette = (): ThemePalette => {
  const basePieces = {
    I: toHex(TETROMINO_COLORS.I),
    O: toHex(TETROMINO_COLORS.O),
    T: toHex(TETROMINO_COLORS.T),
    S: toHex(TETROMINO_COLORS.S),
    Z: toHex(TETROMINO_COLORS.Z),
    J: toHex(TETROMINO_COLORS.J),
    L: toHex(TETROMINO_COLORS.L),
  }

  const baseStrokes = {
    I: toHex(TETROMINO_DARK_COLORS.I),
    O: toHex(TETROMINO_DARK_COLORS.O),
    T: toHex(TETROMINO_DARK_COLORS.T),
    S: toHex(TETROMINO_DARK_COLORS.S),
    Z: toHex(TETROMINO_DARK_COLORS.Z),
    J: toHex(TETROMINO_DARK_COLORS.J),
    L: toHex(TETROMINO_DARK_COLORS.L),
  }

  if (typeof window === 'undefined') {
    return {
      background: '#f9fafb',
      grid: '#e5e7eb',
      gridStroke: '#d1d5db',
      ghost: 'rgba(0,0,0,0.45)',
      accent: '#111827',
      pieces: {
        I: { fill: basePieces.I, stroke: baseStrokes.I },
        O: { fill: basePieces.O, stroke: baseStrokes.O },
        T: { fill: basePieces.T, stroke: baseStrokes.T },
        S: { fill: basePieces.S, stroke: baseStrokes.S },
        Z: { fill: basePieces.Z, stroke: baseStrokes.Z },
        J: { fill: basePieces.J, stroke: baseStrokes.J },
        L: { fill: basePieces.L, stroke: baseStrokes.L },
      },
    }
  }

  const root = document.documentElement
  const styles = getComputedStyle(root)
  const isDark = root.classList.contains('dark')

  const primary = resolveCssVar(styles, '--primary', toHex(baseColors.pieces.J))

  const palette: ThemePalette = {
    background: resolveCssVar(styles, '--card', isDark ? '#0c1220' : '#f9fafb'),
    grid: resolveCssVar(styles, '--game-bg', isDark ? '#0f172a' : '#e5e7eb'),
    gridStroke: resolveCssVar(styles, '--game-border', isDark ? '#0b1324' : '#d1d5db'),
    ghost: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)',
    accent: primary,
    pieces: {
      I: { fill: basePieces.I, stroke: baseStrokes.I },
      O: { fill: basePieces.O, stroke: baseStrokes.O },
      T: { fill: basePieces.T, stroke: baseStrokes.T },
      S: { fill: basePieces.S, stroke: baseStrokes.S },
      Z: { fill: basePieces.Z, stroke: baseStrokes.Z },
      J: { fill: basePieces.J, stroke: baseStrokes.J },
      L: { fill: basePieces.L, stroke: baseStrokes.L },
    },
  }

  return palette
}
