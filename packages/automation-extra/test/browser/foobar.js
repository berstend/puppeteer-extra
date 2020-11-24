'use strict'

const test = require('ava')

const { wrap } = require('testing-tools')

wrap(test)('puppeteer:firefox')(
  'will remove headless from the user-agent',
  async (t, driver) => {
    const plugin = require('puppeteer-extra-plugin-anonymize-ua')()
    const { launcher, browser, page } = await driver.getPage(plugin)

    await page.goto('https://httpbin.org/headers', {
      waitUntil: 'domcontentloaded'
    })

    const content = await page.content()
    t.true(content.includes('Windows NT 10.0'))
    t.true(!content.includes('HeadlessChrome'))

    console.log('content', content)
    console.log('launcher', launcher)

    await browser.close()
    t.true(true)
  }
)
