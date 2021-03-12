import { Vector, bezierCurve } from './math'

import type { Box } from './types'

/**
 * Calculate the amount of time needed to move from (x1, y1) to (x2, y2)
 * given the width of the element being clicked on
 * https://en.wikipedia.org/wiki/Fitts%27s_law
 */
const fitts = (distance: number, width: number): number => {
  const a = 0
  const b = 2
  const id = Math.log2(distance / width + 1)
  return a + b * id
}

const isBox = (a: any): a is Box => 'width' in a

export function path(
  point: Vector,
  target: Vector,
  spreadOverride?: number
): Vector[]
export function path(
  point: Vector,
  target: Box,
  spreadOverride?: number
): Vector[]
export function path(
  start: Vector,
  end: Box | Vector,
  spreadOverride?: number
): Vector[] {
  const defaultWidth = 100
  const minSteps = 25
  const width = isBox(end) ? end.width : defaultWidth
  const curve = bezierCurve(start, end, spreadOverride)
  const length = curve.length() * 0.8
  const baseTime = Math.random() * minSteps
  const steps = Math.ceil((Math.log2(fitts(length, width) + 1) + baseTime) * 3)
  const re = curve.getLUT(steps)
  return clampPositive(re)
}

const clampPositive = (vectors: Vector[]): Vector[] => {
  const clamp0 = (elem: number): number => Math.max(0, elem)
  return vectors.map(vector => {
    return {
      x: clamp0(vector.x),
      y: clamp0(vector.y)
    }
  })
}
