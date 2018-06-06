'use strict'

const { test } = require('ava')

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test.beforeEach(t => {
  // Make sure we work with pristine modules
  delete require.cache[require.resolve('puppeteer-extra')]
  delete require.cache[require.resolve('puppeteer-extra-plugin')]
})

test('will remove headless from remote browser', async (t) => {
  // Launch vanilla puppeteer browser with no plugins
  const puppeteerVanilla = require('puppeteer')
  const browserVanilla = await puppeteerVanilla.launch({ args: PUPPETEER_ARGS })
  const browserWSEndpoint = browserVanilla.wsEndpoint()

  // Use puppeteer-extra with plugin to conntect to existing browser
  const puppeteer = require('puppeteer-extra')
  puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
  const browser = await puppeteer.connect({ browserWSEndpoint })

  // Let's ensure we've anonymized the user-agent, despite not using .launch
  const page = await browser.newPage()
  const ua = await page.evaluate(() => window.navigator.userAgent)
  t.true(!ua.includes('HeadlessChrome'))

  await browser.close()
  t.true(true)
})
