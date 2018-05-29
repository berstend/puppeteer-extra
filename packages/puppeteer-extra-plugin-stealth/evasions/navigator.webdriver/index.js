'use strict'

const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

/**
 * Pass the Webdriver Test.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = { }) { super(opts) }

  get name () { return 'stealth/evasions/navigator.webdriver' }

  async onPageCreated (page) {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      })
    })
  }
}

module.exports = function (pluginConfig) { return new Plugin(pluginConfig) }
