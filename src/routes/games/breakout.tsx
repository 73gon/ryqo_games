import { createFileRoute } from '@tanstack/react-router'
import { BreakoutGame } from '@/games/BreakoutGame'

export const Route = createFileRoute('/games/breakout')({
  component: BreakoutGame,
})
