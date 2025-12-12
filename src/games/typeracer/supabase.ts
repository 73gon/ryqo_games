// Supabase integration for TypeRacer multiplayer

import { supabaseClient, hasSupabaseConfig } from '@/lib/supabaseClient';
import type { RaceRoom, Player } from './types';
import { RACE_TEXTS } from './constants';

const ROOMS_TABLE = 'typeracer_rooms';

// Generate a short unique room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Generate a unique player ID
export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get a random race text
export function getRandomText(): string {
  return RACE_TEXTS[Math.floor(Math.random() * RACE_TEXTS.length)];
}

// Create a new race room
export async function createRoom(hostId: string, hostName: string): Promise<RaceRoom | null> {
  if (!supabaseClient || !hasSupabaseConfig) return null;

  const roomId = generateRoomCode();
  const text = getRandomText();

  const room: RaceRoom = {
    id: roomId,
    hostId,
    text,
    status: 'waiting',
    players: [{
      id: hostId,
      name: hostName,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
    }],
    createdAt: Date.now(),
  };

  const { error } = await supabaseClient
    .from(ROOMS_TABLE)
    .insert({
      id: roomId,
      host_id: hostId,
      text,
      status: 'waiting',
      players: room.players,
      created_at: new Date(room.createdAt).toISOString(),
    });

  if (error) {
    console.error('Error creating room:', error);
    return null;
  }

  return room;
}

// Join an existing room
export async function joinRoom(roomId: string, playerId: string, playerName: string): Promise<RaceRoom | null> {
  if (!supabaseClient || !hasSupabaseConfig) return null;

  // First get the current room
  const { data: roomData, error: fetchError } = await supabaseClient
    .from(ROOMS_TABLE)
    .select('*')
    .eq('id', roomId.toUpperCase())
    .single();

  if (fetchError || !roomData) {
    console.error('Error fetching room:', fetchError);
    return null;
  }

  if (roomData.status !== 'waiting') {
    console.error('Room is not accepting new players');
    return null;
  }

  const players: Player[] = roomData.players || [];
  
  // Check if player already in room
  if (!players.find(p => p.id === playerId)) {
    players.push({
      id: playerId,
      name: playerName,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
    });

    const { error: updateError } = await supabaseClient
      .from(ROOMS_TABLE)
      .update({ players })
      .eq('id', roomId.toUpperCase());

    if (updateError) {
      console.error('Error joining room:', updateError);
      return null;
    }
  }

  return {
    id: roomData.id,
    hostId: roomData.host_id,
    text: roomData.text,
    status: roomData.status,
    startTime: roomData.start_time ? new Date(roomData.start_time).getTime() : undefined,
    players,
    createdAt: new Date(roomData.created_at).getTime(),
  };
}

// Update player progress
export async function updatePlayerProgress(
  roomId: string,
  playerId: string,
  progress: number,
  wpm: number,
  accuracy: number,
  finished: boolean
): Promise<void> {
  if (!supabaseClient || !hasSupabaseConfig) return;

  const { data: roomData, error: fetchError } = await supabaseClient
    .from(ROOMS_TABLE)
    .select('players')
    .eq('id', roomId)
    .single();

  if (fetchError || !roomData) return;

  const players: Player[] = roomData.players || [];
  const playerIndex = players.findIndex(p => p.id === playerId);
  
  if (playerIndex >= 0) {
    players[playerIndex] = {
      ...players[playerIndex],
      progress,
      wpm,
      accuracy,
      finished,
      finishedAt: finished ? Date.now() : undefined,
    };

    await supabaseClient
      .from(ROOMS_TABLE)
      .update({ players })
      .eq('id', roomId);
  }
}

// Start the race
export async function startRace(roomId: string): Promise<boolean> {
  if (!supabaseClient || !hasSupabaseConfig) return false;

  const { error } = await supabaseClient
    .from(ROOMS_TABLE)
    .update({ 
      status: 'countdown',
      start_time: new Date(Date.now() + 3000).toISOString(),
    })
    .eq('id', roomId);

  return !error;
}

// Subscribe to room updates
export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: RaceRoom) => void
): (() => void) | null {
  if (!supabaseClient || !hasSupabaseConfig) return null;

  const channel = supabaseClient
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: ROOMS_TABLE,
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        const data = payload.new as any;
        if (data) {
          onUpdate({
            id: data.id,
            hostId: data.host_id,
            text: data.text,
            status: data.status,
            startTime: data.start_time ? new Date(data.start_time).getTime() : undefined,
            players: data.players || [],
            createdAt: new Date(data.created_at).getTime(),
          });
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// Get room by ID
export async function getRoom(roomId: string): Promise<RaceRoom | null> {
  if (!supabaseClient || !hasSupabaseConfig) return null;

  const { data, error } = await supabaseClient
    .from(ROOMS_TABLE)
    .select('*')
    .eq('id', roomId.toUpperCase())
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    hostId: data.host_id,
    text: data.text,
    status: data.status,
    startTime: data.start_time ? new Date(data.start_time).getTime() : undefined,
    players: data.players || [],
    createdAt: new Date(data.created_at).getTime(),
  };
}

// Update room status
export async function updateRoomStatus(roomId: string, status: RaceRoom['status']): Promise<void> {
  if (!supabaseClient || !hasSupabaseConfig) return;

  await supabaseClient
    .from(ROOMS_TABLE)
    .update({ status })
    .eq('id', roomId);
}

export { hasSupabaseConfig };
