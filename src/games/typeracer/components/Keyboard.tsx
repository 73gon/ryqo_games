// Virtual keyboard component for TypeRacer

import { memo } from 'react';
import { KEYBOARD_LAYOUT, SPECIAL_KEY_LABELS } from '../constants';

interface KeyboardProps {
  pressedKey: string | null;
  lastKeyCorrect: boolean | null;
}

export const Keyboard = memo(function Keyboard({ pressedKey, lastKeyCorrect }: KeyboardProps) {
  const getKeyClass = (key: string) => {
    const isPressed = pressedKey?.toLowerCase() === key.toLowerCase();

    let baseClass = 'flex items-center justify-center rounded-md border font-mono text-xs transition-all duration-75 ';

    if (key === ' ') {
      baseClass += 'w-48 h-8 ';
    } else {
      baseClass += 'w-8 h-8 ';
    }

    if (isPressed) {
      if (lastKeyCorrect === true) {
        baseClass += 'bg-primary text-primary-foreground border-primary scale-95 shadow-lg shadow-primary/30';
      } else if (lastKeyCorrect === false) {
        baseClass += 'bg-destructive text-white border-destructive scale-95 shadow-lg shadow-destructive/30';
      } else {
        baseClass += 'bg-accent text-accent-foreground border-accent scale-95';
      }
    } else {
      baseClass += 'bg-muted/50 text-muted-foreground border-border hover:bg-muted';
    }

    return baseClass;
  };

  return (
    <div className='flex flex-col items-center gap-1 p-3 bg-card/50 rounded-lg border border-border'>
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className='flex gap-1 justify-center'>
          {row.map((key) => (
            <div key={key} className={getKeyClass(key)}>
              {SPECIAL_KEY_LABELS[key] || key.toUpperCase()}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
