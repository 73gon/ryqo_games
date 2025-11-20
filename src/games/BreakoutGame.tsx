import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'

export function BreakoutGame() {
  const { t } = useTranslation()
  return (
    <GameLayout title={t('games.titles.breakout')}>
      <div className="text-center">
        <p className="text-muted-foreground">
          {t('games.titles.breakout')} (PixiJS) - {t('games.common.comingSoon')}
        </p>
      </div>
    </GameLayout>
  )
}
