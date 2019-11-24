'use strict'

const test = require('ava')

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test.beforeEach(t => {
  // Make sure we work with pristine modules
  delete require.cache[require.resolve('puppeteer-extra')]
  delete require.cache[require.resolve('puppeteer-extra-plugin-anonymize-ua')]
})

test('will remove headless from the user-agent on multiple browsers', async t => {
  const puppeteer = require('puppeteer-extra')
  puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
  const browser = await puppeteer.launch({ args: PUPPETEER_ARGS })

  const browsers = await Promise.all(
    [...Array(5)].map(slot => puppeteer.launch({ args: PUPPETEER_ARGS }))
  )
  for (const browser of browsers) {
    const page = await browser.newPage()
    const ua = await page.evaluate(() => window.navigator.userAgent)
    t.true(ua.includes('Windows NT 10.0'))
    t.true(!ua.includes('HeadlessChrome'))
  }

  await browser.close()
  t.true(true)
})

test('will remove headless from the user-agent on many pages', async t => {
  const puppeteer = require('puppeteer-extra')
  puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
  const browser = await puppeteer.launch({ args: PUPPETEER_ARGS })

  const pages = await Promise.all([...Array(30)].map(slot => browser.newPage()))
  for (const page of pages) {
    const ua = await page.evaluate(() => window.navigator.userAgent)
    t.true(ua.includes('Windows NT 10.0'))
    t.true(!ua.includes('HeadlessChrome'))
  }

  await browser.close()
  t.true(true)
})

test('will remove headless from the user-agent on many incognito pages', async t => {
  const puppeteer = require('puppeteer-extra')
  puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
  const browser = await puppeteer.launch({ args: PUPPETEER_ARGS })

  // Requires puppeteer@next currrently
  if (browser.createIncognitoBrowserContext) {
    const contexts = await Promise.all(
      [...Array(30)].map(slot => browser.createIncognitoBrowserContext())
    )
    for (const context of contexts) {
      const page = await context.newPage()
      const ua = await page.evaluate(() => window.navigator.userAgent)
      t.true(ua.includes('Windows NT 10.0'))
      t.true(!ua.includes('HeadlessChrome'))
    }
  }

  await browser.close()
  t.true(true)
})

test('will remove headless from the user-agent on many pages in parallel', async t => {
  const puppeteer = require('puppeteer-extra')
  puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
  const browser = await puppeteer.launch({ args: PUPPETEER_ARGS })

  const testCase = async () => {
    const page = await browser.newPage()
    const ua = await page.evaluate(() => window.navigator.userAgent)
    t.true(ua.includes('Windows NT 10.0'))
    t.true(!ua.includes('HeadlessChrome'))
  }
  await Promise.all([...Array(30)].map(slot => testCase()))

  await browser.close()
  t.true(true)
})
