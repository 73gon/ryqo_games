import { createFileRoute } from '@tanstack/react-router'
import { TetrisGame } from '@/games/TetrisGame'

export const Route = createFileRoute('/games/tetris')({
  component: TetrisGame,
})
