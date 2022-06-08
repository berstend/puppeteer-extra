import { PuppeteerExtraPlugin, PuppeteerPage } from 'puppeteer-extra-plugin';

export interface PluginOptions {
  stripHeadless: boolean,
  makeWindows: boolean,
  customFn: null | ((us: string) => string),
}

/**
 * Anonymize the User-Agent on all pages.
 *
 * Supports dynamic replacing, so the Chrome version stays intact and recent.
 *
 * @param {Object} opts - Options
 * @param {boolean} [opts.stripHeadless=true] - Replace `HeadlessChrome` with `Chrome`.
 * @param {boolean} [opts.makeWindows=true] - Sets the platform to Windows 10, 64bit (most common).
 * @param {Function} [opts.customFn=null] - A custom UA replacer function.
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua').default())
 * // or
 * puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua').default({
 *   customFn: (ua) => 'MyCoolAgent/' + ua.replace('Chrome', 'Beer')})
 * )
 * const browser = await puppeteer.launch()
 */
export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'anonymize-ua' {
    return 'anonymize-ua'
  }

  get defaults(): PluginOptions {
    return {
      stripHeadless: true,
      makeWindows: true,
      customFn: null
    }
  }

  async onPageCreated(page: PuppeteerPage): Promise<void> {
    let ua = await page.browser().userAgent()
    if (this.opts.stripHeadless) {
      ua = ua.replace('HeadlessChrome/', 'Chrome/')
    }
    if (this.opts.makeWindows) {
      ua = ua.replace(/\(([^)]+)\)/, '(Windows NT 10.0; Win64; x64)')
    }
    if (this.opts.customFn) {
      ua = this.opts.customFn(ua)
    }
    this.debug('new ua', ua)
    await page.setUserAgent(ua)
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
