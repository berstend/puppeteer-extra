// Heavily based on: https://github.com/Xetera/ghost-cursor/blob/master/src/spoof.ts
import { Vector, direction, magnitude, origin, overshoot } from './math'
import * as calc from './calc'

import type { Puppeteer, Playwright } from 'automation-extra-plugin'
import type { Box } from './types'

type Page = Puppeteer.Page | Playwright.Page
type ElementHandle = Puppeteer.ElementHandle | Playwright.ElementHandle

/**
 * Type guard, will make TypeScript understand which type we're working with.
 */
function isPlaywrightPage(obj: any): obj is Playwright.Page {
  return 'unroute' in (obj as Playwright.Page)
}

/**
 * Type guard, will make TypeScript understand which type we're working with.
 */
function isPlaywrightElementHandle(obj: any): obj is Playwright.ElementHandle {
  return !('$x' in (obj as Playwright.ElementHandle))
}

interface BoxOptions {
  readonly paddingPercentage: number
}
interface MoveOptions extends BoxOptions {
  readonly waitForSelector: number
}
interface ClickOptions extends MoveOptions {
  readonly waitForClick: number
}

// Helper function to wait a specified number of milliseconds
const delay = async (ms: number): Promise<void> =>
  await new Promise(resolve => setTimeout(resolve, ms))

// Get a random point on a box
const getRandomBoxPoint = (
  { x, y, width, height }: Box,
  options?: BoxOptions
): Vector => {
  let paddingWidth = 0
  let paddingHeight = 0

  if (
    options?.paddingPercentage !== undefined &&
    options?.paddingPercentage > 0 &&
    options?.paddingPercentage < 100
  ) {
    paddingWidth = (width * options.paddingPercentage) / 100
    paddingHeight = (height * options.paddingPercentage) / 100
  }

  return {
    x: x + paddingWidth / 2 + Math.random() * (width - paddingWidth),
    y: y + paddingHeight / 2 + Math.random() * (height - paddingHeight)
  }
}

// Get a random point on a browser window
// export const getRandomPagePoint = async (page: Page): Promise<Vector> => {
//   const targetId: string = (page.target() as any)._targetId
//   const window = await (page as any)._client.send(
//     'Browser.getWindowForTarget',
//     { targetId }
//   )
//   return getRandomBoxPoint({
//     x: origin.x,
//     y: origin.y,
//     width: window.bounds.width,
//     height: window.bounds.height
//   })
// }

// Using this method to get correct position of Inline elements (elements like <a>)
const getElementBox = async (
  page: Page,
  element: ElementHandle,
  relativeToMainFrame: boolean = true
): Promise<Box | null> => {
  if (isPlaywrightPage(page)) {
    // TODO: Check if in main frame
    return await element.boundingBox()
  }

  if (
    (element as any)._remoteObject === undefined ||
    (element as any)._remoteObject.objectId === undefined
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return null
  }
  const quads = await (page as any)._client.send('DOM.getContentQuads', {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    objectId: (element as any)._remoteObject.objectId
  })
  const elementBox = {
    x: quads.quads[0][0],
    y: quads.quads[0][1],
    width: quads.quads[0][4] - quads.quads[0][0],
    height: quads.quads[0][5] - quads.quads[0][1]
  }
  if (elementBox === null) {
    return null
  }
  if (!relativeToMainFrame) {
    const elementFrame = ((element as Puppeteer.ElementHandle).executionContext() as any).frame()
    const iframes = await elementFrame.parentFrame().$x('//iframe')
    let frame = null
    for (const iframe of iframes) {
      if ((await iframe.contentFrame()) === elementFrame) frame = iframe
    }
    if (frame !== null) {
      const boundingBox = await (frame as ElementHandle).boundingBox()
      elementBox.x =
        boundingBox !== null ? elementBox.x - boundingBox.x : elementBox.x
      elementBox.y =
        boundingBox !== null ? elementBox.y - boundingBox.y : elementBox.y
    }
  }
  return elementBox
}

const overshootThreshold = 500
const shouldOvershoot = (a: Vector, b: Vector): boolean =>
  magnitude(direction(a, b)) > overshootThreshold

