'use strict'

const os = require('os')

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
const {
  resolveChromiumIdentity,
  formatUserAgentOverride
} = require('../_identity')

/**
 * Fixes the UserAgent info (composed of UA string, Accept-Language, Platform, and UA hints).
 *
 * If you don't provide any values this plugin will default to using the regular UserAgent string (while stripping the headless part).
 * Default language is set to "en-US,en", the other settings match the UserAgent string.
 * Linux masking is opt-in and can be enabled with the `maskLinux` option.
 *
 * By default puppeteer will not set a `Accept-Language` header in headless:
 * It's (theoretically) possible to fix that using either `page.setExtraHTTPHeaders` or a `--lang` launch arg.
 * Unfortunately `page.setExtraHTTPHeaders` will lowercase everything and launch args are not always available. :)
 *
 * In addition, the `navigator.platform` property is always set to the host value, e.g. `Linux` which makes detection very easy.
 *
 * Note: You cannot use the regular `page.setUserAgent()` puppeteer call in your code,
 * as it will reset the language and platform values you set with this plugin.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)

    this._framework = 'puppeteer'
    this._headless = true
    this._launchContext = 'launch'
    this._launchOptions = {}
    this._resolvedIdentityPromise = null
  }

  get name() {
    return 'stealth/evasions/user-agent-override'
  }

  get dependencies() {
    return new Set(['user-preferences'])
  }

  get defaults() {
    return {
      userAgent: null,
      locale: 'en-US,en',
      maskLinux: false
    }
  }

  async onPluginRegistered(env = {}) {
    if (env.framework) {
      this._framework = env.framework
    }
  }

  async beforeLaunch(options) {
    this._launchContext = 'launch'
    this._launchOptions = { ...(options || {}) }
    this._headless = options.headless !== false
    this._resolvedIdentityPromise = null
    return options
  }

  async beforeConnect() {
    this._launchContext = 'connect'
    this._launchOptions = {}
    this._headless = true
    this._resolvedIdentityPromise = null
  }

  async beforeContext(options = {}, browser) {
    if (this._framework !== 'playwright') {
      return options
    }

    const identity = await this._resolveIdentity(browser)
    return {
      ...options,
      locale: options.locale || identity.locale,
      userAgent: options.userAgent || identity.userAgent
    }
  }

  async onPageCreated(page) {
    const browser =
      typeof page.browser === 'function' ? page.browser() || page : page
    const identity = await this._resolveIdentity(browser)
    const override = formatUserAgentOverride(identity, {
      includeAcceptLanguage: this._framework !== 'playwright' && this._headless
    })

    this.debug('onPageCreated - Will set these user agent options', {
      override,
      opts: this.opts,
      framework: this._framework,
      launchContext: this._launchContext
    })

    const client =
      typeof page._client === 'function' ? page._client() : page._client
    await client.send('Network.setUserAgentOverride', override)
  }

  _getRuntimeHints() {
    if (this._launchContext !== 'launch') {
      return {
        runtimeArch: null,
        runtimePlatformVersion: null
      }
    }

    return {
      runtimeArch: os.arch(),
      runtimePlatformVersion: os.platform() === 'darwin' ? os.release() : null
    }
  }

  async _getBrowserVersion(browser) {
    if (browser && typeof browser.version === 'function') {
      return await browser.version()
    }

    const client =
      browser &&
      (typeof browser._client === 'function' ? browser._client() : browser._client)
    if (client && typeof client.send === 'function') {
      const data = await client.send('Browser.getVersion')
      return data.product || data.userAgent || null
    }

    return null
  }

  async _resolveIdentity(browser) {
    if (!this._resolvedIdentityPromise) {
      this._resolvedIdentityPromise = (async () => {
        const rawUserAgent =
          this.opts.userAgent ||
          (browser && typeof browser.userAgent === 'function'
            ? await browser.userAgent()
            : '')
        const browserVersion = await this._getBrowserVersion(browser)
        const runtimeHints = this._getRuntimeHints()

        return resolveChromiumIdentity({
          browserVersion,
          userAgent: rawUserAgent,
          locale: this.opts.locale,
          maskLinux: this.opts.maskLinux,
          customUserAgent: !!this.opts.userAgent,
          framework: this._framework,
          headless: this._headless,
          runtimeArch: runtimeHints.runtimeArch,
          runtimePlatformVersion: runtimeHints.runtimePlatformVersion,
          executablePath: this._launchOptions.executablePath,
          channel: this._launchOptions.channel
        })
      })().catch(error => {
        this._resolvedIdentityPromise = null
        throw error
      })
    }

    return this._resolvedIdentityPromise
  }

  get data() {
    return [
      {
        name: 'userPreferences',
        value: {
          intl: { accept_languages: this.opts.locale || 'en-US,en' }
        }
      }
    ]
  }
}

const defaultExport = opts => new Plugin(opts)
module.exports = defaultExport
