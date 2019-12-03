'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const userInfo = msg => {
  console.log(`INFO: puppeteer-extra-plugin-stealth(accept-language): ${msg}`)
}

/**
 * By default puppeteer will not set a `accept-language` header in headless.
 *
 * It's (theoretically) possible to fix that using either `page.setExtraHTTPHeaders` or a `--lang` launch arg.
 * Unfortunately `page.setExtraHTTPHeaders` will lowercase everything and launch args are not always available. :)
 *
 * As a solution we hook into a deeper level and add the header there in case it's missing (capitalized correctly).
 * A challenge poses the restriction that only a single request listener can modify the request, so we need to take care of that.
 *
 * It's possible to override the default locale or add additional headers.
 *
 * @example
 * const puppeteer = require("puppeteer-extra")
 *
 * const StealthPlugin = require("puppeteer-extra-plugin-stealth")
 * const stealth = StealthPlugin()
 * // Remove this specific stealth plugin from the default set
 * stealth.enabledEvasions.delete("accept-language")
 * puppeteer.use(stealth)
 *
 * // Stealth plugins are just regular `puppeteer-extra` plugins and can be added as such
 * const AcceptLanguagePlugin = require("puppeteer-extra-plugin-stealth/evasions/accept-language")
 * const acceptLanguage = AcceptLanguagePlugin({ locale: "de-DE,de;q=0.9" }) // Custom locale
 * puppeteer.use(acceptLanguage)
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.locale] - The locale to use in `Accept-Language` (default: `en-US,en;q=0.9`)
 * @param {Object} [opts.extraHeaders] - Any other headers you would like to add to every request (default: `{}`)
 *
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/accept-language'
  }

  get defaults() {
    return { locale: 'en-US,en;q=0.9', extraHeaders: {} }
  }

  async onPageCreated(page) {
    const CUSTOM_HEADERS = Object.assign(
      {},
      {
        // Note: Casing is important here, otherwise this can be detected
        'Accept-Language': this.opts.locale || 'en-US,en;q=0.9'
      },
      // Add any optional user provided headers while we're at it
      this.opts.extraHeaders || {}
    )
    this.debug('onPageCreated - Will add these headers', CUSTOM_HEADERS, {
      opts: this.opts
    })

    // We need to enable request interception ourselves to modify request headers
    await page.setRequestInterception(true)
    this.debug('Enabled request interception.')

    // Monkey patch this method so we become aware if the user wants to modify the request themselves as well
    page.setRequestInterception = (function(originalMethod, context) {
      return async function() {
        await originalMethod.apply(context, arguments)
        context._pptrExtraUserRequestInterceptionEnabled = true // Internal flag
      }
    })(page.setRequestInterception, page)

    // Make this the first request listener
    page.prependListener('request', request => {
      // The following checks should never occur, it's more of a "just in case"
      if (!request) {
        userInfo('Encountered empty request, ignoring.')
        return
      }
      if (!request._allowInterception) {
        userInfo('Request interception is disabled, not modifying headers.')
        return
      }
      if (request._interceptionHandled) {
        userInfo('Request already handled, not modifying headers.')
        return
      }

      // Check if there are other request listeners we need to be aware of
      const hasOtherRequestListeners = page.listenerCount('request') > 1
      // Check if the user is modifying requests as well
      const userIsInterceptingRequest =
        page._pptrExtraUserRequestInterceptionEnabled

      // The simple case: We're the only one modifying the request
      // Note: We're not returning here so our custom `request.continue` can catch a user trying to illegally modify the request afterwards
      if (!hasOtherRequestListeners || !userIsInterceptingRequest) {
        try {
          request.continue({
            headers: Object.assign({}, request.headers(), CUSTOM_HEADERS)
          })
        } catch (err) {
          userInfo(err)
        }
      }

      // More complex case: The user is trying to modify the request as well,
      // which is an issue as only one listener can modify/continue the request :)
      // As a solution we monkey patch request.continue to add our own changes.
      request.continue = (function(originalMethod, context) {
        return async function() {
          // Be friendly and warn the end user of potential issues in their code
          // Due to our own interception the builtin puppeteer warning wouldn't show
          if (!page._pptrExtraUserRequestInterceptionEnabled) {
            throw new Error(
              'You set up a request listener but no interception. If you intend to modify requests you need to add: `await page.setRequestInterception(true)`.'
            )
          }
          // https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#requestcontinueoverrides
          const overrides = (arguments || [])[0] || {}
          overrides.headers = overrides.headers || {}
          overrides.headers = Object.assign(
            {},
            overrides.headers,
            CUSTOM_HEADERS
          )

          await originalMethod.apply(context, [overrides]).catch(userInfo)
        }
      })(request.continue, request)
    }) // page.prependListener
  } // onPageCreated
}

const defaultExport = opts => new Plugin(opts)
module.exports = defaultExport
