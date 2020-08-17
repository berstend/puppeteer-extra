'use strict'

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

const utils = require('../_shared/utils')

/**
 * Pass the Permissions Test.
 */

class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.permissions'
  }

  /* global Notification PermissionStatus */
  async onPageCreated(page) {
    await utils.withUtils.evaluateOnNewDocument(
      page,
      (utils, opts) => {
        const handler = {
          apply: function(target, ctx, args) {
            const param = (args || [])[0]

            if (param && param.name && param.name === 'notifications') {
              const result = { state: Notification.permission }
              Object.setPrototypeOf(result, PermissionStatus.prototype)
              return Promise.resolve(result)
            }

            return Reflect.apply(...arguments)
          }
        }

        utils.replaceWithProxy(
          window.navigator.permissions.__proto__, // eslint-disable-line no-proto
          'query',
          handler
        )
      },
      this.opts
    )
  }
}

module.exports = function(pluginConfig) {
  return new Plugin(pluginConfig)
}
