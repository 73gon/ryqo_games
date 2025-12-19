import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { useGameSound } from '@/hooks/useGameSound'
import { drawPixelApple } from './assets/pixel_apple'
import { drawPixelSnakeHead } from './assets/pixel_snake_head'
import { drawPixelSnakeHeadDead } from './assets/pixel_snake_head_dead'
import { drawPixelSnakeBody } from './assets/pixel_snake_body'
import { drawPixelSnakeTail } from './assets/pixel_snake_tail'

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
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestRef = useRef<number | undefined>(undefined)
    const lastTimeRef = useRef<number>(0)

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
    const scoreRef = useRef(0)

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
          
          // Reset timing
          lastTimeRef.current = performance.now()
          timeSinceLastMoveRef.current = 0
          
          window.focus()
        },
        stopGame: () => {
          isPlayingRef.current = false
          onStateChange(false)
        },
        resumeGame: () => {
          isPlayingRef.current = true
          onStateChange(true)
          lastTimeRef.current = performance.now()
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

    // Game Loop
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set explicit size
      canvas.width = CELL_SIZE * GRID_SIZE
      canvas.height = CELL_SIZE * GRID_SIZE

      const animate = (time: number) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = time
        }
        
        const deltaTime = time - lastTimeRef.current
        lastTimeRef.current = time

        if (!isPlayingRef.current || gameOverRef.current) {
          drawGame(ctx, 0)
          requestRef.current = requestAnimationFrame(animate)
          return
        }

        timeSinceLastMoveRef.current += deltaTime
        const currentSpeed = speedRef.current

        if (timeSinceLastMoveRef.current >= currentSpeed) {
          updateGame()
          timeSinceLastMoveRef.current -= currentSpeed
          // Prevent spiral of death if lag allows multiple updates
          if (timeSinceLastMoveRef.current > currentSpeed) {
            timeSinceLastMoveRef.current = 0
          }
        }

        const progress = Math.min(
          timeSinceLastMoveRef.current / currentSpeed,
          1,
        )
        drawGame(ctx, progress)
        
        requestRef.current = requestAnimationFrame(animate)
      }

      requestRef.current = requestAnimationFrame(animate)

      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current)
        }
      }
    }, []) // Run once on mount

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

        if (e.code === 'Space') {
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
    }, [appleCount])

    const addDirectionToQueue = (newDirection: Direction) => {
      const lastDirection =
        directionQueueRef.current.length > 0
          ? directionQueueRef.current[directionQueueRef.current.length - 1]
          : directionRef.current

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
        lastTimeRef.current = performance.now()
        timeSinceLastMoveRef.current = 0
      } else if (isPlayingRef.current) {
        // Stop
        isPlayingRef.current = false
        onStateChange(false)
      } else {
        // Resume
        isPlayingRef.current = true
        onGameRestart()
        onStateChange(true)
        lastTimeRef.current = performance.now()
      }
    }

    const updateGame = () => {
      prevSnakeRef.current = snakeRef.current.map((p) => ({ ...p }))
      const head = { ...snakeRef.current[0] }

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

      const foodIndex = foodsRef.current.findIndex(
        (f) => f.x === head.x && f.y === head.y,
      )

      if (foodIndex !== -1) {
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

    // Reset score ref when mounting if needed, although state reset handles it.
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

    const drawGame = (ctx: CanvasRenderingContext2D, progress: number) => {
      // Clear screen
      ctx.clearRect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)

      // Get CSS variables for theme-aware colors
      const computedStyle = getComputedStyle(document.documentElement)
      const gameBg = computedStyle.getPropertyValue('--game-bg').trim()
      const gameGrid = computedStyle.getPropertyValue('--game-grid').trim()
      const gameBorder = computedStyle.getPropertyValue('--game-border').trim()

      const bgColor = gameBg || '#1a1a1a'
      const gridColor = gameGrid || '#333333'
      const borderColor = gameBorder || '#000000'

      // Background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)

      // Grid
      ctx.strokeStyle = gridColor
      ctx.globalAlpha = 0.5
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
      ctx.globalAlpha = 1.0

      // Border
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)

      // Snake
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

        points.forEach((p, i) => {
          if (i === 0) {
            // Head
            if (gameOverRef.current) {
              drawPixelSnakeHeadDead(
                ctx,
                p.x,
                p.y,
                CELL_SIZE,
                directionRef.current,
              )
            } else {
              drawPixelSnakeHead(ctx, p.x, p.y, CELL_SIZE, directionRef.current)
            }
          } else if (i === points.length - 1 && points.length > 1) {
            // Tail
            const prevPoint = points[i - 1]
            const dx = p.x - prevPoint.x
            const dy = p.y - prevPoint.y
            let tailDirection: Direction = 'RIGHT'

            if (Math.abs(dx) > Math.abs(dy)) {
              tailDirection = dx > 0 ? 'RIGHT' : 'LEFT'
            } else {
              tailDirection = dy > 0 ? 'DOWN' : 'UP'
            }

            drawPixelSnakeTail(ctx, p.x, p.y, CELL_SIZE, tailDirection)
          } else {
            // Body
            drawPixelSnakeBody(ctx, p.x, p.y, CELL_SIZE)
          }
        })
      }

      // Apples
      foodsRef.current.forEach((food) => {
        drawPixelApple(ctx, food.x, food.y, CELL_SIZE)
      })
    }

    return (
      <div className="rounded-lg shadow-lg overflow-hidden flex justify-center items-center bg-zinc-900">
         <canvas
            ref={canvasRef}
            style={{ display: 'block' }} 
         />
      </div>
    )
  },
)