import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'
import { Button } from '@/components/ui/button'
import { Play, RotateCcw, Pause } from 'lucide-react'
import { useGameSound } from '@/hooks/useGameSound'
import { Kbd } from '@/components/ui/kbd'

const CELL_SIZE = 30
const GRID_SIZE = 20 // 20x20 grid = 600x600 pixels
const GAME_SPEED = 100 // ms per move

type Point = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export function SnakeGameJS({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const { play: playEatSound } = useGameSound(
    'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  )
  const { play: playGameOverSound } = useGameSound(
    'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  )

  // Game state refs
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }])
  const prevSnakeRef = useRef<Point[]>([{ x: 10, y: 10 }])
  const foodRef = useRef<Point>({ x: 15, y: 15 })
  const directionRef = useRef<Direction>('RIGHT')
  const nextDirectionRef = useRef<Direction>('RIGHT')
  const timeSinceLastMoveRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)
  const requestRef = useRef<number>(0)

  const startGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }]
    prevSnakeRef.current = [{ x: 10, y: 10 }]
    directionRef.current = 'RIGHT'
    nextDirectionRef.current = 'RIGHT'
    spawnFood(snakeRef.current)
    setScore(0)
    setGameOver(false)
    setIsPlaying(true)
    timeSinceLastMoveRef.current = 0
    lastFrameTimeRef.current = performance.now()
    window.focus()
  }

  const stopGame = () => {
    setIsPlaying(false)
  }

  const resumeGame = () => {
    setIsPlaying(true)
    lastFrameTimeRef.current = performance.now()
    window.focus()
  }

  // Game Loop
  const animate = (time: number) => {
    const deltaTime = time - lastFrameTimeRef.current
    lastFrameTimeRef.current = time

    if (isPlayingRef.current && !gameOverRef.current) {
      timeSinceLastMoveRef.current += deltaTime

      if (timeSinceLastMoveRef.current >= GAME_SPEED) {
        updateGame()
        timeSinceLastMoveRef.current -= GAME_SPEED
        if (timeSinceLastMoveRef.current > GAME_SPEED) {
          timeSinceLastMoveRef.current = 0
        }
      }
    }

    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      const progress = Math.min(timeSinceLastMoveRef.current / GAME_SPEED, 1)
      drawGame(ctx, progress)
    }

    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)
      ) {
        e.preventDefault()
      }

      if (e.code === 'Space') {
        if (gameOverRef.current) {
          startGame()
        } else if (isPlayingRef.current) {
          stopGame()
        } else {
          resumeGame()
        }
        return
      }

      if (!isPlayingRef.current) return

      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP'
          break
        case 'ArrowDown':
          if (directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN'
          break
        case 'ArrowLeft':
          if (directionRef.current !== 'RIGHT')
            nextDirectionRef.current = 'LEFT'
          break
        case 'ArrowRight':
          if (directionRef.current !== 'LEFT')
            nextDirectionRef.current = 'RIGHT'
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isPlayingRef = useRef(false)
  const gameOverRef = useRef(false)

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    gameOverRef.current = gameOver
  }, [gameOver])

  const updateGame = () => {
    prevSnakeRef.current = snakeRef.current.map((p) => ({ ...p }))
    const head = { ...snakeRef.current[0] }
    directionRef.current = nextDirectionRef.current

    switch (directionRef.current) {
      case 'UP':
        head.y -= 1
        break
      case 'DOWN':
        head.y += 1
        break
      case 'LEFT':
        head.x -= 1
        break
      case 'RIGHT':
        head.x += 1
        break
    }

    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE ||
      snakeRef.current.some(
        (segment) => segment.x === head.x && segment.y === head.y,
      )
    ) {
      setGameOver(true)
      setIsPlaying(false)
      playGameOverSound()
      return
    }

    const newSnake = [head, ...snakeRef.current]

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      setScore((s) => s + 1)
      spawnFood(newSnake)
      playEatSound()
    } else {
      newSnake.pop()
    }

    snakeRef.current = newSnake
  }

  const spawnFood = (snake: Point[]) => {
    let newFood: Point
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
      const onSnake = snake.some((s) => s.x === newFood.x && s.y === newFood.y)
      if (!onSnake) break
    }
    foodRef.current = newFood
  }

  const drawGame = (ctx: CanvasRenderingContext2D, progress: number) => {
    // Clear
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)

    // Draw Grid
    ctx.strokeStyle = 'rgba(51, 51, 51, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * CELL_SIZE
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, CELL_SIZE * GRID_SIZE)
      ctx.moveTo(0, pos)
      ctx.lineTo(CELL_SIZE * GRID_SIZE, pos)
    }
    ctx.stroke()

    // Draw Border
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)

    // Draw Snake
    if (snakeRef.current.length > 0) {
      const points = snakeRef.current.map((segment, i) => {
        let x = segment.x
        let y = segment.y

        if (prevSnakeRef.current[i]) {
          const prev = prevSnakeRef.current[i]
          x = prev.x + (segment.x - prev.x) * progress
          y = prev.y + (segment.y - prev.y) * progress
        }
        return {
          x: x * CELL_SIZE + CELL_SIZE / 2,
          y: y * CELL_SIZE + CELL_SIZE / 2,
        }
      })

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#ffffff'

      // Draw connections (core body)
      if (points.length > 1) {
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y)
        }
        ctx.lineWidth = CELL_SIZE
        ctx.lineCap = 'butt'
        ctx.lineJoin = 'miter'
        ctx.stroke()
      }

      // Draw rounded segments (corners and ends)
      points.forEach((p) => {
        const r = 8
        const x = p.x - CELL_SIZE / 2
        const y = p.y - CELL_SIZE / 2
        const w = CELL_SIZE
        const h = CELL_SIZE

        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.arcTo(x + w, y, x + w, y + r, r)
        ctx.lineTo(x + w, y + h - r)
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
        ctx.lineTo(x + r, y + h)
        ctx.arcTo(x, y + h, x, y + h - r, r)
        ctx.lineTo(x, y + r)
        ctx.arcTo(x, y, x + r, y, r)
        ctx.closePath()
        ctx.fill()
      })
    }

    // Draw Food
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(
      foodRef.current.x * CELL_SIZE + CELL_SIZE / 2,
      foodRef.current.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      <canvas
        ref={canvasRef}
        width={CELL_SIZE * GRID_SIZE}
        height={CELL_SIZE * GRID_SIZE}
        className="border-4 border-black rounded-sm shadow-lg bg-[#1a1a1a]"
      />

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase font-bold">
            {t('games.common.controls.move')}
          </span>
          <div className="flex gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
          </div>
        </div>
      </div>

      {gameOver && (
        <p className="text-xl font-bold text-destructive animate-pulse">
          {t('games.common.gameOver')}
        </p>
      )}
    </div>
  )

  const controls = (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-end">
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
          {t('games.common.score')}
        </span>
        <span className="font-mono font-bold text-3xl tabular-nums leading-none">
          {score.toString().padStart(3, '0')}
        </span>
      </div>

      <div className="h-8 w-px bg-border" />

      <Button
        onClick={() => {
          if (isPlaying) stopGame()
          else if (gameOver) startGame()
          else resumeGame()
        }}
        variant={isPlaying ? 'destructive' : 'default'}
        className="h-11 px-8 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95"
      >
        {gameOver ? (
          <>
            <RotateCcw className="mr-2 h-5 w-5" />
            <span className="font-bold mr-3">{t('games.common.restart')}</span>
            <Kbd className="bg-background/20 text-current border-transparent h-5 min-w-auto px-1.5">
              {t('kbd.space')}
            </Kbd>
          </>
        ) : isPlaying ? (
          <>
            <Pause className="mr-2 h-5 w-5" />
            <span className="font-bold mr-3">Stop</span>
            <Kbd className="bg-background/20 text-current border-transparent h-5 min-w-auto px-1.5">
              {t('kbd.space')}
            </Kbd>
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            <span className="font-bold mr-3">{t('games.common.start')}</span>
            <Kbd className="bg-background/20 text-current border-transparent h-5 min-w-auto px-1.5">
              {t('kbd.space')}
            </Kbd>
          </>
        )}
      </Button>
    </div>
  )

  if (embedded) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-xl font-bold">Canvas API</h3>
        {controls}
        {content}
      </div>
    )
  }

  return (
    <GameLayout title={`${t('games.titles.snake')} (JS)`} controls={controls}>
      {content}
    </GameLayout>
  )
}
