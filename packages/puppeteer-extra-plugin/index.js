'use strict'

/**
 * Abstract base class for puppeteer-extra plugins.
 */
class PuppeteerExtraPlugin {
  constructor () {
    this._puppeteer = null
    this._options = null
    this._browser = null
  }

  /**
   * Plugin name.
   *
   * Convention:
   *   "puppeteer-extra-plugin-anonymize-ua"
   *      becomes
   *   "anonymize-ua"
   *
   * @member {string}
   */
  get name () {
    throw new Error('plugin must override "name"')
  }

  get requirements () {
    return new Set([])
  }

  get puppeteer () { return this._puppeteer }
  set puppeteer (puppeteer) { this._puppeteer = puppeteer }

  get browser () { return this._browser }
  set browser (browser) { this._browser = browser }

  get options () { return this._options }
  set options (options) { this._options = options }
}

module.exports = PuppeteerExtraPlugin
