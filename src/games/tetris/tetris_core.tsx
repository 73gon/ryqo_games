import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  TETROMINO_SHAPES,
  SPAWN_POSITIONS,
  type TetrominoType,
} from './assets/tetromino_shapes'
import { TETROMINO_COLORS, TETROMINO_DARK_COLORS } from './assets/tetromino_colors'

const GRID_WIDTH = 10
const GRID_HEIGHT = 20
const CELL_SIZE = 30
const PREVIEW_CELL_SIZE = 22

interface TetrisCoreProps {
  startLevel: number
  onScoreChange: (score: number) => void
  onLinesChange: (lines: number) => void
  onLevelChange: (level: number) => void
  onGameOver: () => void
  onGameRestart: () => void
  onStateChange: (playing: boolean) => void
}

export interface TetrisGameHandle {
  startGame: () => void
  stopGame: () => void
  resumeGame: () => void
  moveLeft: () => void
  moveRight: () => void
  moveDown: () => void
  rotate: () => void
  hardDrop: () => void
  holdPiece: () => void
}

interface Tetromino {
  type: TetrominoType
  rotation: number
  x: number
  y: number
}

interface ThemePalette {
  background: string
  grid: string
  gridStroke: string
  ghost: string
  accent: string
  pieces: Record<TetrominoType, { fill: string; stroke: string }>
}

interface ClearAnimationState {
  lines: number[]
  start: number
  duration: number
  isTetris: boolean
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)
const toHex = (value: number) => `#${value.toString(16).padStart(6, '0')}`

const parseHsl = (value: string) => {
  const match = value
    .replace(/,/g, ' ')
    .match(/hsl[a]?\(\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%/i)
  if (!match) return null
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  }
}

