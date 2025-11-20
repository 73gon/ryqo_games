import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'

export function PacmanGame() {
  const { t } = useTranslation()
  return (
    <GameLayout title={t('games.titles.pacman')}>
      <div className="text-center">
        <p className="text-muted-foreground">
          {t('games.titles.pacman')} (PixiJS) - {t('games.common.comingSoon')}
        </p>
      </div>
    </GameLayout>
  )
}
