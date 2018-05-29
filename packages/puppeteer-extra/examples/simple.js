'use strict'

// to run this with debug logs:
// DEBUG=puppeteer-extra,puppeteer-extra-plugin:* node examples/simple.js

const puppeteer = require('puppeteer-extra')

puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')({
  customFn: (ua) => 'MyCoolAgent/' + ua})
)
// Will implicitely require 'user-preferences' which will require 'user-data-dir'
puppeteer.use(require('puppeteer-extra-plugin-font-size')())

;(async () => {
  const browser = await puppeteer.launch({headless: false})

  // Demonstrate user agent plugin
  const page = await browser.newPage()
  await page.goto('http://httpbin.org/headers', {waitUntil: 'domcontentloaded'})

  // Create a new incognito browser context
  // Requires puppeteer@next currrently
  if (browser.createIncognitoBrowserContext) {
    const context2 = await browser.createIncognitoBrowserContext()
    const page2 = await context2.newPage()
    await page2.goto('http://httpbin.org/headers')
  }

  // Demonstrate increased font-size
  const page3 = await browser.newPage()
  await page3.goto('http://example.com', {waitUntil: 'domcontentloaded'})
})()
