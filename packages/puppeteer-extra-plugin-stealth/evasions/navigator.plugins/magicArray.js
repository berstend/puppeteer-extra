/* global MimeType MimeTypeArray Plugin PluginArray  */

/**
 * Generate a convincing and functional MimeType or Plugin array from scratch.
 * They're so similar that it makes sense to use a single generator here.
 *
 * Note: This is meant to be run in the context of the page.
 */
module.exports.generateMagicArray = (utils, fns) =>
  function(
    dataArray = [],
    proto = MimeTypeArray.prototype,
    itemProto = MimeType.prototype,
    itemMainProp = 'type'
  ) {
    // Quick helper to set props with the same descriptors vanilla is using
    const defineProp = (obj, prop, value) =>
      Object.defineProperty(obj, prop, {
        value,
        writable: false,
        enumerable: false, // Important for mimeTypes & plugins: `JSON.stringify(navigator.mimeTypes)`
        configurable: true
      })

    // Loop over our fake data and construct items
    const makeItem = data => {
      const item = {}
      for (const prop of Object.keys(data)) {
        if (prop.startsWith('__')) {
          continue
        }
        defineProp(item, prop, data[prop])
      }
      return patchItem(item, data)
    }

    const patchItem = (item, data) => {
      let descriptor = Object.getOwnPropertyDescriptors(item)

      // Special case: Plugins have a magic length property which is not enumerable
      // e.g. `navigator.plugins[i].length` should always be the length of the assigned mimeTypes
      if (itemProto === Plugin.prototype) {
        descriptor = {
          ...descriptor,
          length: {
            value: data.__mimeTypes.length,
            writable: false,
            enumerable: false,
            configurable: true // Important to be able to use the ownKeys trap in a Proxy to strip `length`
          }
        }
      }

      // We need to spoof a specific `MimeType` or `Plugin` object
      const obj = Object.create(itemProto, descriptor)

      // Virtually all property keys are not enumerable in vanilla
      const blacklist = [...Object.keys(data), 'length', 'enabledPlugin']
      return new Proxy(obj, {
        ownKeys(target) {
          return Reflect.ownKeys(target).filter(k => !blacklist.includes(k))
        },
        getOwnPropertyDescriptor(target, prop) {
          if (blacklist.includes(prop)) {
            return undefined
          }
          return Reflect.getOwnPropertyDescriptor(target, prop)
        }
      })
    }

    const magicArray = []

    // Loop through our fake data and use that to create convincing entities
    dataArray.forEach(data => {
      magicArray.push(makeItem(data))
    })

    // Add direct property access  based on types (e.g. `obj['application/pdf']`) afterwards
    magicArray.forEach(entry => {
      defineProp(magicArray, entry[itemMainProp], entry)
    })

    // This is the best way to fake the type to make sure this is false: `Array.isArray(navigator.mimeTypes)`
    const magicArrayObj = Object.create(proto, {
      ...Object.getOwnPropertyDescriptors(magicArray),

      // There's one ugly quirk we unfortunately need to take care of:
      // The `MimeTypeArray` prototype has an enumerable `length` property,
      // but headful Chrome will still skip it when running `Object.getOwnPropertyNames(navigator.mimeTypes)`.
      // To strip it we need to make it first `configurable` and can then overlay a Proxy with an `ownKeys` trap.
      length: {
        value: magicArray.length,
        writable: false,
        enumerable: false,
        configurable: true // Important to be able to use the ownKeys trap in a Proxy to strip `length`
      }
    })

    // Generate our functional function mocks :-)
    const functionMocks = fns.generateFunctionMocks(utils)(
      proto,
      itemMainProp,
      magicArray
    )

    // We need to overlay our custom object with a JS Proxy
    const magicArrayObjProxy = new Proxy(magicArrayObj, {
      get(target, key = '') {
        // Redirect function calls to our custom proxied versions mocking the vanilla behavior
        if (key === 'item') {
          return functionMocks.item
        }
        if (key === 'namedItem') {
          return functionMocks.namedItem
        }
        if (proto === PluginArray.prototype && key === 'refresh') {
          return functionMocks.refresh
        }
        // Everything else can pass through as normal
        return utils.cache.Reflect.get(...arguments)
      },
      ownKeys(target) {
        // There are a couple of quirks where the original property demonstrates "magical" behavior that makes no sense
        // This can be witnessed when calling `Object.getOwnPropertyNames(navigator.mimeTypes)` and the absense of `length`
        // My guess is that it has to do with the recent change of not allowing data enumeration and this being implemented weirdly
        // For that reason we just completely fake the available property names based on our data to match what regular Chrome is doing
        // Specific issues when not patching this: `length` property is available, direct `types` props (e.g. `obj['application/pdf']`) are missing
        const keys = []
        const typeProps = magicArray.map(mt => mt[itemMainProp])
        typeProps.forEach((_, i) => keys.push(`${i}`))
        typeProps.forEach(propName => keys.push(propName))
        return keys
      },
      getOwnPropertyDescriptor(target, prop) {
        if (prop === 'length') {
          return undefined
        }
        return Reflect.getOwnPropertyDescriptor(target, prop)
      }
    })

    return magicArrayObjProxy
  }
