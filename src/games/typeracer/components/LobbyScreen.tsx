// Lobby screen for multiplayer TypeRacer

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Users, Play, Loader2 } from 'lucide-react';
import type { Player } from '../types';

interface LobbyScreenProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onStartRace: () => void;
  isStarting: boolean;
}

export const LobbyScreen = memo(function LobbyScreen({
  roomId,
  players,
  currentPlayerId,
  isHost,
  onStartRace,
  isStarting,
}: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  
  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full max-w-md animate-in fade-in-0 duration-300">
      {/* Room Code */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground mb-1">Race Lobby</h2>
        <div className="text-3xl font-mono font-bold text-primary tracking-wider">
          {roomId}
        </div>
      </div>

      {/* Invite Link */}
      <div className="w-full space-y-2">
        <label className="text-sm text-muted-foreground">Invite Link</label>
        <div className="flex gap-2">
          <Input 
            value={inviteUrl} 
            readOnly 
            className="text-sm font-mono"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleCopyLink}
            className="shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Players List */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Players ({players.length})
          </span>
        </div>
        <div className="space-y-2">
          {players.map((player) => (
            <div 
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-md border ${
                player.id === currentPlayerId 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-muted/30 border-border'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  player.id === currentPlayerId ? 'bg-primary' : 'bg-green-500'
                } animate-pulse`} />
                {player.name}
                {player.id === currentPlayerId && (
                  <span className="text-xs text-muted-foreground">(You)</span>
                )}
              </span>
              {isHost && player.id === currentPlayerId && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                  Host
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Waiting message or Start button */}
      {isHost ? (
        <Button 
          onClick={onStartRace} 
          disabled={players.length < 1 || isStarting}
          className="w-full gap-2"
        >
          {isStarting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isStarting ? 'Starting...' : 'Start Race'}
        </Button>
      ) : (
        <div className="text-center text-sm text-muted-foreground animate-pulse">
          Waiting for host to start the race...
        </div>
      )}
    </div>
  );
});