const withAlpha = (color: string, alpha: number) => {
  const hsl = parseHsl(color)
  if (hsl) return `hsla(${hsl.h} ${hsl.s}% ${hsl.l}% / ${alpha})`
  const hexMatch = color.match(/^#([a-f0-9]{6}|[a-f0-9]{3})$/i)
  if (hexMatch) {
    const hex = hexMatch[1]
    const nums =
      hex.length === 3
        ? hex.split('').map((c) => parseInt(c + c, 16))
        : [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
          ]
    return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
  }
  return color
}

const resolveCssVar = (
  styles: CSSStyleDeclaration,
  variable: string,
  fallback: string,
  seen: Set<string> = new Set(),
): string => {
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

const buildPalette = (): ThemePalette => {
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

  const baseFallbacks = isDark
    ? [basePieces.I, basePieces.S, basePieces.O, basePieces.T, basePieces.Z, basePieces.J, basePieces.L]
    : [basePieces.I, basePieces.S, basePieces.O, basePieces.T, basePieces.Z, basePieces.J, basePieces.L]

  const primary = resolveCssVar(styles, '--primary', baseFallbacks[5])

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
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const holdCanvasRef = useRef<HTMLCanvasElement>(null)

    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const previewCtxRef = useRef<CanvasRenderingContext2D | null>(null)
    const holdCtxRef = useRef<CanvasRenderingContext2D | null>(null)

    const animationFrameRef = useRef<number | null>(null)
    const clearAnimationTimeoutRef = useRef<number | null>(null)
    const lastMoveTimeRef = useRef<number>(0)
    const isPlayingRef = useRef(false)
    const gameOverRef = useRef(false)

    const gridRef = useRef<(TetrominoType | null)[][]>([])
    const currentPieceRef = useRef<Tetromino | null>(null)
    const nextPieceRef = useRef<TetrominoType | null>(null)
    const holdPieceRef = useRef<TetrominoType | null>(null)
    const holdUsedRef = useRef(false)
    const clearAnimationRef = useRef<ClearAnimationState | null>(null)
    const columnOrderRef = useRef<number[]>([])
    const columnRankRef = useRef<number[]>([])

    const scoreRef = useRef(0)
    const linesRef = useRef(0)
    const levelRef = useRef(1)
    const [isPaused, setIsPaused] = useState(false)

    const paletteRef = useRef<ThemePalette>(buildPalette())

    const initGrid = () => {
      gridRef.current = Array(GRID_HEIGHT)
        .fill(null)
        .map(() => Array(GRID_WIDTH).fill(null))
    }

    const getRandomTetromino = (): TetrominoType => {
      const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
      return types[Math.floor(Math.random() * types.length)]
    }

    const createPieceFromType = (type: TetrominoType): Tetromino | null => {
      const spawnPos = SPAWN_POSITIONS[type]
      const piece: Tetromino = { type, rotation: 0, x: spawnPos.x, y: spawnPos.y }
      if (!isValidPosition(piece)) return null
      return piece
    }

    const takeNextPiece = (): Tetromino | null => {
      const type = nextPieceRef.current || getRandomTetromino()
      nextPieceRef.current = getRandomTetromino()
      return createPieceFromType(type)
    }

    const isValidPosition = (piece: Tetromino): boolean => {
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation]
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const gridX = piece.x + col
            const gridY = piece.y + row
            if (
              gridX < 0 ||
              gridX >= GRID_WIDTH ||
              gridY >= GRID_HEIGHT ||
              (gridY >= 0 && gridRef.current[gridY]?.[gridX])
            ) {
              return false
            }
          }
        }
      }
      return true
    }

    const lockPiece = (piece: Tetromino) => {
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation]
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const gridY = piece.y + row
            const gridX = piece.x + col
            if (gridY >= 0 && gridY < GRID_HEIGHT) {
              gridRef.current[gridY][gridX] = piece.type
            }
          }
        }
      }
    }

    const findFullLines = (): number[] => {
      const full: number[] = []
      for (let row = 0; row < GRID_HEIGHT; row++) {
        if (gridRef.current[row].every((cell) => cell !== null)) {
          full.push(row)
        }
      }
      return full
    }

    const removeLines = (lines: number[]) => {
      const sorted = [...lines].sort((a, b) => b - a) // remove from bottom to top to avoid index shift
      for (const row of sorted) {
        gridRef.current.splice(row, 1)
      }
      while (gridRef.current.length < GRID_HEIGHT) {
        gridRef.current.unshift(Array(GRID_WIDTH).fill(null))
      }
    }

    const calculateScore = (linesCleared: number): number => {
      const lineScores = [0, 100, 300, 500, 900]
      return lineScores[linesCleared] * levelRef.current
    }

    const getGhostPosition = (piece: Tetromino): number => {
      let ghostY = piece.y
      const testPiece = { ...piece }
      while (true) {
        testPiece.y++
        if (!isValidPosition(testPiece)) break
        ghostY = testPiece.y
      }
      return ghostY
    }

    const drawGridBackground = (ctx: CanvasRenderingContext2D) => {
      const palette = paletteRef.current
      const width = GRID_WIDTH * CELL_SIZE
      const height = GRID_HEIGHT * CELL_SIZE
      ctx.fillStyle = palette.background
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = palette.gridStroke
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.45

      for (let x = 0; x <= GRID_WIDTH; x++) {
        const px = x * CELL_SIZE + 0.5
        ctx.beginPath()
        ctx.moveTo(px, 0)
        ctx.lineTo(px, height)
        ctx.stroke()
      }

      for (let y = 0; y <= GRID_HEIGHT; y++) {
        const py = y * CELL_SIZE + 0.5
        ctx.beginPath()
        ctx.moveTo(0, py)
        ctx.lineTo(width, py)
        ctx.stroke()
      }

      ctx.globalAlpha = 1
    }

    const drawCell = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      darkColor: string,
      size: number = CELL_SIZE,
    ) => {
      ctx.fillStyle = color
      ctx.fillRect(x, y, size, size)

      ctx.strokeStyle = darkColor
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1)

      ctx.fillStyle = withAlpha('#ffffff', 0.2)
      ctx.fillRect(x + 2, y + 2, size - 4, size / 3)
    }

    const drawLockedBlocks = (ctx: CanvasRenderingContext2D, skipLines?: Set<number>) => {
      const palette = paletteRef.current
      for (let row = 0; row < GRID_HEIGHT; row++) {
        if (skipLines?.has(row)) continue
        for (let col = 0; col < GRID_WIDTH; col++) {
          const cellType = gridRef.current[row][col]
          if (cellType) {
            const color = palette.pieces[cellType].fill
            const darkColor = palette.pieces[cellType].stroke
            drawCell(ctx, col * CELL_SIZE, row * CELL_SIZE, color, darkColor)
          }
        }
      }
    }

    const drawCurrentPiece = (ctx: CanvasRenderingContext2D) => {
      if (!currentPieceRef.current) return
      const palette = paletteRef.current
      const piece = currentPieceRef.current
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation]
      const color = palette.pieces[piece.type].fill
      const darkColor = palette.pieces[piece.type].stroke

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const x = (piece.x + col) * CELL_SIZE
            const y = (piece.y + row) * CELL_SIZE
            drawCell(ctx, x, y, color, darkColor)
          }
        }
      }
    }

    const drawGhostPiece = (ctx: CanvasRenderingContext2D) => {
      if (!currentPieceRef.current) return

      const palette = paletteRef.current
      const piece = currentPieceRef.current
      const ghostY = getGhostPosition(piece)
      const shape = TETROMINO_SHAPES[piece.type][piece.rotation]

      ctx.save()
      ctx.strokeStyle = palette.ghost
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.globalAlpha = 0.8

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const x = (piece.x + col) * CELL_SIZE
            const y = (ghostY + row) * CELL_SIZE
            ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
          }
        }
      }

      ctx.restore()
    }

    const drawPreviewPiece = (ctx: CanvasRenderingContext2D | null, type: TetrominoType | null) => {
      if (!ctx) return
      const palette = paletteRef.current
      const size = PREVIEW_CELL_SIZE
      const width = 4 * size
      const height = 4 * size

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = palette.background
      ctx.fillRect(0, 0, width, height)

      if (!type) return

      const shape = TETROMINO_SHAPES[type][0]
      const shapeWidth = shape[0].length
      const shapeHeight = shape.length
      const offsetX = ((4 - shapeWidth) * size) / 2
      const offsetY = ((4 - shapeHeight) * size) / 2
      const color = palette.pieces[type].fill
      const darkColor = palette.pieces[type].stroke

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const x = offsetX + col * size
            const y = offsetY + row * size
            drawCell(ctx, x, y, color, darkColor, size)
          }
        }
      }
    }

    const drawClearAnimation = (
      ctx: CanvasRenderingContext2D,
      anim: ClearAnimationState,
      timestamp: number,
    ) => {
      const palette = paletteRef.current
      const progress = clamp((timestamp - anim.start) / anim.duration, 0, 1)
      const ranks = columnRankRef.current
      const maxRank = columnOrderRef.current.length - 1 || 1

      ctx.save()
      for (const line of anim.lines) {
        const y = line * CELL_SIZE
        for (let col = 0; col < GRID_WIDTH; col++) {
          const cellType = gridRef.current[line][col]
          if (!cellType) continue
          const rank = ranks[col] ?? 0
          const stage = progress * (maxRank + 1)
          const local = clamp(stage - rank, 0, 1) // 0 => not started, 1 => gone
          if (local >= 1) continue

          const alpha = 1 - local
          const scale = 1 - 0.45 * local
          const color = palette.pieces[cellType].fill
          const stroke = palette.pieces[cellType].stroke
          const cx = col * CELL_SIZE + CELL_SIZE / 2
          const cy = y + CELL_SIZE / 2

          ctx.save()
          ctx.translate(cx, cy)
          ctx.scale(scale, scale)
          ctx.globalAlpha = alpha
          ctx.fillStyle = color
          ctx.fillRect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE)
          ctx.strokeStyle = stroke
          ctx.lineWidth = 1
          ctx.strokeRect(-CELL_SIZE / 2 + 0.5, -CELL_SIZE / 2 + 0.5, CELL_SIZE - 1, CELL_SIZE - 1)
          ctx.restore()
        }
      }

      if (anim.isTetris) {
        const width = GRID_WIDTH * CELL_SIZE
        const height = GRID_HEIGHT * CELL_SIZE
        ctx.globalAlpha = 0.18 * (1 - progress)
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width)
        gradient.addColorStop(0, withAlpha(palette.accent, 0.6))
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      }

      ctx.restore()
    }

    const render = (timestamp: number = performance.now()) => {
      const ctx = ctxRef.current
      if (!ctx) return

      drawGridBackground(ctx)
      const anim = clearAnimationRef.current
      const skip = anim ? new Set(anim.lines) : undefined
      drawLockedBlocks(ctx, skip)
      drawGhostPiece(ctx)
      drawCurrentPiece(ctx)

      if (anim) {
        drawClearAnimation(ctx, anim, timestamp)
      }

      drawPreviewPiece(previewCtxRef.current, nextPieceRef.current)
      drawPreviewPiece(holdCtxRef.current, holdPieceRef.current)
    }

    const finalizeClear = (lines: number[]) => {
      removeLines(lines)
      const linesCleared = lines.length
      if (linesCleared > 0) {
        linesRef.current += linesCleared
        scoreRef.current += calculateScore(linesCleared)
        const baseLevel = Math.max(1, startLevel)
        levelRef.current = baseLevel + Math.floor(linesRef.current / 10)
        onScoreChange(scoreRef.current)
        onLinesChange(linesRef.current)
        onLevelChange(levelRef.current)
      }

      clearAnimationRef.current = null

      const spawned = takeNextPiece()
      if (!spawned) {
        gameOverRef.current = true
        isPlayingRef.current = false
        setIsPaused(false)
        onStateChange(false)
        onGameOver()
        render()
        return
      }
      currentPieceRef.current = spawned
      render()
    }

    const startClearAnimation = (lines: number[]) => {
      const duration = lines.length >= 4 ? 650 : 360

      clearAnimationRef.current = {
        lines,
        start: performance.now(),
        duration,
        isTetris: lines.length >= 4,
      }
      if (clearAnimationTimeoutRef.current) {
        clearTimeout(clearAnimationTimeoutRef.current)
      }
      clearAnimationTimeoutRef.current = window.setTimeout(() => finalizeClear(lines), duration)
      render()
    }

    const handleLock = () => {
      if (!currentPieceRef.current) return false
      lockPiece(currentPieceRef.current)
      holdUsedRef.current = false
      const fullLines = findFullLines()
      if (fullLines.length > 0) {
        currentPieceRef.current = null
        startClearAnimation(fullLines)
        return true
      }

      const newPiece = takeNextPiece()
      if (!newPiece) {
        gameOverRef.current = true
        isPlayingRef.current = false
        setIsPaused(false)
        onStateChange(false)
        onGameOver()
        render()
        return false
      }

      currentPieceRef.current = newPiece
      render()
      return true
    }

    const moveDown = (): boolean => {
      if (!currentPieceRef.current || clearAnimationRef.current) return false

      const newPiece = { ...currentPieceRef.current, y: currentPieceRef.current.y + 1 }
      if (isValidPosition(newPiece)) {
        currentPieceRef.current = newPiece
        return true
      }

      return handleLock()
    }

    const gameLoop = (timestamp: number) => {
      if (!isPlayingRef.current || gameOverRef.current) return

      if (clearAnimationRef.current) {
        render(timestamp)
        animationFrameRef.current = requestAnimationFrame(gameLoop)
        return
      }

      const moveInterval = Math.max(80, 1000 - (levelRef.current - 1) * 60)

      if (timestamp - lastMoveTimeRef.current > moveInterval) {
        moveDown()
        render(timestamp)
        lastMoveTimeRef.current = timestamp
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    const refreshPalette = () => {
      paletteRef.current = buildPalette()
      render()
    }

    const resumeInternal = () => {
      if (gameOverRef.current) return
      if (!currentPieceRef.current) {
        const next = takeNextPiece()
        if (!next) {
          gameOverRef.current = true
          isPlayingRef.current = false
          setIsPaused(false)
          onStateChange(false)
          onGameOver()
          return
        }
        currentPieceRef.current = next
      }
      isPlayingRef.current = true
      setIsPaused(false)
      onStateChange(true)
      lastMoveTimeRef.current = performance.now()
      animationFrameRef.current = requestAnimationFrame(gameLoop)
      render()
    }

    useImperativeHandle(ref, () => ({
      startGame: () => {
        refreshPalette()
        initGrid()
        scoreRef.current = 0
        linesRef.current = 0
        levelRef.current = Math.max(1, startLevel)
        holdPieceRef.current = null
        holdUsedRef.current = false
        gameOverRef.current = false
        clearAnimationRef.current = null
        onScoreChange(0)
        onLinesChange(0)
        onLevelChange(levelRef.current)
        onGameRestart()

        nextPieceRef.current = getRandomTetromino()
        currentPieceRef.current = takeNextPiece()

        isPlayingRef.current = true
        setIsPaused(false)
        onStateChange(true)
        lastMoveTimeRef.current = performance.now()
        animationFrameRef.current = requestAnimationFrame(gameLoop)
        render()
      },
      stopGame: () => {
        isPlayingRef.current = false
        setIsPaused(true)
        onStateChange(false)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      },
      resumeGame: resumeInternal,
      moveLeft: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || clearAnimationRef.current) return
        const newPiece = { ...currentPieceRef.current, x: currentPieceRef.current.x - 1 }
        if (isValidPosition(newPiece)) {
          currentPieceRef.current = newPiece
          render()
        }
      },
      moveRight: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || clearAnimationRef.current) return
        const newPiece = { ...currentPieceRef.current, x: currentPieceRef.current.x + 1 }
        if (isValidPosition(newPiece)) {
          currentPieceRef.current = newPiece
          render()
        }
      },
      moveDown: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || clearAnimationRef.current) return
        if (moveDown()) {
          render()
        }
      },
      rotate: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || clearAnimationRef.current) return
        const piece = currentPieceRef.current
        const numRotations = TETROMINO_SHAPES[piece.type].length
        const newRotation = (piece.rotation + 1) % numRotations
        const newPiece = { ...piece, rotation: newRotation }

        if (isValidPosition(newPiece)) {
          currentPieceRef.current = newPiece
          render()
          return
        }

        const kicks = [
          { x: -1, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: -1 },
          { x: -2, y: 0 },
          { x: 2, y: 0 },
        ]

        for (const kick of kicks) {
          const kickedPiece = {
            ...newPiece,
            x: newPiece.x + kick.x,
            y: newPiece.y + kick.y,
          }
          if (isValidPosition(kickedPiece)) {
            currentPieceRef.current = kickedPiece
            render()
            return
          }
        }
      },
      hardDrop: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || clearAnimationRef.current) return
        const ghostY = getGhostPosition(currentPieceRef.current)
        currentPieceRef.current.y = ghostY
        moveDown()
        render()
      },
      holdPiece: () => {
        if (!currentPieceRef.current || !isPlayingRef.current || holdUsedRef.current) return
        if (clearAnimationRef.current) return

        const currentType = currentPieceRef.current.type

        if (!holdPieceRef.current) {
          holdPieceRef.current = currentType
          const next = takeNextPiece()
          if (!next) {
            gameOverRef.current = true
            isPlayingRef.current = false
            onStateChange(false)
            onGameOver()
            return
          }
          currentPieceRef.current = next
        } else {
          const swapType = holdPieceRef.current
          holdPieceRef.current = currentType
          const swapped = createPieceFromType(swapType)
          if (!swapped) {
            gameOverRef.current = true
            isPlayingRef.current = false
            onStateChange(false)
            onGameOver()
            return
          }
          currentPieceRef.current = swapped
        }

        holdUsedRef.current = true
        drawPreviewPiece(holdCtxRef.current, holdPieceRef.current)
        render()
      },
    }))

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = GRID_WIDTH * CELL_SIZE
      canvas.height = GRID_HEIGHT * CELL_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctxRef.current = ctx

      const previewCanvas = previewCanvasRef.current
      if (previewCanvas) {
        previewCanvas.width = 4 * PREVIEW_CELL_SIZE
        previewCanvas.height = 4 * PREVIEW_CELL_SIZE
        previewCtxRef.current = previewCanvas.getContext('2d')
      }

      const holdCanvas = holdCanvasRef.current
      if (holdCanvas) {
        holdCanvas.width = 4 * PREVIEW_CELL_SIZE
        holdCanvas.height = 4 * PREVIEW_CELL_SIZE
        holdCtxRef.current = holdCanvas.getContext('2d')
      }

      initGrid()
      paletteRef.current = buildPalette()
      const order: number[] = []
      let left = Math.floor((GRID_WIDTH - 1) / 2)
      let right = left + 1
      while (left >= 0 || right < GRID_WIDTH) {
        if (left >= 0) order.push(left--)
        if (right < GRID_WIDTH) order.push(right++)
      }
      columnOrderRef.current = order
      const ranks = new Array<number>(GRID_WIDTH)
      order.forEach((col, idx) => {
        ranks[col] = idx
      })
      columnRankRef.current = ranks
      nextPieceRef.current = getRandomTetromino()
      render()

      const observer = new MutationObserver(refreshPalette)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

      return () => {
        observer.disconnect()
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (clearAnimationTimeoutRef.current) {
          clearTimeout(clearAnimationTimeoutRef.current)
        }
      }
    }, [])

    return (
      <div className="flex items-start gap-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            className="border-2 border-border rounded-lg shadow-sm"
            style={{
              backgroundColor: paletteRef.current.background,
              filter: isPaused ? 'blur(3px)' : 'none',
              transition: 'filter 150ms ease',
            }}
          />

          {isPaused && !gameOverRef.current && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background/85 backdrop-blur-sm px-4 py-3 shadow-lg">
                <div className="flex items-center gap-2 text-foreground/80">
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-7 w-2 rounded bg-foreground/90" />
                    <span className="inline-block h-7 w-2 rounded bg-foreground/60" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Paused
                  </span>
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Press <span className="font-semibold text-foreground">Enter</span> to resume
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 w-[110px] text-xs text-muted-foreground">
          <div className="rounded-md border border-border bg-card p-2 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
              Next
            </div>
            <canvas
              ref={previewCanvasRef}
              width={4 * PREVIEW_CELL_SIZE}
              height={4 * PREVIEW_CELL_SIZE}
              className="mt-2"
            />
          </div>

          <div className="rounded-md border border-border bg-card p-2 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
              Hold
            </div>
            <canvas
              ref={holdCanvasRef}
              width={4 * PREVIEW_CELL_SIZE}
              height={4 * PREVIEW_CELL_SIZE}
              className="mt-2"
            />
          </div>
        </div>
      </div>
    )
  },
)

TetrisCore.displayName = 'TetrisCore'
