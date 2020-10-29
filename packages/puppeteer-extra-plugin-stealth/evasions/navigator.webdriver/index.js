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

  // Pre Chrome 88.0.4291.0
  async onPageCreated(page) {
    await page.evaluateOnNewDocument(() => {
      delete Object.getPrototypeOf(navigator).webdriver
    })
  }

  // Post Chrome 88.0.4291.0
  async beforeLaunch(options) {
    options.args.push(`--disable-blink-features=AutomationControlled`)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
