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
        // Adds a contentWindow proxy to the provided iframe element
        const addContentWindowProxy = iframe => {
          const contentWindowProxy = {
            get(target, key) {
              // Now to the interesting part:
              // We actually make this thing behave like a regular iframe window,
              // by intercepting calls to e.g. `.self` and redirect it to the correct thing. :)
              // That makes it possible for these assertions to be correct:
              // iframe.contentWindow.self === window.top // must be false
              if (key === 'self') {
                return this
              }
              // iframe.contentWindow.frameElement === iframe // must be true
              if (key === 'frameElement') {
                return iframe
              }
              return Reflect.get(target, key)
            }
          }

          if (!iframe.contentWindow) {
            const proxy = new Proxy(window, contentWindowProxy)
            Object.defineProperty(iframe, 'contentWindow', {
              get() {
                return proxy
              },
              set(newValue) {
                return newValue // contentWindow is immutable
              },
              enumerable: true,
              configurable: false
            })
          }
        }

        // Handles iframe element creation, augments `srcdoc` property so we can intercept further
        const handleIframeCreation = (target, thisArg, args) => {
          const iframe = target.apply(thisArg, args)

          // We need to keep the originals around
          const _iframe = iframe
          const _srcdoc = _iframe.srcdoc

          // Add hook for the srcdoc property
          // We need to be very surgical here to not break other iframes by accident
          Object.defineProperty(iframe, 'srcdoc', {
            configurable: true, // Important, so we can reset this later
            get: function() {
              return _iframe.srcdoc
            },
            set: function(newValue) {
              addContentWindowProxy(this)
              // Reset property, the hook is only needed once
              Object.defineProperty(iframe, 'srcdoc', {
                configurable: false,
                writable: false,
                value: _srcdoc
              })
              _iframe.srcdoc = newValue
            }
          })
          return iframe
        }

        // Adds a hook to intercept iframe creation events
        const addIframeCreationSniffer = () => {
          /* global document */
          const createElementHandler = {
            // Make toString() native
            get(target, key) {
              return Reflect.get(target, key)
            },
            apply: function(target, thisArg, args) {
              const isIframe =
                args && args.length && `${args[0]}`.toLowerCase() === 'iframe'
              if (!isIframe) {
                // Everything as usual
                return target.apply(thisArg, args)
              } else {
                return handleIframeCreation(target, thisArg, args)
              }
            }
          }
          // All this just due to iframes with srcdoc bug
          utils.replaceWithProxy(
            document,
            'createElement',
            createElementHandler
          )
        }

        // Let's go
        addIframeCreationSniffer()
      } catch (err) {
        // console.warn(err)
      }
    })
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
