'use strict'

import { Page } from 'puppeteer'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'
import Utils from '../_utils'
import withUtils from '../_utils/withUtils'

/**
 * By default puppeteer will have a fixed `navigator.vendor` property.
 *
 * This plugin makes it possible to change this property.
 *
 * @example
 * const puppeteer = require("puppeteer-extra")
 *
 * const StealthPlugin = require("puppeteer-extra-plugin-stealth")
 * const stealth = StealthPlugin()
 * // Remove this specific stealth plugin from the default set
 * stealth.enabledEvasions.delete("navigator.vendor")
 * puppeteer.use(stealth)
 *
 * // Stealth plugins are just regular `puppeteer-extra` plugins and can be added as such
 * const NavigatorVendorPlugin = require("puppeteer-extra-plugin-stealth/evasions/navigator.vendor")
 * const nvp = NavigatorVendorPlugin({ vendor: 'Apple Computer, Inc.' }) // Custom vendor
 * puppeteer.use(nvp)
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.vendor] - The vendor to use in `navigator.vendor` (default: `Google Inc.`)
 *
 */
class NavigatorVendorPlugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'stealth/evasions/navigator.vendor'
  }

  get defaults() {
    return {
      vendor: 'Google Inc.'
    }
  }

  async onPageCreated(page: Page) {
    this.debug('onPageCreated', {
      opts: this.opts
    })

    await withUtils(page).evaluateOnNewDocument(
      (utils: typeof Utils, { opts }: {opts: any}) => {
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'vendor',
          utils.makeHandler().getterValue(opts.vendor)
        )
      },
      {
        opts: this.opts
      }
    )
  } // onPageCreated
}

export = (opts: any) => new NavigatorVendorPlugin(opts)
