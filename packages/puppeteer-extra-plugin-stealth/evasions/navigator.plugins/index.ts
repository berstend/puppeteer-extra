import { PuppeteerExtraPlugin, PuppeteerPage } from 'puppeteer-extra-plugin'
import { withUtils } from '../_utils/withUtils'
import { utils } from '../_utils'
import Utils from '../_utils'
import { generateMimeTypeArray } from './mimeTypes'
import { generatePluginArray } from './plugins'
import { generateMagicArray } from './magicArray'
import { generateFunctionMocks } from './functionMocks'

export interface NavigatorData {
  mimeTypes: Array<{
    type: string,
    suffixes: string,
    description: string,
    __pluginName: string,
  }>,
  plugins: Array<{
    name: string,
    filename: string,
    description: string,
    __mimeTypes: string[]
  }>,
}

const data: NavigatorData = require('./data.json')

export interface PluginOptions {
}

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
export class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }


  get name(): 'stealth/evasions/navigator.plugins' {
    return 'stealth/evasions/navigator.plugins'
  }

  async onPageCreated(page: PuppeteerPage): Promise<void> {
    await withUtils(page).evaluateOnNewDocument(
      (utils: typeof Utils, fns: any, data: NavigatorData ) => {
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
          pluginData.__mimeTypes.forEach((type: string, index: number) => {
            plugins[pluginData.name][index] = mimeTypes[type]

            Object.defineProperty(plugins[pluginData.name], type, {
              value: mimeTypes[type],
              writable: false,
              enumerable: false, // Not enumerable
              configurable: true
            })
            Object.defineProperty(mimeTypes[type], 'enabledPlugin', {
              value:
                type === 'application/x-pnacl'
                  ? mimeTypes['application/x-nacl'].enabledPlugin // these reference the same plugin, so we need to re-use the Proxy in order to avoid leaks
                  : new Proxy(plugins[pluginData.name], {}), // Prevent circular references
              writable: false,
              enumerable: false, // Important: `JSON.stringify(navigator.plugins)`
              configurable: true
            })
          })
        }

        const patchNavigator = (name: string, value: any) =>
          utils.replaceProperty(Object.getPrototypeOf(navigator), name, {
            get() {
              return value
            }
          })

        patchNavigator('mimeTypes', mimeTypes)
        patchNavigator('plugins', plugins)

        // All done
      },
      // We pass some functions to evaluate to structure the code more nicely
      utils.stringifyFns({
        generateMimeTypeArray,
        generatePluginArray,
        generateMagicArray,
        generateFunctionMocks
      }),
      data
    )
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
