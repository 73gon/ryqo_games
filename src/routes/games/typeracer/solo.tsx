import { createFileRoute } from '@tanstack/react-router';
import { GameLayout } from '@/components/game-layout';
import { SoloTypeRacer } from '@/games/typeracer/pages/SoloTypeRacer';

export const Route = createFileRoute('/games/typeracer/solo')({
  component: SoloPage,
});

function SoloPage() {
  return (
    <GameLayout>
      <SoloTypeRacer />
    </GameLayout>
  );
}
