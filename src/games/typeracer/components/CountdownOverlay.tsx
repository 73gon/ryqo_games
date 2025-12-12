// Countdown overlay component for TypeRacer

import { memo } from 'react';

interface CountdownOverlayProps {
  count: number;
}

export const CountdownOverlay = memo(function CountdownOverlay({ count }: CountdownOverlayProps) {
  return (
    <div className='absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200'>
      <div className='flex flex-col items-center gap-4'>
        <div key={count} className='text-8xl font-bold text-primary animate-in zoom-in-50 duration-300'>
          {count === 0 ? 'GO!' : count}
        </div>
        <div className='text-lg text-muted-foreground'>{count > 0 ? 'Get ready...' : 'Start typing!'}</div>
      </div>
    </div>
  );
});
