'use strict'

const PuppeteerExtraPlugin = require('puppeteer-extra-plugin')

/**
 * Launch puppeteer with arbitrary user preferences.
 *
 * The user preferences will be merged with preferences set by other plugins.
 *
 * Overview:
 * https://chromium.googlesource.com/chromium/src/+/master/chrome/common/pref_names.cc
 *
 * @param {Object} opts - Options
 * @param {Object} [opts.prefs={}] - An object containing the preferences.
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * puppeteer.use(require('puppeteer-extra-plugin-user-preferences')({
 *   webkit: {
 *     webprefs: {
 *       default_font_size: 22
 *     }
 *   }
 * }))
 * const browser = await puppeteer.launch()
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor (opts = { }) {
    super(opts)

    const defaults = {
      prefs: {}
    }

    this._opts = Object.assign(defaults, opts)
  }

  get name () {
    return 'user-preferences'
  }

  get requirements () {
    return new Set(['headful'])
  }

  get userPreferences () {
    return this._opts.prefs
  }
}

module.exports = function (pluginConfig) {
  return new Plugin(pluginConfig)
}
