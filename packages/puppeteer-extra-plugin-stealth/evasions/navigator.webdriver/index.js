'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Pass the Webdriver Test.
 * Will delete `navigator.webdriver` property.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.webdriver'
  }

  async onPageCreated(page) {
    await page.evaluateOnNewDocument(() => {
      delete Object.getPrototypeOf(navigator).webdriver
    })
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
