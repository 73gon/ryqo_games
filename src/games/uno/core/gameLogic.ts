import { type Card, type CardType, type Color, type GameState, type Player } from './types';

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const colors: Color[] = ['red', 'blue', 'green', 'yellow'];

  colors.forEach((color) => {
    // One 0
    deck.push({ id: generateId(), color, type: 'number', value: 0 });

    // Two of 1-9
    for (let i = 1; i <= 9; i++) {
      deck.push({ id: generateId(), color, type: 'number', value: i });
      deck.push({ id: generateId(), color, type: 'number', value: i });
    }

    // Two of each action card
    ['skip', 'reverse', 'draw_two'].forEach((type) => {
      deck.push({ id: generateId(), color, type: type as CardType });
      deck.push({ id: generateId(), color, type: type as CardType });
    });
  });

  // Four Wild and Four Wild Draw Four
  for (let i = 0; i < 4; i++) {
    deck.push({ id: generateId(), color: 'black', type: 'wild' });
    deck.push({ id: generateId(), color: 'black', type: 'wild_draw_four' });
  }

  return shuffle(deck);
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const checkValidMove = (card: Card, topCard: Card, activeColor: Color): boolean => {
  if (card.color === 'black') return true; // Wild cards are always valid
  if (card.color === activeColor) return true; // Match color (use activeColor for wild resolution)
  if (card.type === topCard.type && card.type !== 'number') return true; // Match symbol
  if (card.type === 'number' && card.value === topCard.value) return true; // Match number
  return false;
};

// Handles the effect of special cards and returns the *next* player index
// Does NOT modify hand/deck, purely state calculation logic
export const handleSpecialCard = (card: Card, gameState: GameState): { nextTurnIndex: number; direction: 1 | -1; cardsToDraw: number } => {
  let { currentTurnIndex, direction, players } = gameState;
  let nextTurnIndex = currentTurnIndex;
  let cardsToDraw = 0;
  const numPlayers = players.length;

  // Function to wrap index around
  const getNextIndex = (current: number, dir: 1 | -1, steps: number = 1) => {
    return (current + dir * steps + numPlayers * steps) % numPlayers;
  };

  switch (card.type) {
    case 'reverse':
      if (numPlayers === 2) {
        // In 2 player game, reverse acts like skip
        nextTurnIndex = getNextIndex(currentTurnIndex, direction, 2); // Skip next player (which is the same as playing again)
      } else {
        direction = (direction * -1) as 1 | -1;
        nextTurnIndex = getNextIndex(currentTurnIndex, direction, 1);
      }
      break;
    case 'skip':
      nextTurnIndex = getNextIndex(currentTurnIndex, direction, 2);
      break;
    case 'draw_two':
      nextTurnIndex = getNextIndex(currentTurnIndex, direction, 2); // Skip the person drawing? Standard Uno rules: next player draws 2 and loses turn.
      cardsToDraw = 2;
      break;
    case 'wild_draw_four':
      nextTurnIndex = getNextIndex(currentTurnIndex, direction, 2); // Next player draws 4 and loses turn
      cardsToDraw = 4;
      break;
    default:
      nextTurnIndex = getNextIndex(currentTurnIndex, direction, 1);
      break;
  }

  return { nextTurnIndex, direction, cardsToDraw };
};

