'use strict'

const test = require('ava')

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test.beforeEach(t => {
  // Make sure we work with pristine modules
  delete require.cache[require.resolve('puppeteer-extra')]
  delete require.cache[require.resolve('puppeteer-extra-plugin-anonymize-ua')]
})

test('will not modify the user-agent when disabled', async t => {
  const puppeteer = require('puppeteer-extra')
  const AnonymizeUA = require('puppeteer-extra-plugin-anonymize-ua')({
    stripHeadless: false,
    makeWindows: false,
    customFn: null
  })
  puppeteer.use(AnonymizeUA)

  const browser = await puppeteer.launch({ args: PUPPETEER_ARGS })
  const page = await browser.newPage()
  await page.goto('https://httpbin.org/headers', {
    waitUntil: 'domcontentloaded'
  })

  const content = await page.content()
  t.true(content.includes('HeadlessChrome'))
  t.true(!content.includes('MyCoolAgent/Mozilla'))
  t.true(!content.includes('Beer/'))

  await browser.close()
  t.true(true)
})
