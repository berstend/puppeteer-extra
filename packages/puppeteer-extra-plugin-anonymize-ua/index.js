'use strict'

const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

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
 * puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
 * // or
 * puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')({
 *   customFn: (ua) => 'MyCoolAgent/' + ua.replace('Chrome', 'Beer')})
 * )
 * const browser = await puppeteer.launch()
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = { }) {
    super(opts)

    const defaults = {
      stripHeadless: true,
      makeWindows: true,
      customFn: null
    }
    this._opts = Object.assign(defaults, opts)
  }

  get name () { return 'anonymize-ua' }

  async onPageCreated (page) {
    let ua = await page.browser().userAgent()
    if (this._opts.stripHeadless) {
      ua = ua.replace('HeadlessChrome/', 'Chrome/')
    }
    if (this._opts.makeWindows) {
      ua = ua.replace(/\(([^)]+)\)/, '(Windows NT 10.0; Win64; x64)')
    }
    if (this._opts.customFn) {
      ua = this._opts.customFn(ua)
    }
    this.debug('new ua', ua)
    await page.setUserAgent(ua)
  }
}

module.exports = function (pluginConfig) { return new Plugin(pluginConfig) }
