import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, RotateCcw, Pause } from 'lucide-react'
import { Kbd } from '@/components/ui/kbd'
import { TetrisCore, type TetrisGameHandle } from './tetris_core'
import ElectricBorder from '@/components/ElectricBorder'
import { Input } from '@/components/ui/input'
import {
  supabaseClient,
  hasSupabaseConfig,
  LEADERBOARD_TABLE,
  type TetrisScoreRow,
} from '@/lib/supabaseClient'

const getCurrentWeekStartIso = () => {
  const now = new Date()
  const day = now.getUTCDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1
  now.setUTCHours(0, 0, 0, 0)
  now.setUTCDate(now.getUTCDate() - daysSinceMonday)
  return now.toISOString()
}

export function TetrisGame() {
  const { t } = useTranslation()
  const gameRef = useRef<TetrisGameHandle>(null)
  const hasStartedRef = useRef(false)
  const scoreRef = useRef(0)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [startLevel, setStartLevel] = useState<number>(() => {
    const saved = localStorage.getItem('tetrisStartLevel')
    const parsed = saved ? parseInt(saved, 10) : 1
    return Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 1), 15)
  })
  const [leaderboard, setLeaderboard] = useState<TetrisScoreRow[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [pendingScore, setPendingScore] = useState<number | null>(null)
  const [submittingScore, setSubmittingScore] = useState(false)
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null)
  const supabase = supabaseClient
  const weekStartLabel = useMemo(() => {
    const weekStart = new Date(getCurrentWeekStartIso())
    return weekStart.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }, [])

  const fetchLeaderboard = useCallback(async () => {
    if (!supabase) {
      setLeaderboardError(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable the leaderboard.',
      )
      setLeaderboard([])
      return
    }
    setLeaderboardLoading(true)
    setLeaderboardError(null)
    const weekStartIso = getCurrentWeekStartIso()
    const { data, error } = await supabase
      .from(LEADERBOARD_TABLE)
      .select('id, name, score, created_at')
      .gte('created_at', weekStartIso)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) {
      setLeaderboardError(error.message)
      setLeaderboard([])
    } else {
      setLeaderboard(data ?? [])
    }
    setLeaderboardLoading(false)
  }, [supabase])

  const resetGameState = () => {
    setGameOver(false)
    setScore(0)
    scoreRef.current = 0
    setLines(0)
    setLevel(startLevel)
    setPlayerName('')
    setPendingScore(null)
    setLastSubmittedId(null)
    setLeaderboardError(null)
    setSubmittingScore(false)
  }

  const handleScoreChange = (newScore: number) => {
    setScore(newScore)
    scoreRef.current = newScore
  }

  const handleLinesChange = (newLines: number) => {
    setLines(newLines)
  }

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel)
  }

  const handleGameOver = () => {
    hasStartedRef.current = false
    setGameOver(true)
    setIsPlaying(false)
    const currentScore = scoreRef.current
    setPendingScore(currentScore > 0 ? currentScore : null)
    setLastSubmittedId(null)
  }

  const handleStateChange = (playing: boolean) => {
    setIsPlaying(playing)
  }

  const handleSubmitScore = async () => {
    if (!pendingScore || submittingScore) return
    const trimmedName = playerName.trim()
    if (!trimmedName) {
      setLeaderboardError('Please enter a name to submit your score.')
      return
    }
    if (!supabase) {
      setLeaderboardError(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
      )
      return
    }

    setSubmittingScore(true)
    setLeaderboardError(null)

    const sanitizedName = trimmedName.slice(0, 24)
    const { data, error } = await supabase
      .from(LEADERBOARD_TABLE)
      .insert({ name: sanitizedName, score: pendingScore })
      .select('id')
      .single()

    if (error) {
      setLeaderboardError(error.message)
    } else {
      setLastSubmittedId(data?.id ?? null)
      setPendingScore(null)
      fetchLeaderboard()
    }
    setSubmittingScore(false)
  }

  useEffect(() => {
    localStorage.setItem('tetrisStartLevel', startLevel.toString())
  }, [startLevel])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  useEffect(() => {
    if (!isPlaying && !gameOver && !hasStartedRef.current) {
      setLevel(startLevel)
    }
  }, [startLevel, isPlaying, gameOver])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'Space'
      ) {
        e.preventDefault()
      }

      if (!isPlaying || gameOver) {
        if (e.code === 'Enter') {
          e.preventDefault()
          if (gameOver || !hasStartedRef.current) {
            hasStartedRef.current = true
            resetGameState()
            gameRef.current?.startGame()
          } else {
            gameRef.current?.resumeGame()
          }
        }
        return
      }

      switch (e.code) {
        case 'Enter':
          e.preventDefault()
          if (isPlaying) gameRef.current?.stopGame()
          else gameRef.current?.resumeGame()
          break
        case 'ArrowLeft':
          gameRef.current?.moveLeft(true)
          break
        case 'ArrowRight':
          gameRef.current?.moveRight(true)
          break
        case 'ArrowDown':
          gameRef.current?.moveDown(true)
          break
        case 'ArrowUp':
        case 'KeyX':
          e.preventDefault()
          gameRef.current?.rotate()
          break
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          e.preventDefault()
          gameRef.current?.holdPiece()
          break
        case 'Space':
          e.preventDefault()
          gameRef.current?.hardDrop()
          break
        case 'KeyP':
          e.preventDefault()
          if (isPlaying) {
            gameRef.current?.stopGame()
          } else {
            if (gameOver || !hasStartedRef.current) {
              hasStartedRef.current = true
              resetGameState()
              gameRef.current?.startGame()
            } else {
              gameRef.current?.resumeGame()
            }
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') {
        gameRef.current?.moveLeft(false)
      } else if (e.code === 'ArrowRight') {
        gameRef.current?.moveRight(false)
      } else if (e.code === 'ArrowDown') {
        gameRef.current?.moveDown(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPlaying, gameOver])

  const controls = (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
            {t('games.common.score')}
          </span>
          <span className="font-mono font-bold text-2xl tabular-nums leading-none">
            {score.toString().padStart(6, '0')}
          </span>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
            Lines
          </span>
          <span className="font-mono font-bold text-2xl tabular-nums leading-none">
            {lines.toString().padStart(3, '0')}
          </span>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
            Level
          </span>
          <span className="font-mono font-bold text-2xl tabular-nums leading-none">
            {level.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <Button
        onClick={() => {
          if (isPlaying) {
            gameRef.current?.stopGame()
          } else if (gameOver) {
            hasStartedRef.current = true
            resetGameState()
            gameRef.current?.startGame()
          } else {
            if (!hasStartedRef.current) {
              hasStartedRef.current = true
              resetGameState()
              gameRef.current?.startGame()
            } else {
              gameRef.current?.resumeGame()
            }
          }
        }}
        variant={isPlaying ? 'destructive' : 'default'}
        className="h-11"
      >
        {gameOver ? (
          <>
            <RotateCcw className="mr-2 h-5 w-5" />
            <span className="font-bold">{t('games.common.restart')}</span>
          </>
        ) : isPlaying ? (
          <>
            <Pause className="mr-2 h-5 w-5" />
            <span className="font-bold">Pause</span>
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            <span className="font-bold">{t('games.common.start')}</span>
          </>
        )}
      </Button>
    </div>
  )

  return (
    <GameLayout controls={controls}>
      <div className="flex items-start justify-center gap-8 w-full">
        <div className="flex-1 max-w-md" />

        <div className="flex flex-col items-center gap-6">
          <TetrisCore
            ref={gameRef}
            startLevel={startLevel}
            onScoreChange={handleScoreChange}
            onLinesChange={handleLinesChange}
            onLevelChange={handleLevelChange}
            onGameOver={handleGameOver}
            onGameRestart={() => {
              resetGameState()
            }}
            onStateChange={handleStateChange}
          />

          <div className="flex flex-col gap-4 w-full max-w-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Start Level</label>
                <span className="text-sm text-muted-foreground">
                  {startLevel}
                </span>
              </div>
              <Slider
                value={[startLevel]}
                onValueChange={(v) => setStartLevel(v[0])}
                min={1}
                max={15}
                step={1}
                disabled={isPlaying}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold">
                {t('games.common.controls.move')}
              </span>
              <div className="flex gap-1">
                <Kbd>Left</Kbd>
                <Kbd>Right</Kbd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold">
                Soft Drop
              </span>
              <Kbd>Down</Kbd>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold">
                Hard Drop
              </span>
              <Kbd>{t('kbd.space')}</Kbd>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold">
                Rotate
              </span>
              <Kbd>Up</Kbd>
              <span className="text-xs text-muted-foreground">or</span>
              <Kbd>X</Kbd>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold">
                Hold
              </span>
              <Kbd>C</Kbd>
              <span className="text-xs text-muted-foreground">or</span>
              <Kbd>Shift</Kbd>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold">
                Pause
              </span>
              <Kbd>P</Kbd>
              <span className="text-xs text-muted-foreground">or</span>
              <Kbd>enter</Kbd>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold">
                Start/Resume
              </span>
              <Kbd>Enter</Kbd>
            </div>
          </div>

          {gameOver && (
            <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
              <div className="text-5xl font-black text-destructive animate-bounce">
                {t('games.common.gameOver')}
              </div>
              <div className="text-sm text-muted-foreground animate-pulse">
                Press Enter or click Play to restart
              </div>
            </div>
          )}
        </div>

        <div className="w-72 mt-2 shrink-0 space-y-3">
          {pendingScore !== null && (
            <div className="rounded-md border border-border bg-card p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Submit Score
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Add your name to this week&apos;s board
                  </div>
                </div>
                <span className="font-mono font-bold tabular-nums text-lg">
                  {pendingScore.toString().padStart(6, '0')}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  maxLength={24}
                  disabled={submittingScore}
                />
                <Button
                  onClick={handleSubmitScore}
                  disabled={
                    submittingScore || !playerName.trim() || !hasSupabaseConfig
                  }
                >
                  {submittingScore ? 'Saving…' : 'Submit'}
                </Button>
              </div>
              {leaderboardError && (
                <div className="text-xs text-destructive">{leaderboardError}</div>
              )}
              {!hasSupabaseConfig && (
                <div className="text-xs text-amber-600">
                  Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable submissions.
                </div>
              )}
            </div>
          )}

          <div className="rounded-md border border-border bg-card p-3 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Weekly Leaderboard
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Resets Mondays (UTC)
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Week of {weekStartLabel}
            </div>

            {leaderboardLoading ? (
              <div className="text-xs text-muted-foreground">Loading…</div>
            ) : leaderboardError ? (
              <div className="text-xs text-destructive">{leaderboardError}</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                No scores yet this week. Be the first!
              </div>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((entry, index) => {
                  let medalStyle = {}
                  let medalClass = ''
                  if (index === 0) {
                    medalStyle = {
                      color: 'var(--medal-gold)',
                      backgroundColor: 'var(--medal-gold-bg)',
                    }
                    medalClass = 'font-bold'
                  } else if (index === 1) {
                    medalStyle = {
                      color: 'var(--medal-silver)',
                      backgroundColor: 'var(--medal-silver-bg)',
                    }
                    medalClass = 'font-bold'
                  } else if (index === 2) {
                    medalStyle = {
                      color: 'var(--medal-bronze)',
                      backgroundColor: 'var(--medal-bronze-bg)',
                    }
                    medalClass = 'font-bold'
                  }

                  const row = (
                    <div
                      key={entry.id}
                      className={`flex justify-between items-center px-4 py-2 rounded-md ${
                        index < 3 ? '' : 'bg-muted/50'
                      }`}
                      style={index < 3 ? medalStyle : {}}
                    >
                      <div className={`flex items-center gap-2 ${medalClass}`}>
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm font-semibold truncate max-w-[120px]">
                          {entry.name || 'Anonymous'}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold tabular-nums ${medalClass}`}
                      >
                        {entry.score.toString().padStart(6, '0')}
                      </span>
                    </div>
                  )

                  if (entry.id === lastSubmittedId) {
                    return (
                      <ElectricBorder
                        key={entry.id}
                        color="#7df9ff"
                        speed={0.5}
                        chaos={0.2}
                        thickness={2}
                        style={{ borderRadius: '0.375rem' }}
                      >
                        {row}
                      </ElectricBorder>
                    )
                  }

                  return row
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 max-w-md" />
      </div>
    </GameLayout>
  )
}
