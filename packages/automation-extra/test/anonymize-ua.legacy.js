'use strict'

const test = require('ava')

const vanillaPuppeteer = require('puppeteer')
const { addExtraPuppeteer } = require('automation-extra')

const AnonUA = require('puppeteer-extra-plugin-anonymize-ua')

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

test('will work with anonymize-ua in legacy mode', async t => {
  const puppeteer = addExtraPuppeteer(vanillaPuppeteer)

  puppeteer.use(
    AnonUA({
      customFn: ua => 'MyCoolAgent/foobar1.0'
    })
  )
  const browser = await puppeteer.launch({ args: PUPPETEER_ARGS })
  const page = await browser.newPage()

  const result = await page.evaluate(() => window.navigator.userAgent)
  t.is(result, 'MyCoolAgent/foobar1.0')

  await browser.close()
})
