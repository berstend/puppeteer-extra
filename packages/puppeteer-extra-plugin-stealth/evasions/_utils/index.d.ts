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
export declare const utils: {
    init: () => void;
    /**
     * Wraps a JS Proxy Handler and strips it's presence from error stacks, in case the traps throw.
     *
     * The presence of a JS Proxy can be revealed as it shows up in error stack traces.
     *
     * @param {object} handler - The JS Proxy handler to wrap
     */
    stripProxyFromErrors: (handler?: ProxyHandler<any>) => {
        [key: string]: (...args: any[]) => any;
    };
    /**
     * Strip error lines from stack traces until (and including) a known line the stack.
     *
     * @param {object} err - The error to sanitize
     * @param {string} anchor - The string the anchor line starts with
     */
    stripErrorWithAnchor: (err: Error, anchor: string) => Error;
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
    replaceProperty: (obj: any, propName: string, descriptorOverrides?: {}) => any;
    cache: {
        Reflect: {
            get: Function;
            apply: Function;
        };
        nativeToStringStr: string;
    };
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
    preloadCache: () => void;
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
    makeNativeString: (name?: string) => string;
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
    patchToString: (obj: any, str?: string) => void;
    /**
     * Make all nested functions of an object native.
     *
     * @param {object} obj
     */
    patchToStringNested: (obj?: {}) => any;
    /**
     * Redirect toString requests from one object to another.
     *
     * @param {object} proxyObj - The object that toString will be called on
     * @param {object} originalObj - The object which toString result we wan to return
     */
    redirectToString: (proxyObj: any, originalObj: any) => void;
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
    replaceWithProxy: (obj: any, propName: string, handler: ProxyHandler<any>) => boolean;
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
    replaceGetterWithProxy: (obj: any, propName: string, handler: ProxyHandler<any>) => boolean;
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
    mockWithProxy: (obj: any, propName: string, pseudoTarget: any, handler: any) => boolean;
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
    createProxy: (pseudoTarget: any, handler: any) => any;
    /**
     * Helper function to split a full path to an Object into the first part and property.
     *
     * @example
     * splitObjPath(`HTMLMediaElement.prototype.canPlayType`)
     * // => {objName: "HTMLMediaElement.prototype", propName: "canPlayType"}
     *
     * @param {string} objPath - The full path to an object as dot notation string
     */
    splitObjPath: (objPath: string) => {
        objName: string;
        propName: string;
    };
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
    replaceObjPathWithProxy: (objPath: string, handler: any) => boolean;
    /**
     * Traverse nested properties of an object recursively and apply the given function on a whitelist of value types.
     *
     * @param {object} obj
     * @param {array} typeFilter - e.g. `['function']`
     * @param {Function} fn - e.g. `utils.patchToString`
     */
    execRecursively: (obj: any, typeFilter: string[], fn: Function) => any;
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
    stringifyFns: (fnObj?: any) => any;
    /**
     * Utility function to reverse the process of `utils.stringifyFns`.
     * Will materialize an object with stringified functions (supports classic and fat arrow functions).
     *
     * @param {object} fnStrObj - An object containing stringified functions as properties
     */
    materializeFns: (fnStrObj?: {
        hello: string;
    }) => {
        [k: string]: any;
    };
    makeHandler: () => {
        getterValue: (value: readonly string[] | string | number) => {
            apply(target: any, ctx: any, args?: any[]): string | number | readonly string[];
        };
    };
};
export default utils;
