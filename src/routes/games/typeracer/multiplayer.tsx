import { createFileRoute } from '@tanstack/react-router';
import { GameLayout } from '@/components/game-layout';
import { MultiplayerTypeRacer } from '@/games/typeracer/pages/MultiplayerTypeRacer';

export const Route = createFileRoute('/games/typeracer/multiplayer')({
  component: MultiplayerPage,
});

function MultiplayerPage() {
  return (
    <GameLayout>
      <MultiplayerTypeRacer />
    </GameLayout>
  );
}
