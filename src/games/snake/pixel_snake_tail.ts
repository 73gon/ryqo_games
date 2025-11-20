import { Graphics } from 'pixi.js'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

/**
 * Draws a pixel art snake tail at the specified position
 * @param g - PixiJS Graphics object
 * @param x - Center X position in pixels
 * @param y - Center Y position in pixels
 * @param cellSize - Size of each grid cell in pixels
 * @param direction - Direction the tail is pointing (direction it came from)
 */
export function drawPixelSnakeTail(
  g: Graphics,
  x: number,
  y: number,
  cellSize: number,
  direction: Direction,
): void {
  const pixelSize = cellSize / 8
  const centerX = x
  const centerY = y
  const offset = cellSize / 2

  let tailRects: { x: number; y: number; width: number; height: number }[]

  // Tail tapers in the opposite direction it's moving
  switch (direction) {
    case 'RIGHT':
      // Tail pointing left (came from right)
      tailRects = [
        {
          x: centerX - offset + pixelSize * 3,
          y: centerY - offset + pixelSize * 3,
          width: pixelSize * 4,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 4,
          width: pixelSize * 5,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 3,
          y: centerY - offset + pixelSize * 5,
          width: pixelSize * 4,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 4,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize * 2,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 4,
          y: centerY - offset + pixelSize * 6,
          width: pixelSize * 2,
          height: pixelSize,
        },
      ]
      break
    case 'LEFT':
      // Tail pointing right (came from left)
      tailRects = [
        {
          x: centerX - offset + pixelSize * 1,
          y: centerY - offset + pixelSize * 3,
          width: pixelSize * 4,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 1,
          y: centerY - offset + pixelSize * 4,
          width: pixelSize * 5,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 1,
          y: centerY - offset + pixelSize * 5,
          width: pixelSize * 4,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize * 2,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 6,
          width: pixelSize * 2,
          height: pixelSize,
        },
      ]
      break
    case 'UP':
      // Tail pointing down (came from up)
      tailRects = [
        {
          x: centerX - offset + pixelSize * 3,
          y: centerY - offset + pixelSize * 1,
          width: pixelSize,
          height: pixelSize * 4,
        },
        {
          x: centerX - offset + pixelSize * 4,
          y: centerY - offset + pixelSize * 1,
          width: pixelSize,
          height: pixelSize * 5,
        },
        {
          x: centerX - offset + pixelSize * 5,
          y: centerY - offset + pixelSize * 1,
          width: pixelSize,
          height: pixelSize * 4,
        },
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize,
          height: pixelSize * 2,
        },
        {
          x: centerX - offset + pixelSize * 6,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize,
          height: pixelSize * 2,
        },
      ]
      break
    case 'DOWN':
      // Tail pointing up (came from down)
      tailRects = [
        {
          x: centerX - offset + pixelSize * 3,
          y: centerY - offset + pixelSize * 3,
          width: pixelSize,
          height: pixelSize * 4,
        },
        {
          x: centerX - offset + pixelSize * 4,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize,
          height: pixelSize * 5,
        },
        {
          x: centerX - offset + pixelSize * 5,
          y: centerY - offset + pixelSize * 3,
          width: pixelSize,
          height: pixelSize * 4,
        },
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 4,
          width: pixelSize,
          height: pixelSize * 2,
        },
        {
          x: centerX - offset + pixelSize * 6,
          y: centerY - offset + pixelSize * 4,
          width: pixelSize,
          height: pixelSize * 2,
        },
      ]
      break
  }

  // Draw tail (white)
  g.fillStyle = 0xffffff
  tailRects.forEach((rect) => {
    g.rect(rect.x, rect.y, rect.width, rect.height)
    g.fill()
  })
}
