import ElectricBorder from '@/components/electric-border';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TetrisScoreRow } from '@/lib/supabaseClient';

interface LeaderboardPanelProps {
  leaderboard: TetrisScoreRow[];
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

export function LeaderboardPanel({
  leaderboard,
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
}: LeaderboardPanelProps) {
  return (
    <div className='w-72 shrink-0 space-y-3'>
      {pendingScore !== null && (
        <div className='rounded-md border border-border bg-card p-3 shadow-sm space-y-2'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Submit Score</div>
              <div className='text-sm text-muted-foreground'>Add your name to this week&apos;s board</div>
            </div>
            <span className='font-mono font-bold tabular-nums text-lg'>{pendingScore.toString().padStart(6, '0')}</span>
          </div>
          <div className='flex gap-2'>
            <Input
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder='Your name'
              maxLength={24}
              disabled={submitting}
            />
            <Button onClick={onSubmit} disabled={submitting || !playerName.trim() || !hasSupabaseConfig}>
              {submitting ? 'Saving…' : 'Submit'}
            </Button>
          </div>
          {error && <div className='text-xs text-destructive'>{error}</div>}
          {!hasSupabaseConfig && (
            <div className='text-xs text-amber-600'>Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable submissions.</div>
          )}
        </div>
      )}

      <div className='rounded-md border border-border bg-card p-3 shadow-sm space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-bold tracking-wide uppercase'>Weekly Leaderboard</h3>
        </div>
        <span className='text-[11px] text-muted-foreground'>Resets Mondays (UTC)</span>
        <div className='text-[11px] text-muted-foreground'>Week of {weekStartLabel}</div>

        {loading ? (
          <div className='text-xs text-muted-foreground'>Loading…</div>
        ) : error ? (
          <div className='text-xs text-destructive'>{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className='text-xs text-muted-foreground'>No scores yet this week. Be the first!</div>
        ) : (
          <div className='space-y-1'>
            {leaderboard.map((entry, index) => {
              let medalStyle = {};
              let medalClass = '';
              if (index === 0) {
                medalStyle = {
                  color: 'var(--medal-gold)',
                  backgroundColor: 'var(--medal-gold-bg)',
                };
                medalClass = 'font-bold';
              } else if (index === 1) {
                medalStyle = {
                  color: 'var(--medal-silver)',
                  backgroundColor: 'var(--medal-silver-bg)',
                };
                medalClass = 'font-bold';
              } else if (index === 2) {
                medalStyle = {
                  color: 'var(--medal-bronze)',
                  backgroundColor: 'var(--medal-bronze-bg)',
                };
                medalClass = 'font-bold';
              }

              const row = (
                <div
                  key={entry.id}
                  className={`flex justify-between items-center px-4 py-2 rounded-md ${index < 3 ? '' : 'bg-muted/50'}`}
                  style={index < 3 ? medalStyle : {}}
                >
                  <div className={`flex items-center gap-2 ${medalClass}`}>
                    <span className='text-sm font-medium'>#{index + 1}</span>
                    <span className='text-sm font-semibold truncate max-w-[120px]'>{entry.name || 'Anonymous'}</span>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
