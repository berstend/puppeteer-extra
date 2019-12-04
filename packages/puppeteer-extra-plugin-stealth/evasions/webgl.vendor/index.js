'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Fix WebGL Vendor/Renderer being set to Google in headless mode
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/webgl.vendor'
  }

  /* global WebGLRenderingContext */
  async onPageCreated(page) {
    // Chrome returns undefined, Firefox false
    await page.evaluateOnNewDocument(() => {
      try {
        // Remove traces of our Proxy ;-)
        var stripErrorStack = stack =>
          stack
            .split('\n')
            .filter(line => !line.includes(`at Object.apply`))
            .filter(line => !line.includes(`at Object.get`))
            .join('\n')

        const getParameterProxyHandler = {
          get(target, key) {
            // There's a slight difference in toString: Our version does not return a named function by default
            if (key === 'toString') {
              const dummyFn = function toString() {
                return target.toString() // `function getParameter() { [native code] }`
              }.bind(Function.prototype.toString) // eslint-disable-line
              return dummyFn
            }
            try {
              return Reflect.get(target, key)
            } catch (err) {
              err.stack = stripErrorStack(err.stack)
              throw err
            }
          },
          apply: function(target, thisArg, args) {
            const param = (args || [])[0]
            // UNMASKED_VENDOR_WEBGL
            if (param === 37445) {
              return 'Intel Inc.'
            }
            // UNMASKED_RENDERER_WEBGL
            if (param === 37446) {
              return 'Intel Iris OpenGL Engine'
            }
            try {
              return Reflect.apply(target, thisArg, args)
            } catch (err) {
              err.stack = stripErrorStack(err.stack)
              throw err
            }
          }
        }

        const proxy = new Proxy(
          WebGLRenderingContext.prototype.getParameter,
          getParameterProxyHandler
        )
        // To find out the original values here: Object.getOwnPropertyDescriptors(WebGLRenderingContext.prototype.getParameter)
        Object.defineProperty(WebGLRenderingContext.prototype, 'getParameter', {
          configurable: true,
          enumerable: false,
          writable: false,
          value: proxy
        })
      } catch (err) {
        console.warn(err)
      }
    })
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
