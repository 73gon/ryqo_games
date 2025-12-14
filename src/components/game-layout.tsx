import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameLayoutProps {
  children: React.ReactNode;
  controls?: React.ReactNode;
}

export function GameLayout({ children, controls }: GameLayoutProps) {
  return (
    <div className='flex-1 flex flex-col bg-background'>
      <div className='container mx-auto py-4 px-4 max-w-8xl flex-1 flex flex-col'>
        <div className='mb-4 flex items-center justify-between mx-8'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='icon' asChild>
              <Link to='/'>
                <ArrowLeft className='h-6 w-6' />
              </Link>
            </Button>
          </div>
          {controls && <div className='flex items-center gap-2'>{controls}</div>}
        </div>

        <div className='overflow-visible p-6 flex flex-col items-center justify-center flex-1'>{children}</div>
      </div>
    </div>
  );
}
