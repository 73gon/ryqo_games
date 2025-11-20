import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'

export function PongGame() {
  const { t } = useTranslation()
  return (
    <GameLayout title={t('games.titles.pong')}>
      <div className="text-center">
        <p className="text-muted-foreground">
          {t('games.titles.pong')} (PixiJS) - {t('games.common.comingSoon')}
        </p>
      </div>
    </GameLayout>
  )
}
