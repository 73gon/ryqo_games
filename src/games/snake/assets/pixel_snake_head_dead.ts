import { Graphics } from 'pixi.js'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

/**
 * Draws a dead pixel art snake head at the specified position (with X eyes)
 * @param g - PixiJS Graphics object
 * @param x - Center X position in pixels
 * @param y - Center Y position in pixels
 * @param cellSize - Size of each grid cell in pixels
 * @param direction - Direction the snake was facing
 */
export function drawPixelSnakeHeadDead(
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
  let headRects: { x: number; y: number; width: number; height: number }[]
  let xEyes: {
    line1: { x1: number; y1: number; x2: number; y2: number }
    line2: { x1: number; y1: number; x2: number; y2: number }
  }[]

  switch (direction) {
    case 'RIGHT':
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
      // X eyes for horizontal facing
      xEyes = [
        // First X (top eye position)
        {
          line1: {
            x1: centerX - offset + pixelSize * 2,
            y1: centerY - offset + pixelSize * 2.5,
            x2: centerX - offset + pixelSize * 3,
            y2: centerY - offset + pixelSize * 3.5,
          },
          line2: {
            x1: centerX - offset + pixelSize * 3,
            y1: centerY - offset + pixelSize * 2.5,
            x2: centerX - offset + pixelSize * 2,
            y2: centerY - offset + pixelSize * 3.5,
          },
        },
        // Second X (bottom eye position)
        {
          line1: {
            x1: centerX - offset + pixelSize * 2,
            y1: centerY - offset + pixelSize * 4.5,
            x2: centerX - offset + pixelSize * 3,
            y2: centerY - offset + pixelSize * 5.5,
          },
          line2: {
            x1: centerX - offset + pixelSize * 3,
            y1: centerY - offset + pixelSize * 4.5,
            x2: centerX - offset + pixelSize * 2,
            y2: centerY - offset + pixelSize * 5.5,
          },
        },
      ]
      break
    case 'UP':
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
      // X eyes for vertical facing
      xEyes = [
        // First X (left eye position)
        {
          line1: {
            x1: centerX - offset + pixelSize * 2.5,
            y1: centerY - offset + pixelSize * 2,
            x2: centerX - offset + pixelSize * 3.5,
            y2: centerY - offset + pixelSize * 3,
          },
          line2: {
            x1: centerX - offset + pixelSize * 3.5,
            y1: centerY - offset + pixelSize * 2,
            x2: centerX - offset + pixelSize * 2.5,
            y2: centerY - offset + pixelSize * 3,
          },
        },
        // Second X (right eye position)
        {
          line1: {
            x1: centerX - offset + pixelSize * 4.5,
            y1: centerY - offset + pixelSize * 2,
            x2: centerX - offset + pixelSize * 5.5,
            y2: centerY - offset + pixelSize * 3,
          },
          line2: {
            x1: centerX - offset + pixelSize * 5.5,
            y1: centerY - offset + pixelSize * 2,
            x2: centerX - offset + pixelSize * 4.5,
            y2: centerY - offset + pixelSize * 3,
          },
        },
      ]
      break
  }

  // Head body (gray for dead)
  g.fillStyle = 0x888888
  headRects.forEach((rect) => {
    g.rect(rect.x, rect.y, rect.width, rect.height)
    g.fill()
  })

  // Draw X eyes (red for dead) - using small rects to create X pattern
  g.fillStyle = 0xff0000
  xEyes.forEach((xEye) => {
    // Create X pattern using small rectangles
    const steps = 5
    for (let i = 0; i < steps; i++) {
      const progress = i / (steps - 1)
      // First diagonal of X
      const x1 = xEye.line1.x1 + (xEye.line1.x2 - xEye.line1.x1) * progress
      const y1 = xEye.line1.y1 + (xEye.line1.y2 - xEye.line1.y1) * progress
      g.rect(x1, y1, pixelSize * 0.6, pixelSize * 0.6)
      g.fill()
      // Second diagonal of X
      const x2 = xEye.line2.x1 + (xEye.line2.x2 - xEye.line2.x1) * progress
      const y2 = xEye.line2.y1 + (xEye.line2.y2 - xEye.line2.y1) * progress
      g.rect(x2, y2, pixelSize * 0.6, pixelSize * 0.6)
      g.fill()
    }
  })
}
