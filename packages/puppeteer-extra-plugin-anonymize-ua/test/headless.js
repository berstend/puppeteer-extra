'use strict'

const test = require('ava')

const { wrap } = require('testing-tools')

wrap(test)('puppeteer:chromium')(
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

wrap(test)('puppeteer:chromium')(
  'will remove headless from the user-agent in incognito page',
  async (t, driver) => {
    const plugin = require('puppeteer-extra-plugin-anonymize-ua')()
    const browser = await driver.getBrowser(plugin)

    // Requires puppeteer@next currrently
    if (browser.createIncognitoBrowserContext) {
      const context = await browser.createIncognitoBrowserContext()
      const page = await context.newPage()
      await page.goto('https://httpbin.org/headers', {
        waitUntil: 'domcontentloaded'
      })

      const content = await page.content()
      t.true(content.includes('Windows NT 10.0'))
      t.true(!content.includes('HeadlessChrome'))
    }

    await browser.close()
    t.true(true)
  }
)

wrap(test)('puppeteer:chromium')(
  'will use a custom fn to modify the user-agent',
  async (t, driver) => {
    const plugin = require('puppeteer-extra-plugin-anonymize-ua')({
      customFn: ua => 'MyCoolAgent/' + ua.replace('Chrome', 'Beer')
    })
    const { browser, page } = await driver.getPage(plugin)

    await page.goto('https://httpbin.org/headers', {
      waitUntil: 'domcontentloaded'
    })

    const content = await page.content()
    t.true(content.includes('Windows NT 10.0'))
    t.true(!content.includes('HeadlessChrome'))
    t.true(content.includes('MyCoolAgent/Mozilla'))
    t.true(content.includes('Beer/'))

    await browser.close()
    t.true(true)
  }
)
