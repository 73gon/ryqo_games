import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'
import { Button } from '@/components/ui/button'
import { Flag, Bomb, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROWS = 10
const COLS = 10
const MINES = 15

type Cell = {
  row: number
  col: number
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborMines: number
}

export function MinesweeperGame() {
  const { t } = useTranslation()
  const [grid, setGrid] = useState<Cell[][]>([])
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [flagsLeft, setFlagsLeft] = useState(MINES)

  const initGame = useCallback(() => {
    // Create empty grid
    const newGrid: Cell[][] = []
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = []
      for (let c = 0; c < COLS; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        })
      }
      newGrid.push(row)
    }

    // Place mines
    let minesPlaced = 0
    while (minesPlaced < MINES) {
      const r = Math.floor(Math.random() * ROWS)
      const c = Math.floor(Math.random() * COLS)
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true
        minesPlaced++
      }
    }

    // Calculate neighbors
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newGrid[r][c].isMine) continue

        let neighbors = 0
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue
            const nr = r + i
            const nc = c + j
            if (
              nr >= 0 &&
              nr < ROWS &&
              nc >= 0 &&
              nc < COLS &&
              newGrid[nr][nc].isMine
            ) {
              neighbors++
            }
          }
        }
        newGrid[r][c].neighborMines = neighbors
      }
    }

    setGrid(newGrid)
    setGameOver(false)
    setWon(false)
    setFlagsLeft(MINES)
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  const revealCell = (r: number, c: number) => {
    if (gameOver || won || grid[r][c].isRevealed || grid[r][c].isFlagged) return

    const newGrid = [...grid.map((row) => [...row])]
    const cell = newGrid[r][c]

    if (cell.isMine) {
      // Game Over
      cell.isRevealed = true
      setGrid(newGrid)
      setGameOver(true)
      // Reveal all mines
      newGrid.forEach((row) =>
        row.forEach((c) => {
          if (c.isMine) c.isRevealed = true
        }),
      )
      return
    }

    // Flood fill if 0 neighbors
    const stack = [{ r, c }]
    while (stack.length > 0) {
      const { r: currR, c: currC } = stack.pop()!

      if (newGrid[currR][currC].isRevealed) continue
      newGrid[currR][currC].isRevealed = true

      if (newGrid[currR][currC].neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const nr = currR + i
            const nc = currC + j
            if (
              nr >= 0 &&
              nr < ROWS &&
              nc >= 0 &&
              nc < COLS &&
              !newGrid[nr][nc].isRevealed &&
              !newGrid[nr][nc].isFlagged
            ) {
              stack.push({ r: nr, c: nc })
            }
          }
        }
      }
    }

    setGrid(newGrid)
    checkWin(newGrid)
  }

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault()
    if (gameOver || won || grid[r][c].isRevealed) return

    const newGrid = [...grid.map((row) => [...row])]
    const cell = newGrid[r][c]

    if (!cell.isFlagged && flagsLeft === 0) return

    cell.isFlagged = !cell.isFlagged
    setGrid(newGrid)
    setFlagsLeft((prev) => (cell.isFlagged ? prev - 1 : prev + 1))
  }

  const checkWin = (currentGrid: Cell[][]) => {
    let unrevealedSafeCells = 0
    currentGrid.forEach((row) =>
      row.forEach((cell) => {
        if (!cell.isMine && !cell.isRevealed) unrevealedSafeCells++
      }),
    )
    if (unrevealedSafeCells === 0) {
      setWon(true)
      setGameOver(true)
    }
  }

  return (
    <GameLayout
      title={t('games.titles.minesweeper')}
      controls={
        <div className="flex items-center gap-4">
          <div className="bg-muted px-4 py-2 rounded-md flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span className="font-bold">{flagsLeft}</span>
          </div>
          <Button onClick={initGame} variant="outline" size="icon">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="grid gap-1 bg-muted p-2 rounded-lg"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm font-bold rounded-sm transition-colors',
                  !cell.isRevealed && 'bg-neutral-300 hover:bg-neutral-400',
                  cell.isRevealed && 'bg-neutral-100',
                  cell.isRevealed && cell.isMine && 'bg-red-500 text-white',
                  cell.isFlagged && 'bg-neutral-300',
                )}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                disabled={gameOver || won}
              >
                {cell.isFlagged && <Flag className="h-4 w-4 text-red-600" />}
                {cell.isRevealed && cell.isMine && !cell.isFlagged && (
                  <Bomb className="h-5 w-5" />
                )}
                {cell.isRevealed && !cell.isMine && cell.neighborMines > 0 && (
                  <span
                    className={cn(
                      cell.neighborMines === 1 && 'text-blue-600',
                      cell.neighborMines === 2 && 'text-green-600',
                      cell.neighborMines === 3 && 'text-red-600',
                      cell.neighborMines >= 4 && 'text-purple-600',
                    )}
                  >
                    {cell.neighborMines}
                  </span>
                )}
              </button>
            )),
          )}
        </div>

        {(gameOver || won) && (
          <div className="text-xl font-bold">
            {won ? t('games.common.youWin') : t('games.common.gameOver')}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {t('games.common.controls.reveal')}
        </p>
      </div>
    </GameLayout>
  )
}
