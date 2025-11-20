interface RyqoProps {
  className?: string;
}

export function Ryqo({ className }: RyqoProps) {
  return (
    <svg viewBox='310 90 190 75' xmlns='http://www.w3.org/2000/svg' className={className}>
      <path
        d='M 493 100 C 485.5 105, 408 160, 403 160 C 398 160, 440.5 105, 433 100 C 425.5 95, 323 100, 313 100'
        stroke='currentColor'
        strokeWidth='8'
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}
