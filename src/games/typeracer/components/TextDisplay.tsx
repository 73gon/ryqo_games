// Text display component for TypeRacer

import { memo } from 'react';

interface TextDisplayProps {
  text: string;
  currentIndex: number;
  errors: Set<number>;
}

export const TextDisplay = memo(function TextDisplay({
  text,
  currentIndex,
  errors,
}: TextDisplayProps) {
  return (
    <div className="font-mono text-lg leading-relaxed p-4 bg-muted/30 rounded-lg border border-border select-none whitespace-pre-wrap break-words w-full max-w-full overflow-hidden">
      {text.split('').map((char, index) => {
        let className = 'transition-colors duration-75 ';
        
        if (index < currentIndex) {
          if (errors.has(index)) {
            className += 'text-destructive bg-destructive/20';
          } else {
            className += 'text-primary';
          }
        } else if (index === currentIndex) {
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
    </div>
  );
});
