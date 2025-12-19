import { motion, AnimatePresence } from 'motion/react';
import { type Card as CardType } from '../core/types';
import { Card } from './Card';
import { cn } from '@/lib/utils';

interface HandProps {
  cards: CardType[];
  isMyTurn: boolean;
  onPlayCard: (card: CardType) => void;
  className?: string;
}

export const Hand = ({ cards, isMyTurn, onPlayCard, className }: HandProps) => {
  // Logic to fan cards
  // We want them to overlap.
  // Max width of the hand container should be constrained to screen width.

  return (
    <div className={cn('relative flex justify-center items-end h-32 md:h-48 w-full max-w-full overflow-hidden', className)}>
      <AnimatePresence>
        {cards.map((card, index) => {
          const total = cards.length;
          // Calculate rotation and offset
          // Center is 0. Left is negative, right is positive.
          const centerIndex = (total - 1) / 2;
          const offset = index - centerIndex;

          // Rotation: -30deg to 30deg roughly
          const rotation = total > 1 ? offset * 5 : 0;

          // Y Offset: Arc shape. Center is highest.
          // abs(offset) increases as we go out.
          const yOffset = Math.abs(offset) * 2; // px

          // X Overlap
          // Determine spacing based on number of cards to fit screen
          // Base spacing: 30px?
          const xSpacing = Math.min(40, 300 / total); // crude responsive fit

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ y: 100, opacity: 0, rotate: 0 }}
              animate={{
                y: yOffset,
                rotate: rotation,
                marginLeft: index === 0 ? 0 : -30, // Negative margin for overlap
                zIndex: index,
              }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className='origin-bottom'
            >
              <Card
                card={card}
                isPlayable={isMyTurn}
                onClick={() => isMyTurn && onPlayCard(card)}
                className={cn('shadow-[-5px_0_10px_rgba(0,0,0,0.1)]', !isMyTurn && 'opacity-90 cursor-default hover:translate-y-0 hover:scale-100')}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
