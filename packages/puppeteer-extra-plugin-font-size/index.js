'use strict'

const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

/**
 * Modify/increase the default font size in puppeteer.
 *
 * @param {Object} opts - Options
 * @param {Number} [opts.defaultFontSize=20] - Default browser font size
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * puppeteer.use(require('puppeteer-extra-plugin-font-size')())
 * // or
 * puppeteer.use(require('puppeteer-extra-plugin-font-size')({defaultFontSize: 18}))
 * const browser = await puppeteer.launch()
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = { }) {
    super(opts)

    const defaults = {
      defaultFontSize: 20
    }

    this._opts = Object.assign(defaults, opts)
  }

  get name () {
    return 'font-size'
  }

  get requirements () { return new Set(['headful']) }

  get dependencies () {
    return new Set(['user-preferences'])
  }

  get data () {
    const userPreferences = {
      webkit: {
        webprefs: {
          default_font_size: this._opts.defaultFontSize
        }
      }
    }
    return [
      {
        name: 'userPreferences',
        value: userPreferences
      }
    ]
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
