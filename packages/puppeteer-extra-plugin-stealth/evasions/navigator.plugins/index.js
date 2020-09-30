'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const utils = require('../_utils')
const withUtils = require('../_utils/withUtils')

const { generateMimeTypeArray } = require('./mimeTypes')
const { generatePluginArray } = require('./plugins')
const { generateMagicArray } = require('./magicArray')
const { generateFunctionMocks } = require('./functionMocks')

const data = require('./data.json')

/**
 * In headless mode `navigator.mimeTypes` and `navigator.plugins` are empty.
 * This plugin emulates both of these with functional mocks to match regular headful Chrome.
 *
 * Note: mimeTypes and plugins cross-reference each other, so it makes sense to do them at the same time.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/mimeTypes
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MimeTypeArray
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/plugins
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PluginArray
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.plugins'
  }

  async onPageCreated(page) {
    await withUtils(page).evaluateOnNewDocument(
      (utils, { fns, data }) => {
        fns = utils.materializeFns(fns)

        // That means we're running headful
        const hasPlugins = 'plugins' in navigator && navigator.plugins.length
        if (hasPlugins) {
          return // nothing to do here
        }

        const mimeTypes = fns.generateMimeTypeArray(utils, fns)(data.mimeTypes)
        const plugins = fns.generatePluginArray(utils, fns)(data.plugins)

        // Plugin and MimeType cross-reference each other, let's do that now
        // Note: We're looping through `data.plugins` here, not the generated `plugins`
        for (const pluginData of data.plugins) {
          pluginData.__mimeTypes.forEach((type, index) => {
            plugins[pluginData.name][index] = mimeTypes[type]

            Object.defineProperty(plugins[pluginData.name], type, {
              value: mimeTypes[type],
              writable: false,
              enumerable: false, // Not enumerable
              configurable: true
            })
            Object.defineProperty(mimeTypes[type], 'enabledPlugin', {
              value: new Proxy(plugins[pluginData.name], {}), // Prevent circular references
              writable: false,
              enumerable: false, // Important: `JSON.stringify(navigator.plugins)`
              configurable: true
            })
          })
        }

        const patchNavigator = (name, value) =>
          utils.replaceProperty(Object.getPrototypeOf(navigator), name, {
            get() {
              return value
            }
          })

        patchNavigator('mimeTypes', mimeTypes)
        patchNavigator('plugins', plugins)

        // All done
      },
      {
        // We pass some functions to evaluate to structure the code more nicely
        fns: utils.stringifyFns({
          generateMimeTypeArray,
          generatePluginArray,
          generateMagicArray,
          generateFunctionMocks
        }),
        data
      }
    )
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
