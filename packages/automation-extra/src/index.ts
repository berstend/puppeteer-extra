import * as types from './types'

import { PlaywrightExtra } from './playwright'
import { PuppeteerExtra } from './puppeteer'

// Re-export stuff
export * from './playwright'
export * from './puppeteer'
export * from './types'

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

// import playwrightCore from 'playwright-core'
export const playwrightModule = (() => {
  const playwrightCore = require('playwright-core')

  const makeProduct = (name: types.PlaywrightBrowsers) => {
    const launcher = new PlaywrightExtra()
    launcher.productName = name // So we know what to require later
    return launcher
  }
  return {
    chromium: makeProduct('chromium'),
    firefox: makeProduct('firefox'),
    webkit: makeProduct('webkit'),

    errors: playwrightCore.errors,
    selectors: playwrightCore.selectors,
    devices: playwrightCore.devices
  }
})()
