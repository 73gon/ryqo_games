import { createFileRoute } from '@tanstack/react-router'
import { PacmanGame } from '@/games/pacman/pacman'

export const Route = createFileRoute('/games/pacman')({
  component: PacmanGame,
})
