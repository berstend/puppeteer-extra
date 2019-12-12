'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const userInfo = msg => {
  console.log(`INFO: puppeteer-extra-plugin-stealth(user-agent-language-platform): ${msg}`)
}

/**
 * By default puppeteer will have a fixed locale setting, represented in the `Accept-Language` header and in `navigator.languages`.
 * In addition, the `navigator.platform` and `navigator.vendor` properties are always set to the host values, so for example platform `Linux` which makes detection very easy.
 * 
 * This plugin fixes these issues. Please know that you cannot use the regular ``page.setUserAgent()`` puppeteer call in your code,
 * as it will reset the language and platform values you set with this plugin.
 *
 * @example
 * const puppeteer = require("puppeteer-extra")
 *
 * const StealthPlugin = require("puppeteer-extra-plugin-stealth")
 * const stealth = StealthPlugin()
 * // Remove this specific stealth plugin from the default set
 * stealth.enabledEvasions.delete("user-agent-language-platform")
 * puppeteer.use(stealth)
 *
 * // Stealth plugins are just regular `puppeteer-extra` plugins and can be added as such
 * const UserAgentLanguagePlatformPlugin = require("puppeteer-extra-plugin-stealth/evasions/user-agent-language-platform")
 * const ualpp = UserAgentLanguagePlatformPlugin({ userAgent: "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)", locale: "de-DE,de;q=0.9", platform: "Win32", vendor: 'Google Inc.' }) // Custom UA, locale, platform and vendor
 * puppeteer.use(ualpp)
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.userAgent] - The user agent to use (default: browser.userAgent())
 * @param {string} [opts.locale] - The locale to use in `Accept-Language` header and in `navigator.languages` (default: `en-US,en;q=0.9`)
 * @param {string} [opts.platform] - The platform to use in `navigator.platform` (default: `Win32`)
 * @param {string} [opts.vendor] - The vendor to use in `navigator.vendor` (default: `Google Inc.`)
 *
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/user-agent-language-platform'
  }

  get defaults() {
    return { userAgent: null, acceptLanguage: 'en-US,en;q=0.9', platform: 'Win32', vendor: 'Google Inc.' }
  }

  async onPageCreated(page) {
    this.debug('onPageCreated - Will set these user agent options', {
      opts: this.opts
    })
    console.log("opts", this.opts)

    page._client.send('Network.setUserAgentOverride', { userAgent: this.opts.userAgent || (await page.browser().userAgent()), acceptLanguage: this.opts.locale || 'en-US,en;q=0.9', platform: this.opts.platform || 'Win32' })    

    await page.evaluateOnNewDocument((v) => {
        // Overwrite the `vendor` property to use a custom getter.
        Object.defineProperty(navigator, 'vendor', {
            get: () => v
        })
    }, this.opts.vendor || 'Google Inc.')
  } // onPageCreated
}

const defaultExport = opts => new Plugin(opts)
module.exports = defaultExport
