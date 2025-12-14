import { GameLayout } from '@/components/game-layout';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';

function TypeRacerMenu() {
  return (
    <GameLayout>
      <div className='flex flex-col items-center gap-6 animate-in fade-in-0 duration-300'>
        <div className='text-center mb-4'>
          <h1 className='text-3xl font-bold text-foreground mb-2'>TypeRacer</h1>
          <p className='text-muted-foreground'>Test your typing speed</p>
        </div>
        <div className='flex flex-col gap-3 w-full max-w-xs'>
          <Link to='/games/typeracer/solo'>
            <Button asChild size='lg' className='w-full gap-2'>
              <span>
                <User className='w-4 h-4' />
                Solo
              </span>
            </Button>
          </Link>
          <Link to='/games/typeracer/multiplayer'>
            <Button asChild variant='outline' size='lg' className='w-full gap-2'>
              <span>
                <Users className='w-4 h-4' />
                Multiplayer
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </GameLayout>
  );
}

export default TypeRacerMenu;
