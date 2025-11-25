import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  TILE_SIZE,
  LEVELS,
  PACMAN_START,
  type LevelLayout,
} from './assets/level'

type Direction = 'up' | 'down' | 'left' | 'right'

export interface PacmanGameHandle {
  startGame: () => void
  stopGame: () => void
  resumeGame: () => void
  changeDirection: (dir: Direction) => void
}

interface PacmanCoreProps {
  onScoreChange: (score: number) => void
  onPelletsChange: (remaining: number) => void
  onStateChange: (isPlaying: boolean) => void
  onWin: () => void
  onGameOver: () => void
}

interface PacmanState {
  x: number
  y: number
  dir: Direction
  desiredDir: Direction
}

interface GhostState {
  id: number
  x: number
  y: number
  dir: Direction
  frightenedUntil: number
  color: string
}

const WALL = '#'
const PELLET = '.'
const POWER = 'o'

const BASE_SPEED = 7 // tiles per second
const GHOST_SPEED = 5.2
const FRIGHT_DURATION = 6500
const GHOST_COLORS = ['#ff4b5c', '#ffb347', '#4bd1ff', '#7c4bff']

const dirVectors: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const keyFor = (x: number, y: number) => `${x},${y}`

const pacmanPixels: number[][] = [
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
]

const ghostPixels: number[][] = [
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1],
  [1, 1, 0, 1, 0, 1, 0, 1, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1],
]

const drawPixelSprite = (
  ctx: CanvasRenderingContext2D,
  pattern: number[][],
  color: string,
  x: number,
  y: number,
  size: number,
) => {
  const rows = pattern.length
  const cols = pattern[0].length
  const pixelSize = size / cols
  ctx.fillStyle = color
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (pattern[row][col]) {
        ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize)
      }
    }
  }
}

