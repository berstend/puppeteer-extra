'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
const REPLSession = require('./lib/REPLSession')

/**
 * Interrupt your puppeteer code with an interactive REPL.
 *
 * Features tab auto-completion for the given object properties and a colorized prompt.
 *
 * Works with arbitrary objects ands class instances, though `Page` & `Browser` make the most sense. :-)
 *
 * **opts**
 * @param {Object} opts - Options
 * @param {boolean} [opts.addToPuppeteerClass] - If a `.repl()` method should be attached to Puppeteer `Page` and `Browser` instances (default: true).
 *
 * @todo enumerate instance members differently, so e.g. clickAndWaitForNavigation shows up.
 *
 * @example
 * // In this example we don't extend the native puppeteer classes
 *
 * const puppeteer = require('puppeteer-extra')
 * const repl = require('puppeteer-extra-plugin-repl')({ addToPuppeteerClass: false })
 * puppeteer.use(repl)
 *
 * puppeteer.launch({ headless: true }).then(async browser => {
 *   const page = await browser.newPage()
 *   await page.goto('https://example.com')
 *
 *   // Start an interactive REPL here with the `page` instance.
 *   await repl.repl(page)
 *   // Afterwards start REPL with the `repl` instance itself. 🐴
 *   await repl.repl(repl)
 *
 *   await browser.close()
 * })
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'repl'
  }

  get defaults() {
    return { addToPuppeteerClass: true }
  }

  /**
   * Run last so other plugins can extend e.g. Page :-)
   *
   * @ignore
   */
  get requirements() {
    return new Set(['runLast'])
  }

  /**
   * Create an interactive REPL for the provided object.
   *
   * Uses an extended (colorized) readline interface under the hood.
   * Will resolve the returned Promise when the readline interface is closed.
   *
   * If `opts.addToPuppeteerClass` is true (default) then `page.repl()`/`browser.repl()`
   * will point to this method, for convenience.
   *
   * Can be used standalone as well, to inspect an arbitrary class instance or object.
   *
   * @param  {Object} obj - An object or class instance to use in the repl (e.g. `page`, `browser`)
   * @return {Promise}
   *
   * @example
   * const repl = require('puppeteer-extra-plugin-repl')()
   * await repl.repl(<object or class instance to inspect>)
   */
  async repl(obj) {
    return new REPLSession({ obj }).start()
  }

  /**
   * Conditionally add a .repl() method to `page` and `browser` instances.
   *
   * @ignore
   */
  async onPageCreated(page) {
    if (!this.opts.addToPuppeteerClass) {
      return
    }
    page.repl = () => this.repl(page)
    const browser = page.browser()
    browser.repl = () => this.repl(browser)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
