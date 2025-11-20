import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Application, Graphics } from 'pixi.js'
import { useGameSound } from '@/hooks/useGameSound'
import { drawPixelApple } from './pixel_apple'
import { drawPixelSnakeHead } from './pixel_snake_head'
import { drawPixelSnakeHeadDead } from './pixel_snake_head_dead'
import { drawPixelSnakeBody } from './pixel_snake_body'
import { drawPixelSnakeTail } from './pixel_snake_tail'

const CELL_SIZE = 31
const GRID_SIZE = 20

type Point = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export type SnakeGameHandle = {
  startGame: () => void
  stopGame: () => void
  resumeGame: () => void
}

type SnakeCoreProps = {
  appleCount: number
  speedLevel: number
  onScoreChange: (score: number) => void
  onGameOver: () => void
  onGameRestart: () => void
  onStateChange: (isPlaying: boolean) => void
}

export const SnakeCore = forwardRef<SnakeGameHandle, SnakeCoreProps>(
  (
    {
      appleCount,
      speedLevel,
      onScoreChange,
      onGameOver,
      onGameRestart,
      onStateChange,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const appRef = useRef<Application | null>(null)

    const { play: playEatSound } = useGameSound(
      'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    )
    const { play: playGameOverSound } = useGameSound(
      'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
    )

    // Game state refs
    const snakeRef = useRef<Point[]>([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ])
    const prevSnakeRef = useRef<Point[]>([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ])
    const foodsRef = useRef<Point[]>([])
    const directionRef = useRef<Direction>('RIGHT')
    const directionQueueRef = useRef<Direction[]>([])
    const timeSinceLastMoveRef = useRef<number>(0)
    const speedRef = useRef(100) // ms per move
    const isPlayingRef = useRef(false)
    const gameOverRef = useRef(false)

    // Expose controls to parent
    useImperativeHandle(
      ref,
      () => ({
        startGame: () => {
          snakeRef.current = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 },
          ]
          prevSnakeRef.current = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 },
          ]
          directionRef.current = 'RIGHT'
          directionQueueRef.current = []

          foodsRef.current = []
          for (let i = 0; i < appleCount; i++) {
            spawnFood(snakeRef.current)
          }

          scoreRef.current = 0
          onScoreChange(0)
          gameOverRef.current = false
          isPlayingRef.current = true
          onStateChange(true)
          window.focus()
        },
        stopGame: () => {
          isPlayingRef.current = false
          onStateChange(false)
        },
        resumeGame: () => {
          isPlayingRef.current = true
          onStateChange(true)
          window.focus()
        },
      }),
      [appleCount, onScoreChange, onStateChange],
    )

    // Speed update effect
    useEffect(() => {
      const minSpeed = 200
      const maxSpeed = 50
      const step = (minSpeed - maxSpeed) / 9
      speedRef.current = minSpeed - (speedLevel - 1) * step
    }, [speedLevel])

    // Apple count update effect
    useEffect(() => {
      const currentFoods = foodsRef.current
      if (currentFoods.length < appleCount) {
        const needed = appleCount - currentFoods.length
        for (let i = 0; i < needed; i++) {
          spawnFood(snakeRef.current)
        }
      } else if (currentFoods.length > appleCount) {
        foodsRef.current = currentFoods.slice(0, appleCount)
      }
    }, [appleCount])

    // PixiJS Setup
    useEffect(() => {
      let app: Application | undefined
      let destroyed = false

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

        const graphics = new Graphics()
        newApp.stage.addChild(graphics)

        newApp.ticker.add((ticker) => {
          if (!isPlayingRef.current || gameOverRef.current) {
            if (graphics) drawGame(graphics, 0)
            return
          }

          timeSinceLastMoveRef.current += ticker.deltaMS
          const currentSpeed = speedRef.current

          if (timeSinceLastMoveRef.current >= currentSpeed) {
            updateGame()
            timeSinceLastMoveRef.current -= currentSpeed
            if (timeSinceLastMoveRef.current > currentSpeed) {
              timeSinceLastMoveRef.current = 0
            }
          }

          const progress = Math.min(
            timeSinceLastMoveRef.current / currentSpeed,
            1,
          )
          drawGame(graphics, progress)
        })

        drawGame(graphics, 0)
      }

      initApp()

      return () => {
        destroyed = true
        if (app) {
          app.destroy({ removeView: true })
        }
      }
    }, [])

    // Input handling
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(
            e.key,
          )
        ) {
          e.preventDefault()
        }

        // Space handling is tricky here because we need to call the exposed methods
        // But we are inside the component. We can just call the internal logic or refs.
        // However, the parent might also want to control this.
        // Let's handle direction here, but maybe let parent handle Space?
        // Or handle Space here and notify parent?
        // The original code handled Space inside the component.

        if (e.code === 'Space') {
          if (gameOverRef.current) {
            // Restart
            // We can't call the exposed method directly easily without a ref to self?
            // Actually we can just execute the logic.
            // But for consistency, let's just emit an event or handle it internally.
            // Let's handle it internally and notify state change.
            // BUT the parent has the button that calls these methods.
            // It's better if the parent handles the Space key for game control?
            // No, the game should capture input when focused.
            // Let's just replicate the logic:
            // startGame() // But we need to call the function defined in useImperativeHandle...
            // We can extract the logic to functions outside useImperativeHandle
          }
          // ...
          // Actually, let's just let the parent handle the Space key if it wants global control,
          // OR handle it here.
          // The original code had it here.

          // Let's extract the logic to local functions
          toggleGame()
          return
        }

        if (!isPlayingRef.current) return

        switch (e.key) {
          case 'ArrowUp':
            addDirectionToQueue('UP')
            break
          case 'ArrowDown':
            addDirectionToQueue('DOWN')
            break
          case 'ArrowLeft':
            addDirectionToQueue('LEFT')
            break
          case 'ArrowRight':
            addDirectionToQueue('RIGHT')
            break
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [appleCount]) // Re-bind if props change? No, refs are stable.

    const addDirectionToQueue = (newDirection: Direction) => {
      // Get the last direction in the queue, or current direction if queue is empty
      const lastDirection =
        directionQueueRef.current.length > 0
          ? directionQueueRef.current[directionQueueRef.current.length - 1]
          : directionRef.current

      // Prevent opposite direction and duplicate
      const isOpposite =
        (newDirection === 'UP' && lastDirection === 'DOWN') ||
        (newDirection === 'DOWN' && lastDirection === 'UP') ||
        (newDirection === 'LEFT' && lastDirection === 'RIGHT') ||
        (newDirection === 'RIGHT' && lastDirection === 'LEFT')

      const isDuplicate = newDirection === lastDirection

      if (!isOpposite && !isDuplicate) {
        directionQueueRef.current.push(newDirection)
      }
    }

    const toggleGame = () => {
      if (gameOverRef.current) {
        // Start
        snakeRef.current = [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 },
        ]
        prevSnakeRef.current = [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 },
        ]
        directionRef.current = 'RIGHT'
        directionQueueRef.current = []

        foodsRef.current = []
        for (let i = 0; i < appleCount; i++) {
          spawnFood(snakeRef.current)
        }

        scoreRef.current = 0
        onScoreChange(0)
        gameOverRef.current = false
        isPlayingRef.current = true
        onGameRestart()
        onStateChange(true)
      } else if (isPlayingRef.current) {
        // Stop
        isPlayingRef.current = false
        onStateChange(false)
      } else {
        // Resume or initial start
        isPlayingRef.current = true
        onGameRestart()
        onStateChange(true)
      }
    }

    const updateGame = () => {
      prevSnakeRef.current = snakeRef.current.map((p) => ({ ...p }))
      const head = { ...snakeRef.current[0] }

      // Consume next direction from queue if available
      if (directionQueueRef.current.length > 0) {
        directionRef.current = directionQueueRef.current.shift()!
      }

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
        gameOverRef.current = true
        isPlayingRef.current = false
        playGameOverSound()
        onGameOver()
        onStateChange(false)
        return
      }

      const newSnake = [head, ...snakeRef.current]

      // Check food
      const foodIndex = foodsRef.current.findIndex(
        (f) => f.x === head.x && f.y === head.y,
      )

      if (foodIndex !== -1) {
        onScoreChange(snakeRef.current.length - 2) // Score = length - 3 + 1? Original was just incrementing score state.
        // Wait, original score logic: setScore(s => s + 1).
        // We need to pass the new score.
        // We don't track score locally in ref? We should if we want to pass it.
        // Or just pass increment event?
        // Let's track score in ref or just calculate it.
        // Score is usually just number of apples eaten.
        // Let's assume score starts at 0.
        // We can just call onScoreChange(prev => prev + 1) if the parent supports it? No.
        // We need to track score locally to send absolute value, or parent handles increment.
        // Let's track locally.

        // Actually, simpler:
        // onScoreChange is called with new score.
        // We need a scoreRef.
      }

      // Wait, I missed adding scoreRef.

      if (foodIndex !== -1) {
        // We need to increment score.
        // Let's add scoreRef.
        scoreRef.current += 1
        onScoreChange(scoreRef.current)

        foodsRef.current.splice(foodIndex, 1)
        spawnFood(newSnake)
        playEatSound()
      } else {
        newSnake.pop()
      }

      snakeRef.current = newSnake
    }

    const scoreRef = useRef(0)

    // Reset score ref when starting game
    useEffect(() => {
      if (isPlayingRef.current && !gameOverRef.current) {
        scoreRef.current = 0
      }
    }, [])

    const spawnFood = (snake: Point[]) => {
      let newFood: Point
      while (true) {
        newFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        }
        const onSnake = snake.some(
          (s) => s.x === newFood.x && s.y === newFood.y,
        )
        const onFood = foodsRef.current.some(
          (f) => f.x === newFood.x && f.y === newFood.y,
        )
        if (!onSnake && !onFood) break
      }
      foodsRef.current.push(newFood)
    }

    const drawGame = (g: Graphics, progress: number) => {
      g.clear()

      // Get CSS variables for theme-aware colors
      const computedStyle = getComputedStyle(document.documentElement)
      const gameBg = computedStyle.getPropertyValue('--game-bg').trim()
      const gameGrid = computedStyle.getPropertyValue('--game-grid').trim()
      const gameBorder = computedStyle.getPropertyValue('--game-border').trim()

      // Convert CSS color to hex (fallback to dark mode colors if not found)
      const bgColor = gameBg ? parseInt(gameBg.replace('#', ''), 16) : 0x1a1a1a
      const gridColor = gameGrid ? parseInt(gameGrid.replace('#', ''), 16) : 0x333333
      const borderColor = gameBorder ? parseInt(gameBorder.replace('#', ''), 16) : 0x000000

      g.rect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)
      g.fill(bgColor)

      for (let i = 0; i <= GRID_SIZE; i++) {
        const pos = i * CELL_SIZE
        g.moveTo(pos, 0)
        g.lineTo(pos, CELL_SIZE * GRID_SIZE)
        g.moveTo(0, pos)
        g.lineTo(CELL_SIZE * GRID_SIZE, pos)
      }
      g.stroke({ width: 1, color: gridColor, alpha: 0.5 })

      g.rect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)
      g.stroke({ width: 2, color: borderColor })

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

        g.fillStyle = 0xffffff
        points.forEach((p, i) => {
          if (i === 0) {
            // Draw pixel art head for first segment
            if (gameOverRef.current) {
              drawPixelSnakeHeadDead(g, p.x, p.y, CELL_SIZE, directionRef.current)
            } else {
              drawPixelSnakeHead(g, p.x, p.y, CELL_SIZE, directionRef.current)
            }
          } else if (i === points.length - 1 && points.length > 1) {
            // Draw pixel art tail for last segment
            // Determine tail direction based on previous segment
            const prevPoint = points[i - 1]
            const dx = p.x - prevPoint.x
            const dy = p.y - prevPoint.y
            let tailDirection: Direction = 'RIGHT'

            if (Math.abs(dx) > Math.abs(dy)) {
              tailDirection = dx > 0 ? 'RIGHT' : 'LEFT'
            } else {
              tailDirection = dy > 0 ? 'DOWN' : 'UP'
            }

            drawPixelSnakeTail(g, p.x, p.y, CELL_SIZE, tailDirection)
          } else {
            // Draw pixel art body for middle segments
            drawPixelSnakeBody(g, p.x, p.y, CELL_SIZE)
          }
        })
      }

      foodsRef.current.forEach((food) => {
        drawPixelApple(g, food.x, food.y, CELL_SIZE)
      })
    }

    return (
      <div
        ref={containerRef}
        className="rounded-lg shadow-lg overflow-hidden"
      />
    )
  },
)
