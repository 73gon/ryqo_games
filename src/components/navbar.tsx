import { useTranslation } from 'react-i18next';
import { Link, useRouterState } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { ModeToggle } from '@/components/ui/darkmode';
import { Ryqo } from '@/components/ryqo';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { getPageWidthClass, useSettings } from '@/lib/settings';

export function Navbar() {
  const { t } = useTranslation();
  const router = useRouterState();
  const { settings } = useSettings();

  // Check if we're on a game page and extract game name
  const isGamePage = router.location.pathname.startsWith('/games/');
  const gameName = isGamePage ? router.location.pathname.split('/games/')[1]?.split('/')[0] : null;

  // Map route names to translation keys
  const gameNameMap: Record<string, string> = {
    snake: t('games.snake.name'),
    tetris: t('games.tetris.name'),
    pacman: t('games.pacman.name'),
    '2048': t('games.2048.name'),
    minesweeper: t('games.minesweeper.name'),
    pong: t('games.pong.name'),
    breakout: t('games.breakout.name'),
    typeracer: t('games.typeracer.name'),
  };

  const arcadeGames = [
    { name: 'snake', path: '/games/snake', description: t('games.snake.description', 'Classic snake game') },
    { name: 'tetris', path: '/games/tetris', description: t('games.tetris.description', 'Stack falling blocks') },
    { name: 'pacman', path: '/games/pacman', description: t('games.pacman.description', 'Eat dots, avoid ghosts') },
    { name: '2048', path: '/games/2048', description: t('games.2048.description', 'Merge tiles to 2048') },
    { name: 'minesweeper', path: '/games/minesweeper', description: t('games.minesweeper.description', 'Find hidden mines') },
    { name: 'pong', path: '/games/pong', description: t('games.pong.description', 'Classic pong game') },
    { name: 'breakout', path: '/games/breakout', description: t('games.breakout.description', 'Break all bricks') },
  ];

  return (
    <AnimatePresence mode='popLayout' initial={false}>
      <motion.header
        className={`lg:sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 mx-auto ${getPageWidthClass(settings.pageWidth)}`}
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
      >
        <div className='px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <motion.div layout className='flex items-center gap-4'>
              <Link to='/' preload='viewport' className='flex items-center gap-2 hover:opacity-80 transition-opacity'>
                <motion.div layout className='shrink-0'>
                  <Ryqo className='h-8 w-8' />
                </motion.div>
                <motion.div layout className='relative text-lg sm:text-xl font-semibold text-foreground overflow-hidden whitespace-nowrap pr-6'>
                  <AnimatePresence mode='popLayout' initial={false}>
                    <motion.span
                      key={isGamePage && gameName ? `${gameName}` : 'home'}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                      layout='position'
                      className='inline-block'
                    >
                      {isGamePage && gameName ? (
                        <>
                          {t('navbar.title')}
                          <span className='text-foreground px-1'>/</span>
                          {gameNameMap[gameName] || gameName}
                        </>
                      ) : router.location.pathname === '/settings' ? (
                        t('settings.title', 'Settings')
                      ) : (
                        t('navbar.title')
                      )}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div className='flex items-center gap-4' layout>
              {/* Navigation Menu */}
              <NavigationMenu className='hidden sm:flex'>
                <NavigationMenuList>
                  {/* Home Link */}
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link to='/' preload='viewport'>
                        <span>{t('navbar.tabs.home')}</span>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  {/* Arcade Menu */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className='gap-1'>
                      <span>{t('navbar.tabs.arcade')}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className='grid w-[400px] gap-1 p-2 md:w-[300px] md:grid-cols-2 lg:w-[300px]'>
                        {arcadeGames.map((game) => (
                          <li key={game.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={game.path}
                                className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                              >
                                <div className='text-sm font-medium leading-none'>{gameNameMap[game.name] || game.name}</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* TypeRacer Menu */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className='gap-1'>
                      <span>{t('navbar.tabs.typeracer')}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className='grid w-[200px] gap-1 p-2'>
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              to='/games/typeracer'
                              className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                            >
                              <div className='text-sm font-medium leading-none'>{t('games.typeracer.menu', 'Menu')}</div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              to='/games/typeracer/solo'
                              className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                            >
                              <div className='text-sm font-medium leading-none'>{t('games.typeracer.modes.solo', 'Solo')}</div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              to='/games/typeracer/multiplayer'
                              className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                            >
                              <div className='text-sm font-medium leading-none'>{t('games.typeracer.modes.multiplayer', 'Multiplayer')}</div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </motion.div>

            <div className='flex items-center gap-2 sm:gap-2'>
              <LanguageSwitcher />
              <Link to='/settings'>
                <Button variant='ghost' size='icon' className='h-9 w-9 p-0'>
                  <motion.div
                    className='h-9 w-9 flex items-center justify-center'
                    initial={{ rotate: 0 }}
                    whileHover={{ rotate: 30 }}
                    whileTap={{ rotate: -10 }}
                  >
                    <Settings className='h-4 w-4' />
                  </motion.div>

                  <span className='sr-only'>Settings</span>
                </Button>
              </Link>
              <ModeToggle />
            </div>
          </div>
        </div>
      </motion.header>
    </AnimatePresence>
  );
}
