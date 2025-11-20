import { useTranslation } from 'react-i18next'
import { Link, useRouterState } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ModeToggle } from '@/components/ui/darkmode'
import { Ryqo } from '@/components/ryqo'
import { Separator } from '@/components/ui/separator'

export function Navbar() {
  const { t } = useTranslation()
  const router = useRouterState()
  const isDetailPage = router.location.pathname.startsWith('/prophets/')

  return (
    <header className="lg:sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Ryqo className="h-8 w-8" />
            <span className="text-lg sm:text-xl font-semibold text-foreground">
              {t('navbar.title')}
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <AnimatePresence mode="wait">
              {isDetailPage && (
                <>
                  {/* Desktop: Show inline controls */}
                  <motion.div
                    initial={{ opacity: 0, x: -10, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    exit={{ opacity: 0, x: -10, width: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="hidden md:flex items-center gap-2 sm:gap-3"
                  >
                    <Separator orientation="vertical" className="h-6" />
                  </motion.div>

                  {/* Mobile: Show dropdown */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="md:hidden"
                  ></motion.div>
                </>
              )}
            </AnimatePresence>
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
