// Multiplayer hook for TypeRacer

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RaceRoom } from '../types';
import { generatePlayerId, createRoom, joinRoom, subscribeToRoom, updatePlayerProgress, startRace, hasSupabaseConfig } from '../supabase';
import { COUNTDOWN_SECONDS } from '../constants';

interface UseMultiplayerProps {
  onRaceStart?: () => void;
  onCountdownStart?: () => void;
  onCountdownTick?: (count: number) => void;
}

interface UseMultiplayerReturn {
  playerId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
  room: RaceRoom | null;
  isHost: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  countdown: number | null;
  createNewRoom: () => Promise<boolean>;
  joinExistingRoom: (roomId: string) => Promise<boolean>;
  startTheRace: () => Promise<boolean>;
  updateProgress: (progress: number, wpm: number, accuracy: number, finished: boolean) => void;
  leaveRoom: () => void;
  hasSupabaseConfig: boolean;
}

export function useMultiplayer({ onRaceStart, onCountdownStart, onCountdownTick }: UseMultiplayerProps = {}): UseMultiplayerReturn {
  const [playerId] = useState(() => {
    const saved = localStorage.getItem('typeracer_player_id');
    if (saved) return saved;
    const newId = generatePlayerId();
    localStorage.setItem('typeracer_player_id', newId);
    return newId;
  });

  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('typeracer_player_name') || `Player${Math.floor(Math.random() * 1000)}`;
  });

  const [room, setRoom] = useState<RaceRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownStartedRef = useRef(false);
  const raceStartedRef = useRef(false);

  const isHost = room?.hostId === playerId;
  const isConnected = !!room;

  // Save player name to localStorage
  useEffect(() => {
    localStorage.setItem('typeracer_player_name', playerName);
  }, [playerName]);

  // Handle room updates
  const handleRoomUpdate = useCallback(
    (updatedRoom: RaceRoom) => {
      setRoom(updatedRoom);

      // Handle countdown start - only start once
      if (updatedRoom.status === 'countdown' && updatedRoom.startTime && !countdownStartedRef.current) {
        countdownStartedRef.current = true;

        // Notify that countdown is starting (switch to racing screen)
        onCountdownStart?.();

        const startCountdown = () => {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }

          const tick = () => {
            const now = Date.now();
            const timeUntilStart = updatedRoom.startTime! - now;
            const secondsLeft = Math.ceil(timeUntilStart / 1000);

            if (secondsLeft <= 0 && !raceStartedRef.current) {
              raceStartedRef.current = true;
              setCountdown(0);
              onCountdownTick?.(0);
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              // Longer delay to show "GO!" properly (1 second)
              setTimeout(() => {
                setCountdown(null);
                onRaceStart?.();
              }, 1000);
            } else if (secondsLeft > 0) {
              setCountdown(Math.min(secondsLeft, COUNTDOWN_SECONDS));
              onCountdownTick?.(secondsLeft);
            }
          };

          tick();
          countdownIntervalRef.current = setInterval(tick, 100);
        };

        startCountdown();
      }
    },
    [onRaceStart, onCountdownStart, onCountdownTick],
  );

  // Subscribe to room updates when room changes
  useEffect(() => {
    if (!room?.id || !hasSupabaseConfig) return;

    unsubscribeRef.current = subscribeToRoom(room.id, handleRoomUpdate);

    return () => {
      unsubscribeRef.current?.();
    };
  }, [room?.id, handleRoomUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const createNewRoom = useCallback(async (): Promise<boolean> => {
    if (!hasSupabaseConfig) {
      setError('Multiplayer requires Supabase configuration');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newRoom = await createRoom(playerId, playerName);
      if (newRoom) {
        setRoom(newRoom);
        return true;
      } else {
        setError('Failed to create room');
        return false;
      }
    } catch (err) {
      setError('Error creating room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [playerId, playerName]);

  const joinExistingRoom = useCallback(
    async (roomId: string): Promise<boolean> => {
      if (!hasSupabaseConfig) {
        setError('Multiplayer requires Supabase configuration');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const joinedRoom = await joinRoom(roomId, playerId, playerName);
        if (joinedRoom) {
          setRoom(joinedRoom);
          return true;
        } else {
          setError('Room not found or race already started');
          return false;
        }
      } catch (err) {
        setError('Error joining room');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [playerId, playerName],
  );

  const startTheRace = useCallback(async (): Promise<boolean> => {
    if (!room || !isHost) return false;

    setIsLoading(true);
    try {
      const success = await startRace(room.id);
      if (!success) {
        setError('Failed to start race');
      }
      return success;
    } catch (err) {
      setError('Error starting race');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost]);

  const updateProgress = useCallback(
    (progress: number, wpm: number, accuracy: number, finished: boolean) => {
      if (!room) return;
      updatePlayerProgress(room.id, playerId, progress, wpm, accuracy, finished);
    },
    [room, playerId],
  );

  const leaveRoom = useCallback(() => {
    unsubscribeRef.current?.();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    countdownStartedRef.current = false;
    raceStartedRef.current = false;
    setRoom(null);
    setCountdown(null);
    setError(null);
  }, []);

  return {
    playerId,
    playerName,
    setPlayerName,
    room,
    isHost,
    isConnected,
    isLoading,
    error,
    countdown,
    createNewRoom,
    joinExistingRoom,
    startTheRace,
    updateProgress,
    leaveRoom,
    hasSupabaseConfig,
  };
}

// Hook to check for room ID in URL
export function useRoomFromUrl(): string | null {
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setRoomId(room.toUpperCase());
    }
  }, []);

  return roomId;
}