export const createCursor = (
  page: Page,
  start: Vector = origin,
  performRandomMoves: boolean = false
) => {
  // this is kind of arbitrary, not a big fan but it seems to work
  const overshootSpread = 10
  const overshootRadius = 120
  let previous: Vector = start

  // Initial state: mouse is not moving
  let moving: boolean = false

  // Move the mouse over a number of vectors
  const tracePath = async (
    vectors: Iterable<Vector>,
    abortOnMove: boolean = false
  ): Promise<void> => {
    for (const v of vectors) {
      try {
        // In case this is called from random mouse movements and the users wants to move the mouse, abort
        if (abortOnMove && moving) {
          return
        }
        await page.mouse.move(v.x, v.y)
        previous = v
      } catch (error) {
        // Exit function if the browser is no longer connected
        const isConnected = isPlaywrightPage(page)
          ? page.context().browser()?.isConnected
          : page.browser().isConnected()
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!isConnected) return

        console.log('Warning: could not move mouse, error message:', error)
      }
    }
  }

  // Start random mouse movements. Function recursively calls itself
  // const randomMove = async (): Promise<void> => {
  //   try {
  //     if (!moving) {
  //       const rand = await getRandomPagePoint(page)
  //       await tracePath(path(previous, rand), true)
  //       previous = rand
  //     }
  //     await delay(Math.random() * 2000) // wait max 2 seconds
  //     randomMove().then(
  //       _ => {},
  //       _ => {}
  //     ) // fire and forget, recursive function
  //   } catch (_) {
  //     console.log('Warning: stopping random mouse movements')
  //   }
  // }

  const actions = {
    toggleRandomMove(random: boolean): void {
      moving = !random
    },

    async click(
      selector?: string | ElementHandle,
      options?: ClickOptions
    ): Promise<void> {
      actions.toggleRandomMove(false)

      if (selector !== undefined) {
        await actions.move(selector, options)
        actions.toggleRandomMove(false)
      }

      try {
        await page.mouse.down()
        if (options?.waitForClick !== undefined) {
          await delay(options.waitForClick)
        }
        await page.mouse.up()
      } catch (error) {
        console.log('Warning: could not click mouse, error message:', error)
      }

      await delay(Math.random() * 2000)
      actions.toggleRandomMove(true)
    },
    async move(selector: string | ElementHandle, options?: MoveOptions) {
      actions.toggleRandomMove(false)
      let elem: ElementHandle | null = null
      if (typeof selector === 'string') {
        if (selector.includes('//')) {
          if (options?.waitForSelector !== undefined) {
            // TODO: Refactor and make Playwright compatible
            // @see xpath: https://stackoverflow.com/a/59924073
            // await page.waitForXPath(selector, {
            //   timeout: options.waitForSelector
            // })
          }
          // elem = await page.$x(selector)
        } else {
          if (options?.waitForSelector !== undefined) {
            // await page.waitForSelector(selector, {
            //   timeout: options.waitForSelector
            // })
          }
          elem = await page.$(selector)
        }
        if (elem === null) {
          throw new Error(
            `Could not find element with selector "${selector}", make sure you're waiting for the elements with "puppeteer.waitForSelector"`
          )
        }
      } else {
        elem = selector
      }

      // Make sure the object is in view
      if (isPlaywrightElementHandle(elem)) {
        await elem.scrollIntoViewIfNeeded()
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        if (
          (elem as any)._remoteObject !== undefined &&
          (elem as any)._remoteObject.objectId !== undefined
        ) {
          await (page as any)._client.send('DOM.scrollIntoViewIfNeeded', {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            objectId: (elem as any)._remoteObject.objectId
          })
        }
      }

      const box = await getElementBox(page, elem)
      if (box === null) {
        throw new Error(
          "Could not find the dimensions of the element you're clicking on, this might be a bug?"
        )
      }
      const { height, width } = box
      const destination = getRandomBoxPoint(box, options)
      const dimensions = { height, width }
      const overshooting = shouldOvershoot(previous, destination)
      const to = overshooting
        ? overshoot(destination, overshootRadius)
        : destination
      await tracePath(calc.path(previous, to))

      if (overshooting) {
        const correction = calc.path(
          to,
          { ...dimensions, ...destination },
          overshootSpread
        )

        await tracePath(correction)
      }
      previous = destination

      actions.toggleRandomMove(true)
    },
    async moveTo(destination: Vector) {
      actions.toggleRandomMove(false)
      await tracePath(calc.path(previous, destination))
      actions.toggleRandomMove(true)
    }
  }

  // Start random mouse movements. Do not await the promise but return immediately
  // if (performRandomMoves)
  // TODO: Fix random move thing
  // randomMove().then(
  //   _ => {},
  //   _ => {}
  // )

  return actions
}
