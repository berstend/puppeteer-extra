/// <reference path="./puppeteer-legacy.d.ts" />
import { VanillaPuppeteer } from './deps';
export { VanillaPuppeteer, PuppeteerLaunchOption, BrowserEventOptions, PuppeteerExtraPlugin } from './deps';

import PuppeteerExtra from './PuppeteerExtra';

/**
 * An **alternative way** to use `puppeteer-extra`: Augments the provided puppeteer with extra plugin functionality.
 *
 * This is useful in case you need multiple puppeteer instances with different plugins or to add plugins to a non-standard puppeteer package.
 *
 * @example
 * // js import
 * const { addExtra } = require('puppeteer-extra')
 *
 * // ts/es6 import
 * import { addExtra } from 'puppeteer-extra'
 *
 * // Patch e.g. puppeteer-firefox and add plugins
 * const puppeteer = addExtra(require('puppeteer-firefox'))
 * puppeteer.use(...)
 *
 * @param puppeteer Any puppeteer API-compatible puppeteer implementation or version.
 * @return A fresh PuppeteerExtra instance using the provided puppeteer
 */
export const addExtra = (puppeteer: VanillaPuppeteer): PuppeteerExtra =>
  new PuppeteerExtra(puppeteer)

/**
 * Attempt to require puppeteer or puppeteer-core from dependencies.
 * To stay backwards compatible with the existing default export we have to do some gymnastics here.
 *
 * @return Either a Puppeteer instance or an Error, which we'll throw later if need be.
 * @private
 */
function requireVanillaPuppeteer(): [VanillaPuppeteer?, Error?] {
  try {
    return [require('puppeteer-core'), undefined]
  } catch (_) {
    // noop
  }
  try {
    return [require('puppeteer'), undefined]
  } catch (err) {
    return [undefined, err as Error]
  }
}

/**
 * The **default export** will behave exactly the same as the regular puppeteer
 * (just with extra plugin functionality) and can be used as a drop-in replacement.
 *
 * Behind the scenes it will try to require either `puppeteer`
 * or [`puppeteer-core`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteer-vs-puppeteer-core)
 * from the installed dependencies.
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
  return new PuppeteerExtra(...requireVanillaPuppeteer())
})()

export default defaultExport
