// A set of shared utility functions specifically for the purpose of modifying native browser APIs without leaving traces.
// Meant to be passed down in puppeteer and used in the context of the page.
const utils = {}

/**
 * Wraps a JS Proxy Handler and strips it's presence from error stacks, in case the traps throw.
 *
 * The presence of a JS Proxy can be revealed as it shows up in error stack traces.
 *
 * @param {object} handler - The JS Proxy handler to wrap
 */
utils.stripProxyFromErrors = (handler = {}) => {
  const newHandler = {}
  // We wrap each trap in the handler in a try/catch and modify the error stack if they throw
  const traps = Object.getOwnPropertyNames(handler)
  traps.forEach(trap => {
    newHandler[trap] = function() {
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

        const stripWithBlacklist = stack => {
          const blacklist = [
            `at Reflect.${trap} `, // e.g. Reflect.get or Reflect.apply
            `at Object.${trap} `, // e.g. Object.get or Object.apply
            `at Object.newHandler.<computed> [as ${trap}] ` // caused by this very wrapper :-)
          ]
          return (
            err.stack
              .split('\n')
              // Always remove the first (file) line in the stack (guaranteed to be our proxy)
              .filter((line, index) => index !== 1)
              // Check if the line starts with one of our blacklisted strings
              .filter(line => !blacklist.some(bl => line.trim().startsWith(bl)))
              .join('\n')
          )
        }

        const stripWithAnchor = stack => {
          const stackArr = stack.split('\n')
          const anchor = `at Object.newHandler.<computed> [as ${trap}] ` // Known first Proxy line in chromium
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

        // Try using the anchor method, fallback to blacklist if necessary
        err.stack = stripWithAnchor(err.stack) || stripWithBlacklist(err.stack)

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
  const toStringProxy = new Proxy(Function.prototype.toString, {
    apply: function(target, ctx) {
      // This fixes e.g. `HTMLMediaElement.prototype.canPlayType.toString + ""`
      if (ctx === Function.prototype.toString) {
        return 'function toString() { [native code] }'
      }
      // `toString` targeted at our proxied Object detected
      if (ctx === obj) {
        // We either return the optional string verbatim or derive the most desired result automatically
        return str || `function ${obj.name}() { [native code] }`
      }
      return target.call(ctx)
    }
  })
  utils.replaceProperty(Function.prototype, 'toString', {
    value: toStringProxy
  })
}

/**
 * Redirect toString requests from one object to another.
 *
 * @param {object} proxyObj - The object that toString will be called on
 * @param {object} originalObj - The object which toString result we wan to return
 */
utils.redirectToString = (proxyObj, originalObj) => {
  const toStringProxy = new Proxy(Function.prototype.toString, {
    apply: function(target, ctx) {
      // This fixes e.g. `HTMLMediaElement.prototype.canPlayType.toString + ""`
      if (ctx === Function.prototype.toString) {
        return 'function toString() { [native code] }'
      }

      // `toString` targeted at our proxied Object detected
      if (ctx === proxyObj) {
        const fallback = () =>
          originalObj && originalObj.name
            ? `function ${originalObj.name}() { [native code] }`
            : `function ${proxyObj.name}() { [native code] }`

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
  })
  utils.replaceProperty(Function.prototype, 'toString', {
    value: toStringProxy
  })
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
 * Convenience method to replace a property with a JS Proxy using the provided Proxy handler with traps.
 *
 * Will stealthify these aspects (strip error stack traces, redirect toString, etc).
 * Note: This is meant to modify native Browser APIs and works best with prototype objects.
 *
 * We use a full path (dot notation) to the object as string here, to make followup things easier.
 *
 * @param {string} objPath - The full path to an object (dot notation string) to replace
 * @param {object} handler - The JS Proxy handler to used
 */
utils.replaceWithProxy = (objPath, handler) => {
  const { objName, propName } = utils.splitObjPath(objPath)
  const obj = eval(objName) // eslint-disable-line no-eval
  const originalObj = obj[propName]

  const proxyObj = new Proxy(obj[propName], utils.stripProxyFromErrors(handler))

  utils.replaceProperty(obj, propName, { value: proxyObj })
  utils.redirectToString(proxyObj, originalObj)

  return true
}

module.exports = {
  ...utils,
  stringifyFns,
  withUtils: {
    evaluate,
    evaluateOnNewDocument
  }
}

/**
 * In order for our utility functions to survive being evaluated on the page we need to stringify them and rematerialize them later.
 */
// Object.fromEntries() ponyfill (in 6 lines) - supported only in Node v12+
// https://github.com/feross/fromentries
function fromEntries(iterable) {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val
    return obj
  }, {})
}
function stringifyFns() {
  return (Object.fromEntries || fromEntries)(
    Object.entries(utils)
      .filter(([key, value]) => typeof value === 'function')
      .map(([key, value]) => [key, value.toString()]) // eslint-disable-line no-eval
  )
}

/**
 * Simple `page.evaluate` replacement to preload utils
 */
async function evaluate(page, fn, args = {}) {
  return page.evaluate(
    ({ _utilsFns, _fn, _args }) => {
      const utils = Object.fromEntries(
        Object.entries(_utilsFns).map(([key, value]) => [key, eval(value)]) // eslint-disable-line no-eval
      )
      return eval(_fn)(utils, _args) // eslint-disable-line no-eval
    },
    { _utilsFns: stringifyFns(), _fn: fn.toString(), _args: args }
  )
}

/**
 * Simple `page.evaluateOnNewDocument` replacement to preload utils
 */
async function evaluateOnNewDocument(page, fn, args = {}) {
  return page.evaluateOnNewDocument(
    ({ _utilsFns, _fn, _args }) => {
      /** @type{typeof utils} */
      const utils = Object.fromEntries(
        Object.entries(_utilsFns).map(([key, value]) => [key, eval(value)]) // eslint-disable-line no-eval
      )
      return eval(_fn)(utils, _args) // eslint-disable-line no-eval
    },
    { _utilsFns: stringifyFns(), _fn: fn.toString(), _args: args }
  )
}
