import { createFileRoute } from '@tanstack/react-router';
import TypeRacerMenu from '@/games/typeracer/typeracer-menu';

export const Route = createFileRoute('/games/typeracer/')({
  component: TypeRacerMenu,
});
