import { createFileRoute } from '@tanstack/react-router'
import { PacmanGame } from '@/games/PacmanGame'

export const Route = createFileRoute('/games/pacman')({
  component: PacmanGame,
})
