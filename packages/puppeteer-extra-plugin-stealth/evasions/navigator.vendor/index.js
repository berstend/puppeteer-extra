'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * By default puppeteer will have a fixed `navigator.vendor` property.
 *
 * This plugin makes it possible to change this property.
 *
 * @example
 * const puppeteer = require("puppeteer-extra")
 *
 * const StealthPlugin = require("puppeteer-extra-plugin-stealth")
 * const stealth = StealthPlugin()
 * // Remove this specific stealth plugin from the default set
 * stealth.enabledEvasions.delete("navigator.vendor")
 * puppeteer.use(stealth)
 *
 * // Stealth plugins are just regular `puppeteer-extra` plugins and can be added as such
 * const NavigatorVendorPlugin = require("puppeteer-extra-plugin-stealth/evasions/navigator.vendor")
 * const nvp = NavigatorVendorPlugin({ vendor: 'Apple Computer, Inc.' }) // Custom vendor
 * puppeteer.use(nvp)
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.vendor] - The vendor to use in `navigator.vendor` (default: `Google Inc.`)
 *
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.vendor'
  }

  get defaults() {
    return {
      vendor: 'Google Inc.'
    }
  }

  async onPageCreated(page) {
    this.debug('onPageCreated - Will set these user agent options', {
      opts: this.opts
    })

    await page.evaluateOnNewDocument(v => {
      // Overwrite the `vendor` property to use a custom getter.
      Object.defineProperty(navigator, 'vendor', {
        get: () => v
      })
    }, this.opts.vendor || 'Google Inc.')
  } // onPageCreated
}

const defaultExport = opts => new Plugin(opts)
module.exports = defaultExport
