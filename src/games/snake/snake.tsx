import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, RotateCcw, Pause } from 'lucide-react'
import { Kbd } from '@/components/ui/kbd'
import { SnakeCore, type SnakeGameHandle } from './snake_core'

export function SnakeGame({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const gameRef = useRef<SnakeGameHandle>(null)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [appleCount, setAppleCount] = useState(1)
  const [speed, setSpeed] = useState(5) // 1-10 scale

  const handleScoreChange = (newScore: number) => {
    setScore(newScore)
  }

  const handleGameOver = () => {
    setGameOver(true)
    setIsPlaying(false)
  }

  const handleStateChange = (playing: boolean) => {
    setIsPlaying(playing)
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      <SnakeCore
        ref={gameRef}
        appleCount={appleCount}
        speedLevel={speed}
        onScoreChange={handleScoreChange}
        onGameOver={handleGameOver}
        onStateChange={handleStateChange}
      />

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Apples</label>
            <span className="text-sm text-muted-foreground">{appleCount}</span>
          </div>
          <Slider
            value={[appleCount]}
            onValueChange={(v) => setAppleCount(v[0])}
            min={1}
            max={10}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Speed</label>
            <span className="text-sm text-muted-foreground">{speed}</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={(v) => setSpeed(v[0])}
            min={1}
            max={10}
            step={1}
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
      </div>

      {gameOver && (
        <p className="text-xl font-bold text-destructive animate-pulse">
          {t('games.common.gameOver')}
        </p>
      )}
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
          if (isPlaying) gameRef.current?.stopGame()
          else if (gameOver) gameRef.current?.startGame()
          else gameRef.current?.resumeGame()
        }}
        variant={isPlaying ? 'destructive' : 'default'}
        className="h-11 px-8 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95"
      >
        {gameOver ? (
          <>
            <RotateCcw className="mr-2 h-5 w-5" />
            <span className="font-bold mr-3">{t('games.common.restart')}</span>
            <Kbd className="bg-background/20 text-current border-transparent h-5 min-w-auto px-1.5">
              {t('kbd.space')}
            </Kbd>
          </>
        ) : isPlaying ? (
          <>
            <Pause className="mr-2 h-5 w-5" />
            <span className="font-bold mr-3">Stop</span>
            <Kbd className="bg-background/20 text-current border-transparent h-5 min-w-auto px-1.5">
              {t('kbd.space')}
            </Kbd>
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            <span className="font-bold mr-3">{t('games.common.start')}</span>
            <Kbd className="bg-background/20 text-current border-transparent h-5 min-w-auto px-1.5">
              {t('kbd.space')}
            </Kbd>
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
