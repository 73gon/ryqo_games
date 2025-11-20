import { useTranslation } from 'react-i18next'
import { GameLayout } from '@/components/GameLayout'

export function TetrisGame() {
  const { t } = useTranslation()
  return (
    <GameLayout title={t('games.titles.tetris')}>
      <div className="text-center">
        <p className="text-muted-foreground">
          {t('games.titles.tetris')} (PixiJS) - {t('games.common.comingSoon')}
        </p>
      </div>
    </GameLayout>
  )
}
