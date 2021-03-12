'use strict'

const test = require('ava')
const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin')

test.beforeEach(t => {
  // Make sure we work with pristine modules
  delete require.cache[require.resolve('puppeteer-extra')]
  delete require.cache[
    require.resolve('puppeteer-extra-plugin-user-preferences')
  ]
})

test('will modify preferences when used indirectly in another plugin', async t => {
  const puppeteer = require('puppeteer-extra')

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts)
    }

    get name() {
      return 'test'
    }

    get dependencies() {
      return new Set(['user-preferences'])
    }

    get data() {
      return [
        {
          name: 'userPreferences',
          value: {
            intl: { accept_languages: this.opts.locale || 'xx-XX' }
          }
        }
      ]
    }
  }

  puppeteer.use(new Plugin())

  const browser = await puppeteer.launch({
    headless: false,
    args: PUPPETEER_ARGS
  })
  const page = await browser.newPage()
  await page.goto('https://httpbin.org/headers', {
    waitUntil: 'domcontentloaded'
  })

  const content = await page.content()
  t.true(content.includes('"Accept-Language": "xx-XX'))
  await browser.close()
  t.true(true)
})
