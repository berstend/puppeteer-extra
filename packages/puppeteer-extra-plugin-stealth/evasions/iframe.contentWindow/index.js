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
        // Add a cache to not recreate the proxy and to keep the same object
        // between two calls (to keep the possible modifications made by the
        // website).
        const proxifyContentWindow = utils.memoize(contentWindow => {
          // If the iframe isn't in the DOM, it has no contentWindow.
          if (contentWindow === null) {
            return null
          }
          return new Proxy(contentWindow, {
            get(target, prop) {
              if (
                prop === 'chrome' &&
                Reflect.get(target, prop) === undefined
              ) {
                return window.chrome
              }
              if (prop === 'navigator') {
                return window.navigator
              }
              return Reflect.get(target, prop)
            }
          })
        })

        const handler = {
          get: function(nativeFn) {
            return proxifyContentWindow(nativeFn())
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
