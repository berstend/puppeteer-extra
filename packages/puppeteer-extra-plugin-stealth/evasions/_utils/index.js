/**
 * A set of shared utility functions specifically for the purpose of modifying native browser APIs without leaving traces.
 *
 * Meant to be passed down in puppeteer and used in the context of the page (everything in here runs in NodeJS as well as a browser).
 *
 * Note: If for whatever reason you need to use this outside of `puppeteer-extra`:
 * Just remove the `module.exports` statement at the very bottom, the rest can be copy pasted into any browser context.
 *
 * Alternatively take a look at the `extract-stealth-evasions` package to create a finished bundle which includes these utilities.
 *
 */
const utils = {}

utils.init = () => {
  utils.preloadCache()
}

/**
 * Wraps a JS Proxy Handler and strips it's presence from error stacks, in case the traps throw.
 *
 * The presence of a JS Proxy can be revealed as it shows up in error stack traces.
 *
 * @param {object} handler - The JS Proxy handler to wrap
 */
utils.stripProxyFromErrors = (handler = {}) => {
  const Error = globalThis.Error
  const newHandler = {}
  // We wrap each trap in the handler in a try/catch and modify the error stack if they throw
  const traps = Object.getOwnPropertyNames(handler)
  traps.forEach(trap => {
    newHandler[trap] = function() {
      const normalStackMax = Error.stackTraceLimit
      Error.stackTraceLimit = normalStackMax + 2
      try {
        // Forward the call to the defined proxy handler
        const ret = handler[trap].apply(this, arguments || [])
        Error.stackTraceLimit = normalStackMax
        return ret
      } catch (err) {
        Error.stackTraceLimit = normalStackMax
        // Stack traces differ per browser, we only support chromium based ones currently
        if (typeof err?.stack === 'string') {
          err.stack = err.stack
            .replace('at Object.toString (', 'at Function.toString (')
            .split('\n')
            .filter(line => !line.includes(utils.sourceUrl))
            .slice(0, normalStackMax + 1)
            .join('\n')
        }

        throw err // Re-throw our now sanitized error
      }
    }
  })
  return newHandler
}

/**
 * Replace the property of an object in a stealthy way.
 *
 * Note: You also want to work on the prototype of an object most often,
 * as you'd otherwise leave traces (e.g. showing up in Object.getOwnPropertyNames(obj)).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
 *
 * @example
 * replaceProperty(WebGLRenderingContext.prototype, 'getParameter', { value: "alice" })
 * // or
 * replaceProperty(Object.getPrototypeOf(navigator), 'languages', { get: () => ['en-US', 'en'] })
 *
 * @param {object} obj - The object which has the property to replace
 * @param {string} propName - The property name to replace
 * @param {object} descriptorOverrides - e.g. { value: "alice" }
 */
utils.replaceProperty = (obj, propName, descriptorOverrides = {}) => {
  return Object.defineProperty(obj, propName, {
    // Copy over the existing descriptors (writable, enumerable, configurable, etc)
    ...(Object.getOwnPropertyDescriptor(obj, propName) || {}),
    // Add our overrides (e.g. value, get())
    ...descriptorOverrides
  })
}

/**
 * Preload a cache of function copies and data.
 *
 * For a determined enough observer it would be possible to overwrite and sniff usage of functions
 * we use in our internal Proxies, to combat that we use a cached copy of those functions.
 *
 * Note: Whenever we add a `Function.prototype.toString` proxy we should preload the cache before,
 * by executing `utils.preloadCache()` before the proxy is applied (so we don't cause recursive lookups).
 *
 * This is evaluated once per execution context (e.g. window)
 */
utils.preloadCache = () => {
  if (utils.cache) {
    return
  }
  utils.cache = {
    // Used in our proxies
    Reflect: {
      get: Reflect.get.bind(Reflect),
      apply: Reflect.apply.bind(Reflect)
    },
    // Used in `makeNativeString`
    nativeToStringStr: Function.toString + '' // => `function toString() { [native code] }`
  }
}

