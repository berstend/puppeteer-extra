'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const { getChromeRuntimeMock } = require('../shared')

/**
 * Pass the Chrome Test.
 *
 * This will work for iframes as well, except for `srcdoc` iframes:
 * https://github.com/puppeteer/puppeteer/issues/1106
 *
 * Could be mocked further.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/chrome.runtime'
  }

  async onPageCreated(page) {
    await page.evaluateOnNewDocument(
      args => {
        // Rematerialize serialized functions
        if (args && args.fns) {
          for (const fn of Object.keys(args.fns)) {
            eval(`var ${fn} =  ${args.fns[fn]}`) // eslint-disable-line
          }
        }

        window.chrome = getChromeRuntimeMock(window)
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
