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

  const normalizeHand = (value: unknown): Card[] => {
    if (Array.isArray(value)) return value as Card[];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed as Card[];
      } catch {
        return [];
      }
    }
    return [];
  };

  const normalizePlayers = (value: unknown, fallback: Player[] = []): Player[] => {
    if (Array.isArray(value)) {
      return (value as Player[]).map((player) => ({
        ...player,
        hand: normalizeHand(player.hand),
      }));
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return (parsed as Player[]).map((player) => ({
            ...player,
            hand: normalizeHand(player.hand),
          }));
        }
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const normalizeGameState = (value: unknown, roomId: string, fallback: GameState | null): GameState | null => {
    if (!value) return fallback;
    const parsed = typeof value === 'string' ? (() => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    })() : value;
    if (!parsed || typeof parsed !== 'object') return fallback;
    const state = parsed as GameState;
    return {
      ...state,
      roomId: state.roomId ?? roomId,
      players: normalizePlayers(state.players, fallback?.players ?? []),
      deck: Array.isArray(state.deck) ? state.deck : [],
      discardPile: Array.isArray(state.discardPile) ? state.discardPile : [],
    };
  };

  // Initialize Player ID
  useEffect(() => {
    let storedId = sessionStorage.getItem('uno_player_id');
    let storedName = localStorage.getItem('uno_player_name');

    if (!storedId) {
      storedId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem('uno_player_id', storedId);
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
    if (!playerId) return toast.error('Player is still initializing. Please try again.');
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
    if (!playerId) return toast.error('Player is still initializing. Please try again.');
    setIsLoading(true);

    const player: Player = {
      id: playerId,
      name: playerName,
      hand: [],
      isHost: false,
    };

    const result = await Supabase.joinRoom(code, player);
    if (result.success) {
      connectToRoom(code);
      // Fetch initial state immediately
      const data = await Supabase.getRoom(code);
      if (data) {
        // If game hasn't started, construct a lobby state
        if (data.status === 'waiting') {
          setGameState({
            roomId: code,
            players: normalizePlayers(data.players),
            deck: [],
            discardPile: [],
            currentTurnIndex: 0,
            direction: 1,
            status: 'waiting',
            activeColor: 'red',
            version: 0,
          });
        } else {
          const nextState = normalizeGameState(data.gameState, code, null);
          if (nextState) {
            setGameState(nextState);
          } else {
            toast.error('Room state is unavailable.');
          }
        }
      }
    } else {
      toast.error(result.error || 'Failed to join room. Check code or room might be full/started.');
    }
    setIsLoading(false);
  };

  const connectToRoom = (code: string) => {
    if (subscriptionRef.current) subscriptionRef.current();

    subscriptionRef.current = Supabase.subscribeToRoom(code, (payload) => {
      // payload is the Row from uno_rooms table
      // We care about 'game_state' and 'players' and 'status'
      if (!payload) return;
      setGameState((prev) => {
        const status = payload.status ?? prev?.status;
        const nextState = normalizeGameState(payload.game_state, code, prev);

        if (status === 'waiting' || (!status && prev?.status === 'waiting')) {
          const players = normalizePlayers(payload.players, prev?.players ?? []);
          if (!prev) {
            return {
              roomId: payload.id ?? code,
              players,
              deck: [],
              discardPile: [],
              currentTurnIndex: 0,
              direction: 1,
              status: 'waiting',
              activeColor: 'red',
              version: 0,
            };
          }
          return {
            ...prev,
            players,
            status: 'waiting',
          };
        }

        if (status === 'playing' || status === 'finished') {
          return nextState ?? prev;
        }

        return nextState ?? prev;
      });
    });
  };

  useEffect(() => {
    if (!gameState || gameState.status !== 'waiting') return;
    const roomId = gameState.roomId;
    let isActive = true;

    const refreshRoom = async () => {
      const data = await Supabase.getRoom(roomId);
      if (!data || !isActive) return;
      setGameState((prev) => {
        if (data.status === 'waiting') {
          const players = normalizePlayers(data.players, prev?.players ?? []);
          if (!prev) {
            return {
              roomId,
              players,
              deck: [],
              discardPile: [],
              currentTurnIndex: 0,
              direction: 1,
              status: 'waiting',
              activeColor: 'red',
              version: 0,
            };
          }
          return {
            ...prev,
            players,
            status: 'waiting',
          };
        }

        return normalizeGameState(data.gameState, roomId, prev) ?? prev;
      });
    };

    refreshRoom();
    const intervalId = window.setInterval(refreshRoom, 3000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [gameState?.roomId, gameState?.status]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    if (gameState.discardPile.length === 0) return;
    const me = gameState.players.find((player) => player.id === playerId);
    if (!me || me.hand.length > 0) return;

    let isActive = true;
    const refreshRoom = async () => {
      const data = await Supabase.getRoom(gameState.roomId);
      if (!data || !isActive) return;
      const nextState = normalizeGameState(data.gameState, gameState.roomId, gameState);
      if (nextState) setGameState(nextState);
    };

    refreshRoom();
    return () => {
      isActive = false;
    };
  }, [gameState?.roomId, gameState?.status, gameState?.version, gameState?.discardPile.length, playerId]);

  const startGame = async () => {
    if (!gameState || !gameState.players) return;
    if (gameState.players.length < 2) return toast.error('Need at least 2 players to start');
    setIsLoading(true);
    try {
      const newState = logicStartGame(gameState.roomId, gameState.players);
      setGameState(newState);
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
      if (data) setGameState(normalizeGameState(data.gameState, gameState.roomId, gameState) ?? gameState);
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
