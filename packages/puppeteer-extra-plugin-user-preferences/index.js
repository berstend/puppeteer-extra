'use strict'

const merge = require('deepmerge')

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Launch puppeteer with arbitrary user preferences.
 *
 * The user defined preferences will be merged with preferences set by other plugins.
 * Plugins can add user preferences by exposing a data entry with the name `userPreferences`.
 *
 * Overview:
 * https://chromium.googlesource.com/chromium/src/+/master/chrome/common/pref_names.cc
 *
 * @param {Object} opts - Options
 * @param {Object} [opts.userPrefs={}] - An object containing the preferences.
 *
 * @example
 * const puppeteer = require('puppeteer-extra')
 * puppeteer.use(require('puppeteer-extra-plugin-user-preferences')({userPrefs: {
 *   webkit: {
 *     webprefs: {
 *       default_font_size: 22
 *     }
 *   }
 * }}))
 * const browser = await puppeteer.launch()
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
    this._userPrefsFromPlugins = {}

    const defaults = {
      userPrefs: {}
    }

    this._opts = Object.assign(defaults, opts)
  }

  get name() {
    return 'user-preferences'
  }

  get requirements() {
    return new Set(['runLast', 'dataFromPlugins'])
  }

  get dependencies() {
    return new Set(['user-data-dir'])
  }

  get data() {
    return [
      {
        name: 'userDataDirFile',
        value: {
          target: 'Profile',
          file: 'Preferences',
          contents: JSON.stringify(this.combinedPrefs, null, 2)
        }
      }
    ]
  }

  get combinedPrefs() {
    return merge(this._opts.userPrefs, this._userPrefsFromPlugins)
  }

  async beforeLaunch(options) {
    this._userPrefsFromPlugins = merge.all(
      this.getDataFromPlugins('userPreferences').map(d => d.value)
    )
    this.debug('_userPrefsFromPlugins', this._userPrefsFromPlugins)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
