// Results screen component for TypeRacer

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy, Target, Clock, Zap } from 'lucide-react';
import type { GameStats, Player } from '../types';

interface ResultsScreenProps {
  stats: GameStats;
  players: Player[];
  currentPlayerId: string;
  onPlayAgain: () => void;
  isMultiplayer: boolean;
}

export const ResultsScreen = memo(function ResultsScreen({ stats, players, currentPlayerId, onPlayAgain, isMultiplayer }: ResultsScreenProps) {
  const sortedPlayers = [...players].filter((p) => p.finished).sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0));

  const currentPlayerRank = sortedPlayers.findIndex((p) => p.id === currentPlayerId) + 1;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className='flex flex-col items-center gap-6 p-6 animate-in fade-in-0 zoom-in-95 duration-300'>
      {/* Title */}
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-foreground mb-2'>Race Complete!</h2>
        {isMultiplayer && currentPlayerRank > 0 && (
          <div className='flex items-center justify-center gap-2 text-lg'>
            <Trophy className={`w-5 h-5 ${currentPlayerRank === 1 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            <span className={currentPlayerRank === 1 ? 'text-yellow-500 font-bold' : 'text-muted-foreground'}>
              {currentPlayerRank === 1 ? '1st Place!' : `${currentPlayerRank}${getOrdinalSuffix(currentPlayerRank)} Place`}
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-2 gap-4 w-full max-w-sm'>
        <div className='flex flex-col items-center p-4 bg-muted/30 rounded-lg border border-border'>
          <Zap className='w-6 h-6 text-primary mb-2' />
          <span className='text-3xl font-bold text-foreground'>{stats.wpm}</span>
          <span className='text-xs text-muted-foreground'>Words Per Minute</span>
        </div>

        <div className='flex flex-col items-center p-4 bg-muted/30 rounded-lg border border-border'>
          <Target className='w-6 h-6 text-primary mb-2' />
          <span className='text-3xl font-bold text-foreground'>{stats.accuracy.toFixed(1)}%</span>
          <span className='text-xs text-muted-foreground'>Accuracy</span>
        </div>

        <div className='flex flex-col items-center p-4 bg-muted/30 rounded-lg border border-border'>
          <Clock className='w-6 h-6 text-muted-foreground mb-2' />
          <span className='text-2xl font-bold text-foreground'>{formatTime(stats.timeElapsed)}</span>
          <span className='text-xs text-muted-foreground'>Time</span>
        </div>

        <div className='flex flex-col items-center p-4 bg-muted/30 rounded-lg border border-border'>
          <span className='text-lg mb-2'>⌨️</span>
          <span className='text-2xl font-bold text-foreground'>
            {stats.correctChars}/{stats.totalChars}
          </span>
          <span className='text-xs text-muted-foreground'>Characters</span>
        </div>
      </div>

      {/* Multiplayer leaderboard */}
      {isMultiplayer && sortedPlayers.length > 1 && (
        <div className='w-full max-w-sm'>
          <h3 className='text-sm font-medium text-muted-foreground mb-2'>Race Results</h3>
          <div className='space-y-2'>
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2 rounded-md ${
                  player.id === currentPlayerId ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'
                }`}
              >
                <div className='flex items-center gap-2'>
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? 'bg-yellow-500 text-black'
                        : index === 1
                          ? 'bg-gray-400 text-black'
                          : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className='text-sm'>{player.name}</span>
                </div>
                <span className='text-sm text-muted-foreground'>{player.wpm} WPM</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Play Again Button */}
      <Button onClick={onPlayAgain} className='gap-2'>
        <RotateCcw className='w-4 h-4' />
        Play Again
      </Button>
    </div>
  );
});

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
