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
        const getContentWindowProxy = iframe => {
          return new Proxy(window, {
            get(target, key, proxy) {
              // We actually make this thing behave like a regular iframe window,
              // by intercepting calls to e.g. `.self` and redirect it to the correct thing. :)
              // That makes it possible for these assertions to be correct:
              // iframe.contentWindow.self === window.top // must be false
              if (key === 'self') {
                return proxy
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

        const cache = new Map([[null, null]]);
        const handler = {
          get: function(nativeFn) {
            const native = nativeFn();
            if (!cache.has(native)) {
                cache.set(native, getContentWindowProxy(this));
            }
            return cache.get(native);
          }
        }

        utils.replaceGetterSetter(
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
