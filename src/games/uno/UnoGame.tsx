import { useState } from 'react';
import { useUno } from './hooks/useUno';
import { GameBoard } from './components/GameBoard';
import { Hand } from './components/Hand';
import { type Card as CardType, type Color } from './core/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { GameLayout } from '@/components/game-layout';

export default function UnoGame() {
  const { gameState, playerId, playerName, setPlayerName, createGame, joinGame, startGame, playCard, drawCard, leaveGame, isLoading } = useUno();

  const [joinCode, setJoinCode] = useState('');
  const [wildColorSelection, setWildColorSelection] = useState<{ card: CardType; isOpen: boolean } | null>(null);

  // Wild Color Picker Modal/Overlay
  const handleCardClick = (card: CardType) => {
    if (card.color === 'black') {
      setWildColorSelection({ card, isOpen: true });
    } else {
      playCard(card);
    }
  };

  const handleColorSelect = (color: Color) => {
    if (wildColorSelection) {
      playCard(wildColorSelection.card, color);
      setWildColorSelection(null);
    }
  };

  const renderContent = () => {
    if (!gameState) {
      // MENU / LOBBY ENTRY
      return (
        <div className='flex flex-col items-center justify-center min-h-[60vh] p-4 gap-8 max-w-md mx-auto w-full'>
          <div className='text-center space-y-2'>
            <h1 className='text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-red-500 via-yellow-400 to-blue-500 drop-shadow-sm'>
              UNO
            </h1>
            <p className='text-muted-foreground'>The classic card game, multiplayer.</p>
          </div>

          <div className='w-full space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Your Name</label>
              <Input
                placeholder='Enter nickname...'
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className='text-center text-lg'
              />
            </div>

            <div className='grid grid-cols-2 gap-4 pt-4'>
              <Button
                size='lg'
                onClick={createGame}
                disabled={isLoading || !playerName}
                className='w-full bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all'
              >
                Create Room
              </Button>
              <div className='space-y-2'>
                <Input
                  placeholder='Room Code'
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className='text-center font-mono uppercase'
                  maxLength={6}
                />
                <Button
                  variant='outline'
                  onClick={() => joinGame(joinCode)}
                  disabled={isLoading || !playerName || joinCode.length < 4}
                  className='w-full'
                >
                  Join Room
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (gameState.status === 'waiting') {
      // LOBBY
      const isHost = gameState.players.find((p) => p.id === playerId)?.isHost;

      return (
        <div className='flex flex-col items-center max-w-2xl mx-auto p-6 gap-6 w-full min-h-[60vh] justify-center'>
          <Card className='w-full p-6 flex flex-col items-center gap-4 bg-background/50 backdrop-blur'>
            <h2 className='text-2xl font-bold'>Lobby</h2>

            <div
              className='flex items-center gap-2 bg-muted px-4 py-2 rounded-lg cursor-pointer hover:bg-muted/80'
              onClick={() => {
                navigator.clipboard.writeText(gameState.roomId);
                toast.success('Room code copied!');
              }}
            >
              <span className='font-mono text-xl tracking-widest'>{gameState.roomId}</span>
              <Copy className='w-4 h-4 text-muted-foreground' />
            </div>

            <div className='w-full space-y-2'>
              <p className='text-sm text-muted-foreground font-medium uppercase tracking-wider'>Players ({gameState.players.length}/8)</p>
              <div className='grid grid-cols-2 gap-2'>
                {gameState.players.map((p) => (
                  <div key={p.id} className='flex items-center gap-2 p-2 rounded bg-secondary/50'>
                    <div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold'>{p.name.charAt(0)}</div>
                    <span className='truncate'>
                      {p.name} {p.isHost && '👑'} {p.id === playerId && '(You)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='flex gap-4 w-full pt-4'>
              <Button variant='ghost' className='flex-1' onClick={leaveGame}>
                Leave
              </Button>
              {isHost && (
                <Button className='flex-1' onClick={startGame} disabled={gameState.players.length < 2}>
                  Start Game
                </Button>
              )}
            </div>
          </Card>
        </div>
      );
    }

    // ACTIVE GAME
    const myPlayer = gameState.players.find((p) => p.id === playerId);
    if (!myPlayer) return <div>Error: Player not found in game</div>; // Should not happen
    const isMyTurn = gameState.players[gameState.currentTurnIndex]?.id === playerId;

    if (gameState.status === 'finished') {
      const winner = gameState.players.find((p) => p.id === gameState.winnerId);
      return (
        <div className='flex flex-col items-center justify-center h-[60vh] gap-6 animate-in zoom-in duration-500'>
          <h1 className='text-6xl font-black text-yellow-500 drop-shadow-lg'>WINNER!</h1>
          <div className='text-2xl font-bold'>{winner?.name} has won the game!</div>
          <Button onClick={leaveGame} size='lg'>
            Back to Menu
          </Button>
        </div>
      );
    }

    return (
      <div className='relative w-full h-[calc(100vh-8rem)] overflow-hidden flex flex-col bg-slate-950/30 rounded-xl border border-white/5'>
        {/* Game Board (Opponents & Center) */}
        <div className='flex-1 overflow-hidden'>
          <GameBoard gameState={gameState} currentPlayerId={playerId} onDrawCard={drawCard} />
        </div>

        {/* Player Hand */}
        <div className='h-auto pb-4 pt-8 z-10 relative bg-linear-to-t from-background/90 to-transparent'>
          <Hand cards={myPlayer.hand} isMyTurn={isMyTurn} onPlayCard={handleCardClick} className='px-4' />
        </div>

        {/* Color Picker Modal */}
        {wildColorSelection && (
          <div className='absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in'>
            <div className='bg-background p-6 rounded-xl shadow-2xl space-y-4'>
              <h3 className='text-lg font-bold text-center'>Choose Color</h3>
              <div className='grid grid-cols-2 gap-4'>
                {['red', 'blue', 'green', 'yellow'].map((color) => (
                  <button
                    key={color}
                    className={`w-24 h-24 rounded-lg shadow-lg ${
                      color === 'red'
                        ? 'bg-red-500 hover:bg-red-600'
                        : color === 'blue'
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : color === 'green'
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-yellow-400 hover:bg-yellow-500'
                    }`}
                    onClick={() => handleColorSelect(color as Color)}
                  />
                ))}
              </div>
              <Button variant='ghost' className='w-full' onClick={() => setWildColorSelection(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return <GameLayout>{renderContent()}</GameLayout>;
}
