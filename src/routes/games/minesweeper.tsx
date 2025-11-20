import { createFileRoute } from '@tanstack/react-router'
import { MinesweeperGame } from '@/games/MinesweeperGame'

export const Route = createFileRoute('/games/minesweeper')({
  component: MinesweeperGame,
})
