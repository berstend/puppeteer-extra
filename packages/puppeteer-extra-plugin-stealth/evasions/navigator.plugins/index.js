'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')
const args = require('../shared')

/**
 * In headless mode `navigator.mimeTypes` and `navigator.plugins` are empty.
 * This plugin quite emulates both of these to match regular headful Chrome.
 * We even go so far as to mock functional methods, instance types and `.toString` properties. :D
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.plugins'
  }

  async onPageCreated(page) {
    await page.evaluateOnNewDocument(({ fns }) => {
      const utils = Object.fromEntries(
        Object.entries(fns).map(([key, value]) => [key, eval(value)]) // eslint-disable-line no-eval
      )

      const { redefineGetter } = utils.getFunctionMockers()

      const mockedFns = []

      function mockPluginsAndMimeTypes() {
        /* global MimeType MimeTypeArray PluginArray */

        const fakeData = {
          mimeTypes: [
            {
              type: 'application/pdf',
              suffixes: 'pdf',
              description: '',
              __pluginName: 'Chrome PDF Viewer'
            },
            {
              type: 'application/x-google-chrome-pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              __pluginName: 'Chrome PDF Plugin'
            },
            {
              type: 'application/x-nacl',
              suffixes: '',
              description: 'Native Client Executable',
              enabledPlugin: Plugin,
              __pluginName: 'Native Client'
            },
            {
              type: 'application/x-pnacl',
              suffixes: '',
              description: 'Portable Native Client Executable',
              __pluginName: 'Native Client'
            }
          ],
          plugins: [
            {
              name: 'Chrome PDF Plugin',
              filename: 'internal-pdf-viewer',
              description: 'Portable Document Format'
            },
            {
              name: 'Chrome PDF Viewer',
              filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
              description: ''
            },
            {
              name: 'Native Client',
              filename: 'internal-nacl-plugin',
              description: ''
            }
          ],
          fns: {
            namedItem: instanceName => {
              // Returns the Plugin/MimeType with the specified name.
              const fn = function(name) {
                if (!arguments.length) {
                  throw new TypeError(
                    `Failed to execute 'namedItem' on '${instanceName}': 1 argument required, but only 0 present.`
                  )
                }
                return this[name] || null
              }
              mockedFns.push({ ref: fn, name: 'namedItem' })
              return fn
            },
            item: instanceName => {
              // Returns the Plugin/MimeType at the specified index into the array.
              const fn = function(index) {
                if (!arguments.length) {
                  throw new TypeError(
                    `Failed to execute 'namedItem' on '${instanceName}': 1 argument required, but only 0 present.`
                  )
                }
                return this[index] || null
              }
              mockedFns.push({ ref: fn, name: 'item' })
              return fn
            },
            refresh: instanceName => {
              // Refreshes all plugins on the current page, optionally reloading documents.
              const fn = function() {
                return undefined
              }
              mockedFns.push({ ref: fn, name: 'refresh' })
              return fn
            }
          }
        }
        // Poor mans _.pluck
        const getSubset = (keys, obj) =>
          keys.reduce((a, c) => ({ ...a, [c]: obj[c] }), {})

        function generateMimeTypeArray() {
          const arr = fakeData.mimeTypes
            .map(obj => getSubset(['type', 'suffixes', 'description'], obj))
            .map(obj => Object.setPrototypeOf(obj, MimeType.prototype))
          arr.forEach(obj => {
            arr[obj.type] = obj
          })

          // Mock functions
          arr.namedItem = fakeData.fns.namedItem('MimeTypeArray')
          arr.item = fakeData.fns.item('MimeTypeArray')

          return Object.create(
            MimeTypeArray.prototype,
            Object.getOwnPropertyDescriptors(arr)
          )
        }

        const mimeTypeArray = generateMimeTypeArray()
        redefineGetter(
          Object.getPrototypeOf(navigator),
          'mimeTypes',
          () => mimeTypeArray
        )

        function generatePluginArray() {
          const arr = fakeData.plugins
            .map(obj => getSubset(['name', 'filename', 'description'], obj))
            .map(obj => {
              const mimes = fakeData.mimeTypes.filter(
                m => m.__pluginName === obj.name
              )
              // Add mimetypes
              mimes.forEach((mime, index) => {
                navigator.mimeTypes[mime.type].enabledPlugin = obj
                obj[mime.type] = navigator.mimeTypes[mime.type]
                obj[index] = navigator.mimeTypes[mime.type]
              })
              obj.length = mimes.length
              return obj
            })
            .map(obj => {
              // Mock functions
              obj.namedItem = fakeData.fns.namedItem('Plugin')
              obj.item = fakeData.fns.item('Plugin')
              return obj
            })
            .map(obj => Object.setPrototypeOf(obj, Plugin.prototype))
          arr.forEach(obj => {
            arr[obj.name] = obj // TODO Define property descriptors correctly
          })

          // Mock functions
          arr.namedItem = fakeData.fns.namedItem('PluginArray')
          arr.item = fakeData.fns.item('PluginArray')
          arr.refresh = fakeData.fns.refresh('PluginArray')

          return Object.create(
            PluginArray.prototype,
            Object.getOwnPropertyDescriptors(arr)
          )
        }

        const pluginArray = generatePluginArray()
        redefineGetter(
          Object.getPrototypeOf(navigator),
          'plugins',
          () => pluginArray
        )
      }
      try {
        const isPluginArray = navigator.plugins instanceof PluginArray
        const hasPlugins = isPluginArray && navigator.plugins.length > 0
        if (isPluginArray && hasPlugins) {
          return // nothing to do here
        }
        mockPluginsAndMimeTypes()
      } catch (err) {}
    }, args)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
