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
      Object.defineProperty(window, 'navigator', {
        value: new Proxy(navigator, {
          has: (target, key) => (key === 'webdriver' ? false : key in target),
          get: (target, key) =>
            key === 'webdriver'
              ? undefined
              : typeof target[key] === 'function'
              ? target[key].bind(target)
              : target[key]
        })
      })
    })
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
