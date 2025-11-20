import { Graphics } from 'pixi.js'

/**
 * Draws a pixel art apple at the specified grid position
 * @param g - PixiJS Graphics object
 * @param x - Grid X position
 * @param y - Grid Y position
 * @param cellSize - Size of each grid cell in pixels
 */
export function drawPixelApple(
  g: Graphics,
  x: number,
  y: number,
  cellSize: number,
): void {
  const baseX = x * cellSize
  const baseY = y * cellSize
  const pixelSize = cellSize / 8

  // Stem (brown/dark)
  g.fillStyle = 0x8b4513
  g.rect(
    baseX + pixelSize * 3.5,
    baseY + pixelSize * 1,
    pixelSize,
    pixelSize * 1.5,
  )
  g.fill()

  // Leaf (green)
  g.fillStyle = 0x228b22
  g.rect(
    baseX + pixelSize * 4.5,
    baseY + pixelSize * 0.5,
    pixelSize * 1.5,
    pixelSize,
  )
  g.fill()

  // Apple body (red)
  g.fillStyle = 0xff0000

  // Top row
  g.rect(
    baseX + pixelSize * 2,
    baseY + pixelSize * 2.5,
    pixelSize * 4,
    pixelSize,
  )
  g.fill()

  // Middle rows (wider)
  g.rect(
    baseX + pixelSize * 1.5,
    baseY + pixelSize * 3.5,
    pixelSize * 5,
    pixelSize * 2,
  )
  g.fill()

  // Bottom rows (narrowing)
  g.rect(
    baseX + pixelSize * 2,
    baseY + pixelSize * 5.5,
    pixelSize * 4,
    pixelSize,
  )
  g.fill()
  g.rect(
    baseX + pixelSize * 2.5,
    baseY + pixelSize * 6.5,
    pixelSize * 3,
    pixelSize,
  )
  g.fill()

  // Highlight (lighter red/pink)
  g.fillStyle = 0xffaaaa
  g.rect(
    baseX + pixelSize * 2,
    baseY + pixelSize * 3,
    pixelSize * 1.5,
    pixelSize * 1.5,
  )
  g.fill()
}
