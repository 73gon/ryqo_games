import { supabaseClient, hasSupabaseConfig } from '@/lib/supabaseClient';
import { type GameState, type Player } from './core/types';

const TABLE_NAME = 'uno_rooms';

const parsePlayers = (value: unknown): Player[] => {
  if (Array.isArray(value)) return value as Player[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as Player[];
    } catch {
      return [];
    }
  }
  return [];
};

export const subscribeToRoom = (roomId: string, callback: (payload: any) => void) => {
  if (!supabaseClient || !hasSupabaseConfig) return null;

  const channel = supabaseClient
    .channel(`uno_room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE_NAME,
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        callback(payload.new);
      },
    )
    .subscribe();

  return () => {
    supabaseClient?.removeChannel(channel);
  };
};

export const createRoom = async (host: Player): Promise<string | null> => {
  if (!supabaseClient || !hasSupabaseConfig) return null;

  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabaseClient.from(TABLE_NAME).insert({
    id: roomId,
    host_id: host.id,
    status: 'waiting',
    players: [host],
    game_state: {},
  });

  if (error) {
    console.error('Error creating room:', error);
    return null;
  }
  return roomId;
};

export const joinRoom = async (
  roomId: string,
  player: Player,
): Promise<{ success: boolean; reason?: 'already_joined'; error?: string }> => {
  if (!supabaseClient || !hasSupabaseConfig) return { success: false, error: 'Supabase is not configured' };

  // Fetch current players
  const { data, error } = await supabaseClient.from(TABLE_NAME).select('players, status').eq('id', roomId).single();

  if (error || !data) {
    console.error('Error fetching room for join:', error);
    return { success: false, error: error?.message ?? 'Room not found' };
  }
  if (data.status !== 'waiting') {
    return { success: false, error: 'Game already started' };
  }

  const currentPlayers = parsePlayers(data.players);
  if (currentPlayers.find((p) => p.id === player.id)) {
    return { success: true, reason: 'already_joined' }; // Already joined
  }

  const updatedPlayers = [...currentPlayers, player];

  const { error: updateError } = await supabaseClient.from(TABLE_NAME).update({ players: updatedPlayers }).eq('id', roomId);

  if (updateError) {
    console.error('Error joining room:', updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true };
};

export const updateGameState = async (roomId: string, gameState: GameState) => {
  if (!supabaseClient || !hasSupabaseConfig) return;

  // We update both the top-level status/players columns AND the jsonb game_state
  // This redundancy helps with querying but we need to ensure consistency.
  // Actually, let's keep it simple: players column is for lobby, game_state is for active game.
  // When game starts, we might want to sync players to game_state.players.

  // For now, update everything that matters.
  const { error } = await supabaseClient
    .from(TABLE_NAME)
    .update({
      game_state: gameState,
      status: gameState.status,
      players: gameState.players, // Keep this synced
    })
    .eq('id', roomId);

  if (error) console.error('Error updating game state:', error);
};

export const getRoom = async (roomId: string): Promise<{ players: Player[]; gameState: GameState; hostId: string; status: string } | null> => {
  if (!supabaseClient || !hasSupabaseConfig) return null;

  const { data, error } = await supabaseClient.from(TABLE_NAME).select('*').eq('id', roomId).single();

  if (error || !data) return null;

  return {
    players: data.players,
    gameState: data.game_state,
    hostId: data.host_id,
    status: data.status,
  };
};
