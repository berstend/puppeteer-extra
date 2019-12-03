'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
const { getChromeRuntimeMock } = require('../shared')

/**
 * Fix for the HEADCHR_IFRAME detection (iframe.contentWindow.chrome), hopefully this time without breaking iframes.
 * Note: Only `srcdoc` powered iframes cause issues due to a chromium bug:
 * https://github.com/puppeteer/puppeteer/issues/1106
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/iframe.contentWindow'
  }

  async onPageCreated(page) {
    await page.evaluateOnNewDocument(
      args => {
        try {
          // Rematerialize serialized functions
          if (args && args.fns) {
            for (const fn of Object.keys(args.fns)) {
              eval(`var ${fn} =  ${args.fns[fn]}`) // eslint-disable-line
            }
          }

          const addChromeRuntime = el => {
            // Adding a contentWindow if not present might not be strictly needed
            if (!el.contentWindow) {
              Object.defineProperty(el, 'contentWindow', {
                configurable: true,
                value: {}
              })
            }

            if (el.contentWindow && !el.contentWindow.chrome) {
              Object.defineProperty(el.contentWindow, 'chrome', {
                configurable: true,
                value: window.chrome ||
                  getChromeRuntimeMock(el.contentWindow) || {
                    runtime: {}
                  }
              })
            }
          }

          // This is sufficient for regular frames but not ones with srcdoc
          if (window.frameElement) {
            addChromeRuntime(window.frameElement)
          }

          /* global document */
          const createElement = {
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
              }

              const iframe = target.apply(thisArg, args)
              const _iframe = iframe
              const _srcdoc = _iframe.srcdoc

              // Add hook for the srcdoc property
              // We need to be surgical here to not break other iframes by accident
              Object.defineProperty(iframe, 'srcdoc', {
                configurable: true, // Important
                get: function() {
                  return _iframe.srcdoc
                },
                set: function(newValue) {
                  addChromeRuntime(this)

                  // Reset property, the hook is only needed once
                  Object.defineProperty(iframe, 'srcdoc', {
                    configurable: true,
                    writable: false,
                    value: _srcdoc
                  })

                  _iframe.srcdoc = newValue
                }
              })

              return iframe
            }
          }

          // All this just due to iframes with srcdoc bug
          document.createElement = new Proxy(
            document.createElement,
            createElement
          )
        } catch (err) {
          // console.warn(err)
        }
      },
      {
        // Serialize functions
        fns: {
          getChromeRuntimeMock: `${getChromeRuntimeMock.toString()}`
        }
      }
    )
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