/**
 * Utility function to generate a cross-browser `toString` result representing native code.
 *
 * There's small differences: Chromium uses a single line, whereas FF & Webkit uses multiline strings.
 * To future-proof this we use an existing native toString result as the basis.
 *
 * The only advantage we have over the other team is that our JS runs first, hence we cache the result
 * of the native toString result once, so they cannot spoof it afterwards and reveal that we're using it.
 *
 * @example
 * makeNativeString('foobar') // => `function foobar() { [native code] }`
 *
 * @param {string} [name] - Optional function name
 */
utils.makeNativeString = (name = '') => {
  return utils.cache.nativeToStringStr.replace('toString', name || '')
}

/**
 * Helper function to modify the `toString()` result of the provided object.
 *
 * Note: Use `utils.redirectToString` instead when possible.
 *
 * There's a quirk in JS Proxies that will cause the `toString()` result to differ from the vanilla Object.
 * If no string is provided we will generate a `[native code]` thing based on the name of the property object.
 *
 * @example
 * patchToString(WebGLRenderingContext.prototype.getParameter, 'function getParameter() { [native code] }')
 *
 * @param {object} obj - The object for which to modify the `toString()` representation
 * @param {string} str - Optional string used as a return value
 */
utils.patchToString = (obj, str = '') => {
  const handler = {
    apply: function(target, ctx) {
      // This fixes e.g. `HTMLMediaElement.prototype.canPlayType.toString + ""`
      if (ctx === Function.prototype.toString) {
        return utils.makeNativeString('toString')
      }
      // `toString` targeted at our proxied Object detected
      if (ctx === obj) {
        // We either return the optional string verbatim or derive the most desired result automatically
        return str || utils.makeNativeString(obj.name)
      }
      // Check if the toString protype of the context is the same as the global prototype,
      // if not indicates that we are doing a check across different windows., e.g. the iframeWithdirect` test case
      const hasSameProto = Object.getPrototypeOf(
        Function.prototype.toString
      ).isPrototypeOf(ctx.toString) // eslint-disable-line no-prototype-builtins
      if (!hasSameProto) {
        // Pass the call on to the local Function.prototype.toString instead
        return ctx.toString()
      }
      return target.call(ctx)
    }
  }

  const toStringProxy = new Proxy(
    Function.prototype.toString,
    utils.stripProxyFromErrors(handler)
  )
  utils.replaceProperty(Function.prototype, 'toString', {
    value: toStringProxy
  })
}

/**
 * Make all nested functions of an object native.
 *
 * @param {object} obj
 */
utils.patchToStringNested = (obj = {}) => {
  return utils.execRecursively(obj, ['function'], utils.patchToString)
}

/**
 * Redirect toString requests from one object to another.
 *
 * @param {object} proxyObj - The object that toString will be called on
 * @param {object} originalObj - The object which toString result we wan to return
 */
utils.redirectToString = (proxyObj, originalObj) => {
  const handler = {
    apply: function(target, ctx) {
      // This fixes e.g. `HTMLMediaElement.prototype.canPlayType.toString + ""`
      if (ctx === Function.prototype.toString) {
        return utils.makeNativeString('toString')
      }

      // `toString` targeted at our proxied Object detected
      if (ctx === proxyObj) {
        const fallback = () =>
          originalObj && originalObj.name
            ? utils.makeNativeString(originalObj.name)
            : utils.makeNativeString(proxyObj.name)

        // Return the toString representation of our original object if possible
        return originalObj + '' || fallback()
      }

      // Check if the toString protype of the context is the same as the global prototype,
      // if not indicates that we are doing a check across different windows., e.g. the iframeWithdirect` test case
      const hasSameProto = Object.getPrototypeOf(
        Function.prototype.toString
      ).isPrototypeOf(ctx.toString) // eslint-disable-line no-prototype-builtins
      if (!hasSameProto) {
        // Pass the call on to the local Function.prototype.toString instead
        return ctx.toString()
      }

      return target.call(ctx)
    }
  }

  const toStringProxy = new Proxy(
    Function.prototype.toString,
    utils.stripProxyFromErrors(handler)
  )
  utils.replaceProperty(Function.prototype, 'toString', {
    value: toStringProxy
  })
}

