interface GameOverlayProps {
  isPaused: boolean;
  isGameOver: boolean;
}

export function GameOverlay({ isPaused, isGameOver }: GameOverlayProps) {
  if (!isPaused && !isGameOver) return null;

  const title = isGameOver ? 'Game Over' : 'Paused';
  const subtitle = isGameOver ? 'Press Enter to start a new game' : 'Press Enter to resume';

  return (
    <div className='absolute inset-0 flex items-center justify-center'>
      <div className='flex flex-col items-center gap-3 rounded-xl border border-border bg-background/85 backdrop-blur-sm px-4 py-3 shadow-lg'>
        <div className='flex items-center gap-2 text-foreground/80'>
          <span className='text-sm font-semibold uppercase tracking-wide'>{title}</span>
        </div>
        <div className='text-xs font-medium text-muted-foreground'>
          <span className='font-semibold text-foreground'>{subtitle}</span>
        </div>
      </div>
    </div>
  );
}
