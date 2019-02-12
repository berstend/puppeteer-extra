'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Pass the Webdriver Test.
 * Will delete `navigator.webdriver` property.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = {}) {
    super(opts)
  }

  get name () {
    return 'stealth/evasions/navigator.webdriver'
  }

  async onPageCreated (page) {
    // Chrome returns undefined, Firefox false
    await page.evaluateOnNewDocument(() => {
      // eslint-disable-next-line
      const newProto = navigator.__proto__
      delete newProto.webdriver
      // eslint-disable-next-line
      navigator.__proto__ = newProto
    })
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
