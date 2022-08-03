'use strict'

import merge from 'deepmerge'
import { PluginData, PluginDependencies, PluginRequirements, PuppeteerExtraPlugin, PuppeteerLaunchOption } from 'puppeteer-extra-plugin'

export interface PluginOptions {
  userPrefs: {[key: string]: any};
}

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
export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  private _userPrefsFromPlugins: any = {};

  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get defaults(): PluginOptions {
    return {
      userPrefs: {}
    };
  }

  get name(): 'user-preferences' {
    return 'user-preferences'
  }

  get requirements(): PluginRequirements {
    return new Set(['runLast', 'dataFromPlugins'])
  }

  get dependencies(): PluginDependencies {
    return ['user-data-dir']
  }

  get data(): PluginData[] {
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

  get combinedPrefs(): {[key: string]: any} {
    return merge(this.opts.userPrefs, this._userPrefsFromPlugins)
  }

  async beforeLaunch(options: PuppeteerLaunchOption = {}): Promise<void | PuppeteerLaunchOption> {
    this._userPrefsFromPlugins = merge.all(
      this.getDataFromPlugins('userPreferences').map(d => d.value)
    )
    this.debug('_userPrefsFromPlugins', this._userPrefsFromPlugins)
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
