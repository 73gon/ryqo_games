import { createFileRoute } from '@tanstack/react-router'
import { Game2048 } from '@/games/Game2048'

export const Route = createFileRoute('/games/game-2048')({
  component: Game2048,
})
