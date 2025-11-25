import { createFileRoute } from '@tanstack/react-router'
import { TetrisGame } from '@/games/tetris/tetris'

export const Route = createFileRoute('/games/tetris')({
  component: TetrisGame,
})
