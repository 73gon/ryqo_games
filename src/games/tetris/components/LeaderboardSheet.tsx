import { Trophy, Calendar, Crown, Medal, Clock } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import ElectricBorder from '@/components/electric-border';
import type { TetrisScoreRow } from '@/lib/supabaseClient';
import { useState } from 'react';

interface LeaderboardSheetProps {
  weeklyLeaderboard: TetrisScoreRow[];
  allTimeLeaderboard: TetrisScoreRow[];
  loading: boolean;
  error: string | null;
  pendingScore: number | null;
  playerName: string;
  submitting: boolean;
  lastSubmittedId: string | null;
  hasSupabaseConfig: boolean;
  weekStartLabel: string;
  onPlayerNameChange: (value: string) => void;
  onSubmit: () => void;
}

function LeaderboardEntry({ entry, index, lastSubmittedId }: { entry: TetrisScoreRow; index: number; lastSubmittedId: string | null }) {
  let medalStyle = {};
  let medalClass = '';
  let icon = null;

  if (index === 0) {
    medalStyle = {
      color: 'var(--medal-gold)',
      backgroundColor: 'var(--medal-gold-bg)',
    };
    medalClass = 'font-bold';
    icon = <Crown className='h-4 w-4' />;
  } else if (index === 1) {
    medalStyle = {
      color: 'var(--medal-silver)',
      backgroundColor: 'var(--medal-silver-bg)',
    };
    medalClass = 'font-bold';
    icon = <Medal className='h-4 w-4' />;
  } else if (index === 2) {
    medalStyle = {
      color: 'var(--medal-bronze)',
      backgroundColor: 'var(--medal-bronze-bg)',
    };
    medalClass = 'font-bold';
    icon = <Medal className='h-4 w-4' />;
  }

  const row = (
    <div className={`flex justify-between items-center px-4 py-2.5 rounded-md ${index < 3 ? '' : 'bg-muted/50'}`} style={index < 3 ? medalStyle : {}}>
      <div className={`flex items-center gap-2 ${medalClass}`}>
        {icon || <span className='text-sm font-medium w-4'>#{index + 1}</span>}
        <span className='text-sm font-semibold truncate max-w-[140px]'>{entry.name || 'Anonymous'}</span>
      </div>
      <span className={`font-mono font-bold tabular-nums ${medalClass}`}>{entry.score.toString().padStart(6, '0')}</span>
    </div>
  );

  if (entry.id === lastSubmittedId) {
    return (
      <ElectricBorder key={entry.id} color='#7df9ff' speed={0.5} chaos={0.2} thickness={2} style={{ borderRadius: '0.375rem' }}>
        {row}
      </ElectricBorder>
    );
  }

  return row;
}

function LeaderboardList({
  leaderboard,
  loading,
  error,
  lastSubmittedId,
  emptyMessage,
}: {
  leaderboard: TetrisScoreRow[];
  loading: boolean;
  error: string | null;
  lastSubmittedId: string | null;
  emptyMessage: string;
}) {
  if (loading) {
    return <div className='text-sm text-muted-foreground py-4 text-center'>Loading…</div>;
  }

  if (error) {
    return <div className='text-sm text-destructive py-4 text-center'>{error}</div>;
  }

  if (leaderboard.length === 0) {
    return <div className='text-sm text-muted-foreground py-4 text-center'>{emptyMessage}</div>;
  }

  return (
    <div className='space-y-1'>
      {leaderboard.map((entry, index) => (
        <LeaderboardEntry key={entry.id} entry={entry} index={index} lastSubmittedId={lastSubmittedId} />
      ))}
    </div>
  );
}

export function LeaderboardSheet({
  weeklyLeaderboard,
  allTimeLeaderboard,
  loading,
  error,
  pendingScore,
  playerName,
  submitting,
  lastSubmittedId,
  hasSupabaseConfig,
  weekStartLabel,
  onPlayerNameChange,
  onSubmit,
}: LeaderboardSheetProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'alltime'>('weekly');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <Trophy className='h-4 w-4' />
          Leaderboard
        </Button>
      </SheetTrigger>
      <SheetContent className='w-[400px] sm:w-[450px] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Leaderboard
          </SheetTitle>
          <SheetDescription>Track your high scores and compete with others</SheetDescription>
        </SheetHeader>

        <div className='mt-6 space-y-6'>
          {/* Score submission section */}
          {pendingScore !== null && (
            <div className='rounded-md border border-border bg-card p-4 space-y-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-sm font-semibold'>Submit Your Score</div>
                  <div className='text-xs text-muted-foreground'>Add your name to the leaderboard</div>
                </div>
                <span className='font-mono font-bold tabular-nums text-xl'>{pendingScore.toString().padStart(6, '0')}</span>
              </div>
              <div className='flex gap-2'>
                <Input
                  value={playerName}
                  onChange={(e) => onPlayerNameChange(e.target.value)}
                  placeholder='Your name'
                  maxLength={24}
                  disabled={submitting}
                  className='flex-1'
                />
                <Button onClick={onSubmit} disabled={submitting || !playerName.trim() || !hasSupabaseConfig}>
                  {submitting ? 'Saving…' : 'Submit'}
                </Button>
              </div>
              {error && <div className='text-xs text-destructive'>{error}</div>}
              {!hasSupabaseConfig && <div className='text-xs text-amber-600'>Configure Supabase to enable score submissions.</div>}
            </div>
          )}

          <Separator />

          {/* Tab navigation */}
          <div className='flex gap-2'>
            <Button
              variant={activeTab === 'weekly' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setActiveTab('weekly')}
              className='flex-1 gap-2'
            >
              <Calendar className='h-4 w-4' />
              Weekly
            </Button>
            <Button
              variant={activeTab === 'alltime' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setActiveTab('alltime')}
              className='flex-1 gap-2'
            >
              <Clock className='h-4 w-4' />
              All Time
            </Button>
          </div>

          {/* Weekly leaderboard */}
          {activeTab === 'weekly' && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-bold tracking-wide uppercase flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  Weekly Leaderboard
                </h3>
              </div>
              <div className='text-xs text-muted-foreground'>Week of {weekStartLabel} • Resets Mondays (UTC)</div>
              <LeaderboardList
                leaderboard={weeklyLeaderboard}
                loading={loading}
                error={error}
                lastSubmittedId={lastSubmittedId}
                emptyMessage='No scores yet this week. Be the first!'
              />
            </div>
          )}

          {/* All-time leaderboard */}
          {activeTab === 'alltime' && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-bold tracking-wide uppercase flex items-center gap-2'>
                  <Clock className='h-4 w-4' />
                  All-Time Leaderboard
                </h3>
              </div>
              <div className='text-xs text-muted-foreground'>Top scores of all time</div>
              <LeaderboardList
                leaderboard={allTimeLeaderboard}
                loading={loading}
                error={null}
                lastSubmittedId={lastSubmittedId}
                emptyMessage='No scores yet. Set the first record!'
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
