import { motion } from 'motion/react';
import { type Card as CardType } from '../core/types';
import { cn } from '@/lib/utils';
import { Ban, RefreshCcw, Copy, Hexagon } from 'lucide-react'; // Icons for Skip, Reverse, Draw, Wild

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isHidden?: boolean; // Face down
  isPlayable?: boolean; // Highlight if playable
  className?: string;
  style?: React.CSSProperties;
}

const colorMap = {
  red: 'bg-red-500 text-red-500',
  blue: 'bg-blue-500 text-blue-500',
  green: 'bg-green-500 text-green-500',
  yellow: 'bg-yellow-400 text-yellow-600', // Yellow text needs more contrast
  black: 'bg-slate-900 text-slate-900',
};

export const Card = ({ card, onClick, isHidden, isPlayable, className, style }: CardProps) => {
  const baseColor = colorMap[card.color] || colorMap.black;
  const bgColor = baseColor.split(' ')[0];
  const textColor = baseColor.split(' ')[1];

  const renderContent = () => {
    if (isHidden) {
      return (
        <div className='w-full h-full bg-slate-900 rounded-lg flex items-center justify-center border-2 border-white'>
          <div className='w-3/4 h-3/4 bg-red-500 rounded-full transform -rotate-45 flex items-center justify-center'>
            <span className='text-yellow-400 font-bold text-xl md:text-3xl' style={{ textShadow: '1px 1px 0 #000' }}>
              UNO
            </span>
          </div>
        </div>
      );
    }

    const Icon = () => {
      switch (card.type) {
        case 'skip':
          return <Ban className='w-full h-full' />;
        case 'reverse':
          return <RefreshCcw className='w-full h-full' />;
        case 'draw_two':
          return <Copy className='w-full h-full' />; // Simplified representation
        case 'wild':
          return <Hexagon className='w-full h-full fill-current' />;
        case 'wild_draw_four':
          return (
            <div className='flex flex-col items-center leading-none text-xs md:text-sm font-bold'>
              <span>+4</span>
              <Hexagon className='w-4 h-4 md:w-6 md:h-6 fill-current' />
            </div>
          );
        default:
          return <span className='text-4xl md:text-6xl font-black'>{card.value}</span>;
      }
    };

    const SmallIcon = () => {
      switch (card.type) {
        case 'skip':
          return <Ban className='w-3 h-3 md:w-4 md:h-4' />;
        case 'reverse':
          return <RefreshCcw className='w-3 h-3 md:w-4 md:h-4' />;
        case 'draw_two':
          return <span className='font-bold text-xs md:text-sm'>+2</span>;
        case 'wild':
          return <Hexagon className='w-3 h-3 md:w-4 md:h-4' />;
        case 'wild_draw_four':
          return <span className='font-bold text-[10px] md:text-xs'>+4</span>;
        default:
          return <span className='font-bold text-sm md:text-lg'>{card.value}</span>;
      }
    };

    return (
      <div className={cn('w-full h-full rounded-lg relative overflow-hidden border-4 border-white', bgColor)}>
        {/* White Oval Center */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='w-[85%] h-[60%] bg-white rounded-[100%] transform -rotate-45 shadow-inner flex items-center justify-center'>
            <div className={cn('w-2/3 h-2/3 flex items-center justify-center', textColor)}>
              <Icon />
            </div>
          </div>
        </div>

        {/* Corners */}
        <div className='absolute top-1 left-1 text-white drop-shadow-md'>
          <SmallIcon />
        </div>
        <div className='absolute bottom-1 right-1 text-white drop-shadow-md transform rotate-180'>
          <SmallIcon />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      layoutId={card.id}
      className={cn(
        'relative w-16 h-24 md:w-24 md:h-36 rounded-xl shadow-xl select-none cursor-pointer transition-transform',
        isPlayable && !isHidden && 'hover:-translate-y-4 hover:scale-110 z-10',
        className,
      )}
      style={style}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      initial={false}
    >
      {renderContent()}
    </motion.div>
  );
};
