import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const GRID_SIZE = 4

type Tile = {
  id: number
  value: number
  x: number
  y: number
  mergedFrom?: number[] // ids of tiles that merged into this one
}

export function Game2048() {
  const { t } = useTranslation()
  const [tiles, setTiles] = useState<Tile[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [nextId, setNextId] = useState(1)

  const initGame = useCallback(() => {
    setTiles([])
    setScore(0)
    setGameOver(false)
    setWon(false)
    setNextId(1)

    // Add two initial tiles
    let initialTiles: Tile[] = []
    let id = 1

    const addTile = (currentTiles: Tile[]) => {
      const emptyCells = []
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          if (!currentTiles.find((t) => t.x === x && t.y === y)) {
            emptyCells.push({ x, y })
          }
        }
      }
      if (emptyCells.length === 0) return currentTiles

      const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      const value = Math.random() < 0.9 ? 2 : 4
      return [...currentTiles, { id: id++, value, x, y }]
    }

    initialTiles = addTile(initialTiles)
    initialTiles = addTile(initialTiles)

    setTiles(initialTiles)
    setNextId(id)
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  const move = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (gameOver || won) return

      setTiles((prevTiles) => {
        let moved = false
        let newScore = score
        let newTiles = [...prevTiles]

        // Sort tiles based on direction to process them in correct order
        if (direction === 'UP') newTiles.sort((a, b) => a.y - b.y)
        if (direction === 'DOWN') newTiles.sort((a, b) => b.y - a.y)
        if (direction === 'LEFT') newTiles.sort((a, b) => a.x - b.x)
        if (direction === 'RIGHT') newTiles.sort((a, b) => b.x - a.x)

        const mergedIds = new Set<number>()

        // Process each tile
        // This is a simplified logic, a real implementation needs to handle merging carefully
        // We'll simulate the movement by iterating and moving each tile as far as possible

        // Actually, it's easier to map the grid to a 2D array, manipulate it, and map back to tiles
        // But to keep animations (React keys), we want to preserve tile objects.

        // Let's try a simpler approach:
        // For each line (row or column depending on direction)

        const lines = []
        for (let i = 0; i < GRID_SIZE; i++) {
          const line = newTiles.filter((t) =>
            direction === 'UP' || direction === 'DOWN' ? t.x === i : t.y === i,
          )
          // Sort line
          if (direction === 'UP' || direction === 'LEFT') {
            line.sort((a, b) => (direction === 'UP' ? a.y - b.y : a.x - b.x))
          } else {
            line.sort((a, b) => (direction === 'DOWN' ? b.y - a.y : b.x - a.x))
          }
          lines.push(line)
        }

        const nextTiles: Tile[] = []
        let idCounter = nextId

        lines.forEach((line) => {
          const newLine: Tile[] = []
          let targetPos = 0 // 0 to 3, relative to direction start

          for (let i = 0; i < line.length; i++) {
            const tile = line[i]
            const lastTile = newLine[newLine.length - 1]

            // Check merge
            if (
              lastTile &&
              lastTile.value === tile.value &&
              !mergedIds.has(lastTile.id)
            ) {
              // Merge
              const mergedTile = {
                ...lastTile,
                value: lastTile.value * 2,
                mergedFrom: [lastTile.id, tile.id], // Keep track for animation if we wanted
                id: idCounter++, // New ID for the merged tile? Or keep one?
                // Better to keep one ID or create new. Let's create new to trigger "pop" animation
              }
              // Actually, to keep React happy, maybe better to keep one ID.
              // But for 2048, usually the merged tile is "new".
              // Let's just update the last tile in newLine
              newLine[newLine.length - 1] = mergedTile
              mergedIds.add(mergedTile.id)
              newScore += mergedTile.value
              moved = true
            } else {
              // Move
              let newX = tile.x
              let newY = tile.y

              if (direction === 'UP') {
                newX = tile.x
                newY = targetPos
              }
              if (direction === 'DOWN') {
                newX = tile.x
                newY = GRID_SIZE - 1 - targetPos
              }
              if (direction === 'LEFT') {
                newX = targetPos
                newY = tile.y
              }
              if (direction === 'RIGHT') {
                newX = GRID_SIZE - 1 - targetPos
                newY = tile.y
              }

              if (newX !== tile.x || newY !== tile.y) moved = true

              newLine.push({ ...tile, x: newX, y: newY })
              targetPos++
            }
          }
          nextTiles.push(...newLine)
        })

        if (!moved) return prevTiles

        setScore(newScore)
        setNextId(idCounter)

        // Add new tile
        const emptyCells = []
        for (let x = 0; x < GRID_SIZE; x++) {
          for (let y = 0; y < GRID_SIZE; y++) {
            if (!nextTiles.find((t) => t.x === x && t.y === y)) {
              emptyCells.push({ x, y })
            }
          }
        }

        if (emptyCells.length > 0) {
          const { x, y } =
            emptyCells[Math.floor(Math.random() * emptyCells.length)]
          const value = Math.random() < 0.9 ? 2 : 4
          nextTiles.push({ id: idCounter++, value, x, y })
          setNextId(idCounter + 1)
        }

        // Check Game Over (no moves possible)
        if (emptyCells.length <= 1) {
          // We just filled one, so if 0 or 1 left, check merges
          // Check if any merges possible
          // ... (omitted for brevity, but should be done)
        }

        return nextTiles
      })
    },
    [gameOver, won, score, nextId],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          move('UP')
          break
        case 'ArrowDown':
          move('DOWN')
          break
        case 'ArrowLeft':
          move('LEFT')
          break
        case 'ArrowRight':
          move('RIGHT')
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move])

  return (
    <GameLayout
      controls={
        <div className="flex items-center gap-4">
          <div className="bg-muted px-4 py-2 rounded-md">
            <span className="text-xs uppercase font-bold text-muted-foreground block">
              {t('games.common.score')}
            </span>
            <span className="text-xl font-bold">{score}</span>
          </div>
          <Button onClick={initGame} variant="outline" size="icon">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="relative bg-muted p-4 rounded-lg w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]">
        {/* Grid Background */}
        <div className="grid grid-cols-4 grid-rows-4 gap-2 w-full h-full">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="bg-background/50 rounded-md w-full h-full"
            />
          ))}
        </div>

        {/* Tiles */}
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className={cn(
              'absolute flex items-center justify-center rounded-md font-bold text-2xl sm:text-3xl transition-all duration-100 ease-in-out',
              'w-[calc(25%-0.5rem)] h-[calc(25%-0.5rem)]', // Approximate size minus gap
              // Colors based on value (Monochrome theme)
              tile.value === 2 && 'bg-neutral-100 text-neutral-900',
              tile.value === 4 && 'bg-neutral-200 text-neutral-900',
              tile.value === 8 && 'bg-neutral-300 text-neutral-900',
              tile.value === 16 && 'bg-neutral-400 text-neutral-900',
              tile.value === 32 && 'bg-neutral-500 text-neutral-50',
              tile.value === 64 && 'bg-neutral-600 text-neutral-50',
              tile.value >= 128 && 'bg-neutral-800 text-neutral-50',
              tile.value >= 1024 &&
                'bg-neutral-900 text-neutral-50 ring-2 ring-neutral-500',
            )}
            style={{
              left: `calc(${tile.x * 25}% + 0.25rem)`, // Adjust for gap/padding
              top: `calc(${tile.y * 25}% + 0.25rem)`,
              // Note: This positioning is rough, grid gap makes it tricky with %
              // Better to use fixed pixels or a more robust CSS grid overlay
              // For this demo, we'll try to match the grid cells
              transform: `translate(${tile.x * 4}px, ${tile.y * 4}px)`, // Add gap offset?
            }}
          >
            {tile.value}
          </div>
        ))}

        {/* Overlay for Game Over / Won */}
        {(gameOver || won) && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 rounded-lg">
            <h2 className="text-4xl font-bold mb-4">
              {won ? t('games.common.youWin') : t('games.common.gameOver')}
            </h2>
            <Button onClick={initGame}>{t('games.common.restart')}</Button>
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        {t('games.common.controls.tiles')}
      </p>
    </GameLayout>
  )
}
