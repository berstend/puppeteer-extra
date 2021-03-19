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
// const utils = {} as any

const init = () => {
  preloadCache()
}

/**
 * Wraps a JS Proxy Handler and strips it's presence from error stacks, in case the traps throw.
 *
 * The presence of a JS Proxy can be revealed as it shows up in error stack traces.
 *
 * @param {object} handler - The JS Proxy handler to wrap
 */
const stripProxyFromErrors = (handler = {}) => {
  const newHandler = {}
  // We wrap each trap in the handler in a try/catch and modify the error stack if they throw
  const traps = Object.getOwnPropertyNames(handler)
  traps.forEach(trap => {
    newHandler[trap] = function () {
      try {
        // Forward the call to the defined proxy handler
        return handler[trap].apply(this, arguments || [])
      } catch (err) {
        // Stack traces differ per browser, we only support chromium based ones currently
        if (!err || !err.stack || !err.stack.includes(`at `)) {
          throw err
        }

        // When something throws within one of our traps the Proxy will show up in error stacks
        // An earlier implementation of this code would simply strip lines with a blacklist,
        // but it makes sense to be more surgical here and only remove lines related to our Proxy.
        // We try to use a known "anchor" line for that and strip it with everything above it.
        // If the anchor line cannot be found for some reason we fall back to our blacklist approach.

        const stripWithBlacklist = (stack, stripFirstLine = true) => {
          const blacklist = [
            `at Reflect.${trap} `, // e.g. Reflect.get or Reflect.apply
            `at Object.${trap} `, // e.g. Object.get or Object.apply
            `at Object.newHandler.<computed> [as ${trap}] ` // caused by this very wrapper :-)
          ]
          return (
            err.stack
              .split('\n')
              // Always remove the first (file) line in the stack (guaranteed to be our proxy)
              .filter((line, index) => !(index === 1 && stripFirstLine))
              // Check if the line starts with one of our blacklisted strings
              .filter(line => !blacklist.some(bl => line.trim().startsWith(bl)))
              .join('\n')
          )
        }

        const stripWithAnchor = (stack, anchor?: string) => {
          const stackArr = stack.split('\n')
          anchor = anchor || `at Object.newHandler.<computed> [as ${trap}] ` // Known first Proxy line in chromium
          const anchorIndex = stackArr.findIndex(line =>
            line.trim().startsWith(anchor)
          )
          if (anchorIndex === -1) {
            return false // 404, anchor not found
          }
          // Strip everything from the top until we reach the anchor line
          // Note: We're keeping the 1st line (zero index) as it's unrelated (e.g. `TypeError`)
          stackArr.splice(1, anchorIndex)
          return stackArr.join('\n')
        }

        // Special cases due to our nested toString proxies
        err.stack = err.stack.replace(
          'at Object.toString (',
          'at Function.toString ('
        )
        if ((err.stack || '').includes('at Function.toString (')) {
          err.stack = stripWithBlacklist(err.stack, false)
          throw err
        }

        // Try using the anchor method, fallback to blacklist if necessary
        err.stack = stripWithAnchor(err.stack) || stripWithBlacklist(err.stack)

        throw err // Re-throw our now sanitized error
      }
    }
  })
  return newHandler
}

/**
 * Strip error lines from stack traces until (and including) a known line the stack.
 *
 * @param {object} err - The error to sanitize
 * @param {string} anchor - The string the anchor line starts with
 */