export const PacmanCore = forwardRef<PacmanGameHandle, PacmanCoreProps>(
  ({ onScoreChange, onPelletsChange, onStateChange, onWin, onGameOver }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

    const animationFrameRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number | null>(null)

    const isPlayingRef = useRef(false)
    const gameOverRef = useRef(false)

    const pelletsRef = useRef<Set<string>>(new Set())
    const powerPelletsRef = useRef<Set<string>>(new Set())
    const wallsRef = useRef<Set<string>>(new Set())
    const scoreRef = useRef(0)
    const levelIndexRef = useRef(0)

    const pacmanRef = useRef<PacmanState>({
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      desiredDir: 'left',
    })

    const ghostsRef = useRef<GhostState[]>([])

    const currentLayoutRef = useRef<LevelLayout>(LEVELS[0])

    const resetBoard = (levelIndex: number) => {
      const layout = LEVELS[levelIndex % LEVELS.length]
      currentLayoutRef.current = layout
      const pellets = new Set<string>()
      const powerPellets = new Set<string>()
      const walls = new Set<string>()

      layout.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const char = row[x]
          if (char === WALL) {
            walls.add(keyFor(x, y))
          } else if (char === PELLET) {
            pellets.add(keyFor(x, y))
          } else if (char === POWER) {
            powerPellets.add(keyFor(x, y))
          }
        }
      })

      wallsRef.current = walls
      pelletsRef.current = pellets
      powerPelletsRef.current = powerPellets
      scoreRef.current = scoreRef.current // keep cumulative

      pacmanRef.current = {
        x: PACMAN_START.x,
        y: PACMAN_START.y,
        dir: 'left',
        desiredDir: 'left',
      }

      ghostsRef.current = GHOST_COLORS.map((color, idx) => ({
        id: idx,
        x: PACMAN_START.x + (idx % 2 === 0 ? 1 : -1),
        y: PACMAN_START.y - 1,
        dir: idx % 2 === 0 ? 'left' : 'right',
        frightenedUntil: 0,
        color,
      }))

      onPelletsChange(pellets.size + powerPellets.size)
    }

    const canMove = (dir: Direction, x: number, y: number) => {
      const { x: dx, y: dy } = dirVectors[dir]
      const nextX = Math.round(x + dx * 0.6)
      const nextY = Math.round(y + dy * 0.6)
      return !wallsRef.current.has(keyFor(nextX, nextY))
    }

    const wrapPosition = (state: { x: number; y: number }) => {
      const width = currentLayoutRef.current[0].length
      const height = currentLayoutRef.current.length
      if (state.x < 0) state.x = width - 1
      if (state.x >= width) state.x = 0
      if (state.y < 0) state.y = height - 1
      if (state.y >= height) state.y = 0
    }

    const eatPelletIfPresent = (state: PacmanState, timestamp: number) => {
      const tx = Math.round(state.x)
      const ty = Math.round(state.y)
      const posKey = keyFor(tx, ty)
      let ate = false

      if (pelletsRef.current.has(posKey)) {
        pelletsRef.current.delete(posKey)
        scoreRef.current += 10
        ate = true
      } else if (powerPelletsRef.current.has(posKey)) {
        powerPelletsRef.current.delete(posKey)
        scoreRef.current += 50
        ate = true
        ghostsRef.current = ghostsRef.current.map((g) => ({
          ...g,
          frightenedUntil: timestamp + FRIGHT_DURATION,
        }))
      }

      if (ate) {
        onScoreChange(scoreRef.current)
        const remaining = pelletsRef.current.size + powerPelletsRef.current.size
        onPelletsChange(remaining)
        if (remaining === 0) {
          // advance level or win
          const nextLevel = levelIndexRef.current + 1
          if (nextLevel < LEVELS.length) {
            levelIndexRef.current = nextLevel
            resetBoard(nextLevel)
          } else {
            isPlayingRef.current = false
            gameOverRef.current = true
            onStateChange(false)
            onWin()
          }
        }
      }
    }

    const draw = (timestamp: number) => {
      const ctx = ctxRef.current
      const canvas = canvasRef.current
      if (!ctx || !canvas) return

      const layout = currentLayoutRef.current
      const width = layout[0].length * TILE_SIZE
      const height = layout.length * TILE_SIZE

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#1230ff'
      layout.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === WALL) {
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
          }
        }
      })

      ctx.fillStyle = '#f5d76e'
      pelletsRef.current.forEach((key) => {
        const [sx, sy] = key.split(',').map(Number)
        drawPixelSprite(ctx, [[1]], '#f5d76e', sx * TILE_SIZE + TILE_SIZE / 2 - 2, sy * TILE_SIZE + TILE_SIZE / 2 - 2, 4)
      })

      powerPelletsRef.current.forEach((key) => {
        const [sx, sy] = key.split(',').map(Number)
        drawPixelSprite(ctx, [[1, 1], [1, 1]], '#ffa53b', sx * TILE_SIZE + TILE_SIZE / 2 - 4, sy * TILE_SIZE + TILE_SIZE / 2 - 4, 8)
      })

      ghostsRef.current.forEach((ghost) => {
        const frightened = ghost.frightenedUntil > timestamp
        const bodyColor = frightened ? '#1e3a8a' : ghost.color
        drawPixelSprite(
          ctx,
          ghostPixels,
          bodyColor,
          ghost.x * TILE_SIZE + TILE_SIZE * 0.1,
          ghost.y * TILE_SIZE + TILE_SIZE * 0.1,
          TILE_SIZE * 0.8,
        )
        // eyes
        ctx.fillStyle = frightened ? '#e0f2fe' : '#fff'
        const eyeSize = TILE_SIZE * 0.12
        ctx.fillRect(ghost.x * TILE_SIZE + TILE_SIZE * 0.35, ghost.y * TILE_SIZE + TILE_SIZE * 0.32, eyeSize, eyeSize)
        ctx.fillRect(ghost.x * TILE_SIZE + TILE_SIZE * 0.55, ghost.y * TILE_SIZE + TILE_SIZE * 0.32, eyeSize, eyeSize)
      })

      const pac = pacmanRef.current
      drawPixelSprite(
        ctx,
        pacmanPixels,
        '#ffd800',
        pac.x * TILE_SIZE + TILE_SIZE * 0.05,
        pac.y * TILE_SIZE + TILE_SIZE * 0.05,
        TILE_SIZE * 0.9,
      )
    }

    const chooseGhostDir = (ghost: GhostState): Direction => {
      const width = currentLayoutRef.current[0].length
      const height = currentLayoutRef.current.length
      const atCenter = Math.abs(ghost.x % 1 - 0.5) < 0.15 && Math.abs(ghost.y % 1 - 0.5) < 0.15
      if (!atCenter) return ghost.dir

      const possible: Direction[] = []
      ;(['up', 'down', 'left', 'right'] as Direction[]).forEach((dir) => {
        const { x: dx, y: dy } = dirVectors[dir]
        const nx = Math.round(ghost.x + dx)
        const ny = Math.round(ghost.y + dy)
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !wallsRef.current.has(keyFor(nx, ny))) {
          possible.push(dir)
        }
      })
      if (possible.length === 0) return ghost.dir

      const frightened = ghost.frightenedUntil > performance.now()
      const target = frightened ? { x: width - pacmanRef.current.x, y: height - pacmanRef.current.y } : pacmanRef.current
      let bestDir = possible[0]
      let bestDist = Infinity
      possible.forEach((dir) => {
        const { x: dx, y: dy } = dirVectors[dir]
        const nx = ghost.x + dx
        const ny = ghost.y + dy
        const dist = (nx - target.x) ** 2 + (ny - target.y) ** 2
        if (dist < bestDist) {
          bestDist = dist
          bestDir = dir
        }
      })
      return bestDir
    }

    const checkCollisions = (timestamp: number) => {
      const pac = pacmanRef.current
      for (const ghost of ghostsRef.current) {
        const dx = ghost.x - pac.x
        const dy = ghost.y - pac.y
        if (dx * dx + dy * dy < 0.15) {
          if (ghost.frightenedUntil > timestamp) {
            scoreRef.current += 200
            onScoreChange(scoreRef.current)
            // respawn ghost
            ghost.x = PACMAN_START.x
            ghost.y = PACMAN_START.y - 1
            ghost.dir = 'left'
            ghost.frightenedUntil = 0
          } else {
            isPlayingRef.current = false
            gameOverRef.current = true
            onStateChange(false)
            onGameOver()
          }
        }
      }
    }

    const step = (timestamp: number) => {
      if (!isPlayingRef.current) return

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp
      }
      const deltaMs = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      const pac = pacmanRef.current
      const pacMove = (BASE_SPEED * deltaMs) / 1000

      const centerX = Math.round(pac.x * 100) / 100
      const centerY = Math.round(pac.y * 100) / 100

      if (
        Math.abs(centerX % 1 - 0.5) < 0.15 &&
        Math.abs(centerY % 1 - 0.5) < 0.15 &&
        canMove(pac.desiredDir, pac.x, pac.y)
      ) {
        pac.dir = pac.desiredDir
      }

      if (canMove(pac.dir, pac.x, pac.y)) {
        pac.x += dirVectors[pac.dir].x * pacMove
        pac.y += dirVectors[pac.dir].y * pacMove
      }

      wrapPosition(pac)
      eatPelletIfPresent(pac, timestamp)

      const ghostMove = (GHOST_SPEED * deltaMs) / 1000
      ghostsRef.current = ghostsRef.current.map((ghost) => {
        const dir = chooseGhostDir(ghost)
        ghost.dir = dir
        ghost.x += dirVectors[dir].x * ghostMove
        ghost.y += dirVectors[dir].y * ghostMove
        wrapPosition(ghost)
        return ghost
      })

      checkCollisions(timestamp)

      draw(timestamp)
      animationFrameRef.current = requestAnimationFrame(step)
    }

    useImperativeHandle(ref, () => ({
      startGame: () => {
        levelIndexRef.current = 0
        scoreRef.current = 0
        resetBoard(0)
        isPlayingRef.current = true
        gameOverRef.current = false
        onStateChange(true)
        lastTimeRef.current = null
        draw(performance.now())
        animationFrameRef.current = requestAnimationFrame(step)
      },
      stopGame: () => {
        isPlayingRef.current = false
        onStateChange(false)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      },
      resumeGame: () => {
        if (gameOverRef.current) return
        isPlayingRef.current = true
        onStateChange(true)
        lastTimeRef.current = null
        animationFrameRef.current = requestAnimationFrame(step)
      },
      changeDirection: (dir: Direction) => {
        pacmanRef.current.desiredDir = dir
      },
    }))

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.width = LEVELS[0][0].length * TILE_SIZE
      canvas.height = LEVELS[0].length * TILE_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctxRef.current = ctx
      resetBoard(0)
      draw(performance.now())

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }, [])

    return (
      <canvas
        ref={canvasRef}
        className="border-2 border-border rounded-lg bg-black"
        style={{ width: LEVELS[0][0].length * TILE_SIZE, height: LEVELS[0].length * TILE_SIZE }}
      />
    )
  },
)

PacmanCore.displayName = 'PacmanCore'
