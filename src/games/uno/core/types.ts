export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'black';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four';

export interface Card {
  id: string;
  color: Color;
  type: CardType;
  value?: number;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isHost: boolean;
  avatar?: string;
}

export interface GameState {
  roomId: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentTurnIndex: number;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  status: 'waiting' | 'playing' | 'finished';
  winnerId?: string;
  activeColor: Color; // Needed for wild cards
  lastAction?: string; // Description of the last move for UI logs
  version: number;
}
