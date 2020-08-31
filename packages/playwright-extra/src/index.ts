// Re-export stuff
export { Playwright, Puppeteer, types } from 'automation-extra'
export { PlaywrightExtra } from 'automation-extra'

import { addExtraPlaywright, PlaywrightExtra, types } from 'automation-extra'
import playwrightCore from 'playwright-core'

/**
 * Augment the provided Playwright browser launcher with plugin functionality.
 *
 * Using `addExtra` will always create a fresh PuppeteerExtra instance.
 *
 * @example
 * import playwright from 'playwright'
 * import { addExtra } from 'playwright-extra
 *
 * const chromium = addExtra(playwright.chromium)
 * chromium.use(plugin)
 *
 * @param launcher - Playwright (or compatible) browser launcher
 */
export const addExtra = (launcher: types.PlaywrightBrowserLauncher) =>
  addExtraPlaywright(launcher)

/**
 * The **default export** will behave exactly the same as the regular playwright
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
export const defaultExport = (() => {
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

export default defaultExport