const stripErrorWithAnchor = (err, anchor) => {
  const stackArr = err.stack.split('\n')
  const anchorIndex = stackArr.findIndex(line => line.trim().startsWith(anchor))
  if (anchorIndex === -1) {
    return err // 404, anchor not found
  }
  // Strip everything from the top until we reach the anchor line (remove anchor line as well)
  // Note: We're keeping the 1st line (zero index) as it's unrelated (e.g. `TypeError`)
  stackArr.splice(1, anchorIndex)
  err.stack = stackArr.join('\n')
  return err
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
const replaceProperty = (obj, propName, descriptorOverrides = {}) => {
  return Object.defineProperty(obj, propName, {
    // Copy over the existing descriptors (writable, enumerable, configurable, etc)
    ...(Object.getOwnPropertyDescriptor(obj, propName) || {}),
    // Add our overrides (e.g. value, get())
    ...descriptorOverrides
  })
}

let cache: {
  // Used in our proxies
  Reflect: {
    get: Function,
    apply: Function,
  },
  // Used in `makeNativeString`
  nativeToStringStr: string;
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
const preloadCache = () => {
  if (cache) {
    return
  }
  cache = {
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
const makeNativeString = (name = '') => {
  return cache.nativeToStringStr.replace('toString', name || '')
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
const patchToString = (obj, str = '') => {
  const handler = {
    apply: function (target, ctx) {
      // This fixes e.g. `HTMLMediaElement.prototype.canPlayType.toString + ""`
      if (ctx === Function.prototype.toString) {
        return makeNativeString('toString')
      }
      // `toString` targeted at our proxied Object detected
      if (ctx === obj) {
        // We either return the optional string verbatim or derive the most desired result automatically
        return str || makeNativeString(obj.name)
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
    stripProxyFromErrors(handler)
  )
  replaceProperty(Function.prototype, 'toString', {
    value: toStringProxy
  })
}

/**
 * Make all nested functions of an object native.
 *
 * @param {object} obj
 */
const patchToStringNested = (obj = {}) => {
  return execRecursively(obj, ['function'], patchToString)
}

/**
 * Redirect toString requests from one object to another.
 *
 * @param {object} proxyObj - The object that toString will be called on
 * @param {object} originalObj - The object which toString result we wan to return
 */
const redirectToString = (proxyObj, originalObj) => {
  const handler = {
    apply: function (target, ctx) {
      // This fixes e.g. `HTMLMediaElement.prototype.canPlayType.toString + ""`
      if (ctx === Function.prototype.toString) {
        return makeNativeString('toString')
      }

      // `toString` targeted at our proxied Object detected
      if (ctx === proxyObj) {
        const fallback = () =>
          originalObj && originalObj.name
            ? makeNativeString(originalObj.name)
            : makeNativeString(proxyObj.name)

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
    stripProxyFromErrors(handler)
  )
  replaceProperty(Function.prototype, 'toString', {
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
const replaceWithProxy = (obj, propName, handler) => {
  const originalObj = obj[propName]
  const proxyObj = new Proxy(obj[propName], stripProxyFromErrors(handler))

  replaceProperty(obj, propName, { value: proxyObj })
  redirectToString(proxyObj, originalObj)

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
const replaceGetterWithProxy = (obj, propName, handler) => {
  const fn = Object.getOwnPropertyDescriptor(obj, propName).get
  const fnStr = fn.toString() // special getter function string
  const proxyObj = new Proxy(fn, stripProxyFromErrors(handler))

  replaceProperty(obj, propName, { get: proxyObj })
  patchToString(proxyObj, fnStr)

  return true
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
const mockWithProxy = (obj, propName, pseudoTarget, handler) => {
  const proxyObj = new Proxy(pseudoTarget, stripProxyFromErrors(handler))

  replaceProperty(obj, propName, { value: proxyObj })
  patchToString(proxyObj)

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
const createProxy = (pseudoTarget, handler) => {
  const proxyObj = new Proxy(pseudoTarget, stripProxyFromErrors(handler))
  patchToString(proxyObj)

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
const splitObjPath = objPath => ({
  // Remove last dot entry (property) ==> `HTMLMediaElement.prototype`
  objName: objPath.split('.').slice(0, -1).join('.'),
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
const replaceObjPathWithProxy = (objPath, handler) => {
  const { objName, propName } = splitObjPath(objPath)
  const obj = eval(objName) // eslint-disable-line no-eval
  return replaceWithProxy(obj, propName, handler)
}

/**
 * Traverse nested properties of an object recursively and apply the given function on a whitelist of value types.
 *
 * @param {object} obj
 * @param {array} typeFilter - e.g. `['function']`
 * @param {Function} fn - e.g. `utils.patchToString`
 */
const execRecursively = (obj = {}, typeFilter = [], fn) => {
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
const stringifyFns = (fnObj: any = { hello: () => 'world' }) => {
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
const materializeFns = (fnStrObj = { hello: "() => 'world'" }) => {
  return Object.fromEntries(
    Object.entries(fnStrObj).map(([key, value]) => {
      if (value.startsWith('function')) {
        // some trickery is needed to make oldschool functions work :-)
        return [key, eval(`() => ${value}`)()] // eslint-disable-line no-eval
      } else {
        // arrow functions just work
        return [key, eval(value)] // eslint-disable-line no-eval
      }
    })
  )
}

// Proxy handler templates for re-usability
const makeHandler = () => ({
  // Used by simple `navigator` getter evasions
  getterValue: value => ({
    apply(target, ctx, args) {
      // Let's fetch the value first, to trigger and escalate potential errors
      // Illegal invocations like `navigator.__proto__.vendor` will throw here
      const ret = cache.Reflect.apply(...arguments)
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
export const utils = {
  init,
  stripProxyFromErrors,
  stripErrorWithAnchor,
  replaceProperty,
  preloadCache,
  makeNativeString,
  patchToString,
  patchToStringNested,
  redirectToString,
  replaceWithProxy,
  replaceGetterWithProxy,
  mockWithProxy,
  createProxy,
  splitObjPath,
  replaceObjPathWithProxy,
  execRecursively,
  stringifyFns,
  materializeFns,
  makeHandler,
}

export default utils
