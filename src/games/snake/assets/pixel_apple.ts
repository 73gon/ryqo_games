/**
 * Draws a pixel art apple at the specified grid position
 * @param ctx - CanvasRenderingContext2D
 * @param x - Grid X position
 * @param y - Grid Y position
 * @param cellSize - Size of each grid cell in pixels
 */
export function drawPixelApple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
): void {
  const baseX = x * cellSize
  const baseY = y * cellSize
  const pixelSize = cellSize / 8

  // Stem (brown/dark)
  ctx.fillStyle = '#8b4513'
  ctx.fillRect(
    baseX + pixelSize * 3.5,
    baseY + pixelSize * 1,
    pixelSize,
    pixelSize * 1.5,
  )

  // Leaf (green)
  ctx.fillStyle = '#228b22'
  ctx.fillRect(
    baseX + pixelSize * 4.5,
    baseY + pixelSize * 0.5,
    pixelSize * 1.5,
    pixelSize,
  )

  // Apple body (red)
  ctx.fillStyle = '#ff0000'

  // Top row
  ctx.fillRect(
    baseX + pixelSize * 2,
    baseY + pixelSize * 2.5,
    pixelSize * 4,
    pixelSize,
  )

  // Middle rows (wider)
  ctx.fillRect(
    baseX + pixelSize * 1.5,
    baseY + pixelSize * 3.5,
    pixelSize * 5,
    pixelSize * 2,
  )

  // Bottom rows (narrowing)
  ctx.fillRect(
    baseX + pixelSize * 2,
    baseY + pixelSize * 5.5,
    pixelSize * 4,
    pixelSize,
  )
  ctx.fillRect(
    baseX + pixelSize * 2.5,
    baseY + pixelSize * 6.5,
    pixelSize * 3,
    pixelSize,
  )

  // Highlight (lighter red/pink)
  ctx.fillStyle = '#ffaaaa'
  ctx.fillRect(
    baseX + pixelSize * 2,
    baseY + pixelSize * 3,
    pixelSize * 1.5,
    pixelSize * 1.5,
  )
}