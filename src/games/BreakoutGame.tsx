import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GameLayout } from '@/components/game-layout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, RotateCcw, Pause } from 'lucide-react';
import { Application, Graphics, Container } from 'pixi.js';
import ElectricBorder from '@/components/electric-border';
import { cn } from '@/lib/utils';

// Game constants
const GAME_WIDTH = 620;
const GAME_HEIGHT = 480;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 12;
const PADDLE_Y = GAME_HEIGHT - 30;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_WIDTH = 56;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 4;
const BRICK_TOP_OFFSET = 50;

// Colors for brick rows
const BRICK_COLORS = [
  0xef4444, // red
  0xf97316, // orange
  0xeab308, // yellow
  0x22c55e, // green
  0x3b82f6, // blue
];

type Brick = {
  x: number;
  y: number;
  alive: boolean;
  color: number;
};

export function BreakoutGame() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [ballSpeed, setBallSpeed] = useState(5);
  const [highScores, setHighScores] = useState<number[]>(() => {
    const saved = localStorage.getItem('breakoutHighScores');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastAddedScoreIndex, setLastAddedScoreIndex] = useState<number | null>(null);

  // Game state refs
  const paddleXRef = useRef(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
  const ballRef = useRef({ x: GAME_WIDTH / 2, y: PADDLE_Y - 20, vx: 0, vy: 0 });
  const bricksRef = useRef<Brick[]>([]);
  const isPlayingRef = useRef(false);
  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const ballSpeedRef = useRef(5);

  // Graphics refs
  const paddleGraphicsRef = useRef<Graphics | null>(null);
  const ballGraphicsRef = useRef<Graphics | null>(null);
  const brickContainerRef = useRef<Container | null>(null);
  const brickGraphicsRef = useRef<Graphics[]>([]);

  const initBricks = useCallback(() => {
    const bricks: Brick[] = [];
    const totalBricksWidth = BRICK_COLS * (BRICK_WIDTH + BRICK_GAP) - BRICK_GAP;
    const startX = (GAME_WIDTH - totalBricksWidth) / 2;

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: startX + col * (BRICK_WIDTH + BRICK_GAP),
          y: BRICK_TOP_OFFSET + row * (BRICK_HEIGHT + BRICK_GAP),
          alive: true,
          color: BRICK_COLORS[row],
        });
      }
    }
    return bricks;
  }, []);

  const resetBall = useCallback(() => {
    ballRef.current = {
      x: paddleXRef.current + PADDLE_WIDTH / 2,
      y: PADDLE_Y - BALL_RADIUS - 2,
      vx: 0,
      vy: 0,
    };
  }, []);

  const launchBall = useCallback(() => {
    if (ballRef.current.vx === 0 && ballRef.current.vy === 0) {
      const angle = (Math.random() * 60 - 30) * (Math.PI / 180); // -30 to 30 degrees
      const speed = ballSpeedRef.current;
      ballRef.current.vx = Math.sin(angle) * speed;
      ballRef.current.vy = -Math.cos(angle) * speed;
    }
  }, []);

  const startGame = useCallback(() => {
    bricksRef.current = initBricks();
    paddleXRef.current = GAME_WIDTH / 2 - PADDLE_WIDTH / 2;
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    gameOverRef.current = false;
    isPlayingRef.current = true;
    setIsPlaying(true);
    resetBall();
  }, [initBricks, resetBall]);

  const pauseGame = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const handleGameOver = useCallback((won: boolean) => {
    gameOverRef.current = true;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setGameOver(!won);
    setGameWon(won);

    // Save high score
    const currentScore = scoreRef.current;
    if (currentScore > 0) {
      const savedScores = localStorage.getItem('breakoutHighScores');
      const currentHighScores = savedScores ? JSON.parse(savedScores) : [];
      const allScores = [...currentHighScores, currentScore].sort((a, b) => b - a);
      const newHighScores = allScores.slice(0, 10);

      const oldLength = currentHighScores.length;
      const madeIt = newHighScores.length > oldLength || (oldLength === 10 && currentScore >= newHighScores[9]);

      if (madeIt) {
        const addedIndex = newHighScores.findIndex((s: number, idx: number) => {
          const countBefore = currentHighScores.filter((hs: number) => hs === s).length;
          const countAfter = newHighScores.slice(0, idx + 1).filter((hs: number) => hs === s).length;
          return s === currentScore && countAfter > countBefore;
        });
        setLastAddedScoreIndex(addedIndex >= 0 ? addedIndex : newHighScores.indexOf(currentScore));
        setHighScores(newHighScores);
        localStorage.setItem('breakoutHighScores', JSON.stringify(newHighScores));
      } else {
        setLastAddedScoreIndex(null);
      }
    }
  }, []);

  useEffect(() => {
    ballSpeedRef.current = ballSpeed;
  }, [ballSpeed]);

  useEffect(() => {
    if (!containerRef.current) return;

    let animationFrameId: number;

    const init = async () => {
      const app = new Application();
      await app.init({
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: 0x0a0a0a,
        antialias: true,
      });

      containerRef.current?.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      // Create paddle
      const paddle = new Graphics();
      paddle.roundRect(0, 0, PADDLE_WIDTH, PADDLE_HEIGHT, 4);
      paddle.fill({ color: 0xffffff });
      paddle.x = paddleXRef.current;
      paddle.y = PADDLE_Y;
      paddleGraphicsRef.current = paddle;
      app.stage.addChild(paddle);

      // Create ball
      const ball = new Graphics();
      ball.circle(0, 0, BALL_RADIUS);
      ball.fill({ color: 0xffffff });
      ball.x = ballRef.current.x;
      ball.y = ballRef.current.y;
      ballGraphicsRef.current = ball;
      app.stage.addChild(ball);

      // Create brick container
      const brickContainer = new Container();
      brickContainerRef.current = brickContainer;
      app.stage.addChild(brickContainer);

      // Initialize bricks
      bricksRef.current = initBricks();
      brickGraphicsRef.current = [];

      bricksRef.current.forEach((brick) => {
        const g = new Graphics();
        g.roundRect(0, 0, BRICK_WIDTH, BRICK_HEIGHT, 3);
        g.fill({ color: brick.color });
        g.x = brick.x;
        g.y = brick.y;
        brickContainer.addChild(g);
        brickGraphicsRef.current.push(g);
      });

      // Mouse/touch movement
      const container = containerRef.current;
      if (!container) {
        // container may have been removed while awaiting; ensure app is destroyed and return a no-op cleanup
        app.destroy(true);
        return () => {};
      }

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        paddleXRef.current = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2));
      };

      const handleTouchMove = (e: TouchEvent) => {
        const rect = container.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        paddleXRef.current = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, touchX - PADDLE_WIDTH / 2));
      };

      const handleClick = () => {
        if (isPlayingRef.current) {
          launchBall();
        }
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchmove', handleTouchMove);
      container.addEventListener('click', handleClick);

      // Game loop
      let lastTime = performance.now();

      const gameLoop = (currentTime: number) => {
        const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to ~60fps
        lastTime = currentTime;

        // Update paddle position
        if (paddleGraphicsRef.current) {
          paddleGraphicsRef.current.x = paddleXRef.current;
        }

        // Update ball if game is playing
        if (isPlayingRef.current && !gameOverRef.current) {
          const ball = ballRef.current;

          // If ball not launched yet, follow paddle
          if (ball.vx === 0 && ball.vy === 0) {
            ball.x = paddleXRef.current + PADDLE_WIDTH / 2;
            ball.y = PADDLE_Y - BALL_RADIUS - 2;
          } else {
            // Move ball
            ball.x += ball.vx * deltaTime;
            ball.y += ball.vy * deltaTime;

            // Wall collision
            if (ball.x <= BALL_RADIUS || ball.x >= GAME_WIDTH - BALL_RADIUS) {
              ball.vx = -ball.vx;
              ball.x = Math.max(BALL_RADIUS, Math.min(GAME_WIDTH - BALL_RADIUS, ball.x));
            }
            if (ball.y <= BALL_RADIUS) {
              ball.vy = -ball.vy;
              ball.y = BALL_RADIUS;
            }

            // Bottom - lose life
            if (ball.y >= GAME_HEIGHT) {
              livesRef.current--;
              setLives(livesRef.current);
              if (livesRef.current <= 0) {
                handleGameOver(false);
              } else {
                resetBall();
              }
            }

            // Paddle collision
            if (
              ball.y + BALL_RADIUS >= PADDLE_Y &&
              ball.y - BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT &&
              ball.x >= paddleXRef.current &&
              ball.x <= paddleXRef.current + PADDLE_WIDTH &&
              ball.vy > 0
            ) {
              // Calculate bounce angle based on where ball hits paddle
              const hitPos = (ball.x - paddleXRef.current) / PADDLE_WIDTH; // 0 to 1
              const angle = (hitPos - 0.5) * 120 * (Math.PI / 180); // -60 to 60 degrees
              const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
              ball.vx = Math.sin(angle) * speed;
              ball.vy = -Math.abs(Math.cos(angle) * speed);
              ball.y = PADDLE_Y - BALL_RADIUS - 1;
            }

            // Brick collision
            let aliveBricks = 0;
            bricksRef.current.forEach((brick, index) => {
              if (brick.alive) {
                aliveBricks++;
                // Check collision
                if (
                  ball.x + BALL_RADIUS > brick.x &&
                  ball.x - BALL_RADIUS < brick.x + BRICK_WIDTH &&
                  ball.y + BALL_RADIUS > brick.y &&
                  ball.y - BALL_RADIUS < brick.y + BRICK_HEIGHT
                ) {
                  brick.alive = false;
                  aliveBricks--;

                  // Determine bounce direction
                  const overlapLeft = ball.x + BALL_RADIUS - brick.x;
                  const overlapRight = brick.x + BRICK_WIDTH - (ball.x - BALL_RADIUS);
                  const overlapTop = ball.y + BALL_RADIUS - brick.y;
                  const overlapBottom = brick.y + BRICK_HEIGHT - (ball.y - BALL_RADIUS);

                  const minOverlapX = Math.min(overlapLeft, overlapRight);
                  const minOverlapY = Math.min(overlapTop, overlapBottom);

                  if (minOverlapX < minOverlapY) {
                    ball.vx = -ball.vx;
                  } else {
                    ball.vy = -ball.vy;
                  }

                  // Update score
                  scoreRef.current += 10 * (BRICK_ROWS - Math.floor(index / BRICK_COLS));
                  setScore(scoreRef.current);

                  // Hide brick graphic
                  if (brickGraphicsRef.current[index]) {
                    brickGraphicsRef.current[index].visible = false;
                  }
                }
              }
            });

            // Check win
            if (aliveBricks === 0) {
              handleGameOver(true);
            }
          }
        }

        // Update ball graphic
        if (ballGraphicsRef.current) {
          ballGraphicsRef.current.x = ballRef.current.x;
          ballGraphicsRef.current.y = ballRef.current.y;
        }

        animationFrameId = requestAnimationFrame(gameLoop);
      };

      animationFrameId = requestAnimationFrame(gameLoop);

      return () => {
        cancelAnimationFrame(animationFrameId);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('click', handleClick);
        app.destroy(true);
      };
    };

    const cleanup = init();

    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [initBricks, resetBall, launchBall, handleGameOver]);

  // Update bricks when game restarts
  useEffect(() => {
    if (isPlaying && brickContainerRef.current && brickGraphicsRef.current.length > 0) {
      bricksRef.current.forEach((brick, index) => {
        if (brickGraphicsRef.current[index]) {
          brickGraphicsRef.current[index].visible = brick.alive;
        }
      });
    }
  }, [isPlaying]);

  const handleClearLeaderboard = () => {
    setHighScores([]);
    setLastAddedScoreIndex(null);
    localStorage.removeItem('breakoutHighScores');
  };

  return (
    <GameLayout
      controls={
        <div className='flex items-center gap-4'>
          <div className='bg-muted px-4 py-2 rounded-md'>
            <span className='text-xs uppercase font-bold text-muted-foreground block'>{t('games.common.score')}</span>
            <span className='text-xl font-bold'>{score}</span>
          </div>
          <div className='bg-muted px-4 py-2 rounded-md'>
            <span className='text-xs uppercase font-bold text-muted-foreground block'>{t('games.breakout.lives', 'Lives')}</span>
            <span className='text-xl font-bold'>{lives}</span>
          </div>
          {!isPlaying && !gameOver && !gameWon ? (
            <Button onClick={startGame} variant='outline' size='icon'>
              <Play className='h-4 w-4' />
            </Button>
          ) : isPlaying ? (
            <Button onClick={pauseGame} variant='outline' size='icon'>
              <Pause className='h-4 w-4' />
            </Button>
          ) : (
            <Button onClick={startGame} variant='outline' size='icon'>
              <RotateCcw className='h-4 w-4' />
            </Button>
          )}
        </div>
      }
    >
      <div className='flex items-start justify-center gap-8 w-full'>
        <div className='flex-1 max-w-7xl' />
        <div className='flex flex-col items-center justify-center gap-6'>
          <ElectricBorder color='#3b82f6' thickness={3} className='rounded-lg'>
            <div
              ref={containerRef}
              className={cn('rounded-lg overflow-hidden cursor-none relative', !isPlaying && 'cursor-default')}
              style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
            >
              {/* Overlay */}
              {(gameOver || gameWon || !isPlaying) && (
                <div className='absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10'>
                  {gameWon && (
                    <>
                      <h2 className='text-4xl font-bold text-green-400 mb-2'>{t('games.common.youWin', 'You Win!')}</h2>
                      <p className='text-xl text-white mb-4'>
                        {t('games.common.finalScore', 'Final Score')}: {score}
                      </p>
                      <Button onClick={startGame}>{t('games.common.playAgain', 'Play Again')}</Button>
                    </>
                  )}
                  {gameOver && (
                    <>
                      <h2 className='text-4xl font-bold text-red-400 mb-2'>{t('games.common.gameOver')}</h2>
                      <p className='text-xl text-white mb-4'>
                        {t('games.common.finalScore', 'Final Score')}: {score}
                      </p>
                      <Button onClick={startGame}>{t('games.common.playAgain', 'Play Again')}</Button>
                    </>
                  )}
                  {!isPlaying && !gameOver && !gameWon && (
                    <>
                      <h2 className='text-2xl font-bold text-white mb-4'>{t('games.titles.breakout')}</h2>
                      <Button onClick={startGame}>
                        <Play className='h-4 w-4 mr-2' />
                        {t('games.common.start', 'Start Game')}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </ElectricBorder>

          <div className='flex flex-col gap-4 w-full max-w-xs'>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <label className='text-sm font-medium'>{t('games.breakout.ballSpeed', 'Ball Speed')}</label>
                <span className='text-sm text-muted-foreground'>{ballSpeed}</span>
              </div>
              <Slider value={[ballSpeed]} onValueChange={(v) => setBallSpeed(v[0])} min={3} max={10} step={1} disabled={isPlaying} />
            </div>
          </div>

          <div className='text-sm text-muted-foreground flex flex-wrap gap-2 justify-center'>
            <span className='flex items-center gap-1'>{t('games.breakout.controls', 'Move mouse to control paddle, click to launch ball')}</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className='flex-1 max-w-xs'>
          <div className='bg-muted/50 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>{t('games.common.highScores')}</h3>
              {highScores.length > 0 && (
                <Button variant='ghost' size='sm' onClick={handleClearLeaderboard} className='text-xs'>
                  {t('games.common.clear', 'Clear')}
                </Button>
              )}
            </div>
            {highScores.length === 0 ? (
              <p className='text-sm text-muted-foreground'>{t('games.common.noScores', 'No scores yet')}</p>
            ) : (
              <ol className='space-y-1'>
                {highScores.map((s, i) => (
                  <li
                    key={i}
                    className={cn(
                      'flex justify-between text-sm py-1 px-2 rounded',
                      lastAddedScoreIndex === i && 'bg-primary/20 text-primary font-medium',
                    )}
                  >
                    <span>#{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
