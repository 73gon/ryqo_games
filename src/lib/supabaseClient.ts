import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as
  | string
  | undefined
export const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const hasSupabaseConfig = Boolean(
  supabaseUrl && supabasePublishableKey,
)

export const supabaseClient = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: { persistSession: false },
    })
  : null

export const LEADERBOARD_TABLE = 'tetris_scores'

export interface TetrisScoreRow {
  id: string
  name: string
  score: number
  created_at: string
}
