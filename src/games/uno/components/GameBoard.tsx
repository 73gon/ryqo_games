import { motion } from 'motion/react';
import { type GameState } from '../core/types';
import { Card } from './Card';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerId: string;
  onDrawCard: () => void;
}

export const GameBoard = ({ gameState, currentPlayerId, onDrawCard }: GameBoardProps) => {
  const { players, discardPile, deck, currentTurnIndex, direction, activeColor } = gameState;

  // Arrange opponents
  // Filter out current player and arrange others in order
  const myIndex = players.findIndex((p) => p.id === currentPlayerId);
  const opponents = [];
  if (myIndex !== -1) {
    for (let i = 1; i < players.length; i++) {
      opponents.push(players[(myIndex + i) % players.length]);
    }
  }

  const topCard = discardPile[discardPile.length - 1];
  const isMyTurn = players[currentTurnIndex]?.id === currentPlayerId;

  // Visual helper for active color (useful for wild cards)
  const activeColorBg =
    {
      red: 'ring-red-500',
      blue: 'ring-blue-500',
      green: 'ring-green-500',
      yellow: 'ring-yellow-400',
      black: 'ring-slate-900', // Should not happen often for active color
    }[activeColor] || 'ring-slate-200';

  return (
    <div className='flex flex-col items-center justify-between w-full h-full py-4'>
      {/* Opponents Area */}
      {/* Mobile: Horizontal scrollable row. Desktop: Circle/Arc logic (simplified to row for now) */}
      <div className='flex w-full overflow-x-auto gap-4 px-4 pb-2 justify-center min-h-[100px] items-start'>
        {opponents.map((player) => {
          const isTurn = players[currentTurnIndex]?.id === player.id;
          return (
            <div
              key={player.id}
              className={cn('flex flex-col items-center shrink-0 transition-all duration-300', isTurn ? 'scale-110' : 'opacity-70')}
            >
              <div
                className={cn(
                  'w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-800 border-4 flex items-center justify-center relative shadow-lg',
                  isTurn ? 'border-yellow-400 shadow-yellow-400/50' : 'border-slate-600',
                )}
              >
                <span className='font-bold text-white text-lg'>{player.name.charAt(0).toUpperCase()}</span>
                <div className='absolute -bottom-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full border border-white'>
                  {player.hand.length}
                </div>
              </div>
              <span className='text-xs mt-2 font-medium truncate max-w-20 text-center'>{player.name}</span>
            </div>
          );
        })}
      </div>

      {/* Center Field */}
      <div className='flex-1 flex items-center justify-center gap-8 md:gap-16 relative w-full'>
        {/* Direction Indicator */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center transition-all duration-500',
            direction === 1 ? '' : 'scale-x-[-1]',
          )}
        >
          <div className='w-64 h-64 border-20 border-white rounded-full border-t-transparent border-r-transparent rotate-45'></div>
        </div>

        {/* Draw Pile */}
        <div className='relative group' onClick={() => isMyTurn && onDrawCard()}>
          {deck.length > 0 ? (
            <>
              <Card card={{ id: 'deck-bg', color: 'black', type: 'number', value: 0 }} isHidden className='absolute top-1 left-1' />
              <Card card={{ id: 'deck-top', color: 'black', type: 'number', value: 0 }} isHidden className='cursor-pointer active:scale-95' />
            </>
          ) : (
            <div className='w-16 h-24 md:w-24 md:h-36 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center'>
              <span className='text-white/20 text-xs'>Empty</span>
            </div>
          )}
        </div>

        {/* Discard Pile */}
        <div className='relative'>
          {topCard && (
            <div className={cn('relative rounded-xl ring-4 ring-offset-4 ring-offset-background transition-colors duration-500', activeColorBg)}>
              <Card card={topCard} className='cursor-default' />
              {/* Show Active Color Indicator explicitly if Wild */}
              {topCard.color === 'black' && (
                <div
                  className={cn(
                    'absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-white shadow-lg',
                    activeColor === 'red'
                      ? 'bg-red-500'
                      : activeColor === 'blue'
                        ? 'bg-blue-500'
                        : activeColor === 'green'
                          ? 'bg-green-500'
                          : activeColor === 'yellow'
                            ? 'bg-yellow-400'
                            : 'bg-gray-500',
                  )}
                  title={`Current Color: ${activeColor}`}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Game Info / Status Text */}
      <div className='mb-2 h-6 text-center'>
        {gameState.lastAction && (
          <motion.p
            key={gameState.version}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-sm md:text-base font-medium text-muted-foreground'
          >
            {gameState.lastAction}
          </motion.p>
        )}
      </div>
    </div>
  );
};
