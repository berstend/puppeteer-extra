import type {
  PlaywrightBrowsers,
  PlaywrightBrowserLauncher,
  PuppeteerBrowserLauncher
} from './types'
// import type * as types from './types'
import type * as pw from 'playwright-core'
import type * as pptr from 'puppeteer'

import { PlaywrightExtra } from './playwright'
import { PuppeteerExtra } from './puppeteer'

export * from './types'
export type { pw as Playwright }
export type { pptr as Puppeteer }

export { PlaywrightExtra } from './playwright'
export { PuppeteerExtra } from './puppeteer'
export { AutomationExtraBase } from './base'

/**
 * Augment a Puppeteer or Playwright API compatible browser launcher with plugin functionality.
 * Note: We can't use `addExtra` here as we wildcard export this file in `playwright-extra` and `puppeteer-extra`
 *
 * @param launcher - Puppeteer or Playwright API compatible browser launcher
 * @private
 */
export const _addExtra = (
  launcher: PuppeteerBrowserLauncher | PlaywrightBrowserLauncher
): PuppeteerExtra | PlaywrightExtra => {
  // General checks
  if (!launcher || typeof launcher !== 'object') {
    throw new Error('Invalid browser launcher: Expected object.')
  }
  if (!('launch' in launcher || 'connect' in launcher)) {
    throw new Error(
      'Invalid browser launcher: Must provide "launch" or "connect" method.'
    )
  }

  // Check for Playwright
  if ('name' in launcher) {
    const validBrowserNames: PlaywrightBrowsers[] = [
      'chromium',
      'firefox',
      'webkit'
    ]
    const hasValidBrowserName = validBrowserNames.includes(
      launcher.name() as PlaywrightBrowsers
    )
    if (!hasValidBrowserName) {
      throw new Error(
        `Invalid Playwright launcher: Unexpected browser name "${launcher.name()}".`
      )
    }
    return new PlaywrightExtra(launcher)
  }

  // Everything else we treat as Puppeteer or a custom puppeteer-like implementation
  return new PuppeteerExtra(launcher)
}

/**
 * Augment the provided Playwright browser launcher with plugin functionality.
 *
 * @example
 * import playwright from 'playwright'
 * const chromium = addExtra(playwright.chromium)
 * chromium.use(plugin)
 *
 * @param launcher - Playwright (or compatible) browser launcher
 */
export const addExtraPlaywright = (
  launcher: PlaywrightBrowserLauncher
): PlaywrightExtra => _addExtra(launcher) as PlaywrightExtra

/**
 * Augment the provided Puppeteer browser launcher with plugin functionality.
 *
 * @example
 * import vanillaPuppeteer from 'puppeteer'
 * const puppeteer = addExtra(vanillaPuppeteer)
 * puppeteer.use(plugin)
 *
 * @param launcher - Puppeteer (or compatible) browser launcher
 */
export const addExtraPuppeteer = (
  launcher: PuppeteerBrowserLauncher
): PuppeteerExtra => _addExtra(launcher) as PuppeteerExtra
