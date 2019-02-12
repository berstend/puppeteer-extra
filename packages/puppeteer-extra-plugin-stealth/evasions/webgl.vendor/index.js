'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Fix WebGL Vendor/Renderer being set to Google in headless mode
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = {}) {
    super(opts)
  }

  get name () {
    return 'stealth/evasions/webgl.vendor'
  }

  async onPageCreated (page) {
    // Chrome returns undefined, Firefox false
    await page.evaluateOnNewDocument(() => {
      try {
        /* global WebGLRenderingContext */
        const getParameter = WebGLRenderingContext.getParameter
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
          // UNMASKED_VENDOR_WEBGL
          if (parameter === 37445) {
            return 'Intel Inc.'
          }
          // UNMASKED_RENDERER_WEBGL
          if (parameter === 37446) {
            return 'Intel Iris OpenGL Engine'
          }
          return getParameter(parameter)
        }
      } catch (err) {}
    })
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
