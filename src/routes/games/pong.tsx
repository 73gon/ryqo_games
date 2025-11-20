import { createFileRoute } from '@tanstack/react-router'
import { PongGame } from '@/games/PongGame'

export const Route = createFileRoute('/games/pong')({
  component: PongGame,
})
