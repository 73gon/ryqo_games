import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface GameLayoutProps {
  children: React.ReactNode;
  controls?: React.ReactNode;
}

export function GameLayout({ children, controls }: GameLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className='flex-1 flex'>
      <div className='py-4 px-4 max-w-8xl flex-1 flex flex-col justify-center'>
        <div className='mb-4 flex flex-col items-center justify-center mx-8 gap-2'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/'>
                <ArrowLeft className='h-6 w-6' />
                <span>{t('games.common.goback')}</span>
              </Link>
            </Button>
          </div>
          {controls && <div className='flex items-center gap-2'>{controls}</div>}
        </div>

        <div className='overflow-visible p-6 flex flex-col items-center justify-center'>{children}</div>
      </div>
    </div>
  );
}
