import { Page } from 'puppeteer'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

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
class ClickAndWaitPlugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'click-and-wait'
  }

  async clickAndWaitForNavigation(this: Page, selector: string, clickOptions, waitOptions) {
    return Promise.all([
      this.waitForNavigation(waitOptions),
      this.click(selector, clickOptions)
    ]).then(values => {
      return values[0]
    })
  }

  async onPageCreated(page: Page) {
    (page as any & PuppeteerExtraPlugin).clickAndWaitForNavigation = this.clickAndWaitForNavigation.bind(page)
  }
}

exports = function(pluginConfig?: {}) {
  return new ClickAndWaitPlugin(pluginConfig)
}
