'use strict'

const test = require('ava')
const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test.beforeEach(t => {
  // Make sure we work with pristine modules
  delete require.cache[require.resolve('puppeteer-extra')]
  delete require.cache[
    require.resolve('puppeteer-extra-plugin-user-preferences')
  ]
})

test('will modify preferences when used directly', async t => {
  const puppeteer = require('puppeteer-extra')

  const options = {
    userPrefs: {
      intl: { accept_languages: 'fr-FR' }
    }
  }

  const userPrefs = require('puppeteer-extra-plugin-user-preferences')(options)
  puppeteer.use(userPrefs)

  const browser = await puppeteer.launch({
    headless: false,
    args: PUPPETEER_ARGS
  })
  const page = await browser.newPage()
  await page.goto('https://httpbin.org/headers', {
    waitUntil: 'domcontentloaded'
  })

  const content = await page.content()
  t.true(content.includes('"Accept-Language": "fr-FR'))
  await browser.close()
  t.true(true)
})
