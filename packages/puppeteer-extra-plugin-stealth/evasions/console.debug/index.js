'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Pass toString test, though it breaks console.debug() from working
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/console.debug'
  }

  async onPageCreated(page) {
    await page.evaluateOnNewDocument(() => {
      window.console.debug = () => {
        return null
      }
    })
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
