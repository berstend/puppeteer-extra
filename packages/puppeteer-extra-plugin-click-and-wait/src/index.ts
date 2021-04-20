import { Page } from 'puppeteer'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

// copy from pptr 8.0.0
type PuppeteerLifeCycleEvent =
  | 'load'
  | 'domcontentloaded'
  | 'networkidle0'
  | 'networkidle2';

// copy from pptr 8.0.0
interface WaitForOptions {
  /**
   * Maximum wait time in milliseconds, defaults to 30 seconds, pass `0` to
   * disable the timeout.
   *
   * @remarks
   * The default value can be changed by using the
   * {@link Page.setDefaultTimeout} or {@link Page.setDefaultNavigationTimeout}
   * methods.
   */
  timeout?: number;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
}

// copy from pptr 8.0.0
type MouseButton = 'left' | 'right' | 'middle';

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

  async clickAndWaitForNavigation(this: Page, selector: string, clickOptions?: {
        delay?: number;
        button?: MouseButton;
        clickCount?: number;
    }, waitOptions?: WaitForOptions) {
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
