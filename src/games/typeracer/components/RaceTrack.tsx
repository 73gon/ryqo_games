// Animated race track component for TypeRacer

import { memo } from 'react';
import type { Player } from '../types';
import { CAR_COLORS } from '../constants';

interface RaceTrackProps {
  players: Player[];
  currentPlayerId: string;
}

const Car = memo(function Car({ color, isCurrentPlayer }: { color: string; isCurrentPlayer: boolean }) {
  return (
    <svg width='32' height='16' viewBox='0 0 32 16' className={`drop-shadow-md ${isCurrentPlayer ? 'filter brightness-110' : ''}`}>
      {/* Car body */}
      <rect x='2' y='4' width='28' height='8' rx='2' fill={color} />
      {/* Roof */}
      <rect x='8' y='2' width='12' height='6' rx='1' fill={color} />
      {/* Windshield */}
      <rect x='16' y='3' width='3' height='4' rx='0.5' fill='rgba(255,255,255,0.6)' />
      {/* Rear window */}
      <rect x='9' y='3' width='3' height='4' rx='0.5' fill='rgba(255,255,255,0.4)' />
      {/* Front wheel */}
      <circle cx='24' cy='12' r='3' fill='#333' />
      <circle cx='24' cy='12' r='1.5' fill='#666' />
      {/* Rear wheel */}
      <circle cx='8' cy='12' r='3' fill='#333' />
      <circle cx='8' cy='12' r='1.5' fill='#666' />
      {/* Headlight */}
      <rect x='28' y='6' width='2' height='2' rx='0.5' fill='#FFD700' />
      {/* Taillight */}
      <rect x='2' y='6' width='1' height='2' rx='0.25' fill='#FF4444' />
      {isCurrentPlayer && <circle cx='16' cy='0' r='2' fill='#FFD700' className='animate-pulse' />}
    </svg>
  );
});

export const RaceTrack = memo(function RaceTrack({ players, currentPlayerId }: RaceTrackProps) {
  // Sort players: finished players by finish time, then by progress
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishedAt || 0) - (b.finishedAt || 0);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });

  // Calculate positions for finished players
  const getPosition = (player: Player): number | null => {
    if (!player.finished) return null;
    const finishedPlayers = players.filter((p) => p.finished).sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0));
    return finishedPlayers.findIndex((p) => p.id === player.id) + 1;
  };

  const getPositionSuffix = (pos: number): string => {
    if (pos === 1) return 'st';
    if (pos === 2) return 'nd';
    if (pos === 3) return 'rd';
    return 'th';
  };

  return (
    <div className='w-full space-y-2 p-4 bg-muted/20 rounded-lg border border-border'>
      {/* Track header */}
      <div className='flex justify-between text-xs text-muted-foreground px-2'>
        <span>Start</span>
        <span>Finish</span>
      </div>

      {/* Race lanes */}
      <div className='space-y-3'>
        {sortedPlayers.map((player, index) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const color = CAR_COLORS[index % CAR_COLORS.length];

          return (
            <div key={player.id} className='relative'>
              {/* Lane */}
              <div className='h-10 bg-muted/40 rounded-md relative overflow-hidden border border-border/50'>
                {/* Progress track */}
                <div
                  className='absolute inset-y-0 left-0 bg-primary/10 transition-all duration-300 ease-out'
                  style={{ width: `${player.progress}%` }}
                />

                {/* Lane markings */}
                <div className='absolute inset-0 flex items-center'>
                  {[25, 50, 75].map((mark) => (
                    <div key={mark} className='absolute h-full w-px bg-border/50' style={{ left: `${mark}%` }} />
                  ))}
                </div>

                {/* Finish line */}
                <div
                  className='absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-white via-black to-white opacity-50'
                  style={{ backgroundSize: '100% 4px' }}
                />

                {/* Car */}
                <div
                  className='absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out'
                  style={{ left: `calc(${Math.min(player.progress, 95)}% - 16px)` }}
                >
                  <Car color={color} isCurrentPlayer={isCurrentPlayer} />
                </div>
              </div>

              {/* Player info */}
              <div
                className={`flex items-center justify-between mt-1 text-xs ${isCurrentPlayer ? 'text-primary font-medium' : 'text-muted-foreground'}`}
              >
                <span className='flex items-center gap-1'>
                  {isCurrentPlayer && <span className='text-primary'>●</span>}
                  {player.name}
                  {player.finished &&
                    (() => {
                      const pos = getPosition(player);
                      if (pos) {
                        return (
                          <span
                            className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pos === 1
                                ? 'bg-yellow-500 text-black'
                                : pos === 2
                                  ? 'bg-gray-400 text-black'
                                  : pos === 3
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {pos}
                            {getPositionSuffix(pos)}
                          </span>
                        );
                      }
                      return <span className='text-green-500 ml-1'>✓</span>;
                    })()}
                </span>
                <span>{player.wpm} WPM</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
