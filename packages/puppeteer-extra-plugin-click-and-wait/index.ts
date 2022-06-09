import { PuppeteerNavigationOptions, PuppeteerClickOptions, PuppeteerExtraPlugin, PuppeteerPage } from 'puppeteer-extra-plugin'

export interface PluginOptions {
}

export type ExtandPage<Page = PuppeteerPage> = Page & { clickAndWaitForNavigation: (selector: string, clickOptions: PuppeteerClickOptions, waitOptions: PuppeteerNavigationOptions) => Promise<void> };

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
 export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'click-and-wait' {
    return 'click-and-wait'
  }

  async clickAndWaitForNavigation(this: PuppeteerPage, selector: string, clickOptions: PuppeteerClickOptions, waitOptions: PuppeteerNavigationOptions) {
    return Promise.all([
      this.waitForNavigation(waitOptions),
      this.click(selector, clickOptions)
    ]).then(values => {
      return values[0]
    })
  }

  async onPageCreated(page: PuppeteerPage): Promise<void> {
    page.clickAndWaitForNavigation = this.clickAndWaitForNavigation.bind(page)
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
