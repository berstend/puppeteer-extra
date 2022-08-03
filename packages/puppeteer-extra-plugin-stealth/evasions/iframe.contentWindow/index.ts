import { PluginRequirements, PuppeteerExtraPlugin, PuppeteerPage } from 'puppeteer-extra-plugin'
import { withUtils } from '../_utils/withUtils'
import Utils from '../_utils/'

export interface PluginOptions {
}

/**
 * Fix for the HEADCHR_IFRAME detection (iframe.contentWindow.chrome), hopefully this time without breaking iframes.
 * Note: Only `srcdoc` powered iframes cause issues due to a chromium bug:
 *
 * https://github.com/puppeteer/puppeteer/issues/1106
 */
export  class Plugin extends PuppeteerExtraPlugin<PluginOptions> {
  constructor(opts?: Partial<PluginOptions>) {
    super(opts)
  }

  get name(): 'stealth/evasions/iframe.contentWindow' {
    return 'stealth/evasions/iframe.contentWindow'
  }

  get requirements(): PluginRequirements {
    // Make sure `chrome.runtime` has ran, we use data defined by it (e.g. `window.chrome`)
    return new Set(['runLast'])
  }

  async onPageCreated(page: PuppeteerPage): Promise<void> {
    await withUtils(page).evaluateOnNewDocument((utils: typeof Utils) => {
      try {
        // Adds a contentWindow proxy to the provided iframe element
        const addContentWindowProxy = (iframe: any) => {
          const contentWindowProxy = {
            get(target: any, key: string) {
              // Now to the interesting part:
              // We actually make this thing behave like a regular iframe window,
              // by intercepting calls to e.g. `.self` and redirect it to the correct thing. :)
              // That makes it possible for these assertions to be correct:
              // iframe.contentWindow.self === window.top // must be false
              if (key === 'self') {
                return this
              }
              // iframe.contentWindow.frameElement === iframe // must be true
              if (key === 'frameElement') {
                return iframe
              }
              // Intercept iframe.contentWindow[0] to hide the property 0 added by the proxy.
              if (key === '0') {
                return undefined
              }
              return Reflect.get(target, key)
            }
          }

          if (!iframe.contentWindow) {
            const proxy = new Proxy(window, contentWindowProxy)
            Object.defineProperty(iframe, 'contentWindow', {
              get() {
                return proxy
              },
              set(newValue) {
                return newValue // contentWindow is immutable
              },
              enumerable: true,
              configurable: false
            })
          }
        }

        // Handles iframe element creation, augments `srcdoc` property so we can intercept further
        const handleIframeCreation = (target: Function, thisArg: any, args: any[]) => {
          const iframe = target.apply(thisArg, args)

          // We need to keep the originals around
          const _iframe = iframe
          const _srcdoc = _iframe.srcdoc

          // Add hook for the srcdoc property
          // We need to be very surgical here to not break other iframes by accident
          Object.defineProperty(iframe, 'srcdoc', {
            configurable: true, // Important, so we can reset this later
            get: function() {
              return _srcdoc
            },
            set: function(newValue) {
              addContentWindowProxy(this)
              // Reset property, the hook is only needed once
              Object.defineProperty(iframe, 'srcdoc', {
                configurable: false,
                writable: false,
                value: _srcdoc
              })
              _iframe.srcdoc = newValue
            }
          })
          return iframe
        }

        // Adds a hook to intercept iframe creation events
        const addIframeCreationSniffer = () => {
          /* global document */
          const createElementHandler = {
            // Make toString() native
            get(target: any, key: string) {
              return Reflect.get(target, key)
            },
            apply: function(target: Function, thisArg: any, args: any[]) {
              const isIframe =
                args && args.length && `${args[0]}`.toLowerCase() === 'iframe'
              if (!isIframe) {
                // Everything as usual
                return target.apply(thisArg, args)
              } else {
                return handleIframeCreation(target, thisArg, args)
              }
            }
          }
          // All this just due to iframes with srcdoc bug
          utils.replaceWithProxy(
            document,
            'createElement',
            createElementHandler
          )
        }

        // Let's go
        addIframeCreationSniffer()
      } catch (err) {
        // console.warn(err)
      }
    })
  }
}

export default (pluginConfig?: Partial<PluginOptions>) => new Plugin(pluginConfig)
