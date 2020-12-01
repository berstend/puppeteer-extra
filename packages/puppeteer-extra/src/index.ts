import type { PuppeteerBrowserLauncher } from 'automation-extra'
import { addExtraPuppeteer, PuppeteerExtra } from 'automation-extra'

export * from 'automation-extra'

/**
 * Augment the provided Puppeteer with plugin functionality.
 *
 * Using `addExtra` will always create a fresh PuppeteerExtra instance.
 *
 * @example
 * import vanillaPuppeteer from 'puppeteer'
 * import { addExtra } from 'puppeteer-extra
 *
 * const puppeteer = addExtra(vanillaPuppeteer)
 * puppeteer.use(plugin)
 *
 * @param launcher - Puppeteer (or compatible) browser launcher
 */
export const addExtra = (launcher: PuppeteerBrowserLauncher): PuppeteerExtra =>
  addExtraPuppeteer(launcher)

/**
 * The **default export** will behave exactly the same as the regular puppeteer
 * (just with extra plugin functionality) and can be used as a drop-in replacement.
 *
 * Behind the scenes it will try to require either `puppeteer`
 * or `puppeteer-core` from the installed dependencies.
 *
 * Please note that due to imports being cached this will result in a single
 * PuppeteerExtra instance, even when used in different files. If you need multiple
 * instances (e.g. different plugins) please use `addExtra`.
 *
 * @example
 * // javascript import
 * const puppeteer = require('puppeteer-extra')
 *
 * // typescript/es6 module import
 * import puppeteer from 'puppeteer-extra'
 *
 * // Add plugins
 * puppeteer.use(...)
 */
const defaultExport: PuppeteerExtra = (() => {
  const launcher = new PuppeteerExtra()
  return launcher
})()

export default defaultExport
