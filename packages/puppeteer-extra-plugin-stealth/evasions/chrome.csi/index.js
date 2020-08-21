'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const withUtils = require('../_utils/withUtils')

/**
 * Mock the `chrome.csi` function if not available (e.g. when running headless).
 * It's a deprecated (but unfortunately still existing) chrome specific API to fetch browser timings.
 *
 * Internally chromium switched the implementation to use the WebPerformance API,
 * so we can do the same to create a fully functional mock. :-)
 *
 * Note: We're using the deprecated PerformanceTiming API instead of the new Navigation Timing Level 2 API on purpopse.
 *
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=113048
 * @see https://codereview.chromium.org/2456293003/
 * @see https://developers.google.com/web/updates/2017/12/chrome-loadtimes-deprecated
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming
 * @see https://source.chromium.org/chromium/chromium/src/+/master:chrome/renderer/loadtimes_extension_bindings.cc;l=124?q=loadtimes&ss=chromium
 * @see `chrome.loadTimes` evasion
 *
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/chrome.csi'
  }

  async onPageCreated(page) {
    await withUtils(page).evaluateOnNewDocument(utils => {
      if (!window.chrome) {
        // Use the exact property descriptor found in headful Chrome
        // fetch it via `Object.getOwnPropertyDescriptor(window, 'chrome')`
        Object.defineProperty(window, 'chrome', {
          writable: true,
          enumerable: true,
          configurable: false, // note!
          value: {} // We'll extend that later
        })
      }

      // That means we're running headful and don't need to mock anything
      if ('csi' in window.chrome) {
        return // Nothing to do here
      }

      // Check that the Navigation Timing API v1 is available, we need that
      if (!window.performance || !window.performance.timing) {
        return
      }

      const { timing } = window.performance

      window.chrome.csi = function() {
        return {
          onloadT: timing.domContentLoadedEventEnd,
          startE: timing.navigationStart,
          pageT: Date.now() - timing.navigationStart,
          tran: 15 // Transition type or something
        }
      }
      utils.patchToString(window.chrome.csi)
    })
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
