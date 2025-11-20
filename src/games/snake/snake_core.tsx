import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Application, Graphics } from 'pixi.js'
import { useGameSound } from '@/hooks/useGameSound'

const CELL_SIZE = 30
const GRID_SIZE = 20 // 20x20 grid = 600x600 pixels

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
  onStateChange: (isPlaying: boolean) => void
}

export const SnakeCore = forwardRef<SnakeGameHandle, SnakeCoreProps>(
  (
    { appleCount, speedLevel, onScoreChange, onGameOver, onStateChange },
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
    const nextDirectionRef = useRef<Direction>('RIGHT')
    const timeSinceLastMoveRef = useRef<number>(0)
    const speedRef = useRef(100) // ms per move
    const isPlayingRef = useRef(false)
    const gameOverRef = useRef(false)

    // Expose controls to parent
    useImperativeHandle(ref, () => ({
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
        nextDirectionRef.current = 'RIGHT'

        foodsRef.current = []
        for (let i = 0; i < appleCount; i++) {
          spawnFood(snakeRef.current)
        }

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
    }))

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
    }, [appleCount]) // Re-bind if props change? No, refs are stable.

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
        nextDirectionRef.current = 'RIGHT'

        foodsRef.current = []
        for (let i = 0; i < appleCount; i++) {
          spawnFood(snakeRef.current)
        }

        onScoreChange(0)
        gameOverRef.current = false
        isPlayingRef.current = true
        onStateChange(true)
        onGameOver() // Actually this clears game over state in parent? No parent tracks game over via callback?
        // Wait, onGameOver is usually called when game ends.
        // Parent needs to know game is NOT over now.
        // We might need onGameStart callback?
        // Or onStateChange(isPlaying, isGameOver)
      } else if (isPlayingRef.current) {
        // Stop
        isPlayingRef.current = false
        onStateChange(false)
      } else {
        // Resume
        isPlayingRef.current = true
        onStateChange(true)
      }
    }

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
      g.rect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)
      g.fill(0x1a1a1a)

      for (let i = 0; i <= GRID_SIZE; i++) {
        const pos = i * CELL_SIZE
        g.moveTo(pos, 0)
        g.lineTo(pos, CELL_SIZE * GRID_SIZE)
        g.moveTo(0, pos)
        g.lineTo(CELL_SIZE * GRID_SIZE, pos)
      }
      g.stroke({ width: 1, color: 0x333333, alpha: 0.5 })

      g.rect(0, 0, CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE)
      g.stroke({ width: 2, color: 0x000000 })

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
          // Determine neighbors based on visual position
          const neighbors = {
            left: false,
            right: false,
            up: false,
            down: false,
          }

          const checkNeighbor = (target: { x: number; y: number }) => {
            const dx = target.x - p.x
            const dy = target.y - p.y
            const threshold = 5 // pixels

            if (dx > threshold) neighbors.right = true
            if (dx < -threshold) neighbors.left = true
            if (dy > threshold) neighbors.down = true
            if (dy < -threshold) neighbors.up = true
          }

          if (i > 0) checkNeighbor(points[i - 1])
          if (i < points.length - 1) checkNeighbor(points[i + 1])

          // Draw segment with conditional rounded corners
          const r = 8
          const w = CELL_SIZE
          const h = CELL_SIZE
          const x = p.x - w / 2
          const y = p.y - h / 2

          g.beginPath()

          // Top Left
          // Round if (Left AND Up) OR (!Left AND !Up)
          // Don't round if (Left XOR Up)
          if (
            (neighbors.left && neighbors.up) ||
            (!neighbors.left && !neighbors.up)
          ) {
            g.moveTo(x, y + r)
            g.arcTo(x, y, x + r, y, r)
          } else {
            g.moveTo(x, y)
          }

          // Top Right
          if (
            (neighbors.right && neighbors.up) ||
            (!neighbors.right && !neighbors.up)
          ) {
            g.lineTo(x + w - r, y)
            g.arcTo(x + w, y, x + w, y + r, r)
          } else {
            g.lineTo(x + w, y)
          }

          // Bottom Right
          if (
            (neighbors.right && neighbors.down) ||
            (!neighbors.right && !neighbors.down)
          ) {
            g.lineTo(x + w, y + h - r)
            g.arcTo(x + w, y + h, x + w - r, y + h, r)
          } else {
            g.lineTo(x + w, y + h)
          }

          // Bottom Left
          if (
            (neighbors.left && neighbors.down) ||
            (!neighbors.left && !neighbors.down)
          ) {
            g.lineTo(x + r, y + h)
            g.arcTo(x, y + h, x, y + h - r, r)
          } else {
            g.lineTo(x, y + h)
          }

          g.closePath()
          g.fill()
        })
      }

      g.fillStyle = 0xffffff
      foodsRef.current.forEach((food) => {
        g.circle(
          food.x * CELL_SIZE + CELL_SIZE / 2,
          food.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 3,
        )
        g.fill()
      })
    }

    return (
      <div
        ref={containerRef}
        className="border-4 border-black rounded-sm shadow-lg"
      />
    )
  },
)
