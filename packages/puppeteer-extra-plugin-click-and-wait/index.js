'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Convenience function to wait for navigation to complete after clicking on an element.
 *
 * Adds a new `page.clickAndWaitForNavigation(selector, clickOptions, waitOptions)` method.
 *
 * See this issue for more context: https://github.com/GoogleChrome/puppeteer/issues/1421
 *
 * > Note: Be wary of ajax powered pages where the navigation event is not triggered.
 *
 * @example
 * await page.clickAndWaitForNavigation('input#submitData')
 *
 * // as opposed to:
 *
 * await Promise.all([
 *   page.waitForNavigation(waitOptions),
 *   page.click('input#submitData', clickOptions),
 * ])
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'click-and-wait'
  }

  async clickAndWaitForNavigation(selector, clickOptions, waitOptions) {
    return Promise.all([
      this.waitForNavigation(waitOptions),
      this.click(selector, clickOptions)
    ]).then(values => {
      return values[0]
    })
  }

  async onPageCreated(page) {
    page.clickAndWaitForNavigation = this.clickAndWaitForNavigation.bind(page)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