// Main function to play a card
export const playCard = (
  gameState: GameState,
  playerId: string,
  cardId: string,
  selectedColor?: Color, // Required for wild cards
): GameState => {
  const playerIndex = gameState.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) throw new Error('Player not found');
  if (playerIndex !== gameState.currentTurnIndex) throw new Error('Not your turn');

  const player = gameState.players[playerIndex];
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) throw new Error('Card not in hand');

  const card = player.hand[cardIndex];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  if (!checkValidMove(card, topCard, gameState.activeColor)) {
    throw new Error('Invalid move');
  }

  if ((card.type === 'wild' || card.type === 'wild_draw_four') && !selectedColor) {
    throw new Error('Must select a color for wild card');
  }

  // 1. Remove card from hand
  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1);
  const newPlayers = [...gameState.players];
  newPlayers[playerIndex] = { ...player, hand: newHand };

  // 2. Add to discard pile
  const newDiscardPile = [...gameState.discardPile, card];

  // 3. Handle card effects
  let { nextTurnIndex, direction, cardsToDraw } = handleSpecialCard(card, {
    ...gameState,
    players: newPlayers, // use updated players for length check if needed
  });

  // 4. Handle Drawing (for Draw Two / Wild Draw Four)
  // The person who *would have* played next gets the cards
  let newDeck = [...gameState.deck];

  if (cardsToDraw > 0) {
    // The "next player" (who is being skipped) is the one who draws
    // Wait, handleSpecialCard already calculated nextTurnIndex as the player AFTER the victim.
    // We need to find the victim index to give them cards.
    // Standard flow: P1 plays Draw2 -> P2 draws 2 and is skipped -> P3 plays.
    // My handleSpecialCard returns P3 as nextTurnIndex.
    // The victim is (current + direction) % num.

    const victimIndex = (gameState.currentTurnIndex + gameState.direction + newPlayers.length) % newPlayers.length;
    const victim = newPlayers[victimIndex];
    const drawnCards: Card[] = [];

    for (let i = 0; i < cardsToDraw; i++) {
      if (newDeck.length === 0) {
        // Reshuffle discard pile (except top card)
        if (newDiscardPile.length > 1) {
          const top = newDiscardPile.pop()!;
          const rest = newDiscardPile;
          newDeck = shuffle(rest);
          newDiscardPile.length = 0; // Clear it effectively
          newDiscardPile.push(top);
        } else {
          break; // No cards left
        }
      }
      if (newDeck.length > 0) {
        drawnCards.push(newDeck.pop()!);
      }
    }

    newPlayers[victimIndex] = { ...victim, hand: [...victim.hand, ...drawnCards] };
  }

  // 5. Determine Active Color
  let newActiveColor = card.color;
  if (card.color === 'black') {
    if (!selectedColor) throw new Error('Color selection required');
    newActiveColor = selectedColor;
  }

  // 6. Check Win Condition
  let winnerId = undefined;
  let status = gameState.status;
  if (newHand.length === 0) {
    winnerId = playerId;
    status = 'finished';
  }

  return {
    ...gameState,
    players: newPlayers,
    deck: newDeck,
    discardPile: newDiscardPile,
    currentTurnIndex: nextTurnIndex,
    direction,
    activeColor: newActiveColor,
    status,
    winnerId,
    lastAction: `${player.name} played ${card.color} ${card.type}`,
    version: gameState.version + 1,
  };
};

export const drawCard = (gameState: GameState, playerId: string): GameState => {
  const playerIndex = gameState.players.findIndex((p) => p.id === playerId);
  if (playerIndex !== gameState.currentTurnIndex) throw new Error('Not your turn');

  let newDeck = [...gameState.deck];
  let newDiscardPile = [...gameState.discardPile];

  if (newDeck.length === 0) {
    if (newDiscardPile.length > 1) {
      const top = newDiscardPile.pop()!;
      const rest = newDiscardPile;
      newDeck = shuffle(rest);
      newDiscardPile.length = 0;
      newDiscardPile.push(top);
    } else {
      return gameState; // Cannot draw
    }
  }

  const card = newDeck.pop()!;
  const newPlayers = [...gameState.players];
  newPlayers[playerIndex] = { ...newPlayers[playerIndex], hand: [...newPlayers[playerIndex].hand, card] };

  // Pass turn to next player
  const nextTurnIndex = (gameState.currentTurnIndex + gameState.direction + newPlayers.length) % newPlayers.length;

  return {
    ...gameState,
    deck: newDeck,
    discardPile: newDiscardPile,
    players: newPlayers,
    currentTurnIndex: nextTurnIndex,
    lastAction: `${newPlayers[playerIndex].name} drew a card`,
    version: gameState.version + 1,
  };
};

export const startGame = (roomId: string, players: Player[]): GameState => {
  let deck = createDeck();

  // Deal 7 cards to each player
  const startedPlayers = players.map((p) => {
    const hand: Card[] = [];
    for (let i = 0; i < 7; i++) {
      if (deck.length > 0) hand.push(deck.pop()!);
    }
    return { ...p, hand };
  });

  // Flip top card
  let firstCard = deck.pop()!;
  while (firstCard.color === 'black') {
    // Reshuffle if first card is wild (optional rule, but easier)
    deck.push(firstCard);
    deck = shuffle(deck);
    firstCard = deck.pop()!;
  }

  return {
    roomId,
    players: startedPlayers,
    deck,
    discardPile: [firstCard],
    currentTurnIndex: 0,
    direction: 1,
    status: 'playing',
    activeColor: firstCard.color,
    version: 1,
  };
};