/**
 * All-in-one method to replace a property with a JS Proxy using the provided Proxy handler with traps.
 *
 * Will stealthify these aspects (strip error stack traces, redirect toString, etc).
 * Note: This is meant to modify native Browser APIs and works best with prototype objects.
 *
 * @example
 * replaceWithProxy(WebGLRenderingContext.prototype, 'getParameter', proxyHandler)
 *
 * @param {object} obj - The object which has the property to replace
 * @param {string} propName - The name of the property to replace
 * @param {object} handler - The JS Proxy handler to use
 */
utils.replaceWithProxy = (obj, propName, handler) => {
  const originalObj = obj[propName]
  const proxyObj = new Proxy(obj[propName], utils.stripProxyFromErrors(handler))

  utils.replaceProperty(obj, propName, { value: proxyObj })
  utils.redirectToString(proxyObj, originalObj)

  return true
}
/**
 * All-in-one method to replace a getter with a JS Proxy using the provided Proxy handler with traps.
 *
 * @example
 * replaceGetterWithProxy(Object.getPrototypeOf(navigator), 'vendor', proxyHandler)
 *
 * @param {object} obj - The object which has the property to replace
 * @param {string} propName - The name of the property to replace
 * @param {object} handler - The JS Proxy handler to use
 */
utils.replaceGetterWithProxy = (obj, propName, handler, modType = 'get') => {
  const fn = Object.getOwnPropertyDescriptor(obj, propName)?.[modType]
  const fnStr = fn.toString() // special getter function string
  const proxyObj = new Proxy(fn, utils.stripProxyFromErrors(handler))
  console.log(proxyObj)

  utils.replaceProperty(obj, propName, { [modType]: proxyObj })
  utils.patchToString(proxyObj, fnStr)

  return true
}

utils.makeNameNative = (fn, name) => {
  Object.defineProperty(fn, 'name', { value: name })
  return fn
}

/**
 * All-in-one method to mock a non-existing property with a JS Proxy using the provided Proxy handler with traps.
 *
 * Will stealthify these aspects (strip error stack traces, redirect toString, etc).
 *
 * @example
 * mockWithProxy(chrome.runtime, 'sendMessage', function sendMessage() {}, proxyHandler)
 *
 * @param {object} obj - The object which has the property to replace
 * @param {string} propName - The name of the property to replace or create
 * @param {object} pseudoTarget - The JS Proxy target to use as a basis
 * @param {object} handler - The JS Proxy handler to use
 */
utils.mockWithProxy = (obj, propName, pseudoTarget, handler) => {
  const proxyObj = new Proxy(pseudoTarget, utils.stripProxyFromErrors(handler))

  utils.replaceProperty(obj, propName, { value: proxyObj })
  utils.patchToString(proxyObj)

  return true
}

/**
 * All-in-one method to create a new JS Proxy with stealth tweaks.
 *
 * This is meant to be used whenever we need a JS Proxy but don't want to replace or mock an existing known property.
 *
 * Will stealthify certain aspects of the Proxy (strip error stack traces, redirect toString, etc).
 *
 * @example
 * createProxy(navigator.mimeTypes.__proto__.namedItem, proxyHandler) // => Proxy
 *
 * @param {object} pseudoTarget - The JS Proxy target to use as a basis
 * @param {object} handler - The JS Proxy handler to use
 */
utils.createProxy = (pseudoTarget, handler) => {
  const proxyObj = new Proxy(pseudoTarget, utils.stripProxyFromErrors(handler))
  utils.patchToString(proxyObj)

  return proxyObj
}

/**
 * Helper function to split a full path to an Object into the first part and property.
 *
 * @example
 * splitObjPath(`HTMLMediaElement.prototype.canPlayType`)
 * // => {objName: "HTMLMediaElement.prototype", propName: "canPlayType"}
 *
 * @param {string} objPath - The full path to an object as dot notation string
 */
utils.splitObjPath = objPath => ({
  // Remove last dot entry (property) ==> `HTMLMediaElement.prototype`
  objName: objPath
    .split('.')
    .slice(0, -1)
    .join('.'),
  // Extract last dot entry ==> `canPlayType`
  propName: objPath.split('.').slice(-1)[0]
})

