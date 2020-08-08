/** This could be further improved still (use Proxy and mock behaviour of functions and their errors) */

const getFunctionMockers = () => {
  const nativeGetProto = Object.getPrototypeOf(
    navigator.__lookupGetter__('languages')
  )
  const proxyToOriginal = new Map()
  /** * target - the target to be Proxied * handlers - the handlers to apply to the target */
  const stealthProxy = (target, handlers) => {
    const ret = new Proxy(target, handlers)
    proxyToOriginal.set(ret, target)
    return ret
  }
  /**
   * original - the Function, native function or arrow function to mock
   * func - a Function, native function or arrow function holding the desired logic
   * {
     * hasSideEffects - a Boolean representing if original has side effects. If true, the original is not run to test for errors. If false, the original is run to test for errors.
     * isTrapStyle - a Boolean representing if func will be run with Reflect.apply(func, thisArg, args) or func(target,thisArg,args).
     * modifyProto - a Boolean representing if the prototype of original should also be Proxied.
   }
   */
  const mockFunction = (
    original,
    func,
    { hasSideEffects = false, isTrapStyle = false, modifyProto = true } = {}
  ) => {
    const apply = (oldFunc, thisArg, args) => {
      const lineNumsToRemove = [2]
      try {
        if (oldFunc && !hasSideEffects) Reflect.apply(oldFunc, thisArg, args)
        return isTrapStyle
          ? func(oldFunc, thisArg, args)
          : Reflect.apply(func, thisArg, args)
      } catch (err) {
        const lines = err.stack.split('\n')
        err.stack = lines
          .filter((line, idx) => !lineNumsToRemove.includes(idx))
          .join('\n')
        throw err
      }
    }
    const handlers = {
      apply
    }
    // If modifyProto is true, override the prototype as well
    const toProxy = modifyProto
      ? Object.setPrototypeOf(
          original,
          stealthProxy(Object.getPrototypeOf(original), handlers)
        )
      : original
    // Override the function itself
    return stealthProxy(toProxy, handlers)
  }

  const redefineFunction = (obj, prop, func, options) =>
    (obj[prop] = mockFunction(obj[prop], func, options))
  const redefineGetter = (obj, prop, func, options) =>
    obj.__defineGetter__(
      prop,
      Object.setPrototypeOf(
        mockFunction(
          Object.getOwnPropertyDescriptor(obj, prop).get,
          func,
          options
        ),
        nativeGetProto
      )
    )

  ;[Function, Object].forEach(className =>
    redefineFunction(
      className.prototype,
      'toString',
      function(target, thisArg, args) {
        return Reflect.apply(
          target,
          proxyToOriginal.has(thisArg) ? proxyToOriginal.get(thisArg) : thisArg,
          arguments
        )
      },
      {
        isTrapStyle: true
      }
    )
  )
  return { mockFunction, redefineFunction, redefineGetter, stealthProxy }
}

module.exports = {
  fns: {
    getFunctionMockers: `${getFunctionMockers}`
  }
}
