'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * A small shim to require the `puppeteer-extra-plugin-anonymize-ua` plugin.
 *
 * Let's make use of `puppeteer-extra`'s modular nature and not re-invent things. :-)
 *
 * Note: If you want to customize it's settings just require the above mentioned
 * plugin directly and specify your desired options, it won't be required if you already did so.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = {}) {
    super(opts)
  }

  get name () {
    return 'stealth/evasions/user-agent'
  }

  get dependencies () {
    return new Set(['anonymize-ua'])
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