/**
 * Convenience method to replace a property with a JS Proxy using the provided objPath.
 *
 * Supports a full path (dot notation) to the object as string here, in case that makes it easier.
 *
 * @example
 * replaceObjPathWithProxy('WebGLRenderingContext.prototype.getParameter', proxyHandler)
 *
 * @param {string} objPath - The full path to an object (dot notation string) to replace
 * @param {object} handler - The JS Proxy handler to use
 */
utils.replaceObjPathWithProxy = (objPath, handler) => {
  const { objName, propName } = utils.splitObjPath(objPath)
  const obj = eval(objName + utils.sourceString) // eslint-disable-line no-eval
  return utils.replaceWithProxy(obj, propName, handler)
}

/**
 * Traverse nested properties of an object recursively and apply the given function on a whitelist of value types.
 *
 * @param {object} obj
 * @param {array} typeFilter - e.g. `['function']`
 * @param {Function} fn - e.g. `utils.patchToString`
 */
utils.execRecursively = (obj = {}, typeFilter = [], fn) => {
  function recurse(obj) {
    for (const key in obj) {
      if (obj[key] === undefined) {
        continue
      }
      if (obj[key] && typeof obj[key] === 'object') {
        recurse(obj[key])
      } else {
        if (obj[key] && typeFilter.includes(typeof obj[key])) {
          fn.call(this, obj[key])
        }
      }
    }
  }
  recurse(obj)
  return obj
}

/**
 * Everything we run through e.g. `page.evaluate` runs in the browser context, not the NodeJS one.
 * That means we cannot just use reference variables and functions from outside code, we need to pass everything as a parameter.
 *
 * Unfortunately the data we can pass is only allowed to be of primitive types, regular functions don't survive the built-in serialization process.
 * This utility function will take an object with functions and stringify them, so we can pass them down unharmed as strings.
 *
 * We use this to pass down our utility functions as well as any other functions (to be able to split up code better).
 *
 * @see utils.materializeFns
 *
 * @param {object} fnObj - An object containing functions as properties
 */
utils.stringifyFns = (fnObj = { hello: () => 'world' }) => {
  // Object.fromEntries() ponyfill (in 6 lines) - supported only in Node v12+, modern browsers are fine
  // https://github.com/feross/fromentries
  function fromEntries(iterable) {
    return [...iterable].reduce((obj, [key, val]) => {
      obj[key] = val
      return obj
    }, {})
  }
  return (Object.fromEntries || fromEntries)(
    Object.entries(fnObj)
      .filter(([key, value]) => typeof value === 'function')
      .map(([key, value]) => [key, value.toString()]) // eslint-disable-line no-eval
  )
}

/**
 * Utility function to reverse the process of `utils.stringifyFns`.
 * Will materialize an object with stringified functions (supports classic and fat arrow functions).
 *
 * @param {object} fnStrObj - An object containing stringified functions as properties
 */
utils.materializeFns = (fnStrObj = { hello: "() => 'world'" }) => {
  return Object.fromEntries(
    Object.entries(fnStrObj).map(([key, value]) => {
      if (value.startsWith('function')) {
        // some trickery is needed to make oldschool functions work :-)
        return [key, eval(`() => ${value}${utils.sourceString}`)()] // eslint-disable-line no-eval
      } else {
        // arrow functions just work
        return [key, eval(value + utils.sourceString)] // eslint-disable-line no-eval
      }
    })
  )
}

// Proxy handler templates for re-usability
utils.makeHandler = () => ({
  // Used by simple `navigator` getter evasions
  getterValue: value => ({
    apply(target, ctx, args) {
      // Let's fetch the value first, to trigger and escalate potential errors
      // Illegal invocations like `navigator.__proto__.vendor` will throw here
      const ret = utils.cache.Reflect.apply(...arguments)
      if (args && args.length === 0) {
        return value
      }
      return ret
    }
  })
})

// --
// Stuff starting below this line is NodeJS specific.
// --
module.exports = utils
