'use strict'

const test = require('ava')

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

const waitEvent = function(emitter, eventName) {
  return new Promise(resolve => emitter.once(eventName, resolve))
}

test.beforeEach(t => {
  // Make sure we work with pristine modules
  delete require.cache[require.resolve('puppeteer-extra')]
  delete require.cache[require.resolve('puppeteer-extra-plugin-anonymize-ua')]
})

test('known issue: will not remove headless from implicitly created popup pages', async t => {
  const puppeteer = require('puppeteer-extra')
  puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
  const browser = await puppeteer.launch({ args: PUPPETEER_ARGS })

  const pages = await Promise.all([...Array(10)].map(slot => browser.newPage()))
  for (const page of pages) {
    // Works
    const ua = await page.evaluate(() => window.navigator.userAgent)
    t.true(!ua.includes('HeadlessChrome'))

    // Works
    await page.goto('about:blank')
    const ua2 = await page.evaluate(() => window.navigator.userAgent)
    t.true(!ua2.includes('HeadlessChrome'))

    // Does NOT work:
    // https://github.com/GoogleChrome/puppeteer/issues/2669
    page.evaluate(url => window.open(url), 'about:blank')
    const popupTarget = await waitEvent(browser, 'targetcreated')
    const popupPage = await popupTarget.page()
    const ua3 = await popupPage.evaluate(() => window.navigator.userAgent)
    // Test against the problem until it's fixed
    t.true(ua3.includes('HeadlessChrome')) // should be: !ua3.includes('HeadlessChrome')

    // Works: The bug only affects newly created popups, subsequent page navigations are fine.
    await popupPage.goto('about:blank')
    const ua4 = await page.evaluate(() => window.navigator.userAgent)
    t.true(!ua4.includes('HeadlessChrome'))
  }

  await browser.close()
  t.true(true)
})
