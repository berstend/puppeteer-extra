import type {
  PlaywrightBrowserLauncher,
  PlaywrightBrowsers
} from 'automation-extra'
import { addExtraPlaywright, PlaywrightExtra } from 'automation-extra'
import * as playwrightCore from 'playwright-core'
export * from 'automation-extra'

/**
 * Augment the provided Playwright browser launcher with plugin functionality.
 *
 * Using `addExtra` will always create a fresh PlaywrightExtra instance.
 *
 * @example
 * import playwright from 'playwright'
 * import { addExtra } from 'playwright-extra'
 *
 * const chromium = addExtra(playwright.chromium)
 * chromium.use(plugin)
 *
 * @param launcher - Playwright (or compatible) browser launcher
 */
export const addExtra = (
  launcher: PlaywrightBrowserLauncher
): PlaywrightExtra => addExtraPlaywright(launcher)

const makeProduct = (name: PlaywrightBrowsers): PlaywrightExtra => {
  const launcher = new PlaywrightExtra(name) // So we know what to require later
  return launcher
}

/**
 * This object can be used to launch or connect to Chromium, returning instances of ChromiumBrowser.
 *
 * The **default exports** will behave exactly the same as the regular playwright
 * (just with extra plugin functionality) and can be used as a drop-in replacement.
 *
 * Behind the scenes it will try to require either `playwright`
 * or `playwright-core` from the installed dependencies.
 *
 * Please note that due to imports being cached this will result in a single
 * PlaywrightExtra instance, even when used in different files. If you need multiple
 * instances (e.g. different plugins) please use `addExtra`.
 *
 * @example
 * // javascript import
 * const { chromium } = require('playwright-extra')
 *
 * // typescript/es6 module import
 * import { chromium } from 'playwright-extra'
 *
 * // Add plugins
 * chromium.use(...)
 */
export const chromium = makeProduct('chromium')
/** This object can be used to launch or connect to Firefox, returning instances of FirefoxBrowser. */
export const firefox = makeProduct('firefox')
/** This object can be used to launch or connect to WebKit, returning instances of WebKitBrowser. */
export const webkit = makeProduct('webkit')

/** Returns playwright specific errors */
export const errors = playwrightCore.errors
/** Selectors can be used to install custom selector engines. */
export const selectors = playwrightCore.selectors
/** Returns a list of devices to be used with browser.newContext([options]) or browser.newPage([options]). */
export const devices = playwrightCore.devices

export default {
  addExtra,
  chromium,
  firefox,
  webkit,
  errors,
  selectors,
  devices
}
