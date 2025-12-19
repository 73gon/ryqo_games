import { Link } from '@tanstack/react-router';
import { Gamepad2, Grid3x3, Ghost, Hash, Bomb, RectangleHorizontal, LayoutTemplate, Keyboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SpotlightCard from '@/components/spotlight-card';

export function Home() {
  const games = [
    {
      title: 'Snake',
      description: "Classic snake game. Eat apples, grow longer, don't hit the wall.",
      href: '/games/snake',
      icon: Gamepad2,
      type: 'Arcade',
    },
    {
      title: 'Tetris',
      description: 'Stack the falling blocks to clear lines.',
      href: '/games/tetris',
      icon: Grid3x3,
      type: 'Arcade',
    },
    {
      title: 'Pac-Man',
      description: 'Eat all the dots while avoiding ghosts.',
      href: '/games/pacman',
      icon: Ghost,
      type: 'Arcade',
    },
    {
      title: '2048',
      description: 'Combine tiles to reach the number 2048.',
      href: '/games/2048',
      icon: Hash,
      type: 'Puzzle',
    },
    {
      title: 'Minesweeper',
      description: 'Find the mines without detonating them.',
      href: '/games/minesweeper',
      icon: Bomb,
      type: 'Puzzle',
    },
    {
      title: 'Pong',
      description: 'Classic table tennis arcade game.',
      href: '/games/pong',
      icon: RectangleHorizontal,
      type: 'Arcade',
    },
    {
      title: 'Breakout',
      description: 'Destroy all bricks with the ball.',
      href: '/games/breakout',
      icon: LayoutTemplate,
      type: 'Arcade',
    },
    {
      title: 'TypeRacer',
      description: 'Test your typing speed in solo or multiplayer races.',
      href: '/games/typeracer',
      icon: Keyboard,
      type: 'Skill',
    },
  ];

  return (
    <div className='flex flex-col flex-1 justify-center'>
      <div className='py-12 px-4'>
        <div className='mb-12 text-center'>
          <h1 className='text-4xl font-extrabold tracking-tight lg:text-5xl mb-4'>Mini-Games Hub</h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>A collection of classic arcade and puzzle games built.</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {games.map((game) => (
            <Link
              key={game.href}
              to={game.href}
              className='block transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl'
            >
              <SpotlightCard className='h-full cursor-pointer p-0 rounded-xl'>
                <Card className='h-full bg-transparent border-0 shadow-none ring-0'>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-xl font-bold'>{game.title}</CardTitle>
                    <game.icon className='h-6 w-6 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>{game.type}</div>
                    <CardDescription className='text-base'>{game.description}</CardDescription>
                  </CardContent>
                </Card>
              </SpotlightCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
