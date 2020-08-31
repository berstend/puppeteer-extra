import type * as types from './types'

import { PlaywrightExtra } from './playwright'
import { PuppeteerExtra } from './puppeteer'

// Re-export stuff
export * as Playwright from './playwright'
export * as Puppeteer from './puppeteer'
export * as types from './types'

export { PlaywrightExtra } from './playwright'
export { PuppeteerExtra } from './puppeteer'
export { AutomationExtraBase } from './base'

/**
 * Augment a Puppeteer or Playwright API compatible browser launcher with plugin functionality.
 *
 * @param launcher - Puppeteer or Playwright API compatible browser launcher
 */
export const addExtra = (
  launcher: types.PuppeteerBrowserLauncher | types.PlaywrightBrowserLauncher
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
    const validBrowserNames: types.PlaywrightBrowsers[] = [
      'chromium',
      'firefox',
      'webkit'
    ]
    const hasValidBrowserName = validBrowserNames.includes(
      launcher.name() as types.PlaywrightBrowsers
    )
    if (!hasValidBrowserName) {
      throw new Error(
        `Invalid Playwright launcher: Unexpected browser name "${launcher.name}".`
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
  launcher: types.PlaywrightBrowserLauncher
): PlaywrightExtra => addExtra(launcher) as PlaywrightExtra

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
  launcher: types.PuppeteerBrowserLauncher
): PuppeteerExtra => addExtra(launcher) as PuppeteerExtra
