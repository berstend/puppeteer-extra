'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const withUtils = require('../_utils/withUtils')

/**
 * Fix for the HEADCHR_IFRAME detection (iframe.contentWindow.chrome), hopefully this time without breaking iframes.
 * Note: Only `srcdoc` powered iframes cause issues due to a chromium bug:
 *
 * https://github.com/puppeteer/puppeteer/issues/1106
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/iframe.contentWindow'
  }

  get requirements() {
    // Make sure `chrome.runtime` has ran, we use data defined by it (e.g. `window.chrome`)
    return new Set(['runLast'])
  }

  async onPageCreated(page) {
    await withUtils(page).evaluateOnNewDocument((utils, opts) => {
      try {
        const cache = new Map()

        // Adds a contentWindow proxy to the provided iframe element
        const proxifyContentWindow = iframe => {
          return new Proxy(window, {
            get(target, key) {
              // We actually make this thing behave like a regular iframe window,
              // by intercepting calls to e.g. `.self` and redirect it to the correct thing. :)
              // That makes it possible for these assertions to be correct:
              // iframe.contentWindow.self === window.top // must be false
              if (key === 'self') {
                return cache.get(iframe)
              }
              // iframe.contentWindow.frameElement === iframe // must be true
              if (key === 'frameElement') {
                return iframe
              }
              // Intercept iframe.contentWindow[0] to hide the property 0 added by the proxy.
              if (key === '0') {
                return undefined
              }
              return Reflect.get(target, key)
            }
          })
        }

        const handler = {
          configurable: true,
          enumerable: true,
          get: function contentWindow() {
            if (!this.isConnected) {
              return null
            }
            if (!cache.has(this)) {
              cache.set(this, proxifyContentWindow(this))
            }
            return cache.get(this)
          }
        }

        Object.defineProperty(
          // eslint-disable-next-line no-undef
          HTMLIFrameElement.prototype,
          'contentWindow',
          handler
        )
      } catch (err) {
        // console.warn(err)
      }
    })
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
