'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

/**
 * Pass the Webdriver Test.
 * Will delete `navigator.webdriver` property.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.webdriver'
  }

  // Pre Chrome 88.0.4291.0
  async onPageCreated(page) {
    await page.evaluateOnNewDocument(() => {
      delete Object.getPrototypeOf(navigator).webdriver
    })
  }

  // Post Chrome 88.0.4291.0
  // Note: this will add an infobar to Chrome with a warning that an unsupported flag is set
  // To remove this bar on Linux, run: mkdir -p /etc/opt/chrome/policies/managed && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json
  async beforeLaunch(options) {
    // If disable-blink-features is already passed, append the AutomationControlled switch
    options.args.forEach(e => {
      if (e.startsWith('--disable-blink-features=')) {
        e += ',AutomationControlled'
        return // eslint-disable-line
      }
    })
    options.args.push(`--disable-blink-features=AutomationControlled`)
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
