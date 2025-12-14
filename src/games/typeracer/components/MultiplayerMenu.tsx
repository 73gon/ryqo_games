// Multiplayer menu component for TypeRacer

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Users, Loader2, X } from 'lucide-react';

interface MultiplayerMenuProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  withPunctuation: boolean;
  onPunctuationChange: (value: boolean) => void;
  joinRoomId: string;
  onJoinRoomIdChange: (id: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export const MultiplayerMenu = memo(function MultiplayerMenu({
  playerName,
  onPlayerNameChange,
  withPunctuation,
  onPunctuationChange,
  joinRoomId,
  onJoinRoomIdChange,
  onCreateRoom,
  onJoinRoom,
  onBack,
  isLoading,
  error,
}: MultiplayerMenuProps) {
  return (
    <div className='flex flex-col items-center gap-6 animate-in fade-in-0 duration-300 w-full max-w-2xl'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-foreground mb-2'>Multiplayer</h2>
        <p className='text-muted-foreground text-sm'>Race against friends</p>
      </div>

      {/* Player name input */}
      <div className='w-full max-w-xs'>
        <label className='text-sm text-muted-foreground mb-1 block'>Your Name</label>
        <Input value={playerName} onChange={(e) => onPlayerNameChange(e.target.value)} placeholder='Enter your name' maxLength={20} />
      </div>

      {/* Punctuation toggle for multiplayer */}
      <div className='flex items-center gap-3'>
        <label className='text-sm text-muted-foreground'>Punctuation</label>
        <Toggle pressed={withPunctuation} onPressedChange={onPunctuationChange} size='sm'>
          {withPunctuation ? 'On' : 'Off'}
        </Toggle>
      </div>

      {/* Create room */}
      <Button onClick={onCreateRoom} size='lg' className='w-full max-w-xs gap-2' disabled={isLoading}>
        {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Users className='w-4 h-4' />}
        Create Room
      </Button>

      <div className='flex items-center gap-3 w-full max-w-xs'>
        <div className='h-px bg-border flex-1' />
        <span className='text-xs text-muted-foreground'>or</span>
        <div className='h-px bg-border flex-1' />
      </div>

      {/* Join room */}
      <div className='w-full max-w-xs space-y-2'>
        <label className='text-sm text-muted-foreground'>Join Room</label>
        <div className='flex gap-2'>
          <Input
            value={joinRoomId}
            onChange={(e) => onJoinRoomIdChange(e.target.value.toUpperCase())}
            placeholder='Room Code'
            maxLength={6}
            className='font-mono uppercase'
          />
          <Button onClick={onJoinRoom} disabled={!joinRoomId.trim() || isLoading}>
            Join
          </Button>
        </div>
      </div>

      {error && <p className='text-sm text-destructive'>{error}</p>}

      <Button variant='ghost' onClick={onBack} className='gap-2'>
        <X className='w-4 h-4' />
        Back
      </Button>
    </div>
  );
});
