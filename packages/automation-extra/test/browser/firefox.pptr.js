'use strict'

const test = require('ava')

const { wrap } = require('@extra-test/wrap')

wrap(test)('puppeteer:firefox')(
  'will remove headless from the user-agent',
  async (t, driver) => {
    const plugin = require('puppeteer-extra-plugin-anonymize-ua')()
    const { browser, page } = await driver.getPage(plugin)

    await page.goto('https://httpbin.org/headers', {
      waitUntil: 'domcontentloaded'
    })

    const content = await page.content()
    t.true(content.includes('Windows NT 10.0'))
    t.true(!content.includes('HeadlessChrome'))

    await browser.close()
    t.true(true)
  }
)
