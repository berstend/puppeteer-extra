'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const argsToIgnore = [
  '--disable-extensions',
  '--disable-default-apps',
  '--disable-component-extensions-with-background-pages'
]

/**
 * A CDP driver like puppeteer can make use of various browser launch arguments that are
 * adversarial to mimicking a regular browser and need to be stripped when launching the browser.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/defaultArgs'
  }

  get requirements() {
    return new Set(['runLast']) // So other plugins can modify launch options before
  }

  async beforeLaunch(options = {}) {
    options.ignoreDefaultArgs = options.ignoreDefaultArgs || []
    if (options.ignoreDefaultArgs === true) {
      // that means the user explicitly wants to disable all default arguments
      return
    }
    argsToIgnore.forEach(arg => {
      if (options.ignoreDefaultArgs.includes(arg)) {
        return
      }
      options.ignoreDefaultArgs.push(arg)
    })
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}

module.exports.argsToIgnore = argsToIgnore
