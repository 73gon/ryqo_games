import { createFileRoute } from '@tanstack/react-router'
import UnoGame from '@/games/uno/UnoGame'

export const Route = createFileRoute('/games/uno')({
  component: UnoGame,
})
