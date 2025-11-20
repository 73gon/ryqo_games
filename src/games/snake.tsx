import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Application, Graphics } from 'pixi.js'
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

export function SnakeGame() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const { play: playEatSound } = useGameSound(
    'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  ) // Example sound
  const { play: playGameOverSound } = useGameSound(
    'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  ) // Example sound

  // Game state refs to be accessible inside the game loop without dependencies
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }])
  const prevSnakeRef = useRef<Point[]>([{ x: 10, y: 10 }])
  const foodRef = useRef<Point>({ x: 15, y: 15 })
  const directionRef = useRef<Direction>('RIGHT')
  const nextDirectionRef = useRef<Direction>('RIGHT')
  const timeSinceLastMoveRef = useRef<number>(0)

  useEffect(() => {
    let app: Application | undefined
    let destroyed = false

    // Initialize PixiJS Application
    const initApp = async () => {
      if (!containerRef.current) return

      const newApp = new Application()
      await newApp.init({
        width: CELL_SIZE * GRID_SIZE,
        height: CELL_SIZE * GRID_SIZE,
        backgroundColor: 0x1a1a1a,
        antialias: true,
      })

      if (destroyed) {
        newApp.destroy()
        return
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(newApp.canvas)
      }

      app = newApp
      appRef.current = newApp

      // Graphics for drawing
      const graphics = new Graphics()
      newApp.stage.addChild(graphics)

      // Game Loop
      newApp.ticker.add((ticker) => {
        if (!isPlayingRef.current || gameOverRef.current) {
          // Still draw to show game over state or paused state
          if (graphics) drawGame(graphics, 0)
          return
        }

        timeSinceLastMoveRef.current += ticker.deltaMS

        if (timeSinceLastMoveRef.current >= GAME_SPEED) {
          updateGame()
          timeSinceLastMoveRef.current -= GAME_SPEED
          // Prevent spiral if lag is huge
          if (timeSinceLastMoveRef.current > GAME_SPEED) {
            timeSinceLastMoveRef.current = 0
          }
        }

        const progress = Math.min(timeSinceLastMoveRef.current / GAME_SPEED, 1)
        drawGame(graphics, progress)
      })

      // Initial draw
      drawGame(graphics, 0)
    }

    initApp()

    return () => {
      destroyed = true
      if (app) {
        app.destroy({ removeView: true })
      }
    }
  }, []) // Run once on mount

  const startGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }]
    prevSnakeRef.current = [{ x: 10, y: 10 }]
    directionRef.current = 'RIGHT'
    nextDirectionRef.current = 'RIGHT'
    spawnFood(snakeRef.current)
    setScore(0)
    setGameOver(false)
    setIsPlaying(true)
    window.focus()
  }

  const stopGame = () => {
    setIsPlaying(false)
  }

  const resumeGame = () => {
    setIsPlaying(true)
    window.focus()
  }

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

    // Check collisions
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

    // Check food
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
      // Make sure food doesn't spawn on snake
      const onSnake = snake.some((s) => s.x === newFood.x && s.y === newFood.y)
      if (!onSnake) break
    }
    foodRef.current = newFood
  }

  const drawGame = (g: Graphics, progress: number) => {
    g.clear()

    // Draw Background
    g.rect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)
    g.fill(0x1a1a1a)

    // Draw Grid
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * CELL_SIZE
      // Vertical lines
      g.moveTo(pos, 0)
      g.lineTo(pos, CELL_SIZE * GRID_SIZE)

      // Horizontal lines
      g.moveTo(0, pos)
      g.lineTo(CELL_SIZE * GRID_SIZE, pos)
    }
    g.stroke({ width: 1, color: 0x333333, alpha: 0.5 })

    // Draw Border
    g.rect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)
    g.stroke({ width: 2, color: 0x000000 })

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

      if (points.length === 1) {
        g.circle(points[0].x, points[0].y, CELL_SIZE / 2)
        g.fill(0xffffff)
      } else {
        g.beginPath()
        g.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          g.lineTo(points[i].x, points[i].y)
        }
        g.stroke({
          width: CELL_SIZE,
          color: 0xffffff,
          cap: 'round',
          join: 'round',
        })
      }
    }

    // Draw Food
    g.fillStyle = 0xffffff // Using white for food too
    g.circle(
      foodRef.current.x * CELL_SIZE + CELL_SIZE / 2,
      foodRef.current.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 3,
    )
    g.fill()
  }

  return (
    <GameLayout
      title={t('games.titles.snake')}
      controls={
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
            className="h-11"
          >
            {gameOver ? (
              <>
                <RotateCcw className="mr-2 h-5 w-5" />
                <span className="font-bold mr-3">
                  {t('games.common.restart')}
                </span>
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
                <span className="font-bold mr-3">
                  {t('games.common.start')}
                </span>
                <Kbd className="bg-background/20 text-current border-transparent h-5 min-w-auto px-1.5">
                  {t('kbd.space')}
                </Kbd>
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center gap-6">
        <div
          ref={containerRef}
          className="border-4 border-black rounded-sm shadow-lg"
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
    </GameLayout>
  )
}
