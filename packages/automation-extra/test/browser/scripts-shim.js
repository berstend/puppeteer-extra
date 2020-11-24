'use strict'

const test = require('ava')

const { wrap } = require('testing-tools')

wrap(test)(['playwright:all', 'puppeteer:all'], {
  exclude: ['puppeteer:firefox'] // https://github.com/puppeteer/puppeteer/issues/6163
})('should apply events on the initial page', async (t, driver) => {
  const { AutomationExtraPlugin } = require('automation-extra-plugin')
  const pluginName = 'hello-world'

  class Plugin extends AutomationExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }
    get name() {
      return pluginName
    }

    async onPageCreated(page) {
      await this.shim(page).addScript(x => {
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
