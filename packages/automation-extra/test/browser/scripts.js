'use strict'

const test = require('ava')

const { wrap } = require('@extra-test/wrap')

wrap(test)(['playwright:all', 'puppeteer:all'], {
  exclude: ['puppeteer:firefox'] // https://github.com/puppeteer/puppeteer/issues/6163
})('should apply events on the initial page', async (t, driver) => {
  const { AutomationExtraPlugin } = require('automation-extra-plugin')
  const pluginName = 'hello-world'

  class Plugin extends AutomationExtraPlugin {
    static get id() {
      return pluginName
    }

    constructor(opts = {}) {
      super(opts)
    }

    async onPageCreated(page) {
      if (!this.env.isPuppeteer) {
        return
      }
      await page.evaluateOnNewDocument(x => {
        window._foobar = x
      }, 'alice')
    }

    async onContextCreated(context) {
      await context.addInitScript(x => {
        window._foobar = x
      }, 'alice')
    }
  }

  const plugin = new Plugin()
  const { page, browser } = await driver.getPage(plugin)
  const result = await page.evaluate(() => {
    return window._foobar
  })
  t.is(result, 'alice')
  await browser.close()
})
