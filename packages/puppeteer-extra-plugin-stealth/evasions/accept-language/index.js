'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * By default puppeteer will not set a `accept-language` header in headless.
 *
 * It's (theoretically) possible to fix that using either `page.setExtraHTTPHeaders` or a `--lang` launch arg.
 * Unfortunately `page.setExtraHTTPHeaders` will lowercase everything and launch args are not always available. :)
 * As a solution we hook into the CDP protocol and add the header there in case it's missing (capitalized correctly).
 *
 * https://github.com/berstend/puppeteer-extra/issues/51
 * https://github.com/berstend/puppeteer-extra/issues/62
 *
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/accept-language'
  }

  async onPageCreated(page) {
    const client = await page.target().createCDPSession()
    await client.send('Network.enable')
    await client.send('Network.setRequestInterception', {
      patterns: [{ urlPattern: '*' }]
    })

    await client.on('Network.requestIntercepted', async e => {
      if (e && e.request && e.request.headers) {
        e.request.headers['Accept-Language'] = 'en-US,en;q=0.9' // TODO: Make configurable by user
        await client.send('Network.continueInterceptedRequest', {
          interceptionId: e.interceptionId,
          headers: e.request.headers
        })
      } else {
        await client.send('Network.continueInterceptedRequest', {
          interceptionId: e.interceptionId
        })
      }
    })
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
