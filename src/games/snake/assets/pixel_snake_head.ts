import { Graphics } from 'pixi.js'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

/**
 * Draws a pixel art snake head at the specified position
 * @param g - PixiJS Graphics object
 * @param x - Center X position in pixels
 * @param y - Center Y position in pixels
 * @param cellSize - Size of each grid cell in pixels
 * @param direction - Direction the snake is facing
 */
export function drawPixelSnakeHead(
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

  // Calculate pixel positions based on direction
  let eyePositions: { x1: number; y1: number; x2: number; y2: number }
  let tonguePos: { x: number; y: number; width: number; height: number }[]
  let headRects: { x: number; y: number; width: number; height: number }[]

  switch (direction) {
    case 'RIGHT':
      headRects = [
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize * 4,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 1,
          y: centerY - offset + pixelSize * 3,
          width: pixelSize * 6,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 1,
          y: centerY - offset + pixelSize * 4,
          width: pixelSize * 6,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 1,
          y: centerY - offset + pixelSize * 5,
          width: pixelSize * 6,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 6,
          width: pixelSize * 4,
          height: pixelSize,
        },
      ]
      eyePositions = {
        x1: centerX - offset + pixelSize * 5.5,
        y1: centerY - offset + pixelSize * 3,
        x2: centerX - offset + pixelSize * 5.5,
        y2: centerY - offset + pixelSize * 5,
      }
      tonguePos = [
        {
          x: centerX - offset + pixelSize * 7,
          y: centerY - offset + pixelSize * 3.5,
          width: pixelSize * 1.5,
          height: pixelSize * 0.5,
        },
        {
          x: centerX - offset + pixelSize * 7,
          y: centerY - offset + pixelSize * 4.5,
          width: pixelSize * 1.5,
          height: pixelSize * 0.5,
        },
      ]
      break
    case 'LEFT':
      headRects = [
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize * 4,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 1,
          y: centerY - offset + pixelSize * 3,
          width: pixelSize * 6,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 1,
          y: centerY - offset + pixelSize * 4,
          width: pixelSize * 6,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 1,
          y: centerY - offset + pixelSize * 5,
          width: pixelSize * 6,
          height: pixelSize,
        },
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 6,
          width: pixelSize * 4,
          height: pixelSize,
        },
      ]
      eyePositions = {
        x1: centerX - offset + pixelSize * 1.5,
        y1: centerY - offset + pixelSize * 3,
        x2: centerX - offset + pixelSize * 1.5,
        y2: centerY - offset + pixelSize * 5,
      }
      tonguePos = [
        {
          x: centerX - offset - pixelSize * 0.5,
          y: centerY - offset + pixelSize * 3.5,
          width: pixelSize * 1.5,
          height: pixelSize * 0.5,
        },
        {
          x: centerX - offset - pixelSize * 0.5,
          y: centerY - offset + pixelSize * 4.5,
          width: pixelSize * 1.5,
          height: pixelSize * 0.5,
        },
      ]
      break
    case 'UP':
      headRects = [
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize,
          height: pixelSize * 4,
        },
        {
          x: centerX - offset + pixelSize * 3,
          y: centerY - offset + pixelSize * 1,
          width: pixelSize,
          height: pixelSize * 6,
        },
        {
          x: centerX - offset + pixelSize * 4,
          y: centerY - offset + pixelSize * 1,
          width: pixelSize,
          height: pixelSize * 6,
        },
        {
          x: centerX - offset + pixelSize * 5,
          y: centerY - offset + pixelSize * 1,
          width: pixelSize,
          height: pixelSize * 6,
        },
        {
          x: centerX - offset + pixelSize * 6,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize,
          height: pixelSize * 4,
        },
      ]
      eyePositions = {
        x1: centerX - offset + pixelSize * 3,
        y1: centerY - offset + pixelSize * 1.5,
        x2: centerX - offset + pixelSize * 5,
        y2: centerY - offset + pixelSize * 1.5,
      }
      tonguePos = [
        {
          x: centerX - offset + pixelSize * 3.5,
          y: centerY - offset - pixelSize * 0.5,
          width: pixelSize * 0.5,
          height: pixelSize * 1.5,
        },
        {
          x: centerX - offset + pixelSize * 4.5,
          y: centerY - offset - pixelSize * 0.5,
          width: pixelSize * 0.5,
          height: pixelSize * 1.5,
        },
      ]
      break
    case 'DOWN':
      headRects = [
        {
          x: centerX - offset + pixelSize * 2,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize,
          height: pixelSize * 4,
        },
        {
          x: centerX - offset + pixelSize * 3,
          y: centerY - offset + pixelSize * 1,
          width: pixelSize,
          height: pixelSize * 6,
        },
        {
          x: centerX - offset + pixelSize * 4,
          y: centerY - offset + pixelSize * 1,
          width: pixelSize,
          height: pixelSize * 6,
        },
        {
          x: centerX - offset + pixelSize * 5,
          y: centerY - offset + pixelSize * 1,
          width: pixelSize,
          height: pixelSize * 6,
        },
        {
          x: centerX - offset + pixelSize * 6,
          y: centerY - offset + pixelSize * 2,
          width: pixelSize,
          height: pixelSize * 4,
        },
      ]
      eyePositions = {
        x1: centerX - offset + pixelSize * 3,
        y1: centerY - offset + pixelSize * 5.5,
        x2: centerX - offset + pixelSize * 5,
        y2: centerY - offset + pixelSize * 5.5,
      }
      tonguePos = [
        {
          x: centerX - offset + pixelSize * 3.5,
          y: centerY - offset + pixelSize * 7,
          width: pixelSize * 0.5,
          height: pixelSize * 1.5,
        },
        {
          x: centerX - offset + pixelSize * 4.5,
          y: centerY - offset + pixelSize * 7,
          width: pixelSize * 0.5,
          height: pixelSize * 1.5,
        },
      ]
      break
  }

  // Head body (white/light gray)
  g.fillStyle = 0xffffff
  headRects.forEach((rect) => {
    g.rect(rect.x, rect.y, rect.width, rect.height)
    g.fill()
  })

  // Eyes (black)
  g.fillStyle = 0x000000
  g.rect(eyePositions.x1, eyePositions.y1, pixelSize, pixelSize)
  g.fill()
  g.rect(eyePositions.x2, eyePositions.y2, pixelSize, pixelSize)
  g.fill()

  // Tongue (red)
  g.fillStyle = 0xff0000
  tonguePos.forEach((tongue) => {
    g.rect(tongue.x, tongue.y, tongue.width, tongue.height)
    g.fill()
  })
}
