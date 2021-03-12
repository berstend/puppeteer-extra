// Taken from: https://github.com/Xetera/ghost-cursor/blob/master/src/math.ts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Bezier = require('bezier-js') as typeof BezierJs.Bezier

export interface Vector {
  x: number
  y: number
}
export const origin: Vector = { x: 0, y: 0 }

// maybe i should've just imported a vector library lol
export const sub = (a: Vector, b: Vector): Vector => ({
  x: a.x - b.x,
  y: a.y - b.y
})
export const div = (a: Vector, b: number): Vector => ({
  x: a.x / b,
  y: a.y / b
})
export const mult = (a: Vector, b: number): Vector => ({
  x: a.x * b,
  y: a.y * b
})
export const add = (a: Vector, b: Vector): Vector => ({
  x: a.x + b.x,
  y: a.y + b.y
})

export const direction = (a: Vector, b: Vector): Vector => sub(b, a)
export const perpendicular = (a: Vector): Vector => ({ x: a.y, y: -1 * a.x })
export const magnitude = (a: Vector): number =>
  Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2))
export const unit = (a: Vector): Vector => div(a, magnitude(a))
export const setMagnitude = (a: Vector, amount: number): Vector =>
  mult(unit(a), amount)

export const randomNumberRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min

export const randomVectorOnLine = (a: Vector, b: Vector): Vector => {
  const vec = direction(a, b)
  const multiplier = Math.random()
  return add(a, mult(vec, multiplier))
}

const randomNormalLine = (
  a: Vector,
  b: Vector,
  range: number
): [Vector, Vector] => {
  const randMid = randomVectorOnLine(a, b)
  const normalV = setMagnitude(perpendicular(direction(a, randMid)), range)
  return [randMid, normalV]
}

export const generateBezierAnchors = (
  a: Vector,
  b: Vector,
  spread: number
): [Vector, Vector] => {
  const side = Math.round(Math.random()) === 1 ? 1 : -1
  const calc = (): Vector => {
    const [randMid, normalV] = randomNormalLine(a, b, spread)
    const choice = mult(normalV, side)
    return randomVectorOnLine(randMid, add(randMid, choice))
  }
  return [calc(), calc()].sort((a, b) => a.x - b.x) as [Vector, Vector]
}

const clamp = (target: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, target))

export const overshoot = (coordinate: Vector, radius: number): Vector => {
  const a = Math.random() * 2 * Math.PI
  const rad = radius * Math.sqrt(Math.random())
  const vector = { x: rad * Math.cos(a), y: rad * Math.sin(a) }
  return add(coordinate, vector)
}

export const bezierCurve = (
  start: Vector,
  finish: Vector,
  overrideSpread?: number
): BezierJs.Bezier => {
  // could be played around with
  const min = 2
  const max = 200
  const vec = direction(start, finish)
  const length = magnitude(vec)
  const spread = clamp(length, min, max)
  const anchors = generateBezierAnchors(start, finish, overrideSpread ?? spread)
  return new Bezier(start, ...anchors, finish)
}
