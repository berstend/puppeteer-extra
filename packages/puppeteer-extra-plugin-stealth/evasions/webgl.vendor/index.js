'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Fix WebGL Vendor/Renderer being set to Google in headless mode
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.vendor] - The vendor string to use (default: `Intel Inc.`)
 * @param {string} [opts.renderer] - The renderer string (default: `Intel Iris OpenGL Engine`)
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/webgl.vendor'
  }

  /* global WebGLRenderingContext WebGL2RenderingContext */
  async onPageCreated(page) {
    // Chrome returns undefined, Firefox false
    await page.evaluateOnNewDocument(opts => {
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
            try {
              // Mitigate Chromium bug (#130)
              if (typeof target[key] === 'function') {
                return target[key].bind(target)
              }
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
              return opts.vendor || 'Intel Inc.'
            }
            // UNMASKED_RENDERER_WEBGL
            if (param === 37446) {
              return opts.renderer || 'Intel Iris OpenGL Engine'
            }
            try {
              return Reflect.apply(target, thisArg, args)
            } catch (err) {
              err.stack = stripErrorStack(err.stack)
              throw err
            }
          }
        }

        // There's more than one WebGL rendering context
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext#Browser_compatibility
        // To find out the original values here: Object.getOwnPropertyDescriptors(WebGLRenderingContext.prototype.getParameter)
        Object.defineProperty(WebGLRenderingContext.prototype, 'getParameter', {
          configurable: true,
          enumerable: false,
          writable: false,
          value: new Proxy(
            WebGLRenderingContext.prototype.getParameter,
            getParameterProxyHandler
          )
        })
        Object.defineProperty(
          WebGL2RenderingContext.prototype,
          'getParameter',
          {
            configurable: true,
            enumerable: false,
            writable: false,
            value: new Proxy(
              WebGL2RenderingContext.prototype.getParameter,
              getParameterProxyHandler
            )
          }
        )
      } catch (err) {
        console.warn(err)
      }
    }, this.opts)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
