import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseClient, hasSupabaseConfig, LEADERBOARD_TABLE, type TetrisScoreRow } from '@/lib/supabaseClient';

// Simple profanity filter to avoid bad-words CommonJS issues
const PROFANITY_LIST = [
  'fuck',
  'shit',
  'ass',
  'bitch',
  'damn',
  'crap',
  'dick',
  'cock',
  'pussy',
  'cunt',
  'bastard',
  'slut',
  'whore',
  'nigger',
  'faggot',
  'retard',
];
const profanityRegex = new RegExp(`\\b(${PROFANITY_LIST.join('|')})\\b`, 'gi');
const profanityFilter = {
  isProfane: (text: string): boolean => profanityRegex.test(text),
  clean: (text: string): string => text.replace(profanityRegex, '****'),
};

const getCurrentWeekStartIso = () => {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  now.setUTCHours(0, 0, 0, 0);
  now.setUTCDate(now.getUTCDate() - daysSinceMonday);
  return now.toISOString();
};

export const useTetrisLeaderboard = () => {
  const supabase = supabaseClient;
  const [leaderboard, setLeaderboard] = useState<TetrisScoreRow[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<TetrisScoreRow[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);

  const weekStartLabel = useMemo(() => {
    const weekStart = new Date(getCurrentWeekStartIso());
    return weekStart.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!supabase) {
      setLeaderboardError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable the leaderboard.');
      setLeaderboard([]);
      setAllTimeLeaderboard([]);
      return;
    }
    setLeaderboardLoading(true);
    setLeaderboardError(null);

    // Fetch weekly leaderboard
    const weekStartIso = getCurrentWeekStartIso();
    const { data: weeklyData, error: weeklyError } = await supabase
      .from(LEADERBOARD_TABLE)
      .select('id, name, score, created_at')
      .gte('created_at', weekStartIso)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);

    // Fetch all-time leaderboard
    const { data: allTimeData, error: allTimeError } = await supabase
      .from(LEADERBOARD_TABLE)
      .select('id, name, score, created_at')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);

    if (weeklyError) {
      setLeaderboardError(weeklyError.message);
      setLeaderboard([]);
    } else {
      setLeaderboard(weeklyData ?? []);
    }

    if (allTimeError) {
      // Don't overwrite weekly error, just log
      console.error('All-time leaderboard error:', allTimeError.message);
    } else {
      setAllTimeLeaderboard(allTimeData ?? []);
    }

    setLeaderboardLoading(false);
  }, [supabase]);

  const handleSubmitScore = useCallback(async () => {
    if (!pendingScore || submittingScore) return;
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setLeaderboardError('Please enter a name to submit your score.');
      return;
    }

    // Check for profanity
    if (profanityFilter.isProfane(trimmedName)) {
      setLeaderboardError('Please choose a different name.');
      return;
    }

    if (!supabase) {
      setLeaderboardError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
      return;
    }

    setSubmittingScore(true);
    setLeaderboardError(null);

    const sanitizedName = profanityFilter.clean(trimmedName).slice(0, 24);
    const { data, error } = await supabase.from(LEADERBOARD_TABLE).insert({ name: sanitizedName, score: pendingScore }).select('id').single();

    if (error) {
      setLeaderboardError(error.message);
    } else {
      setLastSubmittedId(data?.id ?? null);
      setPendingScore(null);
      fetchLeaderboard();
    }
    setSubmittingScore(false);
  }, [fetchLeaderboard, pendingScore, playerName, submittingScore, supabase]);

  const markGameOverScore = useCallback((score: number) => {
    setPendingScore(score > 0 ? score : null);
    setLastSubmittedId(null);
  }, []);

  const resetLeaderboardState = useCallback(() => {
    setPlayerName('');
    setPendingScore(null);
    setLastSubmittedId(null);
    setLeaderboardError(null);
    setSubmittingScore(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    allTimeLeaderboard,
    leaderboardLoading,
    leaderboardError,
    playerName,
    pendingScore,
    submittingScore,
    lastSubmittedId,
    hasSupabaseConfig,
    weekStartLabel,
    setPlayerName,
    handleSubmitScore,
    markGameOverScore,
    resetLeaderboardState,
    fetchLeaderboard,
  };
};
