'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const withUtils = require('../_utils/withUtils')

const STATIC_DATA = require('./staticData.json')

/**
 * Mock the `chrome.runtime` object if not available (e.g. when running headless) and on a secure site.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/chrome.runtime'
  }

  get defaults() {
    return { runOnInsecureOrigins: false } // Override for testing
  }

  async onPageCreated(page) {
    await withUtils(page).evaluateOnNewDocument(
      (utils, { opts, STATIC_DATA }) => {
        if (!window.chrome) {
          // Use the exact property descriptor found in headful Chrome
          // fetch it via `Object.getOwnPropertyDescriptor(window, 'chrome')`
          Object.defineProperty(window, 'chrome', {
            writable: true,
            enumerable: true,
            configurable: false, // note!
            value: {} // We'll extend that later
          })
        }

        // That means we're running headful and don't need to mock anything
        const existsAlready = 'runtime' in window.chrome
        // `chrome.runtime` is only exposed on secure origins
        const isNotSecure = !window.location.protocol.startsWith('https')
        if (existsAlready || (isNotSecure && !opts.runOnInsecureOrigins)) {
          return // Nothing to do here
        }

        window.chrome.runtime = {
          // There's a bunch of static data in that property which doesn't seem to change,
          // we should periodically check for updates: `JSON.stringify(window.chrome.runtime, null, 2)`
          ...STATIC_DATA,
          // `chrome.runtime.id` is extension related and returns undefined in Chrome
          get id() {
            return undefined
          },
          // These two require more sophisticated mocks
          connect: null,
          sendMessage: null
        }

        const makeCustomRuntimeErrors = (preamble, method, extensionId) => ({
          NoMatchingSignature: new TypeError(
            preamble + `No matching signature.`
          ),
          MustSpecifyExtensionID: new TypeError(
            preamble +
              `${method} called from a webpage must specify an Extension ID (string) for its first argument.`
          ),
          InvalidExtensionID: new TypeError(
            preamble + `Invalid extension id: '${extensionId}'`
          )
        })

        // Valid Extension IDs are 32 characters in length and use the letter `a` to `p`:
        // https://source.chromium.org/chromium/chromium/src/+/master:components/crx_file/id_util.cc;drc=14a055ccb17e8c8d5d437fe080faba4c6f07beac;l=90
        const isValidExtensionID = str =>
          str.length === 32 && str.toLowerCase().match(/^[a-p]+$/)

        /** Mock `chrome.runtime.sendMessage` */
        const sendMessageHandler = {
          apply: function(target, ctx, args) {
            const [extensionId, options, responseCallback] = args || []

            // Define custom errors
            const errorPreamble = `Error in invocation of runtime.sendMessage(optional string extensionId, any message, optional object options, optional function responseCallback): `
            const Errors = makeCustomRuntimeErrors(
              errorPreamble,
              `chrome.runtime.sendMessage()`,
              extensionId
            )

            // Check if the call signature looks ok
            const noArguments = args.length === 0
            const tooManyArguments = args.length > 4
            const incorrectOptions = options && typeof options !== 'object'
            const incorrectResponseCallback =
              responseCallback && typeof responseCallback !== 'function'
            if (
              noArguments ||
              tooManyArguments ||
              incorrectOptions ||
              incorrectResponseCallback
            ) {
              throw Errors.NoMatchingSignature
            }

            // At least 2 arguments are required before we even validate the extension ID
            if (args.length < 2) {
              throw Errors.MustSpecifyExtensionID
            }

            // Now let's make sure we got a string as extension ID
            if (typeof extensionId !== 'string') {
              throw Errors.NoMatchingSignature
            }

            if (!isValidExtensionID(extensionId)) {
              throw Errors.InvalidExtensionID
            }

            return undefined // Normal behavior
          }
        }
        utils.mockWithProxy(
          window.chrome.runtime,
          'sendMessage',
          function sendMessage() {},
          sendMessageHandler
        )

        /**
         * Mock `chrome.runtime.connect`
         *
         * @see https://developer.chrome.com/apps/runtime#method-connect
         */
        const connectHandler = {
          apply: function(target, ctx, args) {
            const [extensionId, connectInfo] = args || []

            // Define custom errors
            const errorPreamble = `Error in invocation of runtime.connect(optional string extensionId, optional object connectInfo): `
            const Errors = makeCustomRuntimeErrors(
              errorPreamble,
              `chrome.runtime.connect()`,
              extensionId
            )

            // Behavior differs a bit from sendMessage:
            const noArguments = args.length === 0
            const emptyStringArgument = args.length === 1 && extensionId === ''
            if (noArguments || emptyStringArgument) {
              throw Errors.MustSpecifyExtensionID
            }

            const tooManyArguments = args.length > 2
            const incorrectConnectInfoType =
              connectInfo && typeof connectInfo !== 'object'

            if (tooManyArguments || incorrectConnectInfoType) {
              throw Errors.NoMatchingSignature
            }

            const extensionIdIsString = typeof extensionId === 'string'
            if (extensionIdIsString && extensionId === '') {
              throw Errors.MustSpecifyExtensionID
            }
            if (extensionIdIsString && !isValidExtensionID(extensionId)) {
              throw Errors.InvalidExtensionID
            }

            // There's another edge-case here: extensionId is optional so we might find a connectInfo object as first param, which we need to validate
            const validateConnectInfo = ci => {
              // More than a first param connectInfo as been provided
              if (args.length > 1) {
                throw Errors.NoMatchingSignature
              }
              // An empty connectInfo has been provided
              if (Object.keys(ci).length === 0) {
                throw Errors.MustSpecifyExtensionID
              }
              // Loop over all connectInfo props an check them
              Object.entries(ci).forEach(([k, v]) => {
                const isExpected = ['name', 'includeTlsChannelId'].includes(k)
                if (!isExpected) {
                  throw new TypeError(
                    errorPreamble + `Unexpected property: '${k}'.`
                  )
                }
                const MismatchError = (propName, expected, found) =>
                  TypeError(
                    errorPreamble +
                      `Error at property '${propName}': Invalid type: expected ${expected}, found ${found}.`
                  )
                if (k === 'name' && typeof v !== 'string') {
                  throw MismatchError(k, 'string', typeof v)
                }
                if (k === 'includeTlsChannelId' && typeof v !== 'boolean') {
                  throw MismatchError(k, 'boolean', typeof v)
                }
              })
            }
            if (typeof extensionId === 'object') {
              validateConnectInfo(extensionId)
              throw Errors.MustSpecifyExtensionID
            }

            // Unfortunately even when the connect fails Chrome will return an object with methods we need to mock as well
            return utils.patchToStringNested(makeConnectResponse())
          }
        }
        utils.mockWithProxy(
          window.chrome.runtime,
          'connect',
          function connect() {},
          connectHandler
        )

        function makeConnectResponse() {
          const onSomething = () => ({
            addListener: function addListener() {},
            dispatch: function dispatch() {},
            hasListener: function hasListener() {},
            hasListeners: function hasListeners() {
              return false
            },
            removeListener: function removeListener() {}
          })

          const response = {
            name: '',
            sender: undefined,
            disconnect: function disconnect() {},
            onDisconnect: onSomething(),
            onMessage: onSomething(),
            postMessage: function postMessage() {
              if (!arguments.length) {
                throw new TypeError(`Insufficient number of arguments.`)
              }
              throw new Error(`Attempting to use a disconnected port object`)
            }
          }
          return response
        }
      },
      {
        opts: this.opts,
        STATIC_DATA
      }
    )
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
