import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { PacmanCore, type PacmanGameHandle } from './pacman_core'

export function PacmanGame() {
  const { t } = useTranslation()
  const gameRef = useRef<PacmanGameHandle>(null)

  const [score, setScore] = useState(0)
  const [pellets, setPellets] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [win, setWin] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'Space'
      ) {
        e.preventDefault()
      }

      if (e.code === 'Space' && gameOver) {
        setGameOver(false)
        setWin(false)
        gameRef.current?.startGame()
        return
      }
      if (!isPlaying) return
      switch (e.code) {
        case 'ArrowUp':
          gameRef.current?.changeDirection('up')
          break
        case 'ArrowDown':
          gameRef.current?.changeDirection('down')
          break
        case 'ArrowLeft':
          gameRef.current?.changeDirection('left')
          break
        case 'ArrowRight':
          gameRef.current?.changeDirection('right')
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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
            Pellets
          </span>
          <span className="font-mono font-bold text-2xl tabular-nums leading-none">
            {pellets.toString().padStart(3, '0')}
          </span>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <Button
        onClick={() => {
          if (isPlaying) {
            gameRef.current?.stopGame()
          } else if (gameOver) {
            setGameOver(false)
            setWin(false)
            gameRef.current?.startGame()
          } else {
            gameRef.current?.startGame()
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
          <PacmanCore
            ref={gameRef}
            onScoreChange={setScore}
            onPelletsChange={setPellets}
            onStateChange={setIsPlaying}
            onWin={() => {
              setGameOver(true)
              setWin(true)
            }}
            onGameOver={() => {
              setGameOver(true)
              setWin(false)
            }}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold">
                Move
              </span>
              <div className="flex gap-1">
                <Kbd>Up</Kbd>
                <Kbd>Down</Kbd>
                <Kbd>Left</Kbd>
                <Kbd>Right</Kbd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold">
                Restart
              </span>
              <Kbd>Space</Kbd>
            </div>
          </div>

          {gameOver && (
            <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
              <div className="text-5xl font-black text-primary animate-bounce">
                {win ? t('games.common.win') ?? 'You Win!' : t('games.common.gameOver')}
              </div>
              <div className="text-sm text-muted-foreground animate-pulse">
                Press Space or click Restart
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 max-w-md" />
      </div>
    </GameLayout>
  )
}
