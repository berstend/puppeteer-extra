'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Allows faking CPU core number. Overwrites `navigator.hardwareConcurrency`
 * opts.cores : Number of Cores. Integer
 * `puppeteer.use(require('puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency')({'cores':4}));`
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.hardwareConcurrency'
  }

  async onPageCreated(page) {
    await page.evaluateOnNewDocument((cores) => {
      Object.defineProperty(Object.getPrototypeOf(navigator), 'hardwareConcurrency', {get: () => cores});
    }, this.opts.cores || navigator.hardwareConcurrency)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
