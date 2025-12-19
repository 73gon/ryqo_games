/**
 * Draws a pixel art snake body segment at the specified position
 * @param ctx - CanvasRenderingContext2D
 * @param x - Center X position in pixels
 * @param y - Center Y position in pixels
 * @param cellSize - Size of each grid cell in pixels
 */
export function drawPixelSnakeBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
): void {
  const pixelSize = cellSize / 8
  const centerX = x
  const centerY = y
  const offset = cellSize / 2

  // Body (white)
  ctx.fillStyle = '#ffffff'

  // Create a rounded body shape
  const bodyRects = [
    // Top row
    {
      x: centerX - offset + pixelSize * 2,
      y: centerY - offset + pixelSize * 2,
      width: pixelSize * 4,
      height: pixelSize,
    },
    // Upper middle
    {
      x: centerX - offset + pixelSize * 1,
      y: centerY - offset + pixelSize * 3,
      width: pixelSize * 6,
      height: pixelSize,
    },
    // Middle rows
    {
      x: centerX - offset + pixelSize * 1,
      y: centerY - offset + pixelSize * 4,
      width: pixelSize * 6,
      height: pixelSize,
    },
    // Lower middle
    {
      x: centerX - offset + pixelSize * 1,
      y: centerY - offset + pixelSize * 5,
      width: pixelSize * 6,
      height: pixelSize,
    },
    // Bottom row
    {
      x: centerX - offset + pixelSize * 2,
      y: centerY - offset + pixelSize * 6,
      width: pixelSize * 4,
      height: pixelSize,
    },
  ]

  bodyRects.forEach((rect) => {
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  })

  // Add scale pattern (darker pixels for detail)
  ctx.fillStyle = '#e0e0e0'
  ctx.fillRect(
    centerX - offset + pixelSize * 3,
    centerY - offset + pixelSize * 3.5,
    pixelSize,
    pixelSize,
  )
  ctx.fillRect(
    centerX - offset + pixelSize * 5,
    centerY - offset + pixelSize * 4.5,
    pixelSize,
    pixelSize,
  )
}