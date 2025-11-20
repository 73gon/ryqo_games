import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, RotateCcw, Pause } from 'lucide-react'
import { Kbd } from '@/components/ui/kbd'
import { SnakeCore, type SnakeGameHandle } from './snake_core'
import ElectricBorder from '@/components/ElectricBorder'

export function SnakeGame({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const gameRef = useRef<SnakeGameHandle>(null)
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [appleCount, setAppleCount] = useState<number>(() => {
    const saved = localStorage.getItem('snakeAppleCount')
    return saved ? parseInt(saved, 10) : 1
  })
  const [speed, setSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('snakeSpeed')
    return saved ? parseInt(saved, 10) : 5
  })
  const [highScores, setHighScores] = useState<number[]>(() => {
    const saved = localStorage.getItem('snakeHighScores')
    return saved ? JSON.parse(saved) : []
  })
  const [lastAddedScoreIndex, setLastAddedScoreIndex] = useState<number | null>(
    null,
  )

  const handleScoreChange = (newScore: number) => {
    setScore(newScore)
    scoreRef.current = newScore
  }

  const handleGameOver = () => {
    setGameOver(true)
    setIsPlaying(false)
    setIsRunning(false)

    // Save high score only if it qualifies for top 10
    const currentScore = scoreRef.current
    if (currentScore > 0) {
      // Get the current high scores from localStorage to ensure we have the latest
      const savedScores = localStorage.getItem('snakeHighScores')
      const currentHighScores = savedScores ? JSON.parse(savedScores) : []

      // Always add the new score to the list
      const allScores = [...currentHighScores, currentScore].sort(
        (a, b) => b - a,
      )
      const newHighScores = allScores.slice(0, 10) // Keep top 10

      // Check if the current score made it into top 10
      const oldLength = currentHighScores.length
      const madeIt =
        newHighScores.length > oldLength ||
        (oldLength === 10 && currentScore >= newHighScores[9])

      if (madeIt) {
        // Find where this score ended up by checking position
        const addedIndex = newHighScores.findIndex((s, idx) => {
          // Count how many of this score value existed before
          const countBefore = currentHighScores.filter(
            (hs: number) => hs === s,
          ).length
          const countAfter = newHighScores
            .slice(0, idx + 1)
            .filter((hs: number) => hs === s).length
          // If there's one more now than before at this position, this is our new entry
          return s === currentScore && countAfter > countBefore
        })
        setLastAddedScoreIndex(
          addedIndex >= 0 ? addedIndex : newHighScores.indexOf(currentScore),
        )
        setHighScores(newHighScores)
        localStorage.setItem('snakeHighScores', JSON.stringify(newHighScores))
      } else {
        setLastAddedScoreIndex(null)
      }
    }
  }

  const handleGameRestart = () => {
    setIsRunning(true)
    setGameOver(false)
    setIsPlaying(true)
  }

  const handleClearLeaderboard = () => {
    setHighScores([])
    setLastAddedScoreIndex(null)
    localStorage.removeItem('snakeHighScores')
  }

  useEffect(() => {
    console.log('isRunning changed:', isRunning)
  }, [isRunning])

  const handleStateChange = (playing: boolean) => {
    setIsPlaying(playing)
  }

  useEffect(() => {
    localStorage.setItem('snakeAppleCount', appleCount.toString())
  }, [appleCount])

  useEffect(() => {
    localStorage.setItem('snakeSpeed', speed.toString())
  }, [speed])

  const content = (
    <div className="flex items-start justify-center gap-8 w-full">
      <div className="flex-1 max-w-7xl" />
      <div className="flex flex-col items-center justify-between gap-6 ">
        <SnakeCore
          ref={gameRef}
          appleCount={appleCount}
          speedLevel={speed}
          onScoreChange={handleScoreChange}
          onGameOver={handleGameOver}
          onGameRestart={handleGameRestart}
          onStateChange={handleStateChange}
        />

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">
                {t('games.snake.apples')}
              </label>
              <span className="text-sm text-muted-foreground">
                {appleCount}
              </span>
            </div>
            <Slider
              value={[appleCount]}
              onValueChange={(v) => setAppleCount(v[0])}
              min={1}
              max={10}
              step={1}
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">
                {t('games.snake.speed')}
              </label>
              <span className="text-sm text-muted-foreground">{speed}</span>
            </div>
            <Slider
              value={[speed]}
              onValueChange={(v) => setSpeed(v[0])}
              min={1}
              max={10}
              step={1}
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase font-bold">
              {t('games.common.controls.move')}
            </span>
            <div className="flex gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <Kbd>←</Kbd>
              <Kbd>→</Kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase font-bold">
              Start/Stop
            </span>
            <Kbd>{t('kbd.space')}</Kbd>
          </div>
        </div>

        {gameOver && (
          <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
            <div className="text-5xl font-black text-destructive animate-bounce">
              {t('games.common.gameOver')}
            </div>
            <div className="text-sm text-muted-foreground animate-pulse">
              {t('games.snake.restartHint')}
            </div>
          </div>
        )}
      </div>

      {highScores.length > 0 && (
        <div className="w-64 mt-2 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide">
              {t('games.snake.leaderboard')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLeaderboard}
              className="h-7 text-xs"
            >
              {t('games.snake.clear')}
            </Button>
          </div>
          <div className="space-y-1">
            {highScores.map((score, index) => {
              // Determine medal color for top 3 using CSS variables
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

              const entry = (
                <div
                  key={index}
                  className={`flex justify-between items-center px-4 py-2 rounded-md ${
                    index < 3 ? '' : 'bg-muted/50'
                  }`}
                  style={index < 3 ? medalStyle : {}}
                >
                  <span className={`text-sm font-medium ${medalClass}`}>
                    #{index + 1}
                  </span>
                  <span
                    className={`font-mono font-bold tabular-nums ${medalClass}`}
                  >
                    {score.toString().padStart(3, '0')}
                  </span>
                </div>
              )

              if (index === lastAddedScoreIndex) {
                return (
                  <ElectricBorder
                    key={index}
                    color="#7df9ff"
                    speed={0.5}
                    chaos={0.2}
                    thickness={2}
                    style={{ borderRadius: '0.375rem' }}
                  >
                    {entry}
                  </ElectricBorder>
                )
              }

              return entry
            })}
          </div>
        </div>
      )}
      <div className="flex-1 max-w-[600px]" />
    </div>
  )

  const controls = (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-end">
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
          {t('games.common.score')}
        </span>
        <span className="font-mono font-bold text-3xl tabular-nums leading-none">
          {score.toString().padStart(3, '0')}
        </span>
      </div>

      <div className="h-8 w-px bg-border" />

      <Button
        onClick={() => {
          if (isPlaying) {
            gameRef.current?.stopGame()
          } else if (gameOver) {
            setIsRunning(true)
            setGameOver(false)
            setIsPlaying(true)
            gameRef.current?.startGame()
          } else {
            console.log(1)
            setIsRunning(true)
            gameRef.current?.resumeGame()
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
            <span className="font-bold">Stop</span>
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

  if (embedded) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-xl font-bold">PixiJS</h3>
        {controls}
        {content}
      </div>
    )
  }

  return (
    <GameLayout title={t('games.titles.snake')} controls={controls}>
      {content}
    </GameLayout>
  )
}
