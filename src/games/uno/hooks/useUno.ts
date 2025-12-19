import { useState, useEffect, useRef } from 'react';
import { type GameState, type Player, type Card, type Color } from '../core/types';
import { playCard as logicPlayCard, drawCard as logicDrawCard, startGame as logicStartGame } from '../core/gameLogic';
import * as Supabase from '../supabase';
import { toast } from 'sonner';

export const useUno = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Initialize Player ID
  useEffect(() => {
    let storedId = localStorage.getItem('uno_player_id');
    let storedName = localStorage.getItem('uno_player_name');

    if (!storedId) {
      storedId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      localStorage.setItem('uno_player_id', storedId);
    }

    setPlayerId(storedId);
    if (storedName) setPlayerName(storedName);
  }, []);

  const savePlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('uno_player_name', name);
  };

  const createGame = async () => {
    if (!playerName) return toast.error('Please enter your name');
    setIsLoading(true);

    const host: Player = {
      id: playerId,
      name: playerName,
      hand: [],
      isHost: true,
    };

    const newRoomId = await Supabase.createRoom(host);
    if (newRoomId) {
      // Initial state for lobby
      setGameState({
        roomId: newRoomId,
        players: [host],
        deck: [],
        discardPile: [],
        currentTurnIndex: 0,
        direction: 1,
        status: 'waiting',
        activeColor: 'red', // placeholder
        version: 0,
      });
      connectToRoom(newRoomId);
    } else {
      toast.error('Failed to create room');
    }
    setIsLoading(false);
  };

  const joinGame = async (code: string) => {
    if (!playerName) return toast.error('Please enter your name');
    setIsLoading(true);

    const player: Player = {
      id: playerId,
      name: playerName,
      hand: [],
      isHost: false,
    };

    const success = await Supabase.joinRoom(code, player);
    if (success) {
      connectToRoom(code);
      // Fetch initial state immediately
      const data = await Supabase.getRoom(code);
      if (data) {
        // If game hasn't started, construct a lobby state
        if (data.status === 'waiting') {
          setGameState({
            roomId: code,
            players: data.players,
            deck: [],
            discardPile: [],
            currentTurnIndex: 0,
            direction: 1,
            status: 'waiting',
            activeColor: 'red',
            version: 0,
          });
        } else {
          setGameState(data.gameState);
        }
      }
    } else {
      toast.error('Failed to join room. Check code or room might be full/started.');
    }
    setIsLoading(false);
  };

  const connectToRoom = (code: string) => {
    if (subscriptionRef.current) subscriptionRef.current();

    subscriptionRef.current = Supabase.subscribeToRoom(code, (payload) => {
      // payload is the Row from uno_rooms table
      // We care about 'game_state' and 'players' and 'status'
      if (payload.status === 'waiting') {
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                players: payload.players,
                status: 'waiting',
              }
            : null,
        );
      } else {
        setGameState(payload.game_state);
      }
    });
  };

  const startGame = async () => {
    if (!gameState || !gameState.players) return;
    setIsLoading(true);
    try {
      const newState = logicStartGame(gameState.roomId, gameState.players);
      await Supabase.updateGameState(gameState.roomId, newState);
    } catch (e) {
      console.error(e);
      toast.error('Failed to start game');
    }
    setIsLoading(false);
  };

  const playCard = async (card: Card, selectedColor?: Color) => {
    if (!gameState) return;
    try {
      const newState = logicPlayCard(gameState, playerId, card.id, selectedColor);
      // Optimistic update
      setGameState(newState);
      await Supabase.updateGameState(gameState.roomId, newState);
    } catch (e: any) {
      toast.error(e.message);
      // Revert optimistic update?
      // We rely on subscription to fix it if we didn't update local state yet,
      // but here we updated local state.
      // Ideally we'd fetch fresh state on error.
      const data = await Supabase.getRoom(gameState.roomId);
      if (data) setGameState(data.gameState);
    }
  };

  const drawCard = async () => {
    if (!gameState) return;
    try {
      const newState = logicDrawCard(gameState, playerId);
      setGameState(newState);
      await Supabase.updateGameState(gameState.roomId, newState);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const leaveGame = () => {
    if (subscriptionRef.current) subscriptionRef.current();
    setGameState(null);
    // Ideally remove player from DB if lobby
  };

  return {
    gameState,
    playerId,
    playerName,
    setPlayerName: savePlayerName,
    createGame,
    joinGame,
    startGame,
    playCard,
    drawCard,
    leaveGame,
    isLoading,
  };
};
