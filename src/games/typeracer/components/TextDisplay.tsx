// Text display component for TypeRacer

import { memo, useMemo } from 'react';
import { motion } from 'motion/react';

interface TextDisplayProps {
  text: string;
  currentIndex: number;
  errors: Set<number>;
  scrollOffset?: number;
}

export const TextDisplay = memo(function TextDisplay({ text, currentIndex, errors, scrollOffset = 0 }: TextDisplayProps) {
  // Get the text to display, starting from scroll offset
  const displayText = useMemo(() => {
    return text.slice(scrollOffset);
  }, [text, scrollOffset]);

  // Adjust indices relative to scroll offset
  const adjustedCurrentIndex = currentIndex - scrollOffset;
  const adjustedErrors = useMemo(() => {
    const adjusted = new Set<number>();
    errors.forEach((errorIndex) => {
      if (errorIndex >= scrollOffset) {
        adjusted.add(errorIndex - scrollOffset);
      }
    });
    return adjusted;
  }, [errors, scrollOffset]);

  return (
    <motion.div
      className='font-mono text-lg leading-relaxed py-2 select-none whitespace-pre-wrap wrap-break-word w-full max-w-full overflow-hidden min-h-[4.5em] max-h-[4.5em]'
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {displayText.split('').map((char, index) => {
        let className = 'transition-colors duration-75 ';

        if (index < adjustedCurrentIndex) {
          if (adjustedErrors.has(index)) {
            className += 'text-destructive bg-destructive/20';
          } else {
            className += 'text-primary';
          }
        } else if (index === adjustedCurrentIndex) {
          className += 'bg-primary/30 text-foreground animate-pulse';
        } else {
          className += 'text-muted-foreground';
        }

        return (
          <span key={index} className={className}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </motion.div>
  );
});
