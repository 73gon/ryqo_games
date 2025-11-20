import { createFileRoute } from '@tanstack/react-router'
import { SnakeGame } from '@/games/snake/snake'

export const Route = createFileRoute('/games/snake')({
  component: SnakeGame,
})
