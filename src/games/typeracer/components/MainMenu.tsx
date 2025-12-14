// Main menu component for TypeRacer

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';

interface MainMenuProps {
  onStartSolo: () => void;
  onMultiplayer: () => void;
  hasMultiplayer: boolean;
}

export const MainMenu = memo(function MainMenu({ onStartSolo, onMultiplayer, hasMultiplayer }: MainMenuProps) {
  return (
    <div className='flex flex-col items-center gap-6 animate-in fade-in-0 duration-300'>
      <div className='text-center mb-4'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>TypeRacer</h1>
        <p className='text-muted-foreground'>Test your typing speed</p>
      </div>

      <div className='flex flex-col gap-3 w-full max-w-xs'>
        <Button onClick={onStartSolo} size='lg' className='w-full gap-2'>
          <User className='w-4 h-4' />
          Solo
        </Button>

        {hasMultiplayer && (
          <Button onClick={onMultiplayer} variant='outline' size='lg' className='w-full gap-2'>
            <Users className='w-4 h-4' />
            Multiplayer
          </Button>
        )}
      </div>
    </div>
  );
});
