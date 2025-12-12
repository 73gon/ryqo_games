import { createFileRoute } from '@tanstack/react-router';
import { TypeRacerGame } from '@/games/typeracer';

export const Route = createFileRoute('/games/typeracer')({
  component: TypeRacerGame,
});
