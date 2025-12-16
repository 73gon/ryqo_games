// Text display component for TypeRacer

import { memo, useMemo, useEffect, useRef } from 'react';

interface TextDisplayProps {
  text: string;
  currentIndex: number;
  errors: Set<number>;
  scrollOffset?: number;
  onRequestScroll?: (newOffset: number) => void;
}

export const TextDisplay = memo(function TextDisplay({ text, currentIndex, errors, scrollOffset = 0, onRequestScroll }: TextDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Handle auto-scrolling
  useEffect(() => {
    if (!containerRef.current || !onRequestScroll) return;

    const chars = containerRef.current.querySelectorAll('span.transition-colors');
    if (chars.length === 0) return;

    const cursorIndex = adjustedCurrentIndex;
    if (cursorIndex < 0 || cursorIndex >= chars.length) return;

    const firstChar = chars[0] as HTMLElement;
    const cursorChar = chars[cursorIndex] as HTMLElement;

    const firstCharTop = firstChar.offsetTop;
    const cursorCharTop = cursorChar.offsetTop;
    const lineHeight = firstChar.offsetHeight || 24; // Fallback

    // Check if cursor is on the 3rd line (index 2) or later
    // Line 0: top ~ 0
    // Line 1: top ~ 1 * lineHeight
    // Line 2: top ~ 2 * lineHeight
    if (cursorCharTop - firstCharTop > 1.5 * lineHeight) {
      // Find the start of the 2nd line (index 1)
      let newOffsetInView = 0;
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i] as HTMLElement;
        if (char.offsetTop - firstCharTop > 0.5 * lineHeight) {
          newOffsetInView = i;
          break;
        }
      }

      if (newOffsetInView > 0) {
        onRequestScroll(scrollOffset + newOffsetInView);
      }
    }
  }, [adjustedCurrentIndex, onRequestScroll, scrollOffset, displayText]); // Depend on displayText to re-measure after render

  return (
    <div
      ref={containerRef}
      className='text-2xl leading-relaxed py-2 select-none whitespace-pre-wrap w-full max-w-full overflow-hidden min-h-[4.5em] max-h-[5em]'
    >
      {(() => {
        const tokens: { text: string; start: number }[] = [];
        const re = /(\S+|\s+)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(displayText)) !== null) {
          tokens.push({ text: m[0], start: m.index });
        }

        return tokens.map((token) => {
          const isWhitespace = /^\s+$/.test(token.text);

          const wrapperClass = isWhitespace ? undefined : 'whitespace-nowrap';

          return (
            <span key={token.start} className={wrapperClass}>
              {token.text.split('').map((char, i) => {
                const index = token.start + i;
                let className = 'transition-colors duration-75 ';

                if (index < adjustedCurrentIndex) {
                  if (adjustedErrors.has(index)) {
                    className += 'text-destructive bg-destructive/20';
                  } else {
                    className += 'text-accent-foreground';
                  }
                } else if (index === adjustedCurrentIndex) {
                  className += 'bg-primary/30 text-foreground animate-pulse';
                } else {
                  className += 'text-muted-foreground';
                }

                const displayChar = char === ' ' ? ' ' : char;

                return (
                  <span key={index} className={className}>
                    {displayChar}
                  </span>
                );
              })}
            </span>
          );
        });
      })()}
    </div>
  );
});
